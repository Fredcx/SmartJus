import { Router, Request, Response } from 'express';
import prisma from '../config/database'; // Singleton import
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import { DocumentAnalysisService } from '../services/documentAnalysisService';
import caseAnalysisService from '../services/caseAnalysisService';

const router = Router();
// const prisma = new PrismaClient(); // Removed
const analysisService = new DocumentAnalysisService();

// const JWT_SECRET... Removed
// authenticateToken... Removed in favor of authMiddleware

// ============================================
// CONFIGURAR DIRETÓRIO DE UPLOADS
// ============================================
// =====================
// CONFIGURAR MULTER (MEMORY)
// =====================
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use PDF, DOCX ou TXT.'));
    }
  }
});

// ============================================
// POST - UPLOAD E ANÁLISE
// ============================================
// ============================================
// POST - UPLOAD E ANÁLISE (AGGREGATED)
// ============================================
router.post('/analyze', authMiddleware, upload.array('documents', 10), async (req: Request, res: Response) => {
  let createdCaseId: string | null = null;
  const filesToCleanUp: string[] = [];

  try {
    const userId = (req as any).user.userId;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'Nenhum arquivo enviado',
        message: 'Por favor, envie pelo menos um arquivo PDF, DOCX ou TXT'
      });
    }

    // Register files for cleanup in case of error
    files.forEach(f => filesToCleanUp.push(f.path));

    console.log('\n' + '='.repeat(70));
    console.log(`📤 NOVO UPLOAD: ${files.length} arquivo(s)`);
    console.log('='.repeat(70));

    // 1. EXTRACT TEXT FROM ALL FILES
    console.log('\n🔍 ETAPA 1: Extraindo texto combinado e salvando cache...');
    let combinedText = '';
    const fileInfos = [];

    for (const file of files) {
      try {
        console.log(`   📄 Processando: ${file.originalname}`);
        const fileType = path.extname(file.originalname).toLowerCase().replace('.', '');
        const text = await analysisService.extractText(file.buffer, fileType);

        combinedText += `\n\n--- INÍCIO DO ARQUIVO: ${file.originalname} ---\n${text}\n--- FIM DO ARQUIVO: ${file.originalname} ---\n`;

        fileInfos.push({
          file,
          text,
          textLength: text.length
        });

      } catch (err: any) {
        console.warn(`   ⚠️ Falha ao ler ${file.originalname}, pulando...`);
      }
    }

    if (!combinedText.trim()) {
      throw new Error('Não foi possível extrair texto de nenhum dos arquivos enviados.');
    }

    console.log(`✅ Texto combinado total: ${combinedText.length} caracteres`);

    // 2. ANALYZE COMBINED TEXT
    console.log('\n🤖 ETAPA 2: Analisando contexto unificado com IA...');
    // Only validate legal doc if we have enough text
    const isLegalDoc = analysisService.validateLegalDocument(combinedText);

    if (!isLegalDoc) {
      console.warn('⚠️ O conteúdo combinado não parece jurídico, mas prosseguindo com análise genérica.');
    }

    const analysis = await analysisService.analyzeDocument(combinedText);
    console.log('✅ Análise unificada concluída:', analysis.documentType);

    // 3. CREATE SINGLE CASE
    console.log('\n📝 ETAPA 3: Criando processo único...');
    // We'll set a placeholder or use the first file's eventual Supabase path
    const caseData = analysisService.generateCaseData(analysis, userId, '');

    // Override description to mention multiple files if needed, or trust the summary
    if (files.length > 1) {
      caseData.description = `(Análise baseada em ${files.length} documentos) ${caseData.description}`;
    }

    const newCase = await prisma.case.create({
      data: caseData
    });
    createdCaseId = newCase.id;
    console.log('✅ Processo criado:', newCase.id);

    // 4. UPLOAD TO SUPABASE AND CREATE DOCUMENT RECORDS
    console.log('   📎 Enviando arquivos para Supabase e vinculando ao processo...');
    const { supabase } = await import('../config/supabase');

    for (const info of fileInfos) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(info.file.originalname);
      const storagePath = `${newCase.id}/document-${uniqueSuffix}${ext}`;
      const txtPath = storagePath + '.txt';

      // Upload main file
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, info.file.buffer, {
          contentType: info.file.mimetype,
        });

      if (uploadError) {
        console.error(`❌ Erro ao subir ${info.file.originalname}:`, uploadError);
        continue;
      }

      // Upload text cache
      await supabase.storage
        .from('documents')
        .upload(txtPath, Buffer.from(info.text), {
          contentType: 'text/plain',
        });

      // Create record
      await prisma.document.create({
        data: {
          name: info.file.originalname,
          type: path.extname(info.file.originalname).toLowerCase().replace('.', ''),
          path: storagePath,
          extractedTextPath: txtPath,
          caseId: newCase.id,
          status: 'processed',
          classification: {
            type: analysis.documentType,
            confidence: analysis.confidence
          }
        }
      });
    }

    // 5. BACKGROUND STRATEGIC ANALYSIS
    caseAnalysisService.generateGlobalSummary(newCase.id).catch(err => {
      console.error(`   ⚠️ Falha no resumo estratégico background:`, err);
    });

    // Get the primary document URL (first one uploaded)
    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(`${newCase.id}/document-${Date.now()}`); // Placeholder or actual path if we had it

    // Response
    res.status(201).json({
      success: true,
      message: 'Documentos analisados e processo criado com sucesso',
      case: newCase,
      analysis: {
        documentType: analysis.documentType,
        summary: analysis.summary,
        confidence: analysis.confidence,
        extractedData: analysis.extractedData,
      },
      fileCount: files.length
    });

  } catch (error: any) {
    console.error('\n❌ ERRO NO UPLOAD:', error);

    res.status(500).json({
      error: 'Erro ao processar upload',
      message: error.message || 'Erro interno do servidor'
    });
  }
});

// ============================================
// GET - BAIXAR DOCUMENTO
// ============================================
router.get('/document/:caseId/:filename', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { caseId, filename } = req.params;
    const { supabase } = await import('../config/supabase');

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(`${caseId}/${filename}`, 60);

    if (error || !data?.signedUrl) {
      return res.status(404).json({ error: 'Arquivo não encontrado ou erro ao gerar link' });
    }

    res.redirect(data.signedUrl);

  } catch (error) {
    console.error('Erro ao baixar arquivo:', error);
    res.status(500).json({ error: 'Erro ao baixar arquivo' });
  }
});

// ============================================
// EXPORT DEFAULT (IMPORTANTE!)
// ============================================
export default router;
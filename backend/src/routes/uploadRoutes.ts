import { Router, Request, Response } from 'express';
import prisma from '../config/database'; // Singleton import
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Diretório de uploads criado:', uploadDir);
}

// ============================================
// CONFIGURAR MULTER
// ============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'document-' + uniqueSuffix + ext);
  }
});

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
        console.log(`   📄 Lendo: ${file.originalname}`);
        const fileType = path.extname(file.originalname).toLowerCase().replace('.', '');
        const text = await analysisService.extractText(file.path, fileType);

        // Save extracted text to a file for later use (CaseAnalysisService)
        const txtFileName = file.filename + '.txt';
        const txtPath = path.join(uploadDir, txtFileName);
        fs.writeFileSync(txtPath, text);
        console.log(`      💾 Texto salvo em cache: ${txtFileName}`);

        combinedText += `\n\n--- INÍCIO DO ARQUIVO: ${file.originalname} ---\n${text}\n--- FIM DO ARQUIVO: ${file.originalname} ---\n`;

        fileInfos.push({
          file,
          textLength: text.length,
          extractedTextPath: txtPath
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
    // Use the first file as the "main" document URL for legacy reasons, or a placeholder
    const mainDocumentUrl = `/uploads/${files[0].filename}`;

    const caseData = analysisService.generateCaseData(analysis, userId, mainDocumentUrl);

    // Override description to mention multiple files if needed, or trust the summary
    if (files.length > 1) {
      caseData.description = `(Análise baseada em ${files.length} documentos) ${caseData.description}`;
    }

    const newCase = await prisma.case.create({
      data: caseData
    });
    createdCaseId = newCase.id;
    console.log('✅ Processo criado:', newCase.id);

    // 4. CREATE DOCUMENT RECORDS FOR ALL FILES
    console.log('   📎 Anexando documentos ao processo...');

    // Use fileInfos which has the extractedTextPath
    const documentPromises = fileInfos.map(info => {
      return prisma.document.create({
        data: {
          name: info.file.originalname,
          type: path.extname(info.file.originalname).toLowerCase().replace('.', ''),
          path: `/uploads/${info.file.filename}`,
          extractedTextPath: info.extractedTextPath,
          caseId: newCase.id,
          status: 'processed', // Considered processed as they were part of the initial analysis
          classification: {
            type: analysis.documentType, // Apply generic classification for now, or could be improved later
            confidence: analysis.confidence
          }
        }
      });
    });

    await Promise.all(documentPromises);
    console.log(`✅ ${files.length} documentos vinculados.`);

    // 5. BACKGROUND STRATEGIC ANALYSIS
    caseAnalysisService.generateGlobalSummary(newCase.id).catch(err => {
      console.error(`   ⚠️ Falha no resumo estratégico background:`, err);
    });

    // 6. RESPONSE (Standard Single Format)
    console.log('\n' + '='.repeat(70));
    console.log('✅ UPLOAD CONCLUÍDO');
    console.log('='.repeat(70) + '\n');

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
      documentUrl: mainDocumentUrl, // Legacy support
      fileCount: files.length
    });

  } catch (error: any) {
    console.error('\n❌ ERRO NO UPLOAD:', error);

    // Cleanup files
    filesToCleanUp.forEach(p => {
      try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (e) { }
    });

    res.status(500).json({
      error: 'Erro ao processar upload',
      message: error.message || 'Erro interno do servidor'
    });
  }
});

// ============================================
// GET - BAIXAR DOCUMENTO
// ============================================
router.get('/document/:filename', authMiddleware, (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    res.download(filePath);

  } catch (error) {
    console.error('Erro ao baixar arquivo:', error);
    res.status(500).json({ error: 'Erro ao baixar arquivo' });
  }
});

// ============================================
// EXPORT DEFAULT (IMPORTANTE!)
// ============================================
export default router;
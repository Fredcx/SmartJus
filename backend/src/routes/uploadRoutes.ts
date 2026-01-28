import { Router, Request, Response } from 'express';
import prisma from '../config/database'; // Singleton import
// @ts-ignore
import fs from 'fs-extra';
import os from 'os';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import { DocumentAnalysisService } from '../services/documentAnalysisService';
import caseAnalysisService from '../services/caseAnalysisService';
import { supabase } from '../config/supabase';

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
// =====================
// SHARED PROCESSING LOGIC
// =====================
async function processFileBuffers(files: { originalname: string, buffer: Buffer, mimetype: string }[], userId: string) {
  let createdCaseId: string | null = null;
  try {
    console.log('\n' + '='.repeat(70));
    console.log(`📤 PROCESSANDO: ${files.length} arquivo(s) em memória`);
    console.log('='.repeat(70));

    // 1. EXTRACT TEXT FROM ALL FILES
    console.log('\n🔍 ETAPA 1: Extraindo texto e salvando cache...');
    let combinedText = '';
    const fileInfos = [];

    for (const file of files) {
      try {
        console.log(`   📄 Processando: ${file.originalname} (Buffer: ${file.buffer.length} bytes)`);
        const fileType = path.extname(file.originalname).toLowerCase().replace('.', '');

        let text = '';
        try {
          text = await analysisService.extractText(file.buffer, fileType);
          console.log(`   ✅ Texto extraído: ${text.length} caracteres`);
        } catch (extractErr: any) {
          console.warn(`   ⚠️ Extração falhou para ${file.originalname}: ${extractErr.message}`);
          text = ''; // Garantir vazio para o fallback multimodal
        }

        combinedText += `\n\n--- INÍCIO DO ARQUIVO: ${file.originalname} ---\n${text || '[Arquivo digitalizado ou sem texto extraível]'}\n--- FIM DO ARQUIVO: ${file.originalname} ---\n`;

        fileInfos.push({
          file,
          text,
          textLength: text.length
        });

      } catch (err: any) {
        console.warn(`   ⚠️ Erro crítico ao processar ${file.originalname}, pulando...`, err);
      }
    }

    if (!combinedText.trim() && fileInfos.length === 0) {
      throw new Error('Não foi possível extrair texto de nenhum dos arquivos enviados e nenhum arquivo válido para análise multimodal.');
    }

    console.log(`✅ Texto combinado total: ${combinedText.length} caracteres`);

    // Se temos arquivos mas nenhum texto, pegamos o primeiro documento para tentar análise multimodal
    const firstFile = fileInfos.length > 0 ? fileInfos[0].file : null;

    // 2. ANALYZE DOCUMENTS
    console.log('\n🤖 ETAPA 2: Analisando contexto com IA (Multimodal habilitado)...');

    const analysis = await analysisService.analyzeDocument(
      combinedText,
      firstFile?.buffer,
      firstFile ? path.extname(firstFile.originalname).toLowerCase().replace('.', '') : undefined
    );

    console.log('✅ Análise concluída:', analysis.documentType);

    // 3. CREATE SINGLE CASE
    console.log('\n📝 ETAPA 3: Criando processo único...');
    const caseData = analysisService.generateCaseData(analysis, userId, '');

    if (files.length > 1) {
      caseData.description = `(Análise baseada em ${files.length} documentos) ${caseData.description}`;
    }

    const newCase = await prisma.case.create({
      data: caseData
    });
    createdCaseId = newCase.id;
    console.log('✅ Processo criado:', newCase.id);

    console.log('   📎 Enviando arquivos para Supabase...');

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
    caseAnalysisService.generateGlobalSummary(newCase.id).catch((err: any) => {
      console.error(`   ⚠️ Falha no resumo estratégico background:`, err);
    });

    return {
      success: true,
      case: newCase,
      analysis
    };

  } catch (error: any) {
    console.error('❌ Error in processFileBuffers:', error);
    throw error;
  }
}

// ============================================
// POST - UPLOAD E ANÁLISE (AGGREGATED)
// ============================================
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { files: bodyFiles } = req.body;

    if (!bodyFiles || bodyFiles.length === 0) {
      return res.status(400).json({
        error: 'Nenhum arquivo enviado',
        message: 'Por favor, envie pelo menos um arquivo PDF, DOCX ou TXT'
      });
    }

    const files = bodyFiles.map((f: any) => ({
      originalname: f.name,
      buffer: Buffer.from(f.base64, 'base64'),
      mimetype: f.mimetype || 'application/pdf'
    }));

    const result = await processFileBuffers(files, userId);

    res.status(201).json({
      success: true,
      message: 'Documentos analisados e processo criado com sucesso',
      case: result.case,
      analysis: {
        documentType: result.analysis.documentType,
        summary: result.analysis.summary,
        confidence: result.analysis.confidence,
        extractedData: result.analysis.extractedData,
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
// POST - UPLOAD POR REFERÊNCIA (VIA STORAGE)
// ============================================
router.post('/from-storage', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { files: storageFiles, tempId } = req.body;

    if (!storageFiles || storageFiles.length === 0) {
      return res.status(400).json({ error: 'Nenhum caminho de arquivo fornecido' });
    }

    console.log(`\n📦 PROCESSANDO VIA STORAGE: ${storageFiles.length} arquivo(s)`);

    const files = await Promise.all(storageFiles.map(async (f: any) => {
      console.log(`   ⬇️ Baixando do storage: ${f.path}`);

      const { data, error } = await supabase.storage
        .from('documents')
        .download(f.path);

      if (error || !data) {
        console.error(`   ❌ Falha no download de ${f.name}:`, error);
        throw new Error(`Falha ao baixar ${f.name} do storage: ${error?.message || 'Sem dados'}`);
      }

      // Converte Blob/ArrayBuffer para Buffer de forma segura para Vercel/Node
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`   ✅ Download concluído: ${buffer.length} bytes`);

      return {
        originalname: f.name,
        buffer,
        mimetype: f.mimetype || 'application/pdf',
        storagePath: f.path
      };
    }));

    // Reutiliza a lógica unificada de processamento
    const result = await processFileBuffers(files, userId);

    // OPCIONAL: Limpar arquivos temporários do storage
    try {
      const pathsToDelete = storageFiles.map((f: any) => f.path);
      await supabase.storage.from('documents').remove(pathsToDelete);
      console.log('   🧹 Limpeza de arquivos temporários concluída');
    } catch (cleanupError) {
      console.warn('   ⚠️ Falha ao limpar arquivos temporários:', cleanupError);
    }

    res.status(201).json({
      success: true,
      message: 'Documentos processados com sucesso via storage',
      case: result.case,
      analysis: {
        documentType: result.analysis.documentType,
        summary: result.analysis.summary,
        confidence: result.analysis.confidence,
        extractedData: result.analysis.extractedData,
      }
    });

  } catch (error: any) {
    console.error('\n❌ ERRO NO PROCESSAMENTO VIA STORAGE:', error);
    res.status(500).json({
      error: 'Erro ao processar arquivos do storage',
      message: error.message || 'Erro interno do servidor'
    });
  }
});

// ============================================
// POST - CHUNKED UPLOAD
// ============================================
router.post('/chunk', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { uploadId, chunkIndex, totalChunks, chunk, fileName, fileType } = req.body;

    if (!uploadId || chunkIndex === undefined || !totalChunks || !chunk) {
      return res.status(400).json({ error: 'Faltam metadados do chunk' });
    }

    const tempDir = path.join(os.tmpdir(), 'smart-jus-uploads', uploadId);
    await fs.ensureDir(tempDir);

    const chunkPath = path.join(tempDir, `chunk-${chunkIndex}`);
    await fs.writeFile(chunkPath, Buffer.from(chunk, 'base64'));

    console.log(`📥 Chunk ${chunkIndex + 1}/${totalChunks} recebido para ${uploadId}`);

    if (chunkIndex === totalChunks - 1) {
      console.log(`🔄 Reassembling file: ${fileName}...`);

      const chunkFiles = [];
      for (let i = 0; i < totalChunks; i++) {
        chunkFiles.push(path.join(tempDir, `chunk-${i}`));
      }

      const buffers = await Promise.all(chunkFiles.map(f => fs.readFile(f)));
      const finalBuffer = Buffer.concat(buffers);

      console.log(`✅ File reassembled! Total size: ${(finalBuffer.length / 1024).toFixed(2)} KB`);

      const result = await processFileBuffers([{
        originalname: fileName,
        buffer: finalBuffer,
        mimetype: fileType || 'application/pdf'
      }], userId);

      // Cleanup
      await fs.remove(tempDir);

      return res.status(201).json({
        success: true,
        message: 'Arquivo reassemblado e processado com sucesso',
        case: result.case,
        analysis: result.analysis
      });
    }

    res.status(200).json({ success: true, message: `Chunk ${chunkIndex} recebido` });

  } catch (error: any) {
    console.error('❌ ERRO NO CHUNK:', error);
    res.status(500).json({ error: 'Erro ao processar chunk', message: error.message });
  }
});

// ============================================
// GET - BAIXAR DOCUMENTO
// ============================================
router.get('/document/:caseId/:filename', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { caseId, filename } = req.params;

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
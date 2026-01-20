import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import documentService from '../services/documentService';
import documentGenerationService from '../services/documentGenerationService';
import prisma from '../config/database';

export class DocumentController {
  upload = async (req: AuthRequest, res: Response) => {
    try {
      const { caseId, category } = req.body;

      // Changed from req.files to req.file (Multer standard)
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const file = req.file;

      const document = await documentService.uploadDocument(file, caseId, category);

      res.status(201).json(document);
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  };

  list = async (req: AuthRequest, res: Response) => {
    try {
      const { caseId } = req.params;

      const documents = await documentService.getDocumentsByCase(caseId);

      res.json(documents);
    } catch (error) {
      console.error('Error listing documents:', error);
      res.status(500).json({ error: 'Failed to list documents' });
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      await documentService.deleteDocument(id);

      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  };

  // Helper to fetch evidence documents
  private fetchEvidence = async (evidenceIds?: string[]) => {
    if (!evidenceIds || evidenceIds.length === 0) return [];
    return prisma.document.findMany({
      where: { id: { in: evidenceIds } },
      select: {
        id: true,
        name: true,
        classification: true,
        individualSummary: true
      }
    });
  };

  // ============================================
  // GENERATION METHODS
  // ============================================

  generatePeticao = async (req: AuthRequest, res: Response) => {
    try {
      const { caseId } = req.params;
      const userId = req.user?.userId;
      const { saveToDatabase = true, additionalInfo } = req.body;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      console.log(`📄 Gerando petição inicial para caso ${caseId}...`);

      const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: {
          jurisprudence: true,
          deadlines: true,
          documents: true
        }
      });

      if (!caseData) return res.status(404).json({ error: 'Case not found' });

      const userData = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!userData) {
        return res.status(404).json({ error: 'User not found' });
      }

      const evidenceDocs = await this.fetchEvidence(req.body.evidenceIds);
      const content = await documentGenerationService.generatePeticao(caseData, userData as any, evidenceDocs);

      // Save to database if requested
      let savedDocument = null;
      if (saveToDatabase) {
        savedDocument = await prisma.generatedDocument.create({
          data: {
            caseId,
            userId,
            type: 'peticao_inicial',
            title: `Petição Inicial - ${caseData.title}`,
            content,
            htmlContent: null,
            metadata: {
              generatedAt: new Date().toISOString(),
              caseNumber: caseData.caseNumber,
              clientName: caseData.clientName,
              additionalInfo
            }
          }
        });
        console.log(`✅ Petição salva no banco: ${savedDocument.id}`);
      }

      res.json({
        success: true,
        content,
        savedDocument,
        message: 'Petição inicial gerada com sucesso'
      });
    } catch (error: any) {
      console.error('❌ Error generating peticao:', error);
      res.status(500).json({
        error: 'Failed to generate peticao',
        message: error.message
      });
    }
  };

  generateMemorial = async (req: AuthRequest, res: Response) => {
    try {
      const { caseId } = req.params;
      const userId = req.user?.userId;
      const { saveToDatabase = true, additionalInfo } = req.body;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      console.log(`📚 Gerando memorial para caso ${caseId}...`);

      const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: { jurisprudence: true, deadlines: true, documents: true }
      });

      if (!caseData) return res.status(404).json({ error: 'Case not found' });

      if (!caseData.jurisprudence || caseData.jurisprudence.length === 0) {
        return res.status(400).json({
          error: 'Nenhuma jurisprudência salva',
          message: 'É necessário ter jurisprudências salvas para gerar memoriais'
        });
      }

      const userData = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!userData) {
        return res.status(404).json({ error: 'User not found' });
      }

      const content = await documentGenerationService.generateMemorial(caseData, userData as any);

      // Save to database if requested
      let savedDocument = null;
      if (saveToDatabase) {
        savedDocument = await prisma.generatedDocument.create({
          data: {
            caseId,
            userId,
            type: 'memorial',
            title: `Memorial - ${caseData.title}`,
            content,
            htmlContent: null,
            metadata: {
              generatedAt: new Date().toISOString(),
              caseNumber: caseData.caseNumber,
              jurisprudenceCount: caseData.jurisprudence.length,
              additionalInfo
            }
          }
        });
        console.log(`✅ Memorial salvo no banco: ${savedDocument.id}`);
      }

      res.json({
        success: true,
        content,
        savedDocument,
        message: 'Memorial gerado com sucesso'
      });
    } catch (error: any) {
      console.error('❌ Error generating memorial:', error);
      res.status(500).json({
        error: 'Failed to generate memorial',
        message: error.message
      });
    }
  };

  generateContestacao = async (req: AuthRequest, res: Response) => {
    try {
      const { caseId } = req.params;
      const userId = req.user?.userId;
      const { saveToDatabase = true, additionalInfo } = req.body;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      console.log(`📝 Gerando contestação para caso ${caseId}...`);

      const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: { jurisprudence: true, deadlines: true, documents: true }
      });

      if (!caseData) return res.status(404).json({ error: 'Case not found' });

      const userData = await prisma.user.findUnique({ where: { id: userId } });
      if (!userData) return res.status(404).json({ error: 'User not found' });

      const evidenceDocs = await this.fetchEvidence(req.body.evidenceIds);
      const content = await documentGenerationService.generateContestacao(caseData, userData as any, additionalInfo, evidenceDocs);

      let savedDocument = null;
      if (saveToDatabase) {
        savedDocument = await prisma.generatedDocument.create({
          data: {
            caseId,
            userId,
            type: 'contestacao',
            title: `Contestação - ${caseData.title}`,
            content,
            htmlContent: null,
            metadata: {
              generatedAt: new Date().toISOString(),
              additionalInfo: additionalInfo || null
            }
          }
        });
      }

      res.json({
        success: true,
        content,
        savedDocument,
        message: 'Contestação gerada com sucesso'
      });
    } catch (error: any) {
      console.error('❌ Error generating contestacao:', error);
      res.status(500).json({ error: 'Failed to generate contestacao', message: error.message });
    }
  };

  generateGeneric = async (req: AuthRequest, res: Response) => {
    try {
      const { caseId } = req.params;
      const userId = req.user?.userId;
      const { saveToDatabase = true, documentType, additionalInfo } = req.body;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      console.log(`📄 Gerando documento genérico (${documentType}) para caso ${caseId}...`);

      const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: { jurisprudence: true, deadlines: true, documents: true }
      });

      if (!caseData) return res.status(404).json({ error: 'Case not found' });

      const userData = await prisma.user.findUnique({ where: { id: userId } });
      if (!userData) return res.status(404).json({ error: 'User not found' });

      const evidenceDocs = await this.fetchEvidence(req.body.evidenceIds);

      const content = await documentGenerationService.generateGenericDocument(
        caseData,
        userData as any,
        documentType,
        additionalInfo,
        evidenceDocs
      );

      let savedDocument = null;
      if (saveToDatabase) {
        savedDocument = await prisma.generatedDocument.create({
          data: {
            caseId,
            userId,
            type: documentType,
            title: `${documentType.replace('_', ' ').toUpperCase()} - ${caseData.title}`,
            content,
            htmlContent: null,
            metadata: {
              generatedAt: new Date().toISOString(),
              documentType,
              additionalInfo: additionalInfo || null
            }
          }
        });
      }

      res.json({
        success: true,
        content,
        savedDocument,
        message: `${documentType.replace('_', ' ')} gerado com sucesso`
      });
    } catch (error: any) {
      console.error(`❌ Error generating ${req.body.documentType}:`, error);
      res.status(500).json({ error: 'Failed to generate document', message: error.message });
    }
  };

  // List generated documents for a case
  listGenerated = async (req: AuthRequest, res: Response) => {
    try {
      const { caseId } = req.params;

      const documents = await prisma.generatedDocument.findMany({
        where: { caseId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          createdAt: true,
          metadata: true,
          userId: true
        }
      });

      res.json({ documents });
    } catch (error) {
      console.error('Error listing generated documents:', error);
      res.status(500).json({ error: 'Failed to list generated documents' });
    }
  };

  // Get a specific generated document
  getGenerated = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const document = await prisma.generatedDocument.findUnique({
        where: { id }
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json(document);
    } catch (error) {
      console.error('Error getting generated document:', error);
      res.status(500).json({ error: 'Failed to get document' });
    }
  };

  // Delete a generated document
  deleteGenerated = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.generatedDocument.delete({
        where: { id }
      });

      res.json({ message: 'Generated document deleted successfully' });
    } catch (error) {
      console.error('Error deleting generated document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  };
}

export default new DocumentController();
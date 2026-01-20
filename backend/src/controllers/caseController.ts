import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import caseAnalysisService from '../services/caseAnalysisService';
import documentService from '../services/documentService';

export class CaseController {

  // 0. List all cases for user
  async list(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      const cases = await prisma.case.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          caseNumber: true,
          clientName: true,
          opposingParty: true,
          caseType: true,
          status: true,
          court: true,
          updatedAt: true,
          createdAt: true,
        }
      });

      // Map to frontend expected format
      const formattedCases = cases.map(c => ({
        id: c.id,
        number: c.caseNumber || 'S/N',
        title: c.title,
        plaintiff: c.clientName,
        defendant: c.opposingParty || 'Não informado',
        subject: c.caseType,
        status: c.status,
        updatedAt: c.updatedAt,
        court: c.court
      }));

      res.json(formattedCases);
    } catch (error) {
      console.error('Error listing cases:', error);
      res.status(500).json({ error: 'Failed to list cases' });
    }
  }

  // 1. Create Case (Basic Info)
  async create(req: AuthRequest, res: Response) {
    try {
      const { clientName, title, court, caseNumber, description, caseType } = req.body;
      // Validação básica
      if (!title) {
        console.error('Missing title', req.body);
        return res.status(400).json({ error: 'Título é obrigatório' });
      }
      if (!clientName) {
        console.error('Missing clientName', req.body);
        return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
      }
      const userId = req.user!.userId;

      const newCase = await prisma.case.create({
        data: {
          clientName: clientName || 'Cliente não identificado',
          title: title || 'Processo sem título',
          court,
          caseNumber,
          description,
          caseType: caseType || 'Cível',
          userId,
          status: 'active'
        }
      });

      res.status(201).json(newCase);
    } catch (error) {
      console.error('Error creating case:', error);
      res.status(500).json({ error: 'Failed to create case' });
    }
  }

  // 2. Upload Documents (array of files)
  async uploadDocuments(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params; // caseId
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      console.log(`Uploading ${files.length} documents for case ${id}`);

      const uploadPromises = files.map(file =>
        documentService.uploadDocument(file, id)
      );

      const uploadedDocs = await Promise.all(uploadPromises);

      res.json({
        message: `${files.length} documents uploaded and processing started`,
        documents: uploadedDocs
      });

    } catch (error) {
      console.error('Error uploading documents:', error);
      res.status(500).json({ error: 'Failed to upload documents' });
    }
  }

  // 3. Generate Case Summary (Trigger analysis)
  async generateSummary(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      console.log(`🔄 Regenerando resumo para caso ${id}...`);
      const summary = await caseAnalysisService.generateGlobalSummary(id);

      res.json({
        success: true,
        summary,
        message: 'Resumo gerado com sucesso'
      });
    } catch (error: any) {
      console.error('Error generating summary:', error);
      res.status(500).json({
        error: 'Failed to generate summary',
        message: error.message
      });
    }
  }

  // 4. Get Case Details
  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      console.log(`🔍 Buscando caso ${id} para usuário ${userId}`);

      const caseData = await prisma.case.findFirst({
        where: { id, userId },
        include: {
          documents: {
            orderBy: { createdAt: 'desc' }
          },
          timeline: { orderBy: { date: 'asc' } },
          jurisprudence: true
        }
      });

      if (!caseData) {
        console.log(`❌ Caso ${id} não encontrado para usuário ${userId}`);

        // Check if case exists but belongs to another user
        const caseExists = await prisma.case.findUnique({ where: { id } });
        if (caseExists) {
          console.log(`⚠️ Caso existe mas pertence ao usuário ${caseExists.userId}`);
        }

        return res.status(404).json({ error: 'Case not found' });
      }

      console.log(`✅ Caso encontrado: ${caseData.title}`);
      res.json(caseData);
    } catch (error) {
      console.error('❌ Error getting case:', error);
      res.status(500).json({ error: 'Failed to get case' });
    }
  }
  // 5. Archive/Unarchive Case
  async archive(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { archived } = req.body; // true to archive, false to unarchive

      const newStatus = archived ? 'archived' : 'active';
      console.log(`🗄️ Alterando status do caso ${id} para ${newStatus}`);

      const updatedCase = await prisma.case.update({
        where: { id },
        data: { status: newStatus }
      });

      res.json({ success: true, case: updatedCase });
    } catch (error) {
      console.error('Error archiving case:', error);
      res.status(500).json({ error: 'Failed to archive case' });
    }
  }

  // 6. Delete Case
  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      console.log(`🗑️ Excluindo caso ${id}`);

      await prisma.case.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Case deleted successfully' });
    } catch (error) {
      console.error('Error deleting case:', error);
      res.status(500).json({ error: 'Failed to delete case' });
    }
  }
}

export default new CaseController();

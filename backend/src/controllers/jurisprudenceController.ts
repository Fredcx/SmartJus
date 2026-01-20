import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import jurisprudenceService from '../services/jurisprudenceService';

export class JurisprudenceController {
  async search(req: AuthRequest, res: Response) {
    try {
      const { query, court, page, pageSize } = req.query;

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      console.log(`📡 [Controller] Search request: "${query}" page=${page} pageSize=${pageSize}`);

      const results = await jurisprudenceService.searchAll(
        query as string,
        (court as string) || 'TODOS',
        page ? parseInt(page as string) : 1,
        pageSize ? parseInt(pageSize as string) : 20
      );

      res.json({
        results: results.results,
        pagination: {
          total: results.total,
          page: results.page,
          pageSize: results.pageSize,
          totalPages: results.totalPages,
          hasNextPage: results.page < results.totalPages,
          hasPreviousPage: results.page > 1
        }
      });
    } catch (error) {
      console.error('Error searching jurisprudence:', error);
      res.status(500).json({ error: 'Failed to search jurisprudence' });
    }
  }

  async save(req: AuthRequest, res: Response) {
    try {
      const { caseId, court, number, date, summary, understanding, link, relevance } = req.body;

      const jurisprudence = await prisma.jurisprudence.create({
        data: {
          court,
          number,
          date: date,
          summary,
          understanding,
          link,
          relevance,
          caseId,
        },
      });

      // Adicionar evento na timeline
      await prisma.timelineEvent.create({
        data: {
          title: 'Jurisprudência Adicionada',
          description: `${court} - ${number}`,
          type: 'jurisprudence',
          caseId,
        },
      });

      res.status(201).json(jurisprudence);
    } catch (error) {
      console.error('Error saving jurisprudence:', error);
      res.status(500).json({ error: 'Failed to save jurisprudence' });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.jurisprudence.delete({
        where: { id },
      });

      res.json({ message: 'Jurisprudence deleted successfully' });
    } catch (error) {
      console.error('Error deleting jurisprudence:', error);
      res.status(500).json({ error: 'Failed to delete jurisprudence' });
    }
  }
}

export default new JurisprudenceController();
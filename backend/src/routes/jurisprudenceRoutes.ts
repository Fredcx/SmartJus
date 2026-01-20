import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database'; // Singleton import
import { authMiddleware } from '../middleware/auth';
import { JurisprudenceService } from '../services/jurisprudenceService';

const router = Router();
// const prisma = new PrismaClient(); // Removed
const jurisprudenceService = new JurisprudenceService();

// const authenticateToken... Removed in favor of authMiddleware

router.post('/search', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { query, court, page = 1, pageSize = 10, caseId } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query é obrigatória',
        message: 'Por favor, informe uma palavra-chave ou tese jurídica para buscar'
      });
    }

    if (query.trim().length < 3) {
      return res.status(400).json({
        error: 'Query muito curta',
        message: 'Por favor, digite ao menos 3 caracteres'
      });
    }

    const validPage = Math.max(1, parseInt(page as string) || 1);
    const validPageSize = Math.min(50, Math.max(5, parseInt(pageSize as string) || 10));

    const startTime = Date.now();
    const searchResult = await jurisprudenceService.searchAll(query, court, validPage, validPageSize);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (caseId) {
      try {
        await prisma.searchHistory.create({
          data: {
            caseId,
            query,
            court: court || 'TODOS',
            resultsCount: searchResult.total,
          },
        });
      } catch (err) {
        // Ignorar erro
      }
    }

    console.log('DEBUG: searchResult from service:', {
      total: searchResult.total,
      page: searchResult.page,
      resultsLength: searchResult.results.length
    });

    const response = {
      success: true,
      results: searchResult.results,
      pagination: {
        total: searchResult.total,
        page: searchResult.page,
        pageSize: searchResult.pageSize,
        totalPages: searchResult.totalPages,
        hasNextPage: searchResult.page < searchResult.totalPages,
        hasPreviousPage: searchResult.page > 1,
      },
      query,
      court: court || 'TODOS',
      searchTime: duration,
      timestamp: new Date().toISOString(),
    };

    res.json(response);

  } catch (error: any) {
    console.error('Erro na busca:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar jurisprudência',
      message: 'Ocorreu um erro ao buscar. Tente novamente.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.post('/save', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { caseId, jurisprudence, notes, tags } = req.body;
    const userId = (req as any).user.userId;

    if (!caseId || !jurisprudence) {
      return res.status(400).json({
        error: 'Dados incompletos',
        message: 'CaseId e jurisprudence são obrigatórios'
      });
    }

    const caseExists = await prisma.case.findFirst({
      where: { id: caseId, userId },
    });

    if (!caseExists) {
      return res.status(404).json({
        error: 'Processo não encontrado',
        message: 'O processo não existe ou você não tem permissão'
      });
    }

    const existing = await prisma.jurisprudence.findFirst({
      where: {
        caseId,
        court: jurisprudence.court,
        number: jurisprudence.number,
      },
    });

    if (existing) {
      return res.status(409).json({
        error: 'Já existe',
        message: 'Esta jurisprudência já está salva neste processo'
      });
    }

    const saved = await prisma.jurisprudence.create({
      data: {
        caseId,
        court: jurisprudence.court,
        number: jurisprudence.number,
        date: jurisprudence.date,
        summary: jurisprudence.summary,
        understanding: jurisprudence.understanding,
        ementa: jurisprudence.ementa || null,
        link: jurisprudence.link,
        relevance: jurisprudence.relevance,
        notes: notes || null,
        tags: tags || [],
      },
    });

    res.json({
      success: true,
      message: 'Jurisprudência salva com sucesso',
      data: saved,
    });

  } catch (error: any) {
    console.error('Erro ao salvar:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao salvar jurisprudência',
      message: 'Não foi possível salvar',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.get('/case/:caseId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { caseId } = req.params;
    const userId = (req as any).user.userId;
    const { favorite, tags, sortBy = 'createdAt', order = 'desc' } = req.query;

    const caseExists = await prisma.case.findFirst({
      where: { id: caseId, userId },
    });

    if (!caseExists) {
      return res.status(404).json({ error: 'Processo não encontrado' });
    }

    const where: any = { caseId };

    if (favorite === 'true') {
      where.isFavorite = true;
    }

    if (tags && typeof tags === 'string') {
      where.tags = { hasSome: tags.split(',') };
    }

    const jurisprudences = await prisma.jurisprudence.findMany({
      where,
      orderBy: { [sortBy as string]: order as 'asc' | 'desc' },
    });

    res.json({
      success: true,
      results: jurisprudences,
      total: jurisprudences.length,
      caseId,
    });

  } catch (error: any) {
    console.error('Erro ao listar:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar jurisprudências',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes, tags, isFavorite, ementa } = req.body;
    const userId = (req as any).user.userId;

    const jurisprudence = await prisma.jurisprudence.findUnique({
      where: { id },
      include: { case: true },
    });

    if (!jurisprudence || jurisprudence.case.userId !== userId) {
      return res.status(404).json({ error: 'Jurisprudência não encontrada' });
    }

    const updated = await prisma.jurisprudence.update({
      where: { id },
      data: {
        notes: notes !== undefined ? notes : jurisprudence.notes,
        tags: tags !== undefined ? tags : jurisprudence.tags,
        isFavorite: isFavorite !== undefined ? isFavorite : jurisprudence.isFavorite,
        ementa: ementa !== undefined ? ementa : jurisprudence.ementa,
      },
    });

    res.json({
      success: true,
      message: 'Jurisprudência atualizada',
      data: updated,
    });

  } catch (error: any) {
    console.error('Erro ao atualizar:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const jurisprudence = await prisma.jurisprudence.findUnique({
      where: { id },
      include: { case: true },
    });

    if (!jurisprudence || jurisprudence.case.userId !== userId) {
      return res.status(404).json({ error: 'Jurisprudência não encontrada' });
    }

    await prisma.jurisprudence.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Jurisprudência removida',
    });

  } catch (error: any) {
    console.error('Erro ao deletar:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.get('/history/:caseId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { caseId } = req.params;
    const userId = (req as any).user.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    const caseExists = await prisma.case.findFirst({
      where: { id: caseId, userId },
    });

    if (!caseExists) {
      return res.status(404).json({ error: 'Processo não encontrado' });
    }

    const history = await prisma.searchHistory.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({
      success: true,
      results: history,
      total: history.length,
    });

  } catch (error: any) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar histórico',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const total = await prisma.jurisprudence.count({
      where: { case: { userId } }
    });

    const byTribunalRaw = await prisma.jurisprudence.groupBy({
      by: ['court'],
      where: { case: { userId } },
      _count: true
    });

    const byTribunal: Record<string, number> = {};
    byTribunalRaw.forEach((item: any) => {
      byTribunal[item.court] = item._count;
    });

    const recentActivity = await prisma.jurisprudence.findMany({
      where: { case: { userId } },
      include: {
        case: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const formattedActivity = recentActivity.map((j: any) => ({
      title: `Jurisprudência salva em ${j.case.title}`,
      description: `${j.court} - ${j.number}`,
      date: j.createdAt
    }));

    res.json({
      success: true,
      total,
      byTribunal,
      recentActivity: formattedActivity
    });

  } catch (error: any) {
    console.error('Erro ao buscar stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.get('/stats/:caseId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { caseId } = req.params;
    const userId = (req as any).user.userId;

    const caseExists = await prisma.case.findFirst({
      where: { id: caseId, userId },
    });

    if (!caseExists) {
      return res.status(404).json({ error: 'Processo não encontrado' });
    }

    const total = await prisma.jurisprudence.count({ where: { caseId } });
    const favorites = await prisma.jurisprudence.count({ where: { caseId, isFavorite: true } });

    const byCourtRaw = await prisma.jurisprudence.groupBy({
      by: ['court'],
      where: { caseId },
      _count: true,
    });

    const byCourt = byCourtRaw.map((item: any) => ({
      court: item.court,
      count: item._count,
    }));

    const searches = await prisma.searchHistory.count({ where: { caseId } });

    res.json({
      success: true,
      stats: {
        total,
        favorites,
        byCourt,
        totalSearches: searches,
      },
    });

  } catch (error: any) {
    console.error('Erro ao buscar stats do caso:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'jurisprudence',
    timestamp: new Date().toISOString(),
  });
});

export default router;
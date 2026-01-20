import { Router, Request, Response } from 'express';
import prisma from '../config/database'; // Singleton import
import { authMiddleware } from '../middleware/auth';

const router = Router();
// const prisma = new PrismaClient(); // Removed

// Middleware de autenticação substitutions
// Using imported authMiddleware

// CRIAR PRAZO
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { caseId, title, description, dueDate, priority } = req.body;
    const userId = (req as any).user.userId;

    if (!caseId || !title || !dueDate) {
      return res.status(400).json({
        error: 'Dados incompletos',
        message: 'caseId, title e dueDate são obrigatórios'
      });
    }

    const caseExists = await prisma.case.findFirst({
      where: { id: caseId, userId }
    });

    if (!caseExists) {
      return res.status(404).json({
        error: 'Processo não encontrado'
      });
    }

    const deadline = await prisma.deadline.create({
      data: {
        caseId,
        title,
        description: description || null,
        dueDate: new Date(dueDate),
        priority: priority || 'medium'
      }
    });

    res.status(201).json({
      success: true,
      data: deadline
    });

  } catch (error: any) {
    console.error('Erro ao criar prazo:', error);
    res.status(500).json({
      error: 'Erro ao criar prazo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// LISTAR PRAZOS DE UM PROCESSO
router.get('/case/:caseId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { caseId } = req.params;
    const userId = (req as any).user.userId;

    const caseExists = await prisma.case.findFirst({
      where: { id: caseId, userId }
    });

    if (!caseExists) {
      return res.status(404).json({
        error: 'Processo não encontrado'
      });
    }

    const deadlines = await prisma.deadline.findMany({
      where: { caseId },
      orderBy: { dueDate: 'asc' }
    });

    res.json({
      success: true,
      results: deadlines,
      total: deadlines.length
    });

  } catch (error: any) {
    console.error('Erro ao listar prazos:', error);
    res.status(500).json({
      error: 'Erro ao listar prazos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// LISTAR TODOS OS PRAZOS DO USUÁRIO
router.get('/all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { status, priority, limit } = req.query;

    const where: any = {
      case: { userId }
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const deadlines = await prisma.deadline.findMany({
      where,
      include: {
        case: {
          select: {
            title: true,
            caseNumber: true
          }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      results: deadlines,
      total: deadlines.length
    });

  } catch (error: any) {
    console.error('Erro ao listar prazos:', error);
    res.status(500).json({
      error: 'Erro ao listar prazos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PRAZOS PRÓXIMOS (próximos 7 dias)
router.get('/upcoming', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const days = parseInt(req.query.days as string) || 7;

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const deadlines = await prisma.deadline.findMany({
      where: {
        case: { userId },
        status: 'pending',
        dueDate: {
          gte: now,
          lte: futureDate
        }
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            caseNumber: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    res.json({
      success: true,
      results: deadlines,
      total: deadlines.length
    });

  } catch (error: any) {
    console.error('Erro ao buscar prazos próximos:', error);
    res.status(500).json({
      error: 'Erro ao buscar prazos próximos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// MARCAR PRAZO COMO CONCLUÍDO
router.patch('/:id/complete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const deadline = await prisma.deadline.findFirst({
      where: {
        id,
        case: { userId }
      }
    });

    if (!deadline) {
      return res.status(404).json({
        error: 'Prazo não encontrado'
      });
    }

    const updated = await prisma.deadline.update({
      where: { id },
      data: {
        status: 'completed',
        completed: true,
        completedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: updated
    });

  } catch (error: any) {
    console.error('Erro ao atualizar prazo:', error);
    res.status(500).json({
      error: 'Erro ao atualizar prazo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ATUALIZAR PRAZO
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, priority, status } = req.body;
    const userId = (req as any).user.userId;

    const deadline = await prisma.deadline.findFirst({
      where: {
        id,
        case: { userId }
      }
    });

    if (!deadline) {
      return res.status(404).json({
        error: 'Prazo não encontrado'
      });
    }

    const updated = await prisma.deadline.update({
      where: { id },
      data: {
        title: title !== undefined ? title : deadline.title,
        description: description !== undefined ? description : deadline.description,
        dueDate: dueDate ? new Date(dueDate) : deadline.dueDate,
        priority: priority !== undefined ? priority : deadline.priority,
        status: status !== undefined ? status : deadline.status
      }
    });

    res.json({
      success: true,
      data: updated
    });

  } catch (error: any) {
    console.error('Erro ao atualizar prazo:', error);
    res.status(500).json({
      error: 'Erro ao atualizar prazo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETAR PRAZO
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const deadline = await prisma.deadline.findFirst({
      where: {
        id,
        case: { userId }
      }
    });

    if (!deadline) {
      return res.status(404).json({
        error: 'Prazo não encontrado'
      });
    }

    await prisma.deadline.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Prazo removido com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao deletar prazo:', error);
    res.status(500).json({
      error: 'Erro ao deletar prazo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
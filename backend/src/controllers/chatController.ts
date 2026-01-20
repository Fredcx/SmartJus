import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import aiService from '../services/aiService';

export class ChatController {
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const { message } = req.body;
      const userId = req.user!.userId;

      // Buscar histórico recente
      const recentMessages = await prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      const history = recentMessages
        .reverse()
        .map((msg: { role: any; content: any; }) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Gerar resposta
      const response = await aiService.chat(message, history);

      // Salvar mensagens
      await prisma.chatMessage.createMany({
        data: [
          { role: 'user', content: message, userId },
          { role: 'assistant', content: response, userId },
        ],
      });

      res.json({ response });
    } catch (error) {
      console.error('Error in chat:', error);
      res.status(500).json({ error: 'Failed to process message' });
    }
  }

  async getHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      const messages = await prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });

      res.json(messages);
    } catch (error) {
      console.error('Error getting chat history:', error);
      res.status(500).json({ error: 'Failed to get chat history' });
    }
  }

  async clearHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      await prisma.chatMessage.deleteMany({
        where: { userId },
      });

      res.json({ message: 'Chat history cleared' });
    } catch (error) {
      console.error('Error clearing chat history:', error);
      res.status(500).json({ error: 'Failed to clear chat history' });
    }
  }
}

export default new ChatController();
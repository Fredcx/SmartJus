import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/authRoutes';
import caseRoutes from './routes/caseRoutes';
import documentRoutes from './routes/documentRoutes';
import chatRoutes from './routes/chatRoutes';
import jurisprudenceRoutes from './routes/jurisprudenceRoutes';
import deadlineRoutes from './routes/deadlineRoutes';
import uploadRoutes from './routes/uploadRoutes';
import trackingRoutes from './routes/trackingRoutes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3002;

// =====================
// Middleware base
// =====================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// =====================
// Rotas "raiz" (IMPORTANTE PRA PRODUÇÃO)
// Isso evita flood de GET/POST / e derruba CPU
// =====================
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Legal System API',
    status: 'running',
    env: process.env.NODE_ENV || 'development',
  });
});

// (opcional, mas útil) Se alguém der POST / por engano, responde 200/405 sem logar infinito
app.post('/', (req, res) => {
  res.status(200).json({
    message: 'Use the /api/* routes',
  });
});

// =====================
// Health check
// =====================
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =====================
// Rotas da API
// =====================
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/jurisprudence', jurisprudenceRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/v1/sync', uploadRoutes);
app.use('/api/tracking', trackingRoutes);

// =====================
// Scheduler (Cron)
// =====================
import cron from 'node-cron';
import trackingService from './services/trackingService';

// Verificar processos todos os dias às 08:00
cron.schedule('0 8 * * *', () => {
  console.log('⏰ Executing automatic case tracking...');
  trackingService.checkAllActiveCases();
});


// =====================
// Arquivos estáticos (uploads)
// =====================
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// =====================
// 404 handler (SEMPRE POR ÚLTIMO)
// =====================
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method,
  });
});

// =====================
// Error handler
// =====================
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erro:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message,
    stack: err.stack
  });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;

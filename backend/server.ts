import dotenv from 'dotenv';
dotenv.config(); // <--- IMPORTANTE: Carrega a chave ANTES de importar as rotas

import express from 'express';
import cors from 'cors';
// import fileUpload from 'express-fileupload'; // ← COMENTADO (NÃO USAR)
import path from 'path';
import authRoutes from './routes/authRoutes';
import caseRoutes from './routes/caseRoutes';
import documentRoutes from './routes/documentRoutes';
import chatRoutes from './routes/chatRoutes';
import jurisprudenceRoutes from './routes/jurisprudenceRoutes';
import deadlineRoutes from './routes/deadlineRoutes';
import uploadRoutes from './routes/uploadRoutes';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ❌ REMOVIDO: express-fileupload (conflita com multer)
// app.use(fileUpload({
//   limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') },
//   abortOnLimit: true,
// }));

// Log de todas as requisições (para debug)
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// TODAS AS ROTAS DEVEM VIR ANTES DO 404
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/jurisprudence', jurisprudenceRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/upload', uploadRoutes);

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================
// 404 handler (SEMPRE POR ÚLTIMO!)
// ============================================
app.use((req, res) => {
  console.log('❌ Rota não encontrada:', req.method, req.path);
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erro:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Rotas disponíveis:`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - GET  /api/cases`);
  console.log(`   - POST /api/cases`);
  console.log(`   - POST /api/chat/message`);
  console.log(`   - POST /api/documents/upload`);
  console.log(`   - POST /api/documents/generate/summary/:caseId`);
  console.log(`   - POST /api/documents/generate/peticao/:caseId`);
  console.log(`   - POST /api/documents/generate/memorial/:caseId`);
  console.log(`   - POST /api/jurisprudence/search`);
  console.log(`   - POST /api/jurisprudence/save`);
  console.log(`   - GET  /api/deadlines/upcoming`);
  console.log(`   - POST /api/deadlines`);
  console.log(`   - POST /api/upload/analyze`);
});

export default app;

import { Router } from 'express';
import documentController from '../controllers/documentController';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// ============================================
// CONFIGURAR DIRETÓRIO DE UPLOADS E MULTER
// ============================================
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

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
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

router.use(authMiddleware);

router.post('/upload', upload.single('file'), documentController.upload);

// Document generation routes
router.post('/generate/peticao/:caseId', documentController.generatePeticao);
router.post('/generate/memorial/:caseId', documentController.generateMemorial);
router.post('/generate/contestacao/:caseId', documentController.generateContestacao);
router.post('/generate/generic/:caseId', documentController.generateGeneric);

router.get('/case/:caseId', documentController.list);
router.delete('/:id', documentController.delete);

// Generated documents routes
router.get('/generated/case/:caseId', documentController.listGenerated);
router.get('/generated/:id', documentController.getGenerated);
router.delete('/generated/:id', documentController.deleteGenerated);

export default router;

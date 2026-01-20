import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth';
import caseController from '../controllers/caseController';

const router = Router();

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Routes
router.post('/', authMiddleware, caseController.create);
router.get('/', authMiddleware, caseController.list);
router.get('/:id', authMiddleware, caseController.getById);

// Document Upload
router.post('/:id/documents', authMiddleware, upload.array('documents'), caseController.uploadDocuments);

// Trigger Global Summary
router.post('/:id/summary', authMiddleware, caseController.generateSummary);

// Archive/Delete
router.put('/:id/archive', authMiddleware, caseController.archive);
router.delete('/:id', authMiddleware, caseController.delete);

export default router;
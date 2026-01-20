import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import trackingController from '../controllers/trackingController';

const router = Router();

router.post('/check/:caseId', authMiddleware, trackingController.checkUpdates);
router.post('/check-all', authMiddleware, trackingController.checkAll);
router.get('/recent', authMiddleware, trackingController.getRecentUpdates);
router.get('/:caseId', authMiddleware, trackingController.getUpdates);

export default router;

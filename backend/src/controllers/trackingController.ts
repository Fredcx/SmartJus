import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import trackingService from '../services/trackingService';

export class TrackingController {

    // Trigger manual update for a case
    async checkUpdates(req: AuthRequest, res: Response) {
        try {
            const { caseId } = req.params;
            const updates = await trackingService.checkCaseUpdates(caseId);
            res.json({ message: 'Updates checked successfully', count: updates.length, updates });
        } catch (error: any) {
            console.error('Error checking updates:', error);
            res.status(500).json({ error: error.message || 'Failed to check updates' });
        }
    }

    // Get updates history for a case
    async getUpdates(req: AuthRequest, res: Response) {
        try {
            const { caseId } = req.params;
            const updates = await prisma.caseUpdate.findMany({
                where: { caseId },
                orderBy: { date: 'desc' }
            });
            res.json(updates);
        } catch (error) {
            console.error('Error fetching updates:', error);
            res.status(500).json({ error: 'Failed to fetch updates' });
        }
    }

    // Trigger global update (Admin only usually, but open for MVP)
    async checkAll(req: AuthRequest, res: Response) {
        try {
            // Verify in background
            trackingService.checkAllActiveCases();
            res.json({ message: 'Background verification started' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to start verification' });
        }
    }
    // Get recent updates across all cases
    async getRecentUpdates(req: AuthRequest, res: Response) {
        try {
            const updates = await prisma.caseUpdate.findMany({
                take: 10,
                orderBy: { date: 'desc' },
                include: {
                    case: {
                        select: {
                            id: true,
                            title: true,
                            caseNumber: true
                        }
                    }
                }
            });
            res.json(updates);
        } catch (error) {
            console.error('Error fetching recent updates:', error);
            res.status(500).json({ error: 'Failed to fetch recent updates' });
        }
    }
}

export default new TrackingController();

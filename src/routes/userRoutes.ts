import { Router } from 'express';
import { getLeaderboard, getStats, checkBonus, claimBonusHandler } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/leaderboard', getLeaderboard);
router.get('/stats', authMiddleware, getStats);
router.get('/bonus/check', authMiddleware, checkBonus);
router.post('/bonus/claim', authMiddleware, claimBonusHandler);

export default router;
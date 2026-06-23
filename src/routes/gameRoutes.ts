import { Router } from 'express';
import { saveGame } from '../controllers/gameController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/save', authMiddleware, saveGame);

export default router;
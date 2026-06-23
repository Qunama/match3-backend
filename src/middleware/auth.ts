import { Request, Response, NextFunction } from 'express';

// Расширяем тип Request для хранения telegram_id
declare global {
  namespace Express {
    interface Request {
      telegramId?: number;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const telegramId = req.headers['x-telegram-id'];

  if (!telegramId) {
    res.status(401).json({ success: false, error: 'Telegram ID is required' });
    return;
  }

  const id = parseInt(telegramId as string, 10);
  if (isNaN(id)) {
    res.status(401).json({ success: false, error: 'Invalid Telegram ID' });
    return;
  }

  req.telegramId = id;
  next();
};
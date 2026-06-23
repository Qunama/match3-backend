import { Request, Response } from 'express';
import { findOrCreateUser, updateUserScore } from '../services/userService';
import { saveGameSession } from '../services/gameService';

// Сохранение результата игры
export const saveGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const telegramId = req.telegramId;
    if (!telegramId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { score, moves, duration, won } = req.body;

    // Валидация
    if (typeof score !== 'number' || typeof moves !== 'number' || typeof duration !== 'number' || typeof won !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'Invalid request body. Required: score (number), moves (number), duration (number), won (boolean)',
      });
      return;
    }

    // Находим или создаём пользователя
    const user = await findOrCreateUser(telegramId);

    // Сохраняем игровую сессию
    const session = await saveGameSession(user.id, score, moves, duration, won);

    // Обновляем статистику пользователя
    const updatedUser = await updateUserScore(user.id, score, won);

    res.json({
      success: true,
      data: {
        session,
        user: updatedUser,
      },
    });
  } catch (error: any) {
    console.error('Save game error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
};
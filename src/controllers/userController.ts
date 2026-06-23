import { Request, Response } from 'express';
import { getTopPlayers, getPlayerStats } from '../services/userService';
import { checkBonusAvailability, claimBonus } from '../services/bonusService';
import { findOrCreateUser } from '../services/userService';

// Получение таблицы лидеров
export const getLeaderboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const players = await getTopPlayers(10);

    const leaderboard = players.map((player) => ({
      username: player.username,
      first_name: player.first_name,
      total_score: player.total_score,
      games_played: player.games_played,
      games_won: player.games_won,
    }));

    res.json({ success: true, data: leaderboard });
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
};

// Получение статистики игрока
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const telegramId = req.telegramId;
    if (!telegramId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await findOrCreateUser(telegramId);
    const stats = await getPlayerStats(user.id);

    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
};

// Проверка доступности ежедневного бонуса
export const checkBonus = async (req: Request, res: Response): Promise<void> => {
  try {
    const telegramId = req.telegramId;
    if (!telegramId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await findOrCreateUser(telegramId);
    const bonusStatus = await checkBonusAvailability(user.id);

    res.json({ success: true, data: bonusStatus });
  } catch (error: any) {
    console.error('Check bonus error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
};

// Получение ежедневного бонуса
export const claimBonusHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const telegramId = req.telegramId;
    if (!telegramId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await findOrCreateUser(telegramId);
    const bonus = await claimBonus(user.id);

    // Получаем обновлённого пользователя
    const { getSupabaseClient } = require('../config/database');
    const supabase = getSupabaseClient();
    const { data: updatedUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    res.json({
      success: true,
      data: {
        bonus,
        user: updatedUser,
      },
    });
  } catch (error: any) {
    console.error('Claim bonus error:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to claim bonus' });
  }
};
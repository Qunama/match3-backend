import { getSupabaseClient } from '../config/database';

export interface GameSessionRecord {
  id: string;
  user_id: string;
  score: number;
  moves: number;
  duration: number;
  won: boolean;
  started_at: string;
  ended_at: string | null;
}

// Сохранить игровую сессию
export const saveGameSession = async (
  userId: string,
  score: number,
  moves: number,
  duration: number,
  won: boolean
): Promise<GameSessionRecord> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      user_id: userId,
      score,
      moves,
      duration,
      won,
      ended_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as GameSessionRecord;
};
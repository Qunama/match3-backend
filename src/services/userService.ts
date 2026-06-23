import { getSupabaseClient } from '../config/database';

export interface UserRecord {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  total_score: number;
  games_played: number;
  games_won: number;
  created_at: string;
}

// Найти или создать пользователя по telegram_id
export const findOrCreateUser = async (
  telegramId: number,
  username?: string,
  firstName?: string,
  lastName?: string
): Promise<UserRecord> => {
  const supabase = getSupabaseClient();

  // Ищем пользователя
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (existingUser) {
    // Обновляем данные профиля, если изменились
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        username: username || existingUser.username,
        first_name: firstName || existingUser.first_name,
        last_name: lastName || existingUser.last_name,
      })
      .eq('telegram_id', telegramId)
      .select('*')
      .single();

    return (updatedUser || existingUser) as UserRecord;
  }

  // Создаём нового пользователя
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      telegram_id: telegramId,
      username,
      first_name: firstName,
      last_name: lastName,
      total_score: 0,
      games_played: 0,
      games_won: 0,
    })
    .select('*')
    .single();

  if (insertError) throw insertError;
  return newUser as UserRecord;
};

// Получить пользователя по ID
export const getUserById = async (userId: string): Promise<UserRecord | null> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data as UserRecord;
};

// Обновить счёт пользователя после игры
export const updateUserScore = async (
  userId: string,
  score: number,
  won: boolean
): Promise<UserRecord> => {
  const supabase = getSupabaseClient();

  const { data: user, error: getUserError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (getUserError || !user) throw new Error('User not found');

  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({
      total_score: user.total_score + score,
      games_played: user.games_played + 1,
      games_won: won ? user.games_won + 1 : user.games_won,
    })
    .eq('id', userId)
    .select('*')
    .single();

  if (updateError) throw updateError;
  return updatedUser as UserRecord;
};

// Получить топ-10 игроков
export const getTopPlayers = async (limit = 10): Promise<UserRecord[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('total_score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as UserRecord[];
};

// Получить статистику игрока
export const getPlayerStats = async (userId: string) => {
  const supabase = getSupabaseClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) throw new Error('User not found');

  return {
    total_score: user.total_score,
    games_played: user.games_played,
    games_won: user.games_won,
    win_rate: user.games_played > 0 ? (user.games_won / user.games_played) * 100 : 0,
    average_score: user.games_played > 0 ? user.total_score / user.games_played : 0,
  };
};
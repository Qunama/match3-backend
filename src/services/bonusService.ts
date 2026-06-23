import { getSupabaseClient } from '../config/database';

export interface DailyBonusRecord {
  id: string;
  user_id: string;
  bonus_date: string;
  claimed: boolean;
  amount: number;
}

// Проверить, доступен ли ежедневный бонус
export const checkBonusAvailability = async (userId: string): Promise<{ available: boolean; amount: number }> => {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_bonuses')
    .select('*')
    .eq('user_id', userId)
    .eq('bonus_date', today)
    .single();

  if (error || !data) {
    return { available: true, amount: 100 };
  }

  return { available: !data.claimed, amount: data.amount };
};

// Забрать ежедневный бонус
export const claimBonus = async (userId: string): Promise<DailyBonusRecord> => {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split('T')[0];

  // Проверяем, есть ли уже запись на сегодня
  const { data: existingBonus, error: findError } = await supabase
    .from('daily_bonuses')
    .select('*')
    .eq('user_id', userId)
    .eq('bonus_date', today)
    .single();

  if (existingBonus) {
    if (existingBonus.claimed) {
      throw new Error('Bonus already claimed today');
    }

    // Обновляем запись — помечаем как полученную
    const { data: updatedBonus, error: updateError } = await supabase
      .from('daily_bonuses')
      .update({ claimed: true })
      .eq('id', existingBonus.id)
      .select('*')
      .single();

    if (updateError) throw updateError;

    // Начисляем бонусные очки пользователю
    await addBonusToUser(userId, existingBonus.amount);

    return updatedBonus as DailyBonusRecord;
  }

  // Создаём новую запись о получении бонуса
  const { data: newBonus, error: insertError } = await supabase
    .from('daily_bonuses')
    .insert({
      user_id: userId,
      bonus_date: today,
      claimed: true,
      amount: 100,
    })
    .select('*')
    .single();

  if (insertError) throw insertError;

  // Начисляем бонусные очки пользователю
  await addBonusToUser(userId, 100);

  return newBonus as DailyBonusRecord;
};

// Начислить бонус пользователю
export const addBonusToUser = async (userId: string, amount: number): Promise<void> => {
  const supabase = getSupabaseClient();

  const { data: user } = await supabase
    .from('users')
    .select('total_score')
    .eq('id', userId)
    .single();

  if (!user) throw new Error('User not found');

  await supabase
    .from('users')
    .update({ total_score: user.total_score + amount })
    .eq('id', userId);
};
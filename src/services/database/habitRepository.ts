import {getDatabase} from './database';
import {HabitCompletion} from '../../types';

function mapCompletion(row: any): HabitCompletion {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    count: row.count,
    completedAt: row.completed_at,
    source: row.source,
  };
}

export const habitRepository = {
  async saveCompletion(completion: HabitCompletion): Promise<HabitCompletion> {
    const db = getDatabase();

    await db.execute(
      `INSERT INTO habit_completions (id, habit_id, date, count, completed_at, source)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(habit_id, date) DO UPDATE SET
         count = count + excluded.count,
         completed_at = excluded.completed_at`,
      [
        completion.id,
        completion.habitId,
        completion.date,
        completion.count,
        completion.completedAt,
        completion.source,
      ],
    );

    const result = await db.execute(
      'SELECT * FROM habit_completions WHERE habit_id = ? AND date = ?',
      [completion.habitId, completion.date],
    );
    return mapCompletion(result.rows[0]);
  },

  async loadCompletionsForDate(date: string): Promise<HabitCompletion[]> {
    const db = getDatabase();
    const result = await db.execute(
      'SELECT * FROM habit_completions WHERE date = ?',
      [date],
    );
    return result.rows.map(mapCompletion);
  },

  async loadCompletionsForHabit(
    habitId: string,
    startDate: string,
    endDate: string,
  ): Promise<HabitCompletion[]> {
    const db = getDatabase();
    const result = await db.execute(
      'SELECT * FROM habit_completions WHERE habit_id = ? AND date >= ? AND date <= ? ORDER BY date ASC',
      [habitId, startDate, endDate],
    );
    return result.rows.map(mapCompletion);
  },

  async loadCompletionDatesForHabit(habitId: string): Promise<string[]> {
    const db = getDatabase();
    const result = await db.execute(
      'SELECT DISTINCT date FROM habit_completions WHERE habit_id = ? ORDER BY date DESC',
      [habitId],
    );
    return result.rows.map((r: any) => r.date);
  },

  async deleteCompletion(id: string): Promise<void> {
    const db = getDatabase();
    await db.execute('DELETE FROM habit_completions WHERE id = ?', [id]);
  },

  async loadCompletionRates(
    habitIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<
    Array<{
      habitId: string;
      totalCompletions: number;
      daysWithCompletions: number;
    }>
  > {
    const db = getDatabase();
    if (habitIds.length === 0) {
      return [];
    }
    const placeholders = habitIds.map(() => '?').join(',');
    const result = await db.execute(
      `SELECT habit_id, SUM(count) as total_completions, COUNT(DISTINCT date) as days_with_completions
       FROM habit_completions
       WHERE habit_id IN (${placeholders}) AND date >= ? AND date <= ?
       GROUP BY habit_id`,
      [...habitIds, startDate, endDate],
    );
    return result.rows.map((row: any) => ({
      habitId: row.habit_id,
      totalCompletions: row.total_completions,
      daysWithCompletions: row.days_with_completions,
    }));
  },
};

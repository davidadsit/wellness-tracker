import {getDatabase} from './database';
import {
  NotificationOutcomeRecord,
  ReminderPeriod,
  NotificationOutcome,
} from '../../types';

function mapRow(row: any): NotificationOutcomeRecord {
  return {
    id: row.id,
    reminderPeriod: row.reminder_period,
    outcome: row.outcome ?? null,
    scheduledTime: row.scheduled_time,
    sentAt: row.sent_at,
    respondedAt: row.responded_at ?? null,
  };
}

export const notificationOutcomeRepository = {
  async save(
    record: NotificationOutcomeRecord,
  ): Promise<NotificationOutcomeRecord> {
    const db = getDatabase();
    await db.execute(
      'INSERT INTO notification_outcomes (id, reminder_period, outcome, scheduled_time, sent_at, responded_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET reminder_period = excluded.reminder_period, outcome = excluded.outcome, scheduled_time = excluded.scheduled_time, sent_at = excluded.sent_at, responded_at = excluded.responded_at',
      [
        record.id,
        record.reminderPeriod,
        record.outcome,
        record.scheduledTime,
        record.sentAt,
        record.respondedAt,
      ],
    );
    return record;
  },

  async saveOutcome(id: string, outcome: NotificationOutcome): Promise<void> {
    const db = getDatabase();
    const now = Date.now();
    await db.execute(
      'UPDATE notification_outcomes SET outcome = ?, responded_at = ? WHERE id = ?',
      [outcome, now, id],
    );
  },

  async loadDateRange(
    startTimestamp: number,
    endTimestamp: number,
  ): Promise<NotificationOutcomeRecord[]> {
    const db = getDatabase();
    const result = await db.execute(
      'SELECT * FROM notification_outcomes WHERE sent_at >= ? AND sent_at <= ? ORDER BY sent_at DESC',
      [startTimestamp, endTimestamp],
    );
    return result.rows.map(mapRow);
  },

  async loadRecentByPeriod(
    period: ReminderPeriod,
    limit: number,
  ): Promise<NotificationOutcomeRecord[]> {
    const db = getDatabase();
    const result = await db.execute(
      'SELECT * FROM notification_outcomes WHERE reminder_period = ? ORDER BY sent_at DESC LIMIT ?',
      [period, limit],
    );
    return result.rows.map(mapRow);
  },
};

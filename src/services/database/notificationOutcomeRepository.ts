import {getDatabase} from './database';
import {
  NotificationOutcomeRecord,
  ReminderPeriod,
  NotificationOutcome,
} from '../../types';
import {uuid} from '../../utils/uuid';

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
  async recordSent(params: {
    reminderPeriod: ReminderPeriod;
    scheduledTime: string;
  }): Promise<NotificationOutcomeRecord> {
    const db = getDatabase();
    const id = uuid();
    const now = Date.now();

    await db.execute(
      'INSERT INTO notification_outcomes (id, reminder_period, outcome, scheduled_time, sent_at, responded_at) VALUES (?, ?, NULL, ?, ?, NULL)',
      [id, params.reminderPeriod, params.scheduledTime, now],
    );

    return {
      id,
      reminderPeriod: params.reminderPeriod,
      outcome: null,
      scheduledTime: params.scheduledTime,
      sentAt: now,
      respondedAt: null,
    };
  },

  async recordOutcome(id: string, outcome: NotificationOutcome): Promise<void> {
    const db = getDatabase();
    const now = Date.now();
    await db.execute(
      'UPDATE notification_outcomes SET outcome = ?, responded_at = ? WHERE id = ?',
      [outcome, now, id],
    );
  },

  async getByDateRange(
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

  async getRecentByPeriod(
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

import {notificationOutcomeRepository} from '../../../../src/services/database/notificationOutcomeRepository';
import {setupTestDatabase} from '../../../helpers/database';

setupTestDatabase();

describe('notificationOutcomeRepository', () => {
  describe('recordSent', () => {
    it('inserts a row with null outcome', async () => {
      const record = await notificationOutcomeRepository.recordSent({
        reminderPeriod: 'morning',
        scheduledTime: '09:00',
      });

      expect(record.id).toBeDefined();
      expect(record.reminderPeriod).toBe('morning');
      expect(record.outcome).toBeNull();
      expect(record.scheduledTime).toBe('09:00');
      expect(record.sentAt).toBeGreaterThan(0);
      expect(record.respondedAt).toBeNull();
    });
  });

  describe('recordOutcome', () => {
    it('updates the outcome and respondedAt for an existing record', async () => {
      const record = await notificationOutcomeRepository.recordSent({
        reminderPeriod: 'midday',
        scheduledTime: '13:00',
      });

      await notificationOutcomeRepository.recordOutcome(
        record.id,
        'interacted',
      );

      const results = await notificationOutcomeRepository.getRecentByPeriod(
        'midday',
        1,
      );
      expect(results[0].outcome).toBe('interacted');
      expect(results[0].respondedAt).not.toBeNull();
    });

    it('records a dismissed outcome', async () => {
      const record = await notificationOutcomeRepository.recordSent({
        reminderPeriod: 'evening',
        scheduledTime: '19:00',
      });

      await notificationOutcomeRepository.recordOutcome(record.id, 'dismissed');

      const results = await notificationOutcomeRepository.getRecentByPeriod(
        'evening',
        1,
      );
      expect(results[0].outcome).toBe('dismissed');
    });

    it('records a snoozed outcome', async () => {
      const record = await notificationOutcomeRepository.recordSent({
        reminderPeriod: 'morning',
        scheduledTime: '09:00',
      });

      await notificationOutcomeRepository.recordOutcome(record.id, 'snoozed');

      const results = await notificationOutcomeRepository.getRecentByPeriod(
        'morning',
        1,
      );
      expect(results[0].outcome).toBe('snoozed');
    });
  });

  describe('getByDateRange', () => {
    it('returns outcomes within the range', async () => {
      const before = Date.now();
      await notificationOutcomeRepository.recordSent({
        reminderPeriod: 'morning',
        scheduledTime: '09:00',
      });
      await notificationOutcomeRepository.recordSent({
        reminderPeriod: 'midday',
        scheduledTime: '13:00',
      });
      const after = Date.now();

      const results = await notificationOutcomeRepository.getByDateRange(
        before - 1000,
        after + 1000,
      );
      expect(results).toHaveLength(2);
    });

    it('excludes outcomes outside the range', async () => {
      await notificationOutcomeRepository.recordSent({
        reminderPeriod: 'morning',
        scheduledTime: '09:00',
      });

      const results = await notificationOutcomeRepository.getByDateRange(0, 1);
      expect(results).toHaveLength(0);
    });
  });

  describe('getRecentByPeriod', () => {
    it('filters by period and respects limit', async () => {
      await notificationOutcomeRepository.recordSent({
        reminderPeriod: 'morning',
        scheduledTime: '09:00',
      });
      await notificationOutcomeRepository.recordSent({
        reminderPeriod: 'morning',
        scheduledTime: '09:00',
      });
      await notificationOutcomeRepository.recordSent({
        reminderPeriod: 'evening',
        scheduledTime: '19:00',
      });

      const morningResults =
        await notificationOutcomeRepository.getRecentByPeriod('morning', 1);
      expect(morningResults).toHaveLength(1);

      const allMorning = await notificationOutcomeRepository.getRecentByPeriod(
        'morning',
        10,
      );
      expect(allMorning).toHaveLength(2);

      const eveningResults =
        await notificationOutcomeRepository.getRecentByPeriod('evening', 10);
      expect(eveningResults).toHaveLength(1);
    });
  });
});

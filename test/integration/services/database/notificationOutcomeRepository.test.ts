import {notificationOutcomeRepository} from '../../../../src/services/database/notificationOutcomeRepository';
import {setupTestDatabase} from '../../../helpers/database';
import {makeNotificationOutcome as makeOutcome} from '../../../helpers/factories';

setupTestDatabase();

describe('notificationOutcomeRepository', () => {
  describe('save', () => {
    it('inserts a record with null outcome', async () => {
      const record = await notificationOutcomeRepository.save(makeOutcome());

      expect(record.id).toBeDefined();
      expect(record.reminderPeriod).toBe('morning');
      expect(record.outcome).toBeNull();
      expect(record.scheduledTime).toBe('09:00');
      expect(record.sentAt).toBeGreaterThan(0);
      expect(record.respondedAt).toBeNull();
    });
  });

  describe('saveOutcome', () => {
    it('updates the outcome and respondedAt for an existing record', async () => {
      const record = await notificationOutcomeRepository.save(
        makeOutcome({reminderPeriod: 'midday', scheduledTime: '13:00'}),
      );

      await notificationOutcomeRepository.saveOutcome(record.id, 'interacted');

      const results = await notificationOutcomeRepository.loadRecentByPeriod(
        'midday',
        1,
      );
      expect(results[0].outcome).toBe('interacted');
      expect(results[0].respondedAt).not.toBeNull();
    });

    it('records a dismissed outcome', async () => {
      const record = await notificationOutcomeRepository.save(
        makeOutcome({reminderPeriod: 'evening', scheduledTime: '19:00'}),
      );

      await notificationOutcomeRepository.saveOutcome(record.id, 'dismissed');

      const results = await notificationOutcomeRepository.loadRecentByPeriod(
        'evening',
        1,
      );
      expect(results[0].outcome).toBe('dismissed');
    });

    it('records a snoozed outcome', async () => {
      const record = await notificationOutcomeRepository.save(
        makeOutcome({reminderPeriod: 'morning', scheduledTime: '09:00'}),
      );

      await notificationOutcomeRepository.saveOutcome(record.id, 'snoozed');

      const results = await notificationOutcomeRepository.loadRecentByPeriod(
        'morning',
        1,
      );
      expect(results[0].outcome).toBe('snoozed');
    });
  });

  describe('loadDateRange', () => {
    it('returns outcomes within the range', async () => {
      const before = Date.now();
      await notificationOutcomeRepository.save(makeOutcome());
      await notificationOutcomeRepository.save(
        makeOutcome({reminderPeriod: 'midday', scheduledTime: '13:00'}),
      );
      const after = Date.now();

      const results = await notificationOutcomeRepository.loadDateRange(
        before - 1000,
        after + 1000,
      );
      expect(results).toHaveLength(2);
    });

    it('excludes outcomes outside the range', async () => {
      await notificationOutcomeRepository.save(makeOutcome());

      const results = await notificationOutcomeRepository.loadDateRange(0, 1);
      expect(results).toHaveLength(0);
    });
  });

  describe('loadRecentByPeriod', () => {
    it('filters by period and respects limit', async () => {
      await notificationOutcomeRepository.save(makeOutcome());
      await notificationOutcomeRepository.save(makeOutcome());
      await notificationOutcomeRepository.save(
        makeOutcome({reminderPeriod: 'evening', scheduledTime: '19:00'}),
      );

      const morningResults =
        await notificationOutcomeRepository.loadRecentByPeriod('morning', 1);
      expect(morningResults).toHaveLength(1);

      const allMorning = await notificationOutcomeRepository.loadRecentByPeriod(
        'morning',
        10,
      );
      expect(allMorning).toHaveLength(2);

      const eveningResults =
        await notificationOutcomeRepository.loadRecentByPeriod('evening', 10);
      expect(eveningResults).toHaveLength(1);
    });
  });
});

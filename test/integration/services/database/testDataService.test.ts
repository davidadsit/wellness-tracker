import {testDataService} from '../../../../src/services/database/testDataService';
import {checkInRepository} from '../../../../src/services/database/checkInRepository';
import {habitRepository} from '../../../../src/services/database/habitRepository';
import {tagRepository} from '../../../../src/services/database/tagRepository';
import {setupTestDatabase} from '../../../helpers/database';
import {makeHabit} from '../../../helpers/factories';
import {formatDateString} from '../../../../src/utils/dateUtils';
import {subDays} from 'date-fns';

setupTestDatabase();

describe('testDataService', () => {
  describe('generateCheckIns', () => {
    it('creates check-ins spanning the specified number of days', async () => {
      const count = await testDataService.generateCheckIns(7);

      expect(count).toBeGreaterThanOrEqual(7); // at least 1 per day
      expect(count).toBeLessThanOrEqual(24); // at most 3 per day * 8 days (0..7)

      const today = new Date();
      const start = subDays(today, 8);
      const checkIns = await checkInRepository.loadDateRange(
        start.getTime(),
        today.getTime() + 86400000,
      );
      expect(checkIns.length).toBe(count);
    });

    it('assigns 2-4 random tags to each check-in', async () => {
      await testDataService.generateCheckIns(1);

      const today = new Date();
      const start = subDays(today, 2);
      const checkIns = await checkInRepository.loadDateRange(
        start.getTime(),
        today.getTime() + 86400000,
      );

      for (const checkIn of checkIns) {
        expect(checkIn.tagIds.length).toBeGreaterThanOrEqual(2);
        expect(checkIn.tagIds.length).toBeLessThanOrEqual(4);
      }
    });

    it('uses only existing non-archived tags', async () => {
      await testDataService.generateCheckIns(1);

      const allTags = await tagRepository.loadAllTags();
      const validTagIds = new Set(allTags.map(t => t.id));

      const today = new Date();
      const start = subDays(today, 2);
      const checkIns = await checkInRepository.loadDateRange(
        start.getTime(),
        today.getTime() + 86400000,
      );

      for (const checkIn of checkIns) {
        for (const tagId of checkIn.tagIds) {
          expect(validTagIds.has(tagId)).toBe(true);
        }
      }
    });

    it('adds notes to roughly 10% of check-ins', async () => {
      await testDataService.generateCheckIns(30);

      const today = new Date();
      const start = subDays(today, 31);
      const checkIns = await checkInRepository.loadDateRange(
        start.getTime(),
        today.getTime() + 86400000,
      );

      const withNotes = checkIns.filter(c => c.note);
      expect(withNotes.length).toBeGreaterThan(0);
      expect(withNotes.length).toBeLessThan(checkIns.length);
    });
  });

  describe('generateHabitCompletions', () => {
    it('creates completions for each habit over the specified days', async () => {
      const habits = [makeHabit({id: 'h1'})];
      const count = await testDataService.generateHabitCompletions(habits, 10);

      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(11); // days 0..10

      const today = formatDateString(new Date());
      const tenDaysAgo = formatDateString(subDays(new Date(), 11));

      const completions = await habitRepository.loadCompletionsForHabit(
        'h1',
        tenDaysAgo,
        today,
      );
      expect(completions.length).toBe(count);
    });

    it('achieves roughly 70% completion rate', async () => {
      const habits = [makeHabit({id: 'h1'})];
      const count = await testDataService.generateHabitCompletions(habits, 100);
      const rate = count / 101; // days 0..100

      expect(rate).toBeGreaterThan(0.3);
      expect(rate).toBeLessThan(1.0);
    });
  });

  describe('clearAllData', () => {
    it('removes all check-ins and completions', async () => {
      await testDataService.generateCheckIns(3);
      await testDataService.generateHabitCompletions(
        [makeHabit({id: 'h1'})],
        3,
      );

      await testDataService.clearAllData();

      const checkIns = await checkInRepository.loadDateRange(
        0,
        Date.now() + 86400000,
      );
      expect(checkIns).toHaveLength(0);

      const completions = await habitRepository.loadCompletionsForDate(
        formatDateString(new Date()),
      );
      expect(completions).toHaveLength(0);
    });

    it('preserves tags and categories', async () => {
      await testDataService.clearAllData();

      const categories = await tagRepository.loadAllCategories();
      expect(categories.length).toBeGreaterThan(0);

      const tags = await tagRepository.loadAllTags();
      expect(tags.length).toBeGreaterThan(0);
    });
  });
});

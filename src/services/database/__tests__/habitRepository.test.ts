import {habitRepository} from '../habitRepository';
import {resetDatabase} from '../database';
import {resetUuidCounter} from '../../../__mocks__/uuid';

beforeEach(() => {
  resetDatabase();
  resetUuidCounter();
});

describe('habitRepository', () => {
  describe('completeHabit', () => {
    it('creates a new completion', () => {
      const completion = habitRepository.completeHabit('habit-1', {
        date: '2024-01-15',
      });

      expect(completion.habitId).toBe('habit-1');
      expect(completion.date).toBe('2024-01-15');
      expect(completion.count).toBe(1);
      expect(completion.source).toBe('manual');
    });

    it('increments count on duplicate habit+date (upsert)', () => {
      habitRepository.completeHabit('habit-1', {date: '2024-01-15'});
      const second = habitRepository.completeHabit('habit-1', {
        date: '2024-01-15',
      });

      expect(second.count).toBe(2);
    });

    it('creates separate rows for different dates', () => {
      habitRepository.completeHabit('habit-1', {date: '2024-01-15'});
      habitRepository.completeHabit('habit-1', {date: '2024-01-16'});

      const jan15 = habitRepository.getCompletionsForDate('2024-01-15');
      const jan16 = habitRepository.getCompletionsForDate('2024-01-16');
      expect(jan15).toHaveLength(1);
      expect(jan16).toHaveLength(1);
    });

    it('creates separate rows for different habits on same date', () => {
      habitRepository.completeHabit('habit-1', {date: '2024-01-15'});
      habitRepository.completeHabit('habit-2', {date: '2024-01-15'});

      const completions = habitRepository.getCompletionsForDate('2024-01-15');
      expect(completions).toHaveLength(2);
    });

    it('records notification source', () => {
      const completion = habitRepository.completeHabit('habit-1', {
        date: '2024-01-15',
        source: 'notification',
      });
      expect(completion.source).toBe('notification');
    });
  });

  describe('getCompletionsForDate', () => {
    it('returns all completions for a given date', () => {
      habitRepository.completeHabit('habit-1', {date: '2024-01-15'});
      habitRepository.completeHabit('habit-2', {date: '2024-01-15'});
      habitRepository.completeHabit('habit-1', {date: '2024-01-16'});

      const completions = habitRepository.getCompletionsForDate('2024-01-15');
      expect(completions).toHaveLength(2);
      expect(completions.map(c => c.habitId)).toContain('habit-1');
      expect(completions.map(c => c.habitId)).toContain('habit-2');
    });

    it('returns empty array for date with no completions', () => {
      const completions = habitRepository.getCompletionsForDate('2024-01-15');
      expect(completions).toEqual([]);
    });
  });

  describe('getCompletionsForHabit', () => {
    it('returns completions within date range', () => {
      habitRepository.completeHabit('habit-1', {date: '2024-01-14'});
      habitRepository.completeHabit('habit-1', {date: '2024-01-15'});
      habitRepository.completeHabit('habit-1', {date: '2024-01-16'});
      habitRepository.completeHabit('habit-1', {date: '2024-01-17'});

      const completions = habitRepository.getCompletionsForHabit(
        'habit-1',
        '2024-01-15',
        '2024-01-16',
      );
      expect(completions).toHaveLength(2);
    });

    it('returns results in ascending date order', () => {
      habitRepository.completeHabit('habit-1', {date: '2024-01-16'});
      habitRepository.completeHabit('habit-1', {date: '2024-01-14'});

      const completions = habitRepository.getCompletionsForHabit(
        'habit-1',
        '2024-01-01',
        '2024-01-31',
      );
      expect(completions[0].date).toBe('2024-01-14');
      expect(completions[1].date).toBe('2024-01-16');
    });
  });

  describe('getCompletionDatesForHabit', () => {
    it('returns distinct dates in descending order', () => {
      habitRepository.completeHabit('habit-1', {date: '2024-01-14'});
      habitRepository.completeHabit('habit-1', {date: '2024-01-16'});
      habitRepository.completeHabit('habit-1', {date: '2024-01-16'}); // duplicate

      const dates = habitRepository.getCompletionDatesForHabit('habit-1');
      expect(dates).toEqual(['2024-01-16', '2024-01-14']);
    });

    it('returns empty array for habit with no completions', () => {
      const dates = habitRepository.getCompletionDatesForHabit('nonexistent');
      expect(dates).toEqual([]);
    });
  });

  describe('deleteCompletion', () => {
    it('deletes a specific completion', () => {
      const completion = habitRepository.completeHabit('habit-1', {
        date: '2024-01-15',
      });
      habitRepository.deleteCompletion(completion.id);

      const completions = habitRepository.getCompletionsForDate('2024-01-15');
      expect(completions).toHaveLength(0);
    });
  });

  describe('getCompletionRates', () => {
    it('returns completion rates for multiple habits', () => {
      habitRepository.completeHabit('habit-1', {date: '2024-01-15'});
      habitRepository.completeHabit('habit-1', {date: '2024-01-16'});
      habitRepository.completeHabit('habit-1', {date: '2024-01-16'}); // count=2 on this date
      habitRepository.completeHabit('habit-2', {date: '2024-01-15'});

      const rates = habitRepository.getCompletionRates(
        ['habit-1', 'habit-2'],
        '2024-01-01',
        '2024-01-31',
      );

      const habit1 = rates.find(r => r.habitId === 'habit-1');
      expect(habit1?.totalCompletions).toBe(3); // 1 + 2
      expect(habit1?.daysWithCompletions).toBe(2);

      const habit2 = rates.find(r => r.habitId === 'habit-2');
      expect(habit2?.totalCompletions).toBe(1);
      expect(habit2?.daysWithCompletions).toBe(1);
    });

    it('returns empty array for empty habit list', () => {
      const rates = habitRepository.getCompletionRates(
        [],
        '2024-01-01',
        '2024-01-31',
      );
      expect(rates).toEqual([]);
    });

    it('excludes habits with no completions in range', () => {
      habitRepository.completeHabit('habit-1', {date: '2024-02-01'});

      const rates = habitRepository.getCompletionRates(
        ['habit-1'],
        '2024-01-01',
        '2024-01-31',
      );
      expect(rates).toHaveLength(0);
    });
  });
});

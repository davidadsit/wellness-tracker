import {
  todayDateString,
  formatDateString,
  todayStartTimestamp,
  todayEndTimestamp,
  daysAgoTimestamp,
  dateStringToTimestamp,
  formatDisplayDate,
  formatDisplayTime,
  getDateRange,
} from '../../../src/utils/dateUtils';
import {startOfDay, endOfDay, format} from 'date-fns';

describe('dateUtils', () => {
  describe('todayDateString', () => {
    it('returns today in yyyy-MM-dd format', () => {
      const result = todayDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toBe(format(new Date(), 'yyyy-MM-dd'));
    });
  });

  describe('formatDateString', () => {
    it('formats a Date as yyyy-MM-dd', () => {
      const date = new Date(2024, 0, 15); // Jan 15, 2024
      expect(formatDateString(date)).toBe('2024-01-15');
    });
  });

  describe('todayStartTimestamp', () => {
    it('returns start of today as millisecond timestamp', () => {
      const result = todayStartTimestamp();
      expect(result).toBe(startOfDay(new Date()).getTime());
    });
  });

  describe('todayEndTimestamp', () => {
    it('returns end of today as millisecond timestamp', () => {
      const result = todayEndTimestamp();
      expect(result).toBe(endOfDay(new Date()).getTime());
    });
  });

  describe('daysAgoTimestamp', () => {
    it('returns start of day N days ago', () => {
      const sevenDaysAgo = daysAgoTimestamp(7);
      const now = Date.now();
      const expectedApprox = now - 7 * 24 * 60 * 60 * 1000;
      expect(Math.abs(sevenDaysAgo - expectedApprox)).toBeLessThan(
        24 * 60 * 60 * 1000,
      );
    });

    it('returns start of today for 0 days ago', () => {
      expect(daysAgoTimestamp(0)).toBe(todayStartTimestamp());
    });
  });

  describe('dateStringToTimestamp', () => {
    it('parses an ISO date string to timestamp', () => {
      const ts = dateStringToTimestamp('2024-01-15');
      const date = new Date(ts);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(15);
    });
  });

  describe('formatDisplayDate', () => {
    it('formats a timestamp as "MMM d, yyyy"', () => {
      const ts = new Date(2024, 0, 15).getTime();
      expect(formatDisplayDate(ts)).toBe('Jan 15, 2024');
    });
  });

  describe('formatDisplayTime', () => {
    it('formats a timestamp as "h:mm a"', () => {
      const ts = new Date(2024, 0, 15, 14, 30).getTime();
      expect(formatDisplayTime(ts)).toBe('2:30 PM');
    });
  });

  describe('getDateRange', () => {
    it('returns start and end timestamps spanning N days', () => {
      const range = getDateRange(7);
      expect(range.start).toBe(daysAgoTimestamp(7));
      expect(range.end).toBe(endOfDay(new Date()).getTime());
      expect(range.end).toBeGreaterThan(range.start);
    });
  });
});

import {
  calculateStreak,
  calculateTagFrequency,
  calculateTagTrends,
  formatCoOccurrences,
  calculateCompletionRate,
} from '../../src/utils/analytics';
import {format, subDays} from 'date-fns';

function dateStr(daysAgo: number): string {
  return format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
}

describe('calculateStreak', () => {
  it('returns zero for empty input', () => {
    const result = calculateStreak([]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it('returns 1 for a single entry today', () => {
    const result = calculateStreak([dateStr(0)]);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('returns 1 for a single entry yesterday', () => {
    const result = calculateStreak([dateStr(1)]);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('returns 0 current streak for a single entry 2 days ago', () => {
    const result = calculateStreak([dateStr(2)]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(1);
  });

  it('calculates active streak from today', () => {
    const dates = [dateStr(0), dateStr(1), dateStr(2)];
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('calculates active streak from yesterday', () => {
    const dates = [dateStr(1), dateStr(2), dateStr(3)];
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('detects broken streak', () => {
    const dates = [dateStr(0), dateStr(2), dateStr(3)];
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(2);
  });

  it('tracks longest streak separately from current', () => {
    // Current: today only (1 day)
    // Longest: 5 days ago through 10 days ago (6 days)
    const dates = [
      dateStr(0),
      dateStr(5),
      dateStr(6),
      dateStr(7),
      dateStr(8),
      dateStr(9),
      dateStr(10),
    ];
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(6);
  });

  it('handles unsorted input', () => {
    const dates = [dateStr(2), dateStr(0), dateStr(1)];
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(3);
  });
});

describe('calculateTagFrequency', () => {
  it('returns empty array when totalCheckIns is 0', () => {
    const result = calculateTagFrequency(
      [{tagId: 'tag-1', count: 5}],
      {'tag-1': 'Happy'},
      0,
    );
    expect(result).toEqual([]);
  });

  it('calculates frequency and percentage', () => {
    const result = calculateTagFrequency(
      [
        {tagId: 'tag-1', count: 8},
        {tagId: 'tag-2', count: 3},
      ],
      {'tag-1': 'Happy', 'tag-2': 'Sad'},
      10,
    );

    expect(result[0]).toEqual({
      tagId: 'tag-1',
      label: 'Happy',
      count: 8,
      percentage: 80,
    });
    expect(result[1]).toEqual({
      tagId: 'tag-2',
      label: 'Sad',
      count: 3,
      percentage: 30,
    });
  });

  it('sorts by count descending', () => {
    const result = calculateTagFrequency(
      [
        {tagId: 'tag-1', count: 2},
        {tagId: 'tag-2', count: 5},
      ],
      {'tag-1': 'A', 'tag-2': 'B'},
      10,
    );
    expect(result[0].tagId).toBe('tag-2');
  });

  it('uses tagId as label fallback', () => {
    const result = calculateTagFrequency(
      [{tagId: 'tag-unknown', count: 1}],
      {},
      1,
    );
    expect(result[0].label).toBe('tag-unknown');
  });
});

describe('calculateTagTrends', () => {
  it('marks trend as up when current > previous', () => {
    const result = calculateTagTrends(
      [{tagId: 'tag-1', count: 5}],
      [{tagId: 'tag-1', count: 2}],
      {'tag-1': 'Happy'},
    );
    expect(result[0].trend).toBe('up');
  });

  it('marks trend as down when current < previous', () => {
    const result = calculateTagTrends(
      [{tagId: 'tag-1', count: 1}],
      [{tagId: 'tag-1', count: 5}],
      {'tag-1': 'Happy'},
    );
    expect(result[0].trend).toBe('down');
  });

  it('marks trend as stable when counts are equal', () => {
    const result = calculateTagTrends(
      [{tagId: 'tag-1', count: 3}],
      [{tagId: 'tag-1', count: 3}],
      {'tag-1': 'Happy'},
    );
    expect(result[0].trend).toBe('stable');
  });

  it('handles tag only in current period', () => {
    const result = calculateTagTrends(
      [{tagId: 'tag-new', count: 3}],
      [],
      {'tag-new': 'New Tag'},
    );
    expect(result[0].trend).toBe('up');
    expect(result[0].periods[0].count).toBe(0);
    expect(result[0].periods[1].count).toBe(3);
  });

  it('handles tag only in previous period', () => {
    const result = calculateTagTrends(
      [],
      [{tagId: 'tag-old', count: 3}],
      {'tag-old': 'Old Tag'},
    );
    expect(result[0].trend).toBe('down');
  });
});

describe('formatCoOccurrences', () => {
  it('formats and limits co-occurrences', () => {
    const coOccurrences = [
      {tagId: 'tag-2', count: 5},
      {tagId: 'tag-3', count: 3},
      {tagId: 'tag-4', count: 2},
    ];
    const labels = {
      'tag-1': 'Happy',
      'tag-2': 'Energized',
      'tag-3': 'Focused',
      'tag-4': 'Calm',
    };

    const result = formatCoOccurrences('tag-1', coOccurrences, labels, 2);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      tagId: 'tag-1',
      label: 'Happy',
      coOccurringTagId: 'tag-2',
      coOccurringLabel: 'Energized',
      count: 5,
    });
  });
});

describe('calculateCompletionRate', () => {
  it('returns 0 when totalDays is 0', () => {
    expect(calculateCompletionRate(5, 0)).toBe(0);
  });

  it('calculates percentage correctly', () => {
    expect(calculateCompletionRate(7, 10)).toBe(70);
  });

  it('rounds to nearest integer', () => {
    expect(calculateCompletionRate(1, 3)).toBe(33);
  });

  it('returns 100 for perfect completion', () => {
    expect(calculateCompletionRate(30, 30)).toBe(100);
  });
});

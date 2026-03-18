import {format, subDays, differenceInCalendarDays, parseISO} from 'date-fns';

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

export function calculateStreak(completionDates: string[]): StreakResult {
  if (completionDates.length === 0) {
    return {currentStreak: 0, longestStreak: 0};
  }

  const sorted = [...completionDates].sort().reverse();
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 1;

  const firstDate = sorted[0];
  const isActive = firstDate === today || firstDate === yesterday;

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = parseISO(sorted[i - 1]);
    const currDate = parseISO(sorted[i]);
    const diff = differenceInCalendarDays(prevDate, currDate);

    if (diff === 1) {
      streak++;
    } else {
      if (i === 1 || (i > 1 && currentStreak === 0 && isActive)) {
        // nothing — streak already captured below
      }
      longestStreak = Math.max(longestStreak, streak);
      streak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, streak);

  if (isActive) {
    let activeStreak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prevDate = parseISO(sorted[i - 1]);
      const currDate = parseISO(sorted[i]);
      if (differenceInCalendarDays(prevDate, currDate) === 1) {
        activeStreak++;
      } else {
        break;
      }
    }
    currentStreak = activeStreak;
  }

  return {currentStreak, longestStreak};
}

export interface TagFrequencyItem {
  tagId: string;
  label: string;
  count: number;
  percentage: number;
}

export function calculateTagFrequency(
  tagCounts: Array<{tagId: string; count: number}>,
  tagLabels: Record<string, string>,
  totalCheckIns: number,
): TagFrequencyItem[] {
  if (totalCheckIns === 0) {
    return [];
  }

  return tagCounts
    .map(({tagId, count}) => ({
      tagId,
      label: tagLabels[tagId] ?? tagId,
      count,
      percentage: Math.round((count / totalCheckIns) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

export interface TagTrend {
  tagId: string;
  label: string;
  periods: Array<{periodLabel: string; count: number}>;
  trend: 'up' | 'down' | 'stable';
}

export function calculateTagTrends(
  currentPeriodCounts: Array<{tagId: string; count: number}>,
  previousPeriodCounts: Array<{tagId: string; count: number}>,
  tagLabels: Record<string, string>,
): TagTrend[] {
  const currentMap = new Map(currentPeriodCounts.map(t => [t.tagId, t.count]));
  const previousMap = new Map(previousPeriodCounts.map(t => [t.tagId, t.count]));

  const allTagIds = new Set([...currentMap.keys(), ...previousMap.keys()]);

  return Array.from(allTagIds).map(tagId => {
    const current = currentMap.get(tagId) ?? 0;
    const previous = previousMap.get(tagId) ?? 0;

    let trend: 'up' | 'down' | 'stable';
    if (current > previous) {
      trend = 'up';
    } else if (current < previous) {
      trend = 'down';
    } else {
      trend = 'stable';
    }

    return {
      tagId,
      label: tagLabels[tagId] ?? tagId,
      periods: [
        {periodLabel: 'Previous', count: previous},
        {periodLabel: 'Current', count: current},
      ],
      trend,
    };
  });
}

export interface CoOccurrence {
  tagId: string;
  label: string;
  coOccurringTagId: string;
  coOccurringLabel: string;
  count: number;
}

export function formatCoOccurrences(
  tagId: string,
  coOccurrences: Array<{tagId: string; count: number}>,
  tagLabels: Record<string, string>,
  limit: number = 5,
): CoOccurrence[] {
  return coOccurrences.slice(0, limit).map(co => ({
    tagId,
    label: tagLabels[tagId] ?? tagId,
    coOccurringTagId: co.tagId,
    coOccurringLabel: tagLabels[co.tagId] ?? co.tagId,
    count: co.count,
  }));
}

export function calculateCompletionRate(
  completedDays: number,
  totalDays: number,
): number {
  if (totalDays === 0) {
    return 0;
  }
  return Math.round((completedDays / totalDays) * 100);
}

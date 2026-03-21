import {useState, useCallback} from 'react';
import {CheckIn, HabitCompletion} from '../types';
import {checkInRepository} from '../services/database/checkInRepository';
import {habitRepository} from '../services/database/habitRepository';
import {formatDateString, formatDisplayDate} from '../utils/dateUtils';
import {startOfDay, endOfDay, subDays} from 'date-fns';

export type JournalEntry =
  | {type: 'checkin'; data: CheckIn}
  | {type: 'habit'; data: HabitCompletion};

export interface JournalSection {
  title: string;
  dateString: string;
  isGap: boolean;
  data: JournalEntry[];
}

const PAGE_SIZE = 14;

function getTimestamp(entry: JournalEntry): number {
  return entry.type === 'checkin'
    ? entry.data.timestamp
    : entry.data.completedAt;
}

function buildSections(
  checkIns: CheckIn[],
  completions: HabitCompletion[],
  startDay: Date,
  days: number,
): {sections: JournalSection[]; trailingEmpty: number} {
  const sections: JournalSection[] = [];
  let consecutiveEmpty = 0;

  for (let i = 0; i < days; i++) {
    const day = subDays(startDay, i);
    const dateStr = formatDateString(day);
    const dayStart = startOfDay(day).getTime();
    const dayEnd = endOfDay(day).getTime();

    const dayCheckIns = checkIns.filter(
      c => c.timestamp >= dayStart && c.timestamp <= dayEnd,
    );
    const dayCompletions = completions.filter(c => c.date === dateStr);

    if (dayCheckIns.length === 0 && dayCompletions.length === 0) {
      consecutiveEmpty++;
      continue;
    }

    // Flush gap before this populated day (but not at the very top)
    if (consecutiveEmpty > 0 && sections.length > 0) {
      sections.push({
        title: `No data for ${consecutiveEmpty} day${
          consecutiveEmpty > 1 ? 's' : ''
        }`,
        dateString: '',
        isGap: true,
        data: [],
      });
    }
    consecutiveEmpty = 0;

    const entries: JournalEntry[] = [
      ...dayCheckIns.map(c => ({type: 'checkin' as const, data: c})),
      ...dayCompletions.map(c => ({type: 'habit' as const, data: c})),
    ];
    entries.sort((a, b) => getTimestamp(b) - getTimestamp(a));

    sections.push({
      title: formatDisplayDate(dayStart),
      dateString: dateStr,
      isGap: false,
      data: entries,
    });
  }

  return {sections, trailingEmpty: consecutiveEmpty};
}

export function useJournal() {
  const [sections, setSections] = useState<JournalSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [daysLoaded, setDaysLoaded] = useState(0);

  const fetchRange = useCallback(async (offsetDays: number, count: number) => {
    const today = new Date();
    const rangeStart = startOfDay(subDays(today, offsetDays + count - 1));
    const rangeEnd = endOfDay(subDays(today, offsetDays));

    const checkIns = await checkInRepository.getByDateRange(
      rangeStart.getTime(),
      rangeEnd.getTime(),
    );

    // Fetch completions for each day in range
    const completions: HabitCompletion[] = [];
    for (let i = 0; i < count; i++) {
      const day = subDays(today, offsetDays + i);
      const dateStr = formatDateString(day);
      const dayCompletions = await habitRepository.getCompletionsForDate(
        dateStr,
      );
      completions.push(...dayCompletions);
    }

    // Build sections from most recent day first
    const startDay = subDays(today, offsetDays);
    return buildSections(checkIns, completions, startDay, count);
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const {sections: newSections, trailingEmpty} = await fetchRange(
        0,
        PAGE_SIZE,
      );
      setSections(newSections);
      setDaysLoaded(PAGE_SIZE);
      // If the entire window was empty, there may still be older data
      setHasMore(!(trailingEmpty === PAGE_SIZE));
    } finally {
      setLoading(false);
    }
  }, [fetchRange]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const {sections: newSections, trailingEmpty} = await fetchRange(
        daysLoaded,
        PAGE_SIZE,
      );
      if (newSections.length === 0) {
        setHasMore(false);
      } else {
        setSections(prev => {
          // Check if last existing section and first new section should merge a trailing gap
          return [...prev, ...newSections];
        });
      }
      if (trailingEmpty === PAGE_SIZE) {
        setHasMore(false);
      }
      setDaysLoaded(prev => prev + PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, daysLoaded, fetchRange]);

  return {sections, loading, loadingMore, hasMore, loadInitial, loadMore};
}

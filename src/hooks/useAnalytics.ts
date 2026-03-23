import {useState, useCallback} from 'react';
import {checkInRepository} from '../services/database/checkInRepository';
import {habitRepository} from '../services/database/habitRepository';
import {getDateRange, formatDateString} from '../utils/dateUtils';
import {
  calculateTagFrequency,
  calculateTagTrends,
  TagFrequencyItem,
  TagTrend,
} from '../utils/analytics';

export type AnalyticsPeriod = 7 | 30 | 90;

export function useAnalytics(tagLabels: Record<string, string>) {
  const [tagFrequency, setTagFrequency] = useState<TagFrequencyItem[]>([]);
  const [tagTrends, setTagTrends] = useState<TagTrend[]>([]);
  const [completionRates, setCompletionRates] = useState<
    Array<{
      habitId: string;
      totalCompletions: number;
      daysWithCompletions: number;
    }>
  >([]);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = useCallback(
    async (period: AnalyticsPeriod, habitIds: string[]) => {
      setLoading(true);

      const currentRange = getDateRange(period);
      const previousRange = {
        start: getDateRange(period * 2).start,
        end: currentRange.start - 1,
      };

      const currentFreq = await checkInRepository.loadTagFrequency(
        currentRange.start,
        currentRange.end,
      );
      const previousFreq = await checkInRepository.loadTagFrequency(
        previousRange.start,
        previousRange.end,
      );

      const currentCheckIns = await checkInRepository.loadDateRange(
        currentRange.start,
        currentRange.end,
      );

      setTagFrequency(
        calculateTagFrequency(currentFreq, tagLabels, currentCheckIns.length),
      );
      setTagTrends(calculateTagTrends(currentFreq, previousFreq, tagLabels));

      if (habitIds.length > 0) {
        const startDate = formatDateString(new Date(currentRange.start));
        const endDate = formatDateString(new Date(currentRange.end));
        setCompletionRates(
          await habitRepository.loadCompletionRates(
            habitIds,
            startDate,
            endDate,
          ),
        );
      }

      setLoading(false);
    },
    [tagLabels],
  );

  return {tagFrequency, tagTrends, completionRates, loading, loadAnalytics};
}

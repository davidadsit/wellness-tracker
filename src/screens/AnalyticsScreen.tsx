import React, {useState, useCallback, useEffect} from 'react';
import {ScrollView, View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useHabits} from '../hooks/useHabits';
import {useAnalytics, AnalyticsPeriod} from '../hooks/useAnalytics';
import {useTags} from '../hooks/useTags';
import {tagRepository} from '../services/database/tagRepository';
import {Card} from '../components/common/Card';
import {TagWordCloud} from '../components/analytics/TagWordCloud';
import {TagTimeline} from '../components/analytics/TagTimeline';
import {InsightCard} from '../components/analytics/InsightCard';
import {checkInRepository} from '../services/database/checkInRepository';
import {getDateRange, formatDateString} from '../utils/dateUtils';
import {addDays} from 'date-fns';
import {colors, commonStyles} from '../theme';

const PERIODS: AnalyticsPeriod[] = [7, 30, 90];
const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  7: '7 days',
  30: '30 days',
  90: '90 days',
};

export function AnalyticsScreen() {
  const [period, setPeriod] = useState<AnalyticsPeriod>(7);
  const {allTagLabels, loadAllTagLabels} = useTags();
  const [symptomTagIds, setSymptomTagIds] = useState<Set<string>>(new Set());
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [selectedTagColor, setSelectedTagColor] = useState(colors.primary);
  const [timelineData, setTimelineData] = useState<Array<{date: string; count: number}>>([]);
  const [maxDailyFrequency, setMaxDailyFrequency] = useState(1);
  const {habits, loadHabits} = useHabits();
  const {tagFrequency, tagTrends, completionRates, loadAnalytics} =
    useAnalytics(allTagLabels);

  useFocusEffect(
    useCallback(() => {
      loadAllTagLabels();
      tagRepository.getAllTagsIncludingArchived().then(tags => {
        tagRepository.getAllCategories().then(categories => {
          const symptomCatIds = new Set(
            categories.filter(c => c.triggerTagId).map(c => c.id),
          );
          setSymptomTagIds(
            new Set(tags.filter(t => symptomCatIds.has(t.categoryId)).map(t => t.id)),
          );
        });
      });
      loadHabits();
    }, [loadAllTagLabels, loadHabits]),
  );

  useEffect(() => {
    if (Object.keys(allTagLabels).length === 0) {
      return;
    }
    loadAnalytics(
      period,
      habits.map(h => h.id),
    );
  }, [period, habits, allTagLabels, loadAnalytics]);

  useEffect(() => {
    if (tagFrequency.length === 0) {
      setMaxDailyFrequency(1);
      return;
    }
    const range = getDateRange(period);
    Promise.all(
      tagFrequency.map(tf =>
        checkInRepository.getTagDailyFrequency(tf.tagId, range.start, range.end),
      ),
    ).then(results => {
      let max = 1;
      for (const daily of results) {
        for (const d of daily) {
          if (d.count > max) {
            max = d.count;
          }
        }
      }
      setMaxDailyFrequency(max);
    });
  }, [tagFrequency, period]);

  const loadTimelineForTag = useCallback(
    async (tagId: string, days: AnalyticsPeriod) => {
      const range = getDateRange(days);
      const daily = await checkInRepository.getTagDailyFrequency(
        tagId,
        range.start,
        range.end,
      );
      const countByDate = new Map(daily.map(d => [d.date, d.count]));
      const today = new Date();
      const fullRange: Array<{date: string; count: number}> = [];
      for (let i = days; i >= 0; i--) {
        const dateStr = formatDateString(addDays(today, -i));
        fullRange.push({date: dateStr, count: countByDate.get(dateStr) ?? 0});
      }
      setTimelineData(fullRange);
    },
    [],
  );

  const handleTagPress = useCallback(
    (tagId: string, color: string) => {
      setSelectedTagId(tagId);
      setSelectedTagColor(color);
      loadTimelineForTag(tagId, period);
    },
    [period, loadTimelineForTag],
  );

  // Reload timeline when period changes and a tag is selected
  useEffect(() => {
    if (selectedTagId) {
      loadTimelineForTag(selectedTagId, period);
    }
  }, [period, selectedTagId, loadTimelineForTag]);

  return (
    <ScrollView style={styles.container} testID="analytics-screen">
      <Text style={styles.title}>Analytics</Text>

      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodPill, period === p && styles.periodPillActive]}
            onPress={() => setPeriod(p)}>
            <Text
              style={[
                styles.periodText,
                period === p && styles.periodTextActive,
              ]}>
              {PERIOD_LABELS[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Card>
        <TagWordCloud
          data={tagFrequency}
          symptomTagIds={symptomTagIds}
          onTagPress={handleTagPress}
        />
      </Card>

      {selectedTagId && timelineData.length > 0 && (
        <Card>
          <TagTimeline
            tagLabel={allTagLabels[selectedTagId] ?? selectedTagId}
            data={timelineData}
            color={selectedTagColor}
            maxFrequency={maxDailyFrequency}
          />
        </Card>
      )}

      {tagTrends.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Trends</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tagTrends.map(trend => (
              <InsightCard key={trend.tagId} trend={trend} />
            ))}
          </ScrollView>
        </Card>
      )}

      {completionRates.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Habit Completion</Text>
          {completionRates.map(rate => {
            const habit = habits.find(h => h.id === rate.habitId);
            return (
              <View key={rate.habitId} style={styles.rateRow}>
                <Text style={styles.rateName}>{habit?.name ?? rate.habitId}</Text>
                <Text style={styles.rateValue}>
                  {rate.daysWithCompletions} days ({rate.totalCompletions} total)
                </Text>
              </View>
            );
          })}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: commonStyles.screenContainer,
  title: commonStyles.screenTitle,
  periodRow: {flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8},
  periodPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.divider, marginRight: 8,
  },
  periodPillActive: {backgroundColor: colors.primary},
  periodText: {fontSize: 13, color: colors.textSubtle},
  periodTextActive: {color: '#fff', fontWeight: '600'},
  sectionTitle: {...commonStyles.sectionTitle, marginBottom: 12},
  rateRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  rateName: {fontSize: 14, color: colors.text},
  rateValue: {fontSize: 13, color: colors.textSecondary},
});

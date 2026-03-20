import React, {useState, useCallback, useEffect} from 'react';
import {ScrollView, View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useHabits} from '../hooks/useHabits';
import {useAnalytics, AnalyticsPeriod} from '../hooks/useAnalytics';
import {tagRepository} from '../services/database/tagRepository';
import {Card} from '../components/common/Card';
import {TagWordCloud} from '../components/analytics/TagWordCloud';
import {InsightCard} from '../components/analytics/InsightCard';
import {colors, commonStyles} from '../theme';

const PERIODS: AnalyticsPeriod[] = [7, 30, 90];
const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  7: '7 days',
  30: '30 days',
  90: '90 days',
};

export function AnalyticsScreen() {
  const [period, setPeriod] = useState<AnalyticsPeriod>(7);
  const [allTagLabels, setAllTagLabels] = useState<Record<string, string>>({});
  const [symptomTagIds, setSymptomTagIds] = useState<Set<string>>(new Set());
  const {habits, loadHabits} = useHabits();
  const {tagFrequency, tagTrends, completionRates, loadAnalytics} =
    useAnalytics(allTagLabels);

  useFocusEffect(
    useCallback(() => {
      Promise.all([
        tagRepository.getAllTagsIncludingArchived(),
        tagRepository.getAllCategories(),
      ]).then(([tags, categories]) => {
        const labels: Record<string, string> = {};
        for (const tag of tags) {
          labels[tag.id] = tag.label;
        }
        setAllTagLabels(labels);

        const symptomCatIds = new Set(
          categories.filter(c => c.triggerTagId).map(c => c.id),
        );
        setSymptomTagIds(
          new Set(tags.filter(t => symptomCatIds.has(t.categoryId)).map(t => t.id)),
        );
      });
      loadHabits();
    }, [loadHabits]),
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
        <TagWordCloud data={tagFrequency} symptomTagIds={symptomTagIds} />
      </Card>

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

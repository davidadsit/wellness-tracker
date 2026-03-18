import React, {useState, useCallback} from 'react';
import {ScrollView, View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useTags} from '../hooks/useTags';
import {useHabits} from '../hooks/useHabits';
import {useAnalytics, AnalyticsPeriod} from '../hooks/useAnalytics';
import {Card} from '../components/common/Card';
import {TagFrequencyChart} from '../components/analytics/TagFrequencyChart';
import {InsightCard} from '../components/analytics/InsightCard';

const PERIODS: AnalyticsPeriod[] = [7, 30, 90];
const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  7: '7 days',
  30: '30 days',
  90: '90 days',
};

export function AnalyticsScreen() {
  const [period, setPeriod] = useState<AnalyticsPeriod>(7);
  const {tagLabels, loadTags} = useTags();
  const {habits, loadHabits} = useHabits();
  const {tagFrequency, tagTrends, completionRates, loadAnalytics} =
    useAnalytics(tagLabels);

  useFocusEffect(
    useCallback(() => {
      loadTags();
      loadHabits();
    }, [loadTags, loadHabits]),
  );

  useFocusEffect(
    useCallback(() => {
      loadAnalytics(
        period,
        habits.map(h => h.id),
      );
    }, [period, habits, loadAnalytics]),
  );

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
        <TagFrequencyChart data={tagFrequency} title="Tag Frequency" />
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
  container: {flex: 1, backgroundColor: '#f8f9fa'},
  title: {fontSize: 28, fontWeight: '700', color: '#333', margin: 16, marginBottom: 8},
  periodRow: {flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8},
  periodPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f0f0f0', marginRight: 8,
  },
  periodPillActive: {backgroundColor: '#4A90D9'},
  periodText: {fontSize: 13, color: '#555'},
  periodTextActive: {color: '#fff', fontWeight: '600'},
  sectionTitle: {fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12},
  rateRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  rateName: {fontSize: 14, color: '#333'},
  rateValue: {fontSize: 13, color: '#888'},
});

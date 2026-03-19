import React, {useCallback} from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useCheckIn} from '../hooks/useCheckIn';
import {useHabits} from '../hooks/useHabits';
import {useTags} from '../hooks/useTags';
import {Card} from '../components/common/Card';
import {TagBadge} from '../components/common/TagBadge';
import {colors, commonStyles} from '../theme';
import {RootStackParamList} from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const {todayCheckIns, hasCheckedInToday, loadToday} = useCheckIn();
  const {activeHabits, todayCompletions, loadHabits, loadTodayCompletions} = useHabits();
  const {tagLabels, loadTags} = useTags();

  useFocusEffect(
    useCallback(() => {
      loadTags();
      loadToday();
      loadHabits();
      loadTodayCompletions();
    }, [loadTags, loadToday, loadHabits, loadTodayCompletions]),
  );

  const completedCount = activeHabits.filter(h =>
    todayCompletions.some(c => c.habitId === h.id && c.count >= h.targetCount),
  ).length;

  return (
    <ScrollView style={styles.container} testID="home-screen">
      <Text style={styles.greeting}>Today</Text>

      {!hasCheckedInToday ? (
        <Card>
          <Text style={styles.ctaText}>You haven't checked in yet today</Text>
          <TouchableOpacity
            testID="cta-check-in"
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Tabs', {screen: 'Check-In'} as any)}>
            <Text style={styles.ctaButtonText}>Check In Now</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <Card>
          <Text style={styles.sectionTitle}>Today's Check-Ins</Text>
          {todayCheckIns.map(checkIn => (
            <View key={checkIn.id} style={styles.checkInRow}>
              <View style={commonStyles.row}>
                {checkIn.tagIds.map(tagId => (
                  <TagBadge key={tagId} label={tagLabels[tagId] ?? tagId} />
                ))}
              </View>
              {checkIn.note ? (
                <Text style={styles.note}>{checkIn.note}</Text>
              ) : null}
            </View>
          ))}
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>Habits</Text>
        <Text style={styles.habitSummary}>
          {completedCount}/{activeHabits.length} completed today
        </Text>
        {activeHabits.map(habit => {
          const completion = todayCompletions.find(c => c.habitId === habit.id);
          const isComplete =
            completion && completion.count >= habit.targetCount;
          return (
            <TouchableOpacity
              key={habit.id}
              style={styles.habitRow}
              onPress={() => navigation.navigate('HabitDetail', {habitId: habit.id})}>
              <View
                style={[styles.habitDot, {backgroundColor: habit.color}]}
              />
              <Text style={styles.habitName}>{habit.name}</Text>
              <Text style={styles.habitStatus}>
                {isComplete
                  ? 'Done'
                  : `${completion?.count ?? 0}/${habit.targetCount}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: commonStyles.screenContainer,
  greeting: commonStyles.screenTitle,
  ctaText: {fontSize: 15, color: colors.textNote, marginBottom: 12},
  ctaButton: commonStyles.primaryButton,
  ctaButtonText: commonStyles.primaryButtonText,
  sectionTitle: {fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8},
  checkInRow: {paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider},
  note: {fontSize: 13, color: colors.textNote, marginTop: 4, fontStyle: 'italic'},
  habitSummary: {fontSize: 14, color: colors.textSecondary, marginBottom: 8},
  habitRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  habitDot: {width: 10, height: 10, borderRadius: 5, marginRight: 10},
  habitName: {flex: 1, fontSize: 15, color: colors.text},
  habitStatus: {fontSize: 13, color: colors.textSecondary},
});

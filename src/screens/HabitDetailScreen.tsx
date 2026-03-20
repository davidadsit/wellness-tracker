import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet} from 'react-native';
import {useFocusEffect, useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useHabits} from '../hooks/useHabits';
import {habitRepository} from '../services/database/habitRepository';
import {calculateStreak} from '../utils/analytics';
import {HabitStreak} from '../components/habits/HabitStreak';
import {Card} from '../components/common/Card';
import {colors, commonStyles} from '../theme';
import {HabitsStackParamList} from '../types';

type Nav = NativeStackNavigationProp<HabitsStackParamList>;

export function HabitDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<HabitsStackParamList, 'HabitDetail'>>();
  const {habitId} = route.params;
  const {habits, remove} = useHabits();
  const habit = habits.find(h => h.id === habitId);

  const [streak, setStreak] = useState({currentStreak: 0, longestStreak: 0});
  const [completionDates, setCompletionDates] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const dates = await habitRepository.getCompletionDatesForHabit(habitId);
        setCompletionDates(dates);
        setStreak(calculateStreak(dates));
      })();
    }, [habitId]),
  );

  if (!habit) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Habit not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete Habit', `Are you sure you want to delete "${habit.name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove(habit.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} testID="habit-detail-screen">
      <View style={[styles.header, {backgroundColor: habit.color}]}>
        <Text style={styles.habitName}>{habit.name}</Text>
        <Text style={styles.habitMeta}>
          {habit.frequency} · {habit.targetCount} {habit.unit ?? 'times'}
        </Text>
      </View>

      <Card>
        <HabitStreak streak={streak} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Recent Completions</Text>
        {completionDates.length === 0 ? (
          <Text style={styles.emptyText}>No completions yet</Text>
        ) : (
          completionDates.slice(0, 14).map(date => (
            <Text key={date} style={styles.dateItem}>{date}</Text>
          ))
        )}
      </Card>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('HabitForm', {habitId: habit.id})}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: commonStyles.screenContainer,
  header: {padding: 24, paddingTop: 16},
  habitName: {fontSize: 24, fontWeight: '700', color: '#fff'},
  habitMeta: {fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4},
  sectionTitle: commonStyles.sectionTitle,
  emptyText: {fontSize: 14, color: colors.textSecondary},
  dateItem: {fontSize: 14, color: colors.textSubtle, paddingVertical: 4},
  notFound: {fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: 40},
  actions: {flexDirection: 'row', justifyContent: 'center', marginTop: 16, marginBottom: 40},
  editButton: {
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: colors.primary, borderRadius: 8, marginRight: 12,
  },
  editButtonText: {color: '#fff', fontWeight: '600', fontSize: 15},
  deleteButton: {
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: colors.danger, borderRadius: 8,
  },
  deleteButtonText: {color: '#fff', fontWeight: '600', fontSize: 15},
});

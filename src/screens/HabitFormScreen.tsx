import React from 'react';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useHabits} from '../hooks/useHabits';
import {HabitForm} from '../components/habits/HabitForm';
import {notificationService} from '../services/notifications/notificationService';
import {RootStackParamList, Habit} from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HabitFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'HabitForm'>>();
  const {habits, add, update} = useHabits();

  const editingHabit = route.params?.habitId
    ? habits.find(h => h.id === route.params!.habitId)
    : undefined;

  const handleSubmit = async (habit: Habit) => {
    if (editingHabit) {
      update(habit);
      if (habit.reminderTime) {
        await notificationService.rescheduleHabitReminder(habit);
      } else {
        await notificationService.cancelHabitReminder(habit.id);
      }
    } else {
      add(habit);
      if (habit.reminderTime) {
        await notificationService.scheduleHabitReminder(habit);
      }
    }
    navigation.goBack();
  };

  return (
    <HabitForm
      initial={editingHabit}
      onSubmit={handleSubmit}
      onCancel={() => navigation.goBack()}
    />
  );
}

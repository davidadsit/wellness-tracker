import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Habit, HabitCompletion} from '../../types';
import {formatDisplayTime} from '../../utils/dateUtils';
import {colors} from '../../theme';

interface HabitCompletionItemProps {
  completion: HabitCompletion;
  habit: Habit | undefined;
}

export function HabitCompletionItem({completion, habit}: HabitCompletionItemProps) {
  const countText = habit?.targetCount != null
    ? `${completion.count}/${habit.targetCount}${habit.unit ? ` ${habit.unit}` : ''}`
    : null;

  return (
    <View style={styles.container}>
      <View style={[styles.dot, {backgroundColor: habit?.color ?? colors.primary}]} />
      <Text style={styles.name}>{habit?.name ?? 'Unknown Habit'}</Text>
      {countText && <Text style={styles.count}>{countText}</Text>}
      <Text style={styles.time}>{formatDisplayTime(completion.completedAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  count: {
    fontSize: 13,
    color: colors.textNote,
    marginLeft: 8,
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 'auto',
  },
});

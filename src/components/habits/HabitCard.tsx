import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Habit, HabitCompletion} from '../../types';

interface HabitCardProps {
  habit: Habit;
  completion?: HabitCompletion;
  onComplete: () => void;
  onPress: () => void;
}

export function HabitCard({
  habit,
  completion,
  onComplete,
  onPress,
}: HabitCardProps) {
  const progress = completion ? completion.count : 0;
  const isComplete = progress >= habit.targetCount;

  return (
    <TouchableOpacity
      style={[styles.card, {borderLeftColor: habit.color}]}
      onPress={onPress}
      testID={`habit-card-${habit.id}`}>
      <View style={styles.info}>
        <Text style={styles.name}>{habit.name}</Text>
        <Text style={styles.progress}>
          {progress}/{habit.targetCount} {habit.unit ?? ''}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.completeButton, isComplete && styles.completeButtonDone]}
        onPress={onComplete}
        testID={`complete-${habit.id}`}
        disabled={isComplete}>
        <Text
          style={[styles.completeText, isComplete && styles.completeTextDone]}>
          {isComplete ? 'Done' : '+1'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progress: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  completeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4A90D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonDone: {
    backgroundColor: '#4CAF50',
  },
  completeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  completeTextDone: {
    fontSize: 12,
  },
});

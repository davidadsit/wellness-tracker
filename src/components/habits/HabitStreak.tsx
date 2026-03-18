import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {StreakResult} from '../../utils/analytics';

interface HabitStreakProps {
  streak: StreakResult;
}

export function HabitStreak({streak}: HabitStreakProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.value}>{streak.currentStreak}</Text>
        <Text style={styles.label}>Current Streak</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.value}>{streak.longestStreak}</Text>
        <Text style={styles.label}>Longest Streak</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4A90D9',
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
});

import React, {useCallback} from 'react';
import {View, FlatList, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {colors, commonStyles} from '../theme';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useHabits} from '../hooks/useHabits';
import {HabitCard} from '../components/habits/HabitCard';
import {EmptyState} from '../components/common/EmptyState';
import {RootStackParamList} from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HabitsScreen() {
  const navigation = useNavigation<Nav>();
  const {activeHabits, loadHabits, loadTodayCompletions, complete, getCompletionForHabit} =
    useHabits();

  useFocusEffect(
    useCallback(() => {
      loadHabits();
      loadTodayCompletions();
    }, [loadHabits, loadTodayCompletions]),
  );

  if (activeHabits.length === 0) {
    return (
      <View style={styles.container} testID="habits-screen">
        <EmptyState
          title="No habits yet"
          message="Start building healthy habits by tapping the + button below."
        />
        <TouchableOpacity
          testID="add-habit-fab"
          style={styles.fab}
          onPress={() => navigation.navigate('HabitForm', {})}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="habits-screen">
      <FlatList
        data={activeHabits}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <HabitCard
            habit={item}
            completion={getCompletionForHabit(item.id)}
            onComplete={() => complete(item.id)}
            onPress={() => navigation.navigate('HabitDetail', {habitId: item.id})}
          />
        )}
        contentContainerStyle={styles.list}
      />
      <TouchableOpacity
        testID="add-habit-fab"
        style={styles.fab}
        onPress={() => navigation.navigate('HabitForm', {})}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: commonStyles.screenContainer,
  list: {paddingVertical: 8},
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2, shadowRadius: 5, elevation: 5,
  },
  fabText: {color: '#fff', fontSize: 28, fontWeight: '300'},
});

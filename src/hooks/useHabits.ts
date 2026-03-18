import {useCallback} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch} from '../store';
import {
  fetchHabits,
  fetchTodayCompletions,
  completeHabit,
  addHabit,
  updateHabit,
  removeHabit,
  toggleHabitActive,
} from '../store/habitsSlice';
import {Habit} from '../types';

export function useHabits() {
  const dispatch = useDispatch<AppDispatch>();
  const {habits, todayCompletions, loading} = useSelector(
    (state: RootState) => state.habits,
  );

  const loadHabits = useCallback(() => {
    dispatch(fetchHabits());
  }, [dispatch]);

  const loadTodayCompletions = useCallback(() => {
    dispatch(fetchTodayCompletions());
  }, [dispatch]);

  const complete = useCallback(
    (habitId: string) => {
      return dispatch(completeHabit({habitId})).unwrap();
    },
    [dispatch],
  );

  const add = useCallback(
    (habit: Habit) => {
      dispatch(addHabit(habit));
    },
    [dispatch],
  );

  const update = useCallback(
    (habit: Habit) => {
      dispatch(updateHabit(habit));
    },
    [dispatch],
  );

  const remove = useCallback(
    (habitId: string) => {
      dispatch(removeHabit(habitId));
    },
    [dispatch],
  );

  const toggle = useCallback(
    (habitId: string) => {
      dispatch(toggleHabitActive(habitId));
    },
    [dispatch],
  );

  const activeHabits = habits.filter(h => h.isActive);

  const getCompletionForHabit = useCallback(
    (habitId: string) => {
      return todayCompletions.find(c => c.habitId === habitId);
    },
    [todayCompletions],
  );

  return {
    habits,
    activeHabits,
    todayCompletions,
    loading,
    loadHabits,
    loadTodayCompletions,
    complete,
    add,
    update,
    remove,
    toggle,
    getCompletionForHabit,
  };
}

import habitsReducer, {
  addHabit,
  updateHabit,
  removeHabit,
  toggleHabitActive,
  fetchTodayCompletions,
  completeHabit,
  HabitsState,
} from '../../src/store/habitsSlice';
import {HabitCompletion} from '../../src/types';
import {makeHabit} from '../helpers/factories';

const initialState: HabitsState = {
  habits: [],
  todayCompletions: [],
  loading: false,
};

describe('habitsSlice', () => {
  describe('reducers', () => {
    it('returns the initial state', () => {
      expect(habitsReducer(undefined, {type: 'unknown'})).toEqual(initialState);
    });

    it('addHabit adds a habit', () => {
      const habit = makeHabit();
      const state = habitsReducer(initialState, addHabit(habit));
      expect(state.habits).toHaveLength(1);
      expect(state.habits[0].name).toBe('Drink Water');
    });

    it('updateHabit replaces a habit by id', () => {
      const stateWith = {...initialState, habits: [makeHabit()]};
      const updated = makeHabit({name: 'Drink More Water'});
      const state = habitsReducer(stateWith, updateHabit(updated));
      expect(state.habits[0].name).toBe('Drink More Water');
    });

    it('updateHabit does nothing for unknown id', () => {
      const stateWith = {...initialState, habits: [makeHabit()]};
      const unknown = makeHabit({id: 'h999', name: 'Unknown'});
      const state = habitsReducer(stateWith, updateHabit(unknown));
      expect(state.habits[0].name).toBe('Drink Water');
    });

    it('removeHabit removes a habit by id', () => {
      const stateWith = {...initialState, habits: [makeHabit()]};
      const state = habitsReducer(stateWith, removeHabit('h1'));
      expect(state.habits).toHaveLength(0);
    });

    it('toggleHabitActive flips isActive', () => {
      const stateWith = {...initialState, habits: [makeHabit()]};
      const state = habitsReducer(stateWith, toggleHabitActive('h1'));
      expect(state.habits[0].isActive).toBe(false);

      const state2 = habitsReducer(state, toggleHabitActive('h1'));
      expect(state2.habits[0].isActive).toBe(true);
    });
  });

  describe('fetchTodayCompletions', () => {
    it('sets loading true on pending', () => {
      const state = habitsReducer(
        initialState,
        fetchTodayCompletions.pending('', undefined),
      );
      expect(state.loading).toBe(true);
    });

    it('stores completions on fulfilled', () => {
      const completions: HabitCompletion[] = [
        {id: 'c1', habitId: 'h1', date: '2024-01-15', count: 3, completedAt: 100, source: 'manual'},
      ];
      const state = habitsReducer(
        {...initialState, loading: true},
        fetchTodayCompletions.fulfilled(completions, '', undefined),
      );
      expect(state.loading).toBe(false);
      expect(state.todayCompletions).toEqual(completions);
    });
  });

  describe('completeHabit', () => {
    it('adds a new completion', () => {
      const completion: HabitCompletion = {
        id: 'c1',
        habitId: 'h1',
        date: '2024-01-15',
        count: 1,
        completedAt: 100,
        source: 'manual',
      };
      const state = habitsReducer(
        initialState,
        completeHabit.fulfilled(completion, '', {habitId: 'h1'}),
      );
      expect(state.todayCompletions).toHaveLength(1);
    });

    it('updates existing completion for same habit', () => {
      const existing: HabitCompletion = {
        id: 'c1',
        habitId: 'h1',
        date: '2024-01-15',
        count: 1,
        completedAt: 100,
        source: 'manual',
      };
      const stateWithExisting = {...initialState, todayCompletions: [existing]};

      const updated: HabitCompletion = {
        ...existing,
        count: 2,
        completedAt: 200,
      };
      const state = habitsReducer(
        stateWithExisting,
        completeHabit.fulfilled(updated, '', {habitId: 'h1'}),
      );
      expect(state.todayCompletions).toHaveLength(1);
      expect(state.todayCompletions[0].count).toBe(2);
    });
  });
});

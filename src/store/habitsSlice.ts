import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {Habit, HabitCompletion} from '../types';
import {habitRepository} from '../services/database/habitRepository';
import {MMKV} from 'react-native-mmkv';
import {todayDateString} from '../utils/dateUtils';
import {ulid} from '../utils/ulid';

const HABITS_KEY = 'habits';

let _storage: MMKV | null = null;
function getStorage(): MMKV {
  if (!_storage) {
    _storage = new MMKV();
  }
  return _storage;
}

function loadHabitsFromStorage(): Habit[] {
  const json = getStorage().getString(HABITS_KEY);
  return json ? JSON.parse(json) : [];
}

function saveHabitsToStorage(habits: Habit[]): void {
  getStorage().set(HABITS_KEY, JSON.stringify(habits));
}

export interface HabitsState {
  habits: Habit[];
  todayCompletions: HabitCompletion[];
  loading: boolean;
}

const initialState: HabitsState = {
  habits: [],
  todayCompletions: [],
  loading: false,
};

export const fetchHabits = createAsyncThunk('habits/fetch', () => {
  return loadHabitsFromStorage();
});

export const fetchTodayCompletions = createAsyncThunk(
  'habits/fetchTodayCompletions',
  async () => {
    return habitRepository.loadCompletionsForDate(todayDateString());
  },
);

export const completeHabit = createAsyncThunk(
  'habits/complete',
  async (params: {habitId: string; source?: 'manual' | 'notification'}) => {
    return habitRepository.saveCompletion({
      id: ulid(),
      habitId: params.habitId,
      date: todayDateString(),
      count: 1,
      completedAt: Date.now(),
      source: params.source ?? 'manual',
    });
  },
);

const habitsSlice = createSlice({
  name: 'habits',
  initialState,
  reducers: {
    addHabit(state, action: PayloadAction<Habit>) {
      state.habits.push(action.payload);
      saveHabitsToStorage(state.habits);
    },
    updateHabit(state, action: PayloadAction<Habit>) {
      const index = state.habits.findIndex(h => h.id === action.payload.id);
      if (index !== -1) {
        state.habits[index] = action.payload;
        saveHabitsToStorage(state.habits);
      }
    },
    removeHabit(state, action: PayloadAction<string>) {
      state.habits = state.habits.filter(h => h.id !== action.payload);
      saveHabitsToStorage(state.habits);
    },
    toggleHabitActive(state, action: PayloadAction<string>) {
      const habit = state.habits.find(h => h.id === action.payload);
      if (habit) {
        habit.isActive = !habit.isActive;
        saveHabitsToStorage(state.habits);
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchHabits.fulfilled, (state, action) => {
        state.habits = action.payload;
      })
      .addCase(fetchTodayCompletions.pending, state => {
        state.loading = true;
      })
      .addCase(fetchTodayCompletions.fulfilled, (state, action) => {
        state.loading = false;
        state.todayCompletions = action.payload;
      })
      .addCase(fetchTodayCompletions.rejected, state => {
        state.loading = false;
      })
      .addCase(completeHabit.fulfilled, (state, action) => {
        const existing = state.todayCompletions.findIndex(
          c => c.habitId === action.payload.habitId,
        );
        if (existing !== -1) {
          state.todayCompletions[existing] = action.payload;
        } else {
          state.todayCompletions.push(action.payload);
        }
      });
  },
});

export const {addHabit, updateHabit, removeHabit, toggleHabitActive} =
  habitsSlice.actions;
export default habitsSlice.reducer;

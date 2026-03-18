import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {HabitsScreen} from '../HabitsScreen';
import tagsReducer from '../../store/tagsSlice';
import checkInReducer from '../../store/checkInSlice';
import habitsReducer from '../../store/habitsSlice';
import settingsReducer from '../../store/settingsSlice';

jest.mock('../../services/database/habitRepository', () => ({
  habitRepository: {
    getCompletionsForDate: jest.fn().mockReturnValue([]),
  },
}));

function makeStore(preloaded: any = {}) {
  return configureStore({
    reducer: {
      tags: tagsReducer,
      checkIn: checkInReducer,
      habits: habitsReducer,
      settings: settingsReducer,
    },
    preloadedState: preloaded,
  });
}

describe('HabitsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows empty state when no habits', () => {
    const store = makeStore();
    const {getByText} = render(
      <Provider store={store}>
        <HabitsScreen />
      </Provider>,
    );
    expect(getByText('No habits yet')).toBeTruthy();
  });

  it('shows FAB button', () => {
    const store = makeStore();
    const {getByTestId} = render(
      <Provider store={store}>
        <HabitsScreen />
      </Provider>,
    );
    expect(getByTestId('add-habit-fab')).toBeTruthy();
  });

  it('navigates on FAB press', () => {
    const store = makeStore();
    const {getByTestId} = render(
      <Provider store={store}>
        <HabitsScreen />
      </Provider>,
    );

    fireEvent.press(getByTestId('add-habit-fab'));
    // Navigation is handled by the global mock — just verify it doesn't crash
  });

  it('renders habit cards when habits exist', () => {
    const store = makeStore({
      tags: {categories: [], tags: [], loading: false, error: null},
      checkIn: {todayCheckIns: [], recentCheckIns: [], loading: false, error: null},
      habits: {
        habits: [
          {
            id: 'h1', name: 'Drink Water', category: 'water',
            frequency: 'daily', targetCount: 8, unit: 'glasses',
            color: '#3498db', icon: 'water', isActive: true, createdAt: 0,
          },
        ],
        todayCompletions: [],
        loading: false,
        error: null,
      },
      settings: {notificationsEnabled: true, dailyCheckInTime: '09:00', theme: 'system'},
    });

    const {getByText} = render(
      <Provider store={store}>
        <HabitsScreen />
      </Provider>,
    );
    expect(getByText('Drink Water')).toBeTruthy();
  });
});

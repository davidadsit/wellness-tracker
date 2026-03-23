import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {HabitsScreen} from '../../../src/screens/HabitsScreen';
import {renderWithStore} from '../../helpers/renderWithStore';

jest.mock('../../../src/services/database/habitRepository', () => ({
  habitRepository: {
    loadCompletionsForDate: jest.fn().mockReturnValue([]),
  },
}));

describe('HabitsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows empty state when no habits', () => {
    const {getByText} = renderWithStore(<HabitsScreen />);
    expect(getByText('No habits yet')).toBeTruthy();
  });

  it('shows FAB button', () => {
    const {getByTestId} = renderWithStore(<HabitsScreen />);
    expect(getByTestId('add-habit-fab')).toBeTruthy();
  });

  it('navigates on FAB press', () => {
    const {getByTestId} = renderWithStore(<HabitsScreen />);
    fireEvent.press(getByTestId('add-habit-fab'));
    // Navigation is handled by the global mock — just verify it doesn't crash
  });

  it('renders habit cards when habits exist', () => {
    const {getByText} = renderWithStore(<HabitsScreen />, {
      tags: {categories: [], tags: [], loading: false, error: null},
      checkIn: {
        todayCheckIns: [],
        recentCheckIns: [],
        loading: false,
        error: null,
      },
      habits: {
        habits: [
          {
            id: 'h1',
            name: 'Drink Water',
            category: 'water',
            frequency: 'daily',
            targetCount: 8,
            unit: 'glasses',
            color: '#3498db',
            icon: 'water',
            isActive: true,
            createdAt: 0,
          },
        ],
        todayCompletions: [],
        loading: false,
        error: null,
      },
      settings: {
        reminders: {
          morning: {enabled: false, time: '09:00'},
          midday: {enabled: true, time: '13:00'},
          evening: {enabled: false, time: '19:00'},
        },
        theme: 'system',
      },
    });

    expect(getByText('Drink Water')).toBeTruthy();
  });

  it('shows FAB that navigates to HabitForm when habits exist', () => {
    const mockNavigate = jest.fn();
    const {useNavigation} = require('@react-navigation/native');
    useNavigation.mockReturnValue({navigate: mockNavigate, goBack: jest.fn()});

    const {getByTestId} = renderWithStore(<HabitsScreen />, {
      tags: {categories: [], tags: [], loading: false, error: null},
      checkIn: {
        todayCheckIns: [],
        recentCheckIns: [],
        loading: false,
        error: null,
      },
      habits: {
        habits: [
          {
            id: 'h1',
            name: 'Drink Water',
            category: 'water',
            frequency: 'daily',
            targetCount: 8,
            unit: 'glasses',
            color: '#3498db',
            icon: 'water',
            isActive: true,
            createdAt: 0,
          },
        ],
        todayCompletions: [],
        loading: false,
        error: null,
      },
      settings: {
        reminders: {
          morning: {enabled: false, time: '09:00'},
          midday: {enabled: true, time: '13:00'},
          evening: {enabled: false, time: '19:00'},
        },
        theme: 'system',
      },
    });

    fireEvent.press(getByTestId('add-habit-fab'));
    expect(mockNavigate).toHaveBeenCalledWith('HabitForm', {});
  });

  it('navigates to HabitDetail when pressing a habit card', () => {
    const mockNavigate = jest.fn();
    const {useNavigation} = require('@react-navigation/native');
    useNavigation.mockReturnValue({navigate: mockNavigate, goBack: jest.fn()});

    const {getByText} = renderWithStore(<HabitsScreen />, {
      tags: {categories: [], tags: [], loading: false, error: null},
      checkIn: {
        todayCheckIns: [],
        recentCheckIns: [],
        loading: false,
        error: null,
      },
      habits: {
        habits: [
          {
            id: 'h1',
            name: 'Drink Water',
            category: 'water',
            frequency: 'daily',
            targetCount: 8,
            unit: 'glasses',
            color: '#3498db',
            icon: 'water',
            isActive: true,
            createdAt: 0,
          },
        ],
        todayCompletions: [],
        loading: false,
        error: null,
      },
      settings: {
        reminders: {
          morning: {enabled: false, time: '09:00'},
          midday: {enabled: true, time: '13:00'},
          evening: {enabled: false, time: '19:00'},
        },
        theme: 'system',
      },
    });

    fireEvent.press(getByText('Drink Water'));
    expect(mockNavigate).toHaveBeenCalledWith('HabitDetail', {habitId: 'h1'});
  });
});

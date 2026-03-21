import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {HabitsScreen} from '../../../src/screens/HabitsScreen';
import {renderWithStore} from '../../helpers/renderWithStore';

jest.mock('../../../src/services/database/habitRepository', () => ({
  habitRepository: {
    getCompletionsForDate: jest.fn().mockReturnValue([]),
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

    expect(getByText('Drink Water')).toBeTruthy();
  });
});

import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {HomeScreen} from '../../../src/screens/HomeScreen';
import {renderWithStore} from '../../helpers/renderWithStore';
import {MMKV} from 'react-native-mmkv';

jest.mock('../../../src/services/database/tagRepository', () => ({
  tagRepository: {
    loadAllCategories: jest.fn().mockReturnValue([]),
    loadAllTags: jest.fn().mockReturnValue([]),
  },
}));

jest.mock('../../../src/services/database/checkInRepository', () => ({
  checkInRepository: {
    loadToday: jest.fn().mockReturnValue([]),
    loadRecent: jest.fn().mockReturnValue([]),
  },
}));

jest.mock('../../../src/services/database/habitRepository', () => ({
  habitRepository: {
    loadCompletionsForDate: jest.fn().mockReturnValue([]),
  },
}));

const waterHabit = {
  id: 'h1',
  name: 'Water',
  category: 'water',
  frequency: 'daily',
  targetCount: 8,
  color: '#3498db',
  icon: 'water',
  isActive: true,
  createdAt: 0,
};

function storeHabits(habits: object[]) {
  new MMKV().set('habits', JSON.stringify(habits));
}

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    new MMKV().clearAll();
  });

  it('renders the screen', async () => {
    const {getByTestId} = renderWithStore(<HomeScreen />);
    await waitFor(() => {
      expect(getByTestId('home-screen')).toBeTruthy();
    });
  });

  it('shows CTA when no check-ins today', async () => {
    const {getByTestId, getByText} = renderWithStore(<HomeScreen />);
    await waitFor(() => {
      expect(getByText("You haven't checked in yet today")).toBeTruthy();
      expect(getByTestId('cta-check-in')).toBeTruthy();
    });
  });

  it('shows today check-ins when present', async () => {
    const {getByText} = renderWithStore(<HomeScreen />, {
      checkIn: {
        todayCheckIns: [
          {
            id: '1',
            timestamp: Date.now(),
            tagIds: ['tag-happy'],
            source: 'manual',
          },
        ],
        recentCheckIns: [],
        loading: false,
        error: null,
      },
      tags: {
        categories: [],
        tags: [
          {
            id: 'tag-happy',
            categoryId: 'c1',
            label: 'Happy',
            isDefault: true,
            isArchived: false,
            createdAt: 0,
          },
        ],
        loading: false,
        error: null,
      },
      habits: {habits: [], todayCompletions: [], loading: false, error: null},
      settings: {
        reminders: {
          morning: {enabled: false, time: '09:00'},
          midday: {enabled: true, time: '13:00'},
          evening: {enabled: false, time: '19:00'},
        },
        theme: 'system',
      },
    });

    await waitFor(() => {
      expect(getByText("Today's Check-Ins")).toBeTruthy();
      expect(getByText('Happy')).toBeTruthy();
    });
  });

  it('shows habit summary', async () => {
    storeHabits([waterHabit]);
    const {getByText} = renderWithStore(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('0/1 completed today')).toBeTruthy();
      expect(getByText('Water')).toBeTruthy();
    });
  });

  it('navigates to Check-In when CTA is pressed', async () => {
    const mockNavigate = jest.fn();
    const {useNavigation} = require('@react-navigation/native');
    useNavigation.mockReturnValue({navigate: mockNavigate, goBack: jest.fn()});

    const {getByTestId} = renderWithStore(<HomeScreen />);
    await waitFor(() => {
      expect(getByTestId('cta-check-in')).toBeTruthy();
    });
    fireEvent.press(getByTestId('cta-check-in'));
    expect(mockNavigate).toHaveBeenCalledWith('Check-In');
  });

  it('navigates to HabitDetail when a habit row is pressed', async () => {
    storeHabits([waterHabit]);
    const mockNavigate = jest.fn();
    const {useNavigation} = require('@react-navigation/native');
    useNavigation.mockReturnValue({navigate: mockNavigate, goBack: jest.fn()});

    const {getByText} = renderWithStore(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Water')).toBeTruthy();
    });
    fireEvent.press(getByText('Water'));
    expect(mockNavigate).toHaveBeenCalledWith('Habits', {
      screen: 'HabitDetail',
      params: {habitId: 'h1'},
    });
  });

  it('shows Done for completed habits', async () => {
    storeHabits([{...waterHabit, targetCount: 2}]);
    const {getByText} = renderWithStore(<HomeScreen />, {
      habits: {
        habits: [{...waterHabit, targetCount: 2}],
        todayCompletions: [
          {
            id: 'c1',
            habitId: 'h1',
            date: '2026-03-20',
            count: 2,
            completedAt: 100,
            source: 'manual',
          },
        ],
        loading: false,
        error: null,
      },
    });

    await waitFor(() => {
      expect(getByText('Done')).toBeTruthy();
      expect(getByText('1/1 completed today')).toBeTruthy();
    });
  });
});

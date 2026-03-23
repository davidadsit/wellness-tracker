import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {HomeScreen} from '../../../src/screens/HomeScreen';
import {renderWithStore} from '../../helpers/renderWithStore';

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

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the screen', () => {
    const {getByTestId} = renderWithStore(<HomeScreen />);
    expect(getByTestId('home-screen')).toBeTruthy();
  });

  it('shows CTA when no check-ins today', () => {
    const {getByTestId, getByText} = renderWithStore(<HomeScreen />);
    expect(getByText("You haven't checked in yet today")).toBeTruthy();
    expect(getByTestId('cta-check-in')).toBeTruthy();
  });

  it('shows today check-ins when present', () => {
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

    expect(getByText("Today's Check-Ins")).toBeTruthy();
    expect(getByText('Happy')).toBeTruthy();
  });

  it('shows habit summary', () => {
    const {getByText} = renderWithStore(<HomeScreen />, {
      checkIn: {
        todayCheckIns: [],
        recentCheckIns: [],
        loading: false,
        error: null,
      },
      tags: {categories: [], tags: [], loading: false, error: null},
      habits: {
        habits: [
          {
            id: 'h1',
            name: 'Water',
            category: 'water',
            frequency: 'daily',
            targetCount: 8,
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

    expect(getByText('0/1 completed today')).toBeTruthy();
    expect(getByText('Water')).toBeTruthy();
  });

  it('navigates to Check-In when CTA is pressed', () => {
    const mockNavigate = jest.fn();
    const {useNavigation} = require('@react-navigation/native');
    useNavigation.mockReturnValue({navigate: mockNavigate, goBack: jest.fn()});

    const {getByTestId} = renderWithStore(<HomeScreen />);
    fireEvent.press(getByTestId('cta-check-in'));
    expect(mockNavigate).toHaveBeenCalledWith('Check-In');
  });

  it('navigates to HabitDetail when a habit row is pressed', () => {
    const mockNavigate = jest.fn();
    const {useNavigation} = require('@react-navigation/native');
    useNavigation.mockReturnValue({navigate: mockNavigate, goBack: jest.fn()});

    const {getByText} = renderWithStore(<HomeScreen />, {
      checkIn: {
        todayCheckIns: [],
        recentCheckIns: [],
        loading: false,
        error: null,
      },
      tags: {categories: [], tags: [], loading: false, error: null},
      habits: {
        habits: [
          {
            id: 'h1',
            name: 'Water',
            category: 'water',
            frequency: 'daily',
            targetCount: 8,
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

    fireEvent.press(getByText('Water'));
    expect(mockNavigate).toHaveBeenCalledWith('Habits', {
      screen: 'HabitDetail',
      params: {habitId: 'h1'},
    });
  });

  it('shows Done for completed habits', () => {
    const {getByText} = renderWithStore(<HomeScreen />, {
      checkIn: {
        todayCheckIns: [],
        recentCheckIns: [],
        loading: false,
        error: null,
      },
      tags: {categories: [], tags: [], loading: false, error: null},
      habits: {
        habits: [
          {
            id: 'h1',
            name: 'Water',
            category: 'water',
            frequency: 'daily',
            targetCount: 2,
            color: '#3498db',
            icon: 'water',
            isActive: true,
            createdAt: 0,
          },
        ],
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
      settings: {
        reminders: {
          morning: {enabled: false, time: '09:00'},
          midday: {enabled: true, time: '13:00'},
          evening: {enabled: false, time: '19:00'},
        },
        theme: 'system',
      },
    });

    expect(getByText('Done')).toBeTruthy();
    expect(getByText('1/1 completed today')).toBeTruthy();
  });
});

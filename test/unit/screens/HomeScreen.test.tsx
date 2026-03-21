import React from 'react';
import {HomeScreen} from '../../../src/screens/HomeScreen';
import {renderWithStore} from '../../helpers/renderWithStore';

jest.mock('../../../src/services/database/tagRepository', () => ({
  tagRepository: {
    getAllCategories: jest.fn().mockReturnValue([]),
    getAllTags: jest.fn().mockReturnValue([]),
  },
}));

jest.mock('../../../src/services/database/checkInRepository', () => ({
  checkInRepository: {
    getToday: jest.fn().mockReturnValue([]),
    getRecent: jest.fn().mockReturnValue([]),
  },
}));

jest.mock('../../../src/services/database/habitRepository', () => ({
  habitRepository: {
    getCompletionsForDate: jest.fn().mockReturnValue([]),
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
          {id: '1', timestamp: Date.now(), tagIds: ['tag-happy'], source: 'manual'},
        ],
        recentCheckIns: [],
        loading: false,
        error: null,
      },
      tags: {
        categories: [],
        tags: [{id: 'tag-happy', categoryId: 'c1', label: 'Happy', isDefault: true, isArchived: false, createdAt: 0}],
        loading: false,
        error: null,
      },
      habits: {habits: [], todayCompletions: [], loading: false, error: null},
      settings: {notificationsEnabled: true, dailyCheckInTime: '09:00', theme: 'system'},
    });

    expect(getByText("Today's Check-Ins")).toBeTruthy();
    expect(getByText('Happy')).toBeTruthy();
  });

  it('shows habit summary', () => {
    const {getByText} = renderWithStore(<HomeScreen />, {
      checkIn: {todayCheckIns: [], recentCheckIns: [], loading: false, error: null},
      tags: {categories: [], tags: [], loading: false, error: null},
      habits: {
        habits: [
          {id: 'h1', name: 'Water', category: 'water', frequency: 'daily', targetCount: 8, color: '#3498db', icon: 'water', isActive: true, createdAt: 0},
        ],
        todayCompletions: [],
        loading: false,
        error: null,
      },
      settings: {notificationsEnabled: true, dailyCheckInTime: '09:00', theme: 'system'},
    });

    expect(getByText('0/1 completed today')).toBeTruthy();
    expect(getByText('Water')).toBeTruthy();
  });
});

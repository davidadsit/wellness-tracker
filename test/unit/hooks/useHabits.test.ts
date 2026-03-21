import React from 'react';
import {renderHook} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {makeStore} from '../../helpers/renderWithStore';
import {useHabits} from '../../../src/hooks/useHabits';
import {makeHabit} from '../../helpers/factories';
import {HabitCompletion} from '../../../src/types';

jest.mock('../../../src/services/database/habitRepository', () => ({
  habitRepository: {
    getAll: jest.fn().mockReturnValue([]),
    getCompletionsForDate: jest.fn().mockReturnValue([]),
    completeHabit: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    toggleActive: jest.fn(),
  },
}));

function renderWithHabits(habitsState: any = {}) {
  const store = makeStore({
    habits: {
      habits: [],
      todayCompletions: [],
      loading: false,
      ...habitsState,
    },
  });
  const wrapper = ({children}: {children: React.ReactNode}) =>
    React.createElement(Provider, {store}, children);
  return renderHook(() => useHabits(), {wrapper});
}

describe('useHabits', () => {
  describe('activeHabits', () => {
    it('filters to only active habits', () => {
      const {result} = renderWithHabits({
        habits: [
          makeHabit({id: 'h1', isActive: true}),
          makeHabit({id: 'h2', isActive: false}),
          makeHabit({id: 'h3', isActive: true}),
        ],
      });

      expect(result.current.activeHabits).toHaveLength(2);
      expect(result.current.activeHabits.map(h => h.id)).toEqual(['h1', 'h3']);
    });

    it('returns empty array when no habits are active', () => {
      const {result} = renderWithHabits({
        habits: [makeHabit({id: 'h1', isActive: false})],
      });
      expect(result.current.activeHabits).toEqual([]);
    });
  });

  describe('getCompletionForHabit', () => {
    it('returns the completion matching the habit id', () => {
      const completion: HabitCompletion = {
        id: 'comp1',
        habitId: 'h1',
        date: '2026-03-20',
        count: 3,
        completedAt: 100,
        source: 'manual',
      };

      const {result} = renderWithHabits({
        habits: [makeHabit({id: 'h1'})],
        todayCompletions: [completion],
      });

      expect(result.current.getCompletionForHabit('h1')).toEqual(completion);
    });

    it('returns undefined when no completion exists for the habit', () => {
      const {result} = renderWithHabits({
        habits: [makeHabit({id: 'h1'})],
        todayCompletions: [],
      });

      expect(result.current.getCompletionForHabit('h1')).toBeUndefined();
    });
  });
});

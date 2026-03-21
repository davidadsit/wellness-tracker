import {Habit} from '../../src/types';

export const makeHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'h1',
  name: 'Drink Water',
  category: 'water',
  frequency: 'daily',
  targetCount: 8,
  unit: 'glasses',
  color: '#3498db',
  icon: 'water',
  isActive: true,
  createdAt: 100,
  ...overrides,
});

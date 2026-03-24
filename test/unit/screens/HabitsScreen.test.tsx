import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {HabitsScreen} from '../../../src/screens/HabitsScreen';
import {renderWithStore} from '../../helpers/renderWithStore';
import {makeHabit} from '../../helpers/factories';
import {MMKV} from 'react-native-mmkv';

jest.mock('../../../src/services/database/habitRepository', () => ({
  habitRepository: {
    loadCompletionsForDate: jest.fn().mockReturnValue([]),
  },
}));

const testHabit = makeHabit({id: 'h1'});

function storeHabits(habits: object[]) {
  new MMKV().set('habits', JSON.stringify(habits));
}

describe('HabitsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    new MMKV().clearAll();
  });

  it('shows empty state when no habits', async () => {
    const {getByText} = renderWithStore(<HabitsScreen />);
    await waitFor(() => {
      expect(getByText('No habits yet')).toBeTruthy();
    });
  });

  it('shows FAB button', async () => {
    const {getByTestId} = renderWithStore(<HabitsScreen />);
    await waitFor(() => {
      expect(getByTestId('add-habit-fab')).toBeTruthy();
    });
  });

  it('navigates on FAB press', async () => {
    const {getByTestId} = renderWithStore(<HabitsScreen />);
    await waitFor(() => {
      expect(getByTestId('add-habit-fab')).toBeTruthy();
    });
    fireEvent.press(getByTestId('add-habit-fab'));
    // Navigation is handled by the global mock — just verify it doesn't crash
  });

  it('renders habit cards when habits exist', async () => {
    storeHabits([testHabit]);
    const {getByText} = renderWithStore(<HabitsScreen />);

    await waitFor(() => {
      expect(getByText('Drink Water')).toBeTruthy();
    });
  });

  it('shows FAB that navigates to HabitForm when habits exist', async () => {
    storeHabits([testHabit]);
    const mockNavigate = jest.fn();
    const {useNavigation} = require('@react-navigation/native');
    useNavigation.mockReturnValue({navigate: mockNavigate, goBack: jest.fn()});

    const {getByTestId} = renderWithStore(<HabitsScreen />);

    await waitFor(() => {
      expect(getByTestId('add-habit-fab')).toBeTruthy();
    });
    fireEvent.press(getByTestId('add-habit-fab'));
    expect(mockNavigate).toHaveBeenCalledWith('HabitForm', {});
  });

  it('navigates to HabitDetail when pressing a habit card', async () => {
    storeHabits([testHabit]);
    const mockNavigate = jest.fn();
    const {useNavigation} = require('@react-navigation/native');
    useNavigation.mockReturnValue({navigate: mockNavigate, goBack: jest.fn()});

    const {getByText} = renderWithStore(<HabitsScreen />);

    await waitFor(() => {
      expect(getByText('Drink Water')).toBeTruthy();
    });
    fireEvent.press(getByText('Drink Water'));
    expect(mockNavigate).toHaveBeenCalledWith('HabitDetail', {habitId: 'h1'});
  });
});

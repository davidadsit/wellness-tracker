import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {HabitsScreen} from '../../../src/screens/HabitsScreen';
import {HomeScreen} from '../../../src/screens/HomeScreen';
import {setupTestDatabase} from '../../helpers/database';
import {makeStore} from '../../helpers/renderWithStore';
import {makeHabit} from '../../helpers/factories';
import {addHabit} from '../../../src/store/habitsSlice';
import {habitRepository} from '../../../src/services/database/habitRepository';
import {todayDateString} from '../../../src/utils/dateUtils';
import {MMKV} from 'react-native-mmkv';

setupTestDatabase();

beforeEach(() => {
  new MMKV().clearAll();
});

function renderScreen(ui: React.ReactElement, store = makeStore()) {
  return {...render(<Provider store={store}>{ui}</Provider>), store};
}

describe('habit tracking workflow', () => {
  it('shows empty state when no habits exist', async () => {
    const {getByText} = renderScreen(<HabitsScreen />);

    await waitFor(() => {
      expect(getByText('No habits yet')).toBeTruthy();
    });
  });

  it('user sees their active habits listed', async () => {
    const store = makeStore();
    store.dispatch(addHabit(makeHabit({id: 'h1', name: 'Drink Water'})));
    store.dispatch(
      addHabit(
        makeHabit({id: 'h2', name: 'Meditate', category: 'mindfulness'}),
      ),
    );

    const {getByText} = renderScreen(<HabitsScreen />, store);

    await waitFor(() => {
      expect(getByText('Drink Water')).toBeTruthy();
      expect(getByText('Meditate')).toBeTruthy();
    });
  });

  it('user completes a habit and sees the count increase', async () => {
    const store = makeStore();
    store.dispatch(
      addHabit(makeHabit({id: 'h1', name: 'Drink Water', targetCount: 8})),
    );

    const {getByTestId, getByText} = renderScreen(<HabitsScreen />, store);

    await waitFor(() => {
      expect(getByText('Drink Water')).toBeTruthy();
    });

    fireEvent.press(getByTestId('complete-h1'));

    await waitFor(() => {
      expect(getByText('1/8 glasses')).toBeTruthy();
    });

    const completions = await habitRepository.getCompletionsForDate(
      todayDateString(),
    );
    expect(completions).toHaveLength(1);
    expect(completions[0].habitId).toBe('h1');
    expect(completions[0].count).toBe(1);
  });

  it('user completes a habit multiple times and count increments', async () => {
    const store = makeStore();
    store.dispatch(
      addHabit(makeHabit({id: 'h1', name: 'Drink Water', targetCount: 8})),
    );

    const {getByTestId, getByText} = renderScreen(<HabitsScreen />, store);

    await waitFor(() => {
      expect(getByText('Drink Water')).toBeTruthy();
    });

    fireEvent.press(getByTestId('complete-h1'));
    await waitFor(() => {
      expect(getByText('1/8 glasses')).toBeTruthy();
    });

    fireEvent.press(getByTestId('complete-h1'));
    await waitFor(() => {
      expect(getByText('2/8 glasses')).toBeTruthy();
    });

    const completions = await habitRepository.getCompletionsForDate(
      todayDateString(),
    );
    expect(completions[0].count).toBe(2);
  });

  it('habit shows Done when target count is reached', async () => {
    const store = makeStore();
    store.dispatch(
      addHabit(
        makeHabit({id: 'h1', name: 'Stretch', targetCount: 1, unit: undefined}),
      ),
    );

    const {getByTestId, getByText} = renderScreen(<HabitsScreen />, store);

    await waitFor(() => {
      expect(getByText('Stretch')).toBeTruthy();
    });

    fireEvent.press(getByTestId('complete-h1'));

    await waitFor(() => {
      expect(getByText('Done')).toBeTruthy();
    });
  });

  it('inactive habits do not appear in the habits list', async () => {
    const store = makeStore();
    store.dispatch(addHabit(makeHabit({id: 'h1', name: 'Drink Water'})));
    store.dispatch(
      addHabit(makeHabit({id: 'h2', name: 'Old Habit', isActive: false})),
    );

    const {getByText, queryByText} = renderScreen(<HabitsScreen />, store);

    await waitFor(() => {
      expect(getByText('Drink Water')).toBeTruthy();
    });

    expect(queryByText('Old Habit')).toBeNull();
  });

  it('home screen shows habit progress summary', async () => {
    const store = makeStore();
    store.dispatch(
      addHabit(makeHabit({id: 'h1', name: 'Drink Water', targetCount: 8})),
    );
    store.dispatch(
      addHabit(
        makeHabit({
          id: 'h2',
          name: 'Meditate',
          category: 'mindfulness',
          targetCount: 1,
        }),
      ),
    );

    const {getByText} = renderScreen(<HomeScreen />, store);

    await waitFor(() => {
      expect(getByText('0/2 completed today')).toBeTruthy();
      expect(getByText('Drink Water')).toBeTruthy();
      expect(getByText('Meditate')).toBeTruthy();
    });
  });
});

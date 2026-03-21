import React from 'react';
import {Alert} from 'react-native';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {CheckInScreen} from '../../../src/screens/CheckInScreen';
import {HomeScreen} from '../../../src/screens/HomeScreen';
import {JournalScreen} from '../../../src/screens/JournalScreen';
import {setupTestDatabase} from '../../helpers/database';
import {makeStore} from '../../helpers/renderWithStore';
import {checkInRepository} from '../../../src/services/database/checkInRepository';
import {formatDisplayDate} from '../../../src/utils/dateUtils';
import {MMKV} from 'react-native-mmkv';

jest.spyOn(Alert, 'alert');

setupTestDatabase();

beforeEach(() => {
  new MMKV().clearAll();
  (Alert.alert as jest.Mock).mockClear();
});

function renderScreen(ui: React.ReactElement, store = makeStore()) {
  return {...render(<Provider store={store}>{ui}</Provider>), store};
}

describe('check-in workflow', () => {
  it('user selects tags, submits a check-in, and sees it in the journal', async () => {
    const store = makeStore();
    const checkinResult = renderScreen(<CheckInScreen />, store);

    await waitFor(() => {
      expect(checkinResult.getByText('Focused')).toBeTruthy();
    });

    fireEvent.press(checkinResult.getByText('Focused'));
    fireEvent.press(checkinResult.getByText('Calm'));
    fireEvent.press(checkinResult.getByTestId('checkin-submit'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Saved', 'Check-in recorded!');
    });

    const checkIns = await checkInRepository.getRecent(10);
    expect(checkIns).toHaveLength(1);
    expect(checkIns[0].tagIds).toContain('tag-focused');
    expect(checkIns[0].tagIds).toContain('tag-calm');

    checkinResult.unmount();

    const {getByText} = renderScreen(<JournalScreen />, store);
    const todayHeader = formatDisplayDate(Date.now());

    await waitFor(() => {
      expect(getByText(todayHeader)).toBeTruthy();
      expect(getByText('Focused')).toBeTruthy();
      expect(getByText('Calm')).toBeTruthy();
    });
  });

  it('user submits a check-in with a note', async () => {
    const {getByTestId, getByText} = renderScreen(<CheckInScreen />);

    await waitFor(() => {
      expect(getByText('Energized')).toBeTruthy();
    });

    fireEvent.press(getByText('Energized'));
    fireEvent.changeText(getByTestId('checkin-note'), 'Great morning workout!');
    fireEvent.press(getByTestId('checkin-submit'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Saved', 'Check-in recorded!');
    });

    const checkIns = await checkInRepository.getRecent(10);
    expect(checkIns).toHaveLength(1);
    expect(checkIns[0].note).toBe('Great morning workout!');
  });

  it('user cannot submit a check-in without selecting tags', async () => {
    const {getByTestId, getByText} = renderScreen(<CheckInScreen />);

    await waitFor(() => {
      expect(getByText('Focused')).toBeTruthy();
    });

    fireEvent.press(getByTestId('checkin-submit'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Select Tags',
        'Please select at least one tag for your check-in.',
      );
    });

    const checkIns = await checkInRepository.getRecent(10);
    expect(checkIns).toHaveLength(0);
  });

  it('Symptoms category appears only when Sick tag is selected', async () => {
    const {getByText, queryByText} = renderScreen(<CheckInScreen />);

    await waitFor(() => {
      expect(getByText('Mental Health')).toBeTruthy();
    });

    expect(queryByText('Symptoms')).toBeNull();
    expect(queryByText('Headache')).toBeNull();

    fireEvent.press(getByText('Sick'));

    await waitFor(() => {
      expect(getByText('Symptoms')).toBeTruthy();
      expect(getByText('Headache')).toBeTruthy();
    });
  });

  it('Symptoms category disappears when Sick tag is deselected', async () => {
    const {getByText, queryByText} = renderScreen(<CheckInScreen />);

    await waitFor(() => {
      expect(getByText('Sick')).toBeTruthy();
    });

    fireEvent.press(getByText('Sick'));
    await waitFor(() => {
      expect(getByText('Symptoms')).toBeTruthy();
    });

    fireEvent.press(getByText('Sick'));
    await waitFor(() => {
      expect(queryByText('Symptoms')).toBeNull();
    });
  });

  it('check-in appears on the home screen after submission', async () => {
    const store = makeStore();
    const checkinResult = renderScreen(<CheckInScreen />, store);

    await waitFor(() => {
      expect(checkinResult.getByText('Focused')).toBeTruthy();
    });

    fireEvent.press(checkinResult.getByText('Focused'));
    fireEvent.press(checkinResult.getByTestId('checkin-submit'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Saved', 'Check-in recorded!');
    });

    checkinResult.unmount();

    const {getByText} = renderScreen(<HomeScreen />, store);

    await waitFor(() => {
      expect(getByText("Today's Check-Ins")).toBeTruthy();
      expect(getByText('Focused')).toBeTruthy();
    });
  });

  it('home screen shows check-in prompt when no check-ins exist', async () => {
    const {getByText} = renderScreen(<HomeScreen />);

    await waitFor(() => {
      expect(getByText("You haven't checked in yet today")).toBeTruthy();
    });
  });
});

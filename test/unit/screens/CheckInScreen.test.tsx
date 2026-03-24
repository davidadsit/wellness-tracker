import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {Alert} from 'react-native';
import {CheckInScreen} from '../../../src/screens/CheckInScreen';
import {makeStore, renderWithStore} from '../../helpers/renderWithStore';

jest.spyOn(Alert, 'alert');

jest.mock('../../../src/services/database/checkInRepository', () => ({
  checkInRepository: {
    save: jest.fn().mockReturnValue({
      id: 'new-1',
      timestamp: Date.now(),
      tagIds: ['tag-happy'],
      source: 'manual',
    }),
    loadToday: jest.fn().mockReturnValue([]),
    loadRecent: jest.fn().mockReturnValue([]),
  },
}));

jest.mock('../../../src/services/database/tagRepository', () => ({
  tagRepository: {
    loadAllCategories: jest.fn().mockReturnValue([
      {
        id: 'cat-mental',
        name: 'Mental Health',
        sortOrder: 1,
        isDefault: true,
        createdAt: 0,
      },
      {
        id: 'cat-physical',
        name: 'Physical Health',
        sortOrder: 2,
        isDefault: true,
        createdAt: 0,
      },
      {
        id: 'cat-symptoms',
        name: 'Symptoms',
        sortOrder: 4,
        isDefault: true,
        triggerTagId: 'tag-ill',
        createdAt: 0,
      },
    ]),
    loadAllTags: jest.fn().mockReturnValue([
      {
        id: 'tag-calm',
        categoryId: 'cat-mental',
        label: 'Calm',
        isDefault: true,
        isArchived: false,
        createdAt: 0,
      },
      {
        id: 'tag-ill',
        categoryId: 'cat-physical',
        label: 'Ill',
        isDefault: true,
        isArchived: false,
        createdAt: 0,
      },
      {
        id: 'tag-headache',
        categoryId: 'cat-symptoms',
        label: 'Headache',
        isDefault: true,
        isArchived: false,
        createdAt: 0,
      },
    ]),
    saveTag: jest.fn(),
  },
}));

const tagPayload = {
  categories: [
    {
      id: 'cat-mental',
      name: 'Mental Health',
      sortOrder: 1,
      isDefault: true,
      createdAt: 0,
    },
    {
      id: 'cat-physical',
      name: 'Physical Health',
      sortOrder: 2,
      isDefault: true,
      createdAt: 0,
    },
    {
      id: 'cat-symptoms',
      name: 'Symptoms',
      sortOrder: 4,
      isDefault: true,
      triggerTagId: 'tag-ill',
      createdAt: 0,
    },
  ],
  tags: [
    {
      id: 'tag-calm',
      categoryId: 'cat-mental',
      label: 'Calm',
      isDefault: true,
      isArchived: false,
      createdAt: 0,
    },
    {
      id: 'tag-ill',
      categoryId: 'cat-physical',
      label: 'Ill',
      isDefault: true,
      isArchived: false,
      createdAt: 0,
    },
    {
      id: 'tag-headache',
      categoryId: 'cat-symptoms',
      label: 'Headache',
      isDefault: true,
      isArchived: false,
      createdAt: 0,
    },
  ],
};

function renderCheckInWithTags() {
  const store = makeStore();
  store.dispatch({type: 'tags/fetchAll/fulfilled', payload: tagPayload});
  return renderWithStore(<CheckInScreen />, store.getState());
}

describe('CheckInScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the screen with title', async () => {
    const {getByText} = renderWithStore(<CheckInScreen />);
    await waitFor(() => {
      expect(getByText('How are you feeling?')).toBeTruthy();
    });
  });

  it('shows Mental Health and Physical Health categories but hides Symptoms', async () => {
    const {getByText, queryByText} = renderCheckInWithTags();

    await waitFor(() => {
      expect(getByText('Mental Health')).toBeTruthy();
      expect(getByText('Physical Health')).toBeTruthy();
      expect(queryByText('Symptoms')).toBeNull();
    });
  });

  it('reveals Symptoms when Ill is selected', async () => {
    const {getByTestId, getByText, queryByText} = renderCheckInWithTags();

    await waitFor(() => {
      expect(queryByText('Symptoms')).toBeNull();
    });
    fireEvent.press(getByTestId('tag-tag-ill'));
    expect(getByText('Symptoms')).toBeTruthy();
    expect(getByText('Headache')).toBeTruthy();
  });

  it('alerts when submitting with no tags', async () => {
    const {getByTestId} = renderWithStore(<CheckInScreen />);
    await waitFor(() => {
      expect(getByTestId('checkin-submit')).toBeTruthy();
    });
    fireEvent.press(getByTestId('checkin-submit'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Select Tags',
      'Please select at least one tag for your check-in.',
    );
  });

  it('submits check-in and shows success alert when tags are selected', async () => {
    const {getByTestId} = renderCheckInWithTags();

    fireEvent.press(getByTestId('tag-tag-calm'));
    fireEvent.press(getByTestId('checkin-submit'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Saved', 'Check-in recorded!');
    });
  });

  it('resets note after successful submission', async () => {
    const {getByTestId} = renderCheckInWithTags();

    fireEvent.press(getByTestId('tag-tag-calm'));
    fireEvent.changeText(getByTestId('checkin-note'), 'feeling good');
    fireEvent.press(getByTestId('checkin-submit'));

    await waitFor(() => {
      expect(getByTestId('checkin-note').props.value).toBe('');
    });
  });

  it('auto-selects a newly added inline tag', async () => {
    const {
      tagRepository,
    } = require('../../../src/services/database/tagRepository');
    tagRepository.saveTag.mockReturnValue({
      id: 'new-tag',
      categoryId: 'cat-mental',
      label: 'Excited',
      isDefault: false,
      isArchived: false,
      createdAt: 123,
    });

    const {getByTestId} = renderCheckInWithTags();

    // Open inline add for Mental Health category (testID = add-tag-category-cat-mental)
    fireEvent.press(getByTestId('add-tag-category-cat-mental'));

    fireEvent.changeText(
      getByTestId('add-tag-category-cat-mental-input'),
      'Excited',
    );
    fireEvent.press(getByTestId('add-tag-category-cat-mental-confirm'));

    await waitFor(() => {
      expect(tagRepository.saveTag).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 'cat-mental',
          label: 'Excited',
        }),
      );
    });
  });

  it('shows error alert when adding duplicate tag', async () => {
    const {
      tagRepository,
    } = require('../../../src/services/database/tagRepository');
    tagRepository.saveTag.mockRejectedValue(new Error('duplicate'));

    const {getByTestId} = renderCheckInWithTags();

    fireEvent.press(getByTestId('add-tag-category-cat-mental'));
    fireEvent.changeText(
      getByTestId('add-tag-category-cat-mental-input'),
      'Calm',
    );
    fireEvent.press(getByTestId('add-tag-category-cat-mental-confirm'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'A tag with that name already exists in this category.',
      );
    });
  });
});

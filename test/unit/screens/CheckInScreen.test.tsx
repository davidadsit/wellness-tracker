import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {Alert} from 'react-native';
import {CheckInScreen} from '../../../src/screens/CheckInScreen';
import {makeStore, renderWithStore} from '../../helpers/renderWithStore';

jest.spyOn(Alert, 'alert');

jest.mock('../../../src/services/database/checkInRepository', () => ({
  checkInRepository: {
    create: jest.fn().mockReturnValue({
      id: 'new-1',
      timestamp: Date.now(),
      tagIds: ['tag-happy'],
      source: 'manual',
    }),
    getToday: jest.fn().mockReturnValue([]),
    getRecent: jest.fn().mockReturnValue([]),
  },
}));

jest.mock('../../../src/services/database/tagRepository', () => ({
  tagRepository: {
    getAllCategories: jest.fn().mockReturnValue([
      {id: 'cat-mental', name: 'Mental Health', sortOrder: 1, isDefault: true, createdAt: 0},
      {id: 'cat-physical', name: 'Physical Health', sortOrder: 2, isDefault: true, createdAt: 0},
      {id: 'cat-symptoms', name: 'Symptoms', sortOrder: 4, isDefault: true, triggerTagId: 'tag-ill', createdAt: 0},
    ]),
    getAllTags: jest.fn().mockReturnValue([
      {id: 'tag-calm', categoryId: 'cat-mental', label: 'Calm', isDefault: true, isArchived: false, createdAt: 0},
      {id: 'tag-ill', categoryId: 'cat-physical', label: 'Ill', isDefault: true, isArchived: false, createdAt: 0},
      {id: 'tag-headache', categoryId: 'cat-symptoms', label: 'Headache', isDefault: true, isArchived: false, createdAt: 0},
    ]),
    createTag: jest.fn(),
  },
}));

const tagPayload = {
  categories: [
    {id: 'cat-mental', name: 'Mental Health', sortOrder: 1, isDefault: true, createdAt: 0},
    {id: 'cat-physical', name: 'Physical Health', sortOrder: 2, isDefault: true, createdAt: 0},
    {id: 'cat-symptoms', name: 'Symptoms', sortOrder: 4, isDefault: true, triggerTagId: 'tag-ill', createdAt: 0},
  ],
  tags: [
    {id: 'tag-calm', categoryId: 'cat-mental', label: 'Calm', isDefault: true, isArchived: false, createdAt: 0},
    {id: 'tag-ill', categoryId: 'cat-physical', label: 'Ill', isDefault: true, isArchived: false, createdAt: 0},
    {id: 'tag-headache', categoryId: 'cat-symptoms', label: 'Headache', isDefault: true, isArchived: false, createdAt: 0},
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

  it('renders the screen with title', () => {
    const {getByText} = renderWithStore(<CheckInScreen />);
    expect(getByText('How are you feeling?')).toBeTruthy();
  });

  it('shows Mental Health and Physical Health categories but hides Symptoms', () => {
    const {getByText, queryByText} = renderCheckInWithTags();

    expect(getByText('Mental Health')).toBeTruthy();
    expect(getByText('Physical Health')).toBeTruthy();
    expect(queryByText('Symptoms')).toBeNull();
  });

  it('reveals Symptoms when Ill is selected', () => {
    const {getByTestId, getByText, queryByText} = renderCheckInWithTags();

    expect(queryByText('Symptoms')).toBeNull();
    fireEvent.press(getByTestId('tag-tag-ill'));
    expect(getByText('Symptoms')).toBeTruthy();
    expect(getByText('Headache')).toBeTruthy();
  });

  it('alerts when submitting with no tags', () => {
    const {getByTestId} = renderWithStore(<CheckInScreen />);
    fireEvent.press(getByTestId('checkin-submit'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Select Tags',
      'Please select at least one tag for your check-in.',
    );
  });
});

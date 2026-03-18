import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {Alert} from 'react-native';
import {CheckInScreen} from '../../src/screens/CheckInScreen';
import tagsReducer from '../../src/store/tagsSlice';
import checkInReducer from '../../src/store/checkInSlice';
import habitsReducer from '../../src/store/habitsSlice';
import settingsReducer from '../../src/store/settingsSlice';

jest.spyOn(Alert, 'alert');

jest.mock('../../src/services/database/checkInRepository', () => ({
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

jest.mock('../../src/services/database/tagRepository', () => ({
  tagRepository: {
    getAllCategories: jest.fn().mockReturnValue([
      {id: 'cat-mental', name: 'Mental Health', sortOrder: 1, isDefault: true, createdAt: 0},
      {id: 'cat-physical', name: 'Physical Health', sortOrder: 2, isDefault: true, createdAt: 0},
      {id: 'cat-symptoms', name: 'Symptoms', sortOrder: 4, isDefault: true, triggerTagId: 'tag-ill', createdAt: 0},
    ]),
    getAllTags: jest.fn().mockReturnValue([
      {id: 'tag-calm', categoryId: 'cat-mental', label: 'Calm', isDefault: true, createdAt: 0},
      {id: 'tag-ill', categoryId: 'cat-physical', label: 'Ill', isDefault: true, createdAt: 0},
      {id: 'tag-headache', categoryId: 'cat-symptoms', label: 'Headache', isDefault: true, createdAt: 0},
    ]),
    createTag: jest.fn(),
  },
}));

function makeStore() {
  return configureStore({
    reducer: {
      tags: tagsReducer,
      checkIn: checkInReducer,
      habits: habitsReducer,
      settings: settingsReducer,
    },
  });
}

describe('CheckInScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the screen with title', () => {
    const store = makeStore();
    const {getByText} = render(
      <Provider store={store}>
        <CheckInScreen />
      </Provider>,
    );
    expect(getByText('How are you feeling?')).toBeTruthy();
  });

  it('shows Mental Health and Physical Health categories but hides Symptoms', () => {
    const store = makeStore();
    store.dispatch({
      type: 'tags/fetchAll/fulfilled',
      payload: {
        categories: [
          {id: 'cat-mental', name: 'Mental Health', sortOrder: 1, isDefault: true, createdAt: 0},
          {id: 'cat-physical', name: 'Physical Health', sortOrder: 2, isDefault: true, createdAt: 0},
          {id: 'cat-symptoms', name: 'Symptoms', sortOrder: 4, isDefault: true, triggerTagId: 'tag-ill', createdAt: 0},
        ],
        tags: [
          {id: 'tag-calm', categoryId: 'cat-mental', label: 'Calm', isDefault: true, createdAt: 0},
          {id: 'tag-ill', categoryId: 'cat-physical', label: 'Ill', isDefault: true, createdAt: 0},
          {id: 'tag-headache', categoryId: 'cat-symptoms', label: 'Headache', isDefault: true, createdAt: 0},
        ],
      },
    });

    const {getByText, queryByText} = render(
      <Provider store={store}>
        <CheckInScreen />
      </Provider>,
    );

    expect(getByText('Mental Health')).toBeTruthy();
    expect(getByText('Physical Health')).toBeTruthy();
    expect(queryByText('Symptoms')).toBeNull();
  });

  it('reveals Symptoms when Ill is selected', () => {
    const store = makeStore();
    store.dispatch({
      type: 'tags/fetchAll/fulfilled',
      payload: {
        categories: [
          {id: 'cat-mental', name: 'Mental Health', sortOrder: 1, isDefault: true, createdAt: 0},
          {id: 'cat-physical', name: 'Physical Health', sortOrder: 2, isDefault: true, createdAt: 0},
          {id: 'cat-symptoms', name: 'Symptoms', sortOrder: 4, isDefault: true, triggerTagId: 'tag-ill', createdAt: 0},
        ],
        tags: [
          {id: 'tag-calm', categoryId: 'cat-mental', label: 'Calm', isDefault: true, createdAt: 0},
          {id: 'tag-ill', categoryId: 'cat-physical', label: 'Ill', isDefault: true, createdAt: 0},
          {id: 'tag-headache', categoryId: 'cat-symptoms', label: 'Headache', isDefault: true, createdAt: 0},
        ],
      },
    });

    const {getByTestId, getByText, queryByText} = render(
      <Provider store={store}>
        <CheckInScreen />
      </Provider>,
    );

    expect(queryByText('Symptoms')).toBeNull();

    fireEvent.press(getByTestId('tag-tag-ill'));

    expect(getByText('Symptoms')).toBeTruthy();
    expect(getByText('Headache')).toBeTruthy();
  });

  it('alerts when submitting with no tags', () => {
    const store = makeStore();
    const {getByTestId} = render(
      <Provider store={store}>
        <CheckInScreen />
      </Provider>,
    );

    fireEvent.press(getByTestId('checkin-submit'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Select Tags',
      'Please select at least one tag for your check-in.',
    );
  });
});

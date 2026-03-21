import React from 'react';
import {render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import tagsReducer from '../../src/store/tagsSlice';
import checkInReducer from '../../src/store/checkInSlice';
import habitsReducer from '../../src/store/habitsSlice';
import settingsReducer from '../../src/store/settingsSlice';

export function makeStore(preloadedState: any = {}) {
  return configureStore({
    reducer: {
      tags: tagsReducer,
      checkIn: checkInReducer,
      habits: habitsReducer,
      settings: settingsReducer,
    },
    preloadedState,
  });
}

export function renderWithStore(
  ui: React.ReactElement,
  preloadedState: any = {},
) {
  const store = makeStore(preloadedState);
  return {...render(<Provider store={store}>{ui}</Provider>), store};
}

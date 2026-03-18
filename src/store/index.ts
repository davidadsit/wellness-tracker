import {configureStore, combineReducers} from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import {MMKV} from 'react-native-mmkv';
import settingsReducer from './settingsSlice';
import tagsReducer from './tagsSlice';
import checkInReducer from './checkInSlice';
import habitsReducer from './habitsSlice';

let _mmkv: MMKV | null = null;
function getMmkv(): MMKV {
  if (!_mmkv) {
    _mmkv = new MMKV();
  }
  return _mmkv;
}

const mmkvStorage = {
  setItem: (key: string, value: string) => {
    getMmkv().set(key, value);
    return Promise.resolve(true);
  },
  getItem: (key: string) => {
    const value = getMmkv().getString(key);
    return Promise.resolve(value ?? null);
  },
  removeItem: (key: string) => {
    getMmkv().delete(key);
    return Promise.resolve();
  },
};

const rootReducer = combineReducers({
  settings: settingsReducer,
  tags: tagsReducer,
  checkIn: checkInReducer,
  habits: habitsReducer,
});

const persistConfig = {
  key: 'root',
  storage: mmkvStorage,
  whitelist: ['settings'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {CheckIn} from '../types';
import {checkInRepository} from '../services/database/checkInRepository';
import {todayStartTimestamp, todayEndTimestamp} from '../utils/dateUtils';

export interface CheckInState {
  todayCheckIns: CheckIn[];
  recentCheckIns: CheckIn[];
  loading: boolean;
  error: string | null;
}

const initialState: CheckInState = {
  todayCheckIns: [],
  recentCheckIns: [],
  loading: false,
  error: null,
};

export const fetchTodayCheckIns = createAsyncThunk(
  'checkIn/fetchToday',
  async () => {
    return checkInRepository.getToday(
      todayStartTimestamp(),
      todayEndTimestamp(),
    );
  },
);

export const fetchRecentCheckIns = createAsyncThunk(
  'checkIn/fetchRecent',
  async (limit: number = 20) => {
    return checkInRepository.getRecent(limit);
  },
);

export const submitCheckIn = createAsyncThunk(
  'checkIn/submit',
  async (params: {tagIds: string[]; note?: string; source?: 'manual' | 'notification'}) => {
    return checkInRepository.create(params);
  },
);

export const removeCheckIn = createAsyncThunk(
  'checkIn/remove',
  async (id: string) => {
    await checkInRepository.delete(id);
    return id;
  },
);

const checkInSlice = createSlice({
  name: 'checkIn',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchTodayCheckIns.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodayCheckIns.fulfilled, (state, action) => {
        state.loading = false;
        state.todayCheckIns = action.payload;
      })
      .addCase(fetchTodayCheckIns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch check-ins';
      })
      .addCase(fetchRecentCheckIns.fulfilled, (state, action) => {
        state.recentCheckIns = action.payload;
      })
      .addCase(submitCheckIn.fulfilled, (state, action) => {
        state.todayCheckIns.unshift(action.payload);
        state.recentCheckIns.unshift(action.payload);
      })
      .addCase(removeCheckIn.fulfilled, (state, action) => {
        state.todayCheckIns = state.todayCheckIns.filter(
          c => c.id !== action.payload,
        );
        state.recentCheckIns = state.recentCheckIns.filter(
          c => c.id !== action.payload,
        );
      });
  },
});

export default checkInSlice.reducer;

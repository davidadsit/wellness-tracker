import {useCallback} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch} from '../store';
import {
  fetchTodayCheckIns,
  fetchRecentCheckIns,
  submitCheckIn,
} from '../store/checkInSlice';

export function useCheckIn() {
  const dispatch = useDispatch<AppDispatch>();
  const {todayCheckIns, recentCheckIns, loading} = useSelector(
    (state: RootState) => state.checkIn,
  );

  const loadToday = useCallback(() => {
    dispatch(fetchTodayCheckIns());
  }, [dispatch]);

  const loadRecent = useCallback(
    (limit: number = 20) => {
      dispatch(fetchRecentCheckIns(limit));
    },
    [dispatch],
  );

  const submit = useCallback(
    (params: {
      tagIds: string[];
      note?: string;
      source?: 'manual' | 'notification';
    }) => {
      return dispatch(submitCheckIn(params)).unwrap();
    },
    [dispatch],
  );

  const hasCheckedInToday = todayCheckIns.length > 0;

  return {
    todayCheckIns,
    recentCheckIns,
    loading,
    hasCheckedInToday,
    loadToday,
    loadRecent,
    submit,
  };
}

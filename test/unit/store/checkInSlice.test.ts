import checkInReducer, {
  fetchTodayCheckIns,
  fetchRecentCheckIns,
  submitCheckIn,
  removeCheckIn,
  CheckInState,
} from '../../../src/store/checkInSlice';

const initialState: CheckInState = {
  todayCheckIns: [],
  recentCheckIns: [],
  loading: false,
};

describe('checkInSlice', () => {
  describe('reducers', () => {
    it('returns the initial state', () => {
      expect(checkInReducer(undefined, {type: 'unknown'})).toEqual(
        initialState,
      );
    });
  });

  describe('fetchTodayCheckIns', () => {
    it('sets loading true on pending', () => {
      const state = checkInReducer(
        initialState,
        fetchTodayCheckIns.pending('', undefined),
      );
      expect(state.loading).toBe(true);
    });

    it('stores today check-ins on fulfilled', () => {
      const checkIns = [
        {id: '1', timestamp: 100, tagIds: ['t1'], source: 'manual' as const},
      ];
      const state = checkInReducer(
        {...initialState, loading: true},
        fetchTodayCheckIns.fulfilled(checkIns, '', undefined),
      );
      expect(state.loading).toBe(false);
      expect(state.todayCheckIns).toEqual(checkIns);
    });

    it('sets loading false on rejected', () => {
      const state = checkInReducer(
        {...initialState, loading: true},
        fetchTodayCheckIns.rejected(new Error('fail'), '', undefined),
      );
      expect(state.loading).toBe(false);
    });
  });

  describe('fetchRecentCheckIns', () => {
    it('stores recent check-ins on fulfilled', () => {
      const checkIns = [
        {id: '1', timestamp: 100, tagIds: ['t1'], source: 'manual' as const},
      ];
      const state = checkInReducer(
        initialState,
        fetchRecentCheckIns.fulfilled(checkIns, '', 20),
      );
      expect(state.recentCheckIns).toEqual(checkIns);
    });
  });

  describe('submitCheckIn', () => {
    it('prepends new check-in to today and recent lists', () => {
      const existing = {
        id: 'old',
        timestamp: 50,
        tagIds: ['t1'],
        source: 'manual' as const,
      };
      const stateWithExisting: CheckInState = {
        ...initialState,
        todayCheckIns: [existing],
        recentCheckIns: [existing],
      };

      const newCheckIn = {
        id: 'new',
        timestamp: 100,
        tagIds: ['t2', 't3'],
        note: 'test',
        source: 'manual' as const,
      };

      const state = checkInReducer(
        stateWithExisting,
        submitCheckIn.fulfilled(newCheckIn, '', {
          tagIds: ['t2', 't3'],
          note: 'test',
        }),
      );

      expect(state.todayCheckIns[0].id).toBe('new');
      expect(state.todayCheckIns).toHaveLength(2);
      expect(state.recentCheckIns[0].id).toBe('new');
    });
  });

  describe('removeCheckIn', () => {
    it('removes check-in from both lists', () => {
      const checkIn = {
        id: '1',
        timestamp: 100,
        tagIds: ['t1'],
        source: 'manual' as const,
      };
      const stateWithCheckIn: CheckInState = {
        ...initialState,
        todayCheckIns: [checkIn],
        recentCheckIns: [checkIn],
      };

      const state = checkInReducer(
        stateWithCheckIn,
        removeCheckIn.fulfilled('1', '', '1'),
      );

      expect(state.todayCheckIns).toHaveLength(0);
      expect(state.recentCheckIns).toHaveLength(0);
    });
  });
});

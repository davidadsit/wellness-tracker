import React from 'react';
import {renderHook} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {makeStore} from '../../helpers/renderWithStore';
import {useCheckIn} from '../../../src/hooks/useCheckIn';

jest.mock('../../../src/services/database/checkInRepository', () => ({
  checkInRepository: {
    getToday: jest.fn().mockReturnValue([]),
    getRecent: jest.fn().mockReturnValue([]),
    create: jest.fn(),
    delete: jest.fn(),
  },
}));

function renderWithCheckIns(checkInState: any = {}) {
  const store = makeStore({
    checkIn: {
      todayCheckIns: [],
      recentCheckIns: [],
      loading: false,
      ...checkInState,
    },
  });
  const wrapper = ({children}: {children: React.ReactNode}) =>
    React.createElement(Provider, {store}, children);
  return renderHook(() => useCheckIn(), {wrapper});
}

describe('useCheckIn', () => {
  describe('hasCheckedInToday', () => {
    it('returns false when no check-ins exist today', () => {
      const {result} = renderWithCheckIns({todayCheckIns: []});
      expect(result.current.hasCheckedInToday).toBe(false);
    });

    it('returns true when check-ins exist today', () => {
      const {result} = renderWithCheckIns({
        todayCheckIns: [
          {id: '1', timestamp: Date.now(), tagIds: ['t1'], source: 'manual'},
        ],
      });
      expect(result.current.hasCheckedInToday).toBe(true);
    });
  });
});

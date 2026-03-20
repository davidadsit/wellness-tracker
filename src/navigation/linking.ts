import {LinkingOptions} from '@react-navigation/native';
import {TabParamList} from '../types';

export const linking: LinkingOptions<TabParamList> = {
  prefixes: ['wellnesstracker://'],
  config: {
    screens: {
      Home: {
        screens: {
          HomeMain: 'home',
          Settings: 'settings',
          Analytics: 'analytics',
          TagManagement: 'tags',
          QuickCheckIn: 'check-in',
        },
      },
      'Check-In': 'checkin',
      Habits: {
        screens: {
          HabitsMain: 'habits',
          HabitDetail: 'habit/:habitId',
        },
      },
      Journal: 'journal',
    },
  },
};

import {LinkingOptions} from '@react-navigation/native';
import {RootStackParamList} from '../types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['wellnesstracker://'],
  config: {
    screens: {
      QuickCheckIn: 'check-in',
      Tabs: {
        screens: {
          Home: 'home',
          'Check-In': 'checkin',
          Habits: 'habits',
          Analytics: 'analytics',
        },
      },
      HabitDetail: 'habit/:habitId',
      Settings: 'settings',
      TagManagement: 'tags',
    },
  },
};

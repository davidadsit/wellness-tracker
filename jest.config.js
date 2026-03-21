const baseConfig = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-mmkv|react-native-safe-area-context|react-native-screens|react-native-svg|react-native-gifted-charts|@notifee/react-native|react-native-permissions|uuid|immer|react-redux|@reduxjs/toolkit|redux|redux-persist|reselect|redux-thunk)/)',
  ],
  moduleNameMapper: {
    '@op-engineering/op-sqlite': '<rootDir>/test/__mocks__/op-sqlite.ts',
    '@notifee/react-native': '<rootDir>/test/__mocks__/notifee.ts',
    'react-native-mmkv': '<rootDir>/test/__mocks__/react-native-mmkv.ts',
    '@react-native-community/datetimepicker':
      '<rootDir>/test/__mocks__/@react-native-community/datetimepicker.tsx',
  },
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
};

module.exports = {
  projects: [
    {
      ...baseConfig,
      displayName: 'unit',
      roots: ['<rootDir>/test/unit'],
    },
    {
      ...baseConfig,
      displayName: 'integration',
      roots: ['<rootDir>/test/integration'],
    },
    {
      ...baseConfig,
      displayName: 'acceptance',
      roots: ['<rootDir>/test/acceptance'],
    },
  ],
};

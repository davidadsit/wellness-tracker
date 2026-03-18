module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-mmkv|react-native-safe-area-context|react-native-screens|react-native-svg|react-native-gifted-charts|@notifee/react-native|react-native-permissions|uuid|immer|react-redux|@reduxjs/toolkit|redux|redux-persist|reselect|redux-thunk)/)',
  ],
  moduleNameMapper: {
    '@op-engineering/op-sqlite': '<rootDir>/src/__mocks__/op-sqlite.ts',
    '@notifee/react-native': '<rootDir>/src/__mocks__/notifee.ts',
    'react-native-mmkv': '<rootDir>/src/__mocks__/react-native-mmkv.ts',
    uuid: '<rootDir>/src/__mocks__/uuid.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
};

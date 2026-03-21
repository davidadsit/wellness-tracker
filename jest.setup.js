// Silence React Native warnings in test output
try {
  jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
} catch {
  // Module path changed in newer RN versions — safe to skip
}

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = {top: 0, right: 0, bottom: 0, left: 0};
  return {
    SafeAreaProvider: ({children}) => children,
    SafeAreaView: ({children}) => children,
    useSafeAreaInsets: () => inset,
  };
});

// Mock react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

// Mock @react-navigation to avoid heavy transformation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({children}) => children,
  useNavigation: jest.fn(() => ({navigate: jest.fn(), goBack: jest.fn()})),
  useFocusEffect: (cb) => {
    const React = require('react');
    React.useEffect(() => { const cleanup = cb(); return cleanup; }, []);
  },
  useRoute: jest.fn(() => ({params: {}})),
  useIsFocused: jest.fn(() => true),
}));

jest.mock('@react-navigation/native-stack', () => {
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({children}) => children,
      Screen: ({children}) => children,
    }),
  };
});

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({children}) => children,
    Screen: ({children}) => children,
  }),
}));

// Mock @react-native-vector-icons/ionicons (loads font files Jest can't parse)
jest.mock('@react-native-vector-icons/ionicons', () => {
  const React = require('react');
  return {
    Ionicons: (props) => React.createElement('Ionicons', props),
  };
});

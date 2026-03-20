import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {createBottomTabNavigator, BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useNavigation, getFocusedRouteNameFromRoute} from '@react-navigation/native';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {HomeScreen} from '../screens/HomeScreen';
import {CheckInScreen} from '../screens/CheckInScreen';
import {HabitsScreen} from '../screens/HabitsScreen';
import {JournalScreen} from '../screens/JournalScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {AnalyticsScreen} from '../screens/AnalyticsScreen';
import {TagManagementScreen} from '../screens/TagManagementScreen';
import {QuickCheckInScreen} from '../screens/QuickCheckInScreen';
import {HabitDetailScreen} from '../screens/HabitDetailScreen';
import {HabitFormScreen} from '../screens/HabitFormScreen';
import {TabParamList, HomeStackParamList, HabitsStackParamList} from '../types';

const TAB_ICONS: Record<keyof TabParamList, {focused: string; unfocused: string}> = {
  Home: {focused: 'home', unfocused: 'home-outline'},
  'Check-In': {focused: 'checkmark-circle', unfocused: 'checkmark-circle-outline'},
  Habits: {focused: 'repeat', unfocused: 'repeat-outline'},
  Journal: {focused: 'book', unfocused: 'book-outline'},
};

// The root screen name for each tab's stack
const TAB_ROOT_SCREENS: Record<keyof TabParamList, string> = {
  Home: 'HomeMain',
  'Check-In': 'Check-In',
  Habits: 'HabitsMain',
  Journal: 'Journal',
};

function SettingsButton() {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('Home', {screen: 'Settings'})} style={{marginRight: 8}}>
      <Ionicons name="settings-outline" size={24} color="#4A90D9" />
    </TouchableOpacity>
  );
}

// Home stack
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{headerRight: () => <SettingsButton />}}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{title: 'Home'}} />
      <HomeStack.Screen name="Settings" component={SettingsScreen} />
      <HomeStack.Screen name="Analytics" component={AnalyticsScreen} />
      <HomeStack.Screen name="TagManagement" component={TagManagementScreen} options={{title: 'Manage Tags'}} />
      <HomeStack.Screen name="QuickCheckIn" component={QuickCheckInScreen} options={{title: 'Quick Check-In'}} />
    </HomeStack.Navigator>
  );
}

// Habits stack
const HabitsStack = createNativeStackNavigator<HabitsStackParamList>();

function HabitsStackScreen() {
  return (
    <HabitsStack.Navigator screenOptions={{headerRight: () => <SettingsButton />}}>
      <HabitsStack.Screen name="HabitsMain" component={HabitsScreen} options={{title: 'Habits'}} />
      <HabitsStack.Screen name="HabitDetail" component={HabitDetailScreen} options={{title: 'Habit Details'}} />
      <HabitsStack.Screen
        name="HabitForm"
        component={HabitFormScreen}
        options={({route}) => ({title: route.params?.habitId ? 'Edit Habit' : 'New Habit'})}
      />
    </HabitsStack.Navigator>
  );
}

function CustomTabBar({state, descriptors, navigation}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const activeTab = state.routes[state.index];
  const focusedRouteName = getFocusedRouteNameFromRoute(activeTab);
  const tabName = activeTab.name as keyof TabParamList;
  const expectedRoot = TAB_ROOT_SCREENS[tabName];
  const isOnRootScreen = focusedRouteName === undefined || focusedRouteName === expectedRoot;

  return (
    <View style={[styles.tabBar, {paddingBottom: insets.bottom}]}>
      {state.routes.map((route, index) => {
        const label = route.name as keyof TabParamList;
        const isFocused = state.index === index && isOnRootScreen;
        const icons = TAB_ICONS[label];
        const iconName = isFocused ? icons.focused : icons.unfocused;
        const color = isFocused ? '#4A90D9' : '#888';

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? {selected: true} : {}}
            onPress={() => {
              const event = navigation.emit({type: 'tabPress', target: route.key, canPreventDefault: true});
              if (!event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={styles.tabItem}>
            <Ionicons name={iconName} size={24} color={color} />
            <Text style={[styles.tabLabel, {color}]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{headerShown: false}}>
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen
        name="Check-In"
        component={CheckInScreen}
        options={{headerShown: true, headerRight: () => <SettingsButton />}}
      />
      <Tab.Screen name="Habits" component={HabitsStackScreen} />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{headerShown: true, headerRight: () => <SettingsButton />}}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});

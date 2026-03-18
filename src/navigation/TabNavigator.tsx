import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {HomeScreen} from '../screens/HomeScreen';
import {CheckInScreen} from '../screens/CheckInScreen';
import {HabitsScreen} from '../screens/HabitsScreen';
import {AnalyticsScreen} from '../screens/AnalyticsScreen';
import {TabParamList} from '../types';

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#4A90D9',
        tabBarInactiveTintColor: '#888',
      }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Check-In" component={CheckInScreen} />
      <Tab.Screen name="Habits" component={HabitsScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
    </Tab.Navigator>
  );
}

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {TabNavigator} from './TabNavigator';
import {HabitDetailScreen} from '../screens/HabitDetailScreen';
import {HabitFormScreen} from '../screens/HabitFormScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {TagManagementScreen} from '../screens/TagManagementScreen';
import {QuickCheckInScreen} from '../screens/QuickCheckInScreen';
import {RootStackParamList} from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="HabitDetail"
        component={HabitDetailScreen}
        options={{title: 'Habit Details'}}
      />
      <Stack.Screen
        name="HabitForm"
        component={HabitFormScreen}
        options={({route}) => ({
          title: route.params?.habitId ? 'Edit Habit' : 'New Habit',
        })}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen
        name="TagManagement"
        component={TagManagementScreen}
        options={{title: 'Manage Tags'}}
      />
      <Stack.Screen
        name="QuickCheckIn"
        component={QuickCheckInScreen}
        options={{title: 'Quick Check-In', presentation: 'modal'}}
      />
    </Stack.Navigator>
  );
}

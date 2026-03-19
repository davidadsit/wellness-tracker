import React from 'react';
import {TouchableOpacity} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {HomeScreen} from '../screens/HomeScreen';
import {CheckInScreen} from '../screens/CheckInScreen';
import {HabitsScreen} from '../screens/HabitsScreen';
import {JournalScreen} from '../screens/JournalScreen';
import {TabParamList, RootStackParamList} from '../types';

const TAB_ICONS: Record<keyof TabParamList, {focused: string; unfocused: string}> = {
  Home: {focused: 'home', unfocused: 'home-outline'},
  'Check-In': {focused: 'checkmark-circle', unfocused: 'checkmark-circle-outline'},
  Habits: {focused: 'repeat', unfocused: 'repeat-outline'},
  Journal: {focused: 'book', unfocused: 'book-outline'},
};

function SettingsButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{marginRight: 8}}>
      <Ionicons name="settings-outline" size={24} color="#4A90D9" />
    </TouchableOpacity>
  );
}

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: true,
        tabBarActiveTintColor: '#4A90D9',
        tabBarInactiveTintColor: '#888',
        headerRight: () => <SettingsButton />,
        tabBarIcon: ({focused, color, size}) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Check-In" component={CheckInScreen} />
      <Tab.Screen name="Habits" component={HabitsScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
    </Tab.Navigator>
  );
}

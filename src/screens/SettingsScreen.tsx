import React from 'react';
import {View, Text, Switch, TouchableOpacity, StyleSheet} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootState, AppDispatch} from '../store';
import {
  setNotificationsEnabled,
  setDailyCheckInTime,
} from '../store/settingsSlice';
import {notificationService} from '../services/notifications/notificationService';
import {Card} from '../components/common/Card';
import {RootStackParamList} from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector((state: RootState) => state.settings);

  const handleToggleNotifications = async (value: boolean) => {
    dispatch(setNotificationsEnabled(value));
    if (value) {
      await notificationService.scheduleDailyCheckIn(settings.dailyCheckInTime);
    } else {
      await notificationService.cancelAll();
    }
  };

  return (
    <View style={styles.container} testID="settings-screen">
      <Text style={styles.title}>Settings</Text>

      <Card>
        <View style={styles.row}>
          <Text style={styles.label}>Notifications</Text>
          <Switch
            testID="notifications-toggle"
            value={settings.notificationsEnabled}
            onValueChange={handleToggleNotifications}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Daily Check-In Time</Text>
          <Text style={styles.value}>{settings.dailyCheckInTime}</Text>
        </View>
      </Card>

      <Card>
        <TouchableOpacity
          testID="manage-tags-button"
          style={styles.row}
          onPress={() => navigation.navigate('TagManagement')}>
          <Text style={styles.label}>Manage Tags & Categories</Text>
          <Text style={styles.chevron}>&gt;</Text>
        </TouchableOpacity>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f8f9fa'},
  title: {fontSize: 28, fontWeight: '700', color: '#333', margin: 16, marginBottom: 8},
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  label: {fontSize: 15, color: '#333'},
  value: {fontSize: 15, color: '#888'},
  chevron: {fontSize: 18, color: '#ccc'},
});

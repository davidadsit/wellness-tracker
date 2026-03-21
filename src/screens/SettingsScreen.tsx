import React, {useState} from 'react';
import {View, Text, Switch, TouchableOpacity, StyleSheet} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {RootState, AppDispatch} from '../store';
import {setReminderEnabled, setReminderTime} from '../store/settingsSlice';
import {notificationService} from '../services/notifications/notificationService';
import {ReminderPeriod} from '../types';
import {Card} from '../components/common/Card';
import {colors, commonStyles} from '../theme';

const REMINDER_LABELS: Record<ReminderPeriod, string> = {
  morning: 'Morning Reminder',
  midday: 'Mid-day Reminder',
  evening: 'Evening Reminder',
};

function timeToDate(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function dateToTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatTime12Hour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const {reminders} = useSelector((state: RootState) => state.settings);
  const [editingPeriod, setEditingPeriod] = useState<ReminderPeriod | null>(
    null,
  );

  const handleToggleReminder = async (
    period: ReminderPeriod,
    enabled: boolean,
  ) => {
    dispatch(setReminderEnabled({period, enabled}));
    if (enabled) {
      await notificationService.scheduleCheckInReminder(
        period,
        reminders[period].time,
      );
    } else {
      await notificationService.cancelCheckInReminder(period);
    }
  };

  const handleTimeChange = async (_event: any, selectedDate?: Date) => {
    if (!editingPeriod || !selectedDate) {
      setEditingPeriod(null);
      return;
    }

    const newTime = dateToTime(selectedDate);
    dispatch(setReminderTime({period: editingPeriod, time: newTime}));

    if (reminders[editingPeriod].enabled) {
      await notificationService.rescheduleCheckInReminder(
        editingPeriod,
        newTime,
      );
    }

    setEditingPeriod(null);
  };

  return (
    <View style={styles.container} testID="settings-screen">
      <Text style={styles.title}>Settings</Text>

      <Card>
        {(['morning', 'midday', 'evening'] as ReminderPeriod[]).map(period => (
          <View key={period} style={styles.row}>
            <View style={styles.reminderInfo}>
              <Text style={styles.label}>{REMINDER_LABELS[period]}</Text>
              <TouchableOpacity
                testID={`${period}-reminder-time`}
                onPress={() => setEditingPeriod(period)}
                disabled={!reminders[period].enabled}>
                <Text
                  style={[
                    styles.value,
                    !reminders[period].enabled && styles.valueDisabled,
                  ]}>
                  {formatTime12Hour(reminders[period].time)}
                </Text>
              </TouchableOpacity>
            </View>
            <Switch
              testID={`${period}-reminder-toggle`}
              value={reminders[period].enabled}
              onValueChange={value => handleToggleReminder(period, value)}
            />
          </View>
        ))}
      </Card>

      {editingPeriod && (
        <DateTimePicker
          testID="reminder-time-picker"
          value={timeToDate(reminders[editingPeriod].time)}
          mode="time"
          is24Hour={false}
          onChange={handleTimeChange}
        />
      )}

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
  container: commonStyles.screenContainer,
  title: commonStyles.screenTitle,
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  reminderInfo: {
    flex: 1,
  },
  label: {fontSize: 15, color: colors.text},
  value: {fontSize: 13, color: colors.textSecondary, marginTop: 2},
  valueDisabled: {color: colors.divider},
  chevron: {fontSize: 18, color: '#ccc'},
});

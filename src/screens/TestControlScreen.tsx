import React, {useState, useCallback} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {useHabits} from '../hooks/useHabits';
import {testDataService} from '../services/database/testDataService';
import {notificationService} from '../services/notifications/notificationService';
import {colors, commonStyles} from '../theme';
import {Card} from '../components/common/Card';

export function TestControlScreen() {
  const [status, setStatus] = useState('');
  const {habits, loadHabits} = useHabits();

  const showStatus = useCallback((message: string) => {
    setStatus(message);
  }, []);

  const generateCheckIns = useCallback(async () => {
    showStatus('Generating check-ins...');
    const count = await testDataService.generateCheckIns(30);
    showStatus(`Created ${count} check-ins over 30 days.`);
  }, [showStatus]);

  const generateHabitCompletions = useCallback(async () => {
    await loadHabits();
    if (habits.length === 0) {
      showStatus('No habits found. Create habits first.');
      return;
    }
    showStatus('Generating habit completions...');
    const count = await testDataService.generateHabitCompletions(habits, 30);
    showStatus(`Created ${count} habit completions over 30 days.`);
  }, [habits, loadHabits, showStatus]);

  const clearAllData = useCallback(async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all check-ins, habit completions, and notification outcomes. Tags and habits will be preserved.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await testDataService.clearAllData();
            showStatus('All data cleared.');
          },
        },
      ],
    );
  }, [showStatus]);

  const fireReminder = useCallback(
    async (period: 'morning' | 'midday' | 'evening', time: string) => {
      showStatus(`Scheduling ${period} reminder...`);
      await notificationService.scheduleCheckInReminder(period, time);
      showStatus(`${period} reminder scheduled.`);
    },
    [showStatus],
  );

  return (
    <ScrollView style={styles.container} testID="test-control-screen">
      <Text style={styles.title}>Test Controls</Text>

      {status !== '' && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText} testID="test-control-status">
            {status}
          </Text>
        </View>
      )}

      <Card>
        <Text style={styles.sectionTitle}>Test Data</Text>
        <ActionButton
          testID="generate-checkins"
          label="Generate 30 Days of Check-Ins"
          onPress={generateCheckIns}
        />
        <ActionButton
          testID="generate-completions"
          label="Generate 30 Days of Habit Completions"
          onPress={generateHabitCompletions}
        />
        <ActionButton
          testID="clear-all-data"
          label="Clear All Data"
          onPress={clearAllData}
          destructive
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <ActionButton
          testID="fire-morning"
          label="Fire Morning Reminder"
          onPress={() => fireReminder('morning', '09:00')}
        />
        <ActionButton
          testID="fire-midday"
          label="Fire Mid-day Reminder"
          onPress={() => fireReminder('midday', '13:00')}
        />
        <ActionButton
          testID="fire-evening"
          label="Fire Evening Reminder"
          onPress={() => fireReminder('evening', '19:00')}
        />
      </Card>
    </ScrollView>
  );
}

function ActionButton({
  testID,
  label,
  onPress,
  destructive,
}: {
  testID: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.button, destructive && styles.destructiveButton]}
      onPress={onPress}>
      <Text style={[styles.buttonText, destructive && styles.destructiveText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: commonStyles.screenContainer,
  title: commonStyles.screenTitle,
  sectionTitle: {...commonStyles.sectionTitle, marginBottom: 12},
  statusBar: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  statusText: {fontSize: 14, color: colors.text, textAlign: 'center'},
  button: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  destructiveButton: {backgroundColor: colors.danger},
  buttonText: {color: '#fff', fontSize: 15, fontWeight: '600'},
  destructiveText: {color: '#fff'},
});

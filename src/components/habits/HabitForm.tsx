import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {Habit, HabitCategory} from '../../types';
import {uuid} from '../../utils/uuid';

const CATEGORIES: HabitCategory[] = [
  'sleep',
  'water',
  'exercise',
  'nutrition',
  'mindfulness',
  'custom',
];

const COLORS = [
  '#3498db',
  '#e74c3c',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
];

interface HabitFormProps {
  initial?: Habit;
  onSubmit: (habit: Habit) => void;
  onCancel: () => void;
}

export function HabitForm({initial, onSubmit, onCancel}: HabitFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<HabitCategory>(
    initial?.category ?? 'custom',
  );
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>(
    initial?.frequency ?? 'daily',
  );
  const [targetCount, setTargetCount] = useState(
    String(initial?.targetCount ?? 1),
  );
  const [unit, setUnit] = useState(initial?.unit ?? '');
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [reminderTime, setReminderTime] = useState(initial?.reminderTime ?? '');

  const handleSubmit = () => {
    if (!name.trim()) {
      return;
    }
    onSubmit({
      id: initial?.id ?? uuid(),
      name: name.trim(),
      category,
      frequency,
      targetCount: Math.max(1, parseInt(targetCount, 10) || 1),
      unit: unit.trim() || undefined,
      color,
      icon: category,
      reminderTime: reminderTime || undefined,
      isActive: initial?.isActive ?? true,
      createdAt: initial?.createdAt ?? Date.now(),
    });
  };

  return (
    <ScrollView style={styles.container} testID="habit-form">
      <Text style={styles.label}>Name</Text>
      <TextInput
        testID="habit-name-input"
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g., Drink Water"
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.row}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.pill, category === cat && styles.pillSelected]}
            onPress={() => setCategory(cat)}>
            <Text
              style={[
                styles.pillText,
                category === cat && styles.pillTextSelected,
              ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Frequency</Text>
      <View style={styles.row}>
        {(['daily', 'weekly'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.pill, frequency === f && styles.pillSelected]}
            onPress={() => setFrequency(f)}>
            <Text
              style={[
                styles.pillText,
                frequency === f && styles.pillTextSelected,
              ]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Target Count</Text>
      <TextInput
        testID="habit-target-input"
        style={styles.input}
        value={targetCount}
        onChangeText={setTargetCount}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Unit (optional)</Text>
      <TextInput
        style={styles.input}
        value={unit}
        onChangeText={setUnit}
        placeholder="e.g., glasses, minutes"
      />

      <Text style={styles.label}>Color</Text>
      <View style={styles.row}>
        {COLORS.map(c => (
          <TouchableOpacity
            key={c}
            style={[
              styles.colorDot,
              {backgroundColor: c},
              color === c && styles.colorDotSelected,
            ]}
            onPress={() => setColor(c)}
          />
        ))}
      </View>

      <Text style={styles.label}>Reminder Time (HH:MM, optional)</Text>
      <TextInput
        style={styles.input}
        value={reminderTime}
        onChangeText={setReminderTime}
        placeholder="09:00"
      />

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="habit-submit"
          style={styles.submitBtn}
          onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>
            {initial ? 'Update' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  row: {flexDirection: 'row', flexWrap: 'wrap'},
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  pillSelected: {backgroundColor: '#4A90D9'},
  pillText: {fontSize: 13, color: '#555'},
  pillTextSelected: {color: '#fff', fontWeight: '600'},
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 8,
  },
  colorDotSelected: {borderWidth: 3, borderColor: '#333'},
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    marginBottom: 40,
  },
  cancelBtn: {paddingHorizontal: 20, paddingVertical: 12, marginRight: 12},
  cancelBtnText: {fontSize: 16, color: '#888'},
  submitBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4A90D9',
    borderRadius: 8,
  },
  submitBtnText: {fontSize: 16, color: '#fff', fontWeight: '600'},
});

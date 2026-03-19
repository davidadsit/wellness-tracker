import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import {colors} from '../../theme';

interface TagChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}

export function TagChip({label, selected, onPress, testID}: TagChipProps) {
  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{selected}}>
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.divider,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 14,
    color: colors.textSubtle,
  },
  labelSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});

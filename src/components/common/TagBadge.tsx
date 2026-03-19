import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';

interface TagBadgeProps {
  label: string;
  size?: 'small' | 'medium';
}

export function TagBadge({ label, size = 'small' }: TagBadgeProps) {
  return (
    <View style={[styles.badge, size === 'medium' && styles.badgeMedium]}>
      <Text style={[styles.text, size === 'medium' && styles.textMedium]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  badgeMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  text: {
    fontSize: 12,
    color: colors.primary,
  },
  textMedium: {
    fontSize: 13,
  },
});

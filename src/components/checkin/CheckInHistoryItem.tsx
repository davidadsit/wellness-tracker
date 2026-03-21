import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {CheckIn} from '../../types';
import {formatDisplayDate, formatDisplayTime} from '../../utils/dateUtils';
import {TagBadge} from '../common/TagBadge';
import {colors} from '../../theme';

interface CheckInHistoryItemProps {
  checkIn: CheckIn;
  tagLabels: Record<string, string>;
  compact?: boolean;
}

export function CheckInHistoryItem({
  checkIn,
  tagLabels,
  compact,
}: CheckInHistoryItemProps) {
  return (
    <View style={compact ? styles.compactContainer : styles.container}>
      {!compact && (
        <View style={styles.header}>
          <Text style={styles.date}>
            {formatDisplayDate(checkIn.timestamp)}
          </Text>
          <Text style={styles.time}>
            {formatDisplayTime(checkIn.timestamp)}
          </Text>
        </View>
      )}
      <View style={styles.tagsRow}>
        {checkIn.tagIds.map(tagId => (
          <TagBadge key={tagId} label={tagLabels[tagId] ?? tagId} />
        ))}
        {compact && (
          <Text style={styles.compactTime}>
            {formatDisplayTime(checkIn.timestamp)}
          </Text>
        )}
      </View>
      {checkIn.note ? <Text style={styles.note}>{checkIn.note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  compactContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  compactTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 'auto',
    alignSelf: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  note: {
    fontSize: 13,
    color: colors.textNote,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

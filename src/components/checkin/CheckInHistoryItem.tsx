import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {CheckIn} from '../../types';
import {formatDisplayDate, formatDisplayTime} from '../../utils/dateUtils';
import {TagBadge} from '../common/TagBadge';
import {colors} from '../../theme';

interface CheckInHistoryItemProps {
  checkIn: CheckIn;
  tagLabels: Record<string, string>;
}

export function CheckInHistoryItem({checkIn, tagLabels}: CheckInHistoryItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDisplayDate(checkIn.timestamp)}</Text>
        <Text style={styles.time}>{formatDisplayTime(checkIn.timestamp)}</Text>
      </View>
      <View style={styles.tagsRow}>
        {checkIn.tagIds.map(tagId => (
          <TagBadge key={tagId} label={tagLabels[tagId] ?? tagId} />
        ))}
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
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  note: {
    fontSize: 13,
    color: colors.textNote,
    marginTop: 6,
    fontStyle: 'italic',
  },
});

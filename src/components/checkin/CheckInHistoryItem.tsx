import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {CheckIn} from '../../types';
import {formatDisplayDate, formatDisplayTime} from '../../utils/dateUtils';

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
          <View key={tagId} style={styles.tagBadge}>
            <Text style={styles.tagText}>{tagLabels[tagId] ?? tagId}</Text>
          </View>
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
    color: '#333',
  },
  time: {
    fontSize: 12,
    color: '#888',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagBadge: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#4A90D9',
  },
  note: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
  },
});

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {TagFrequencyItem} from '../../utils/analytics';

interface TagFrequencyChartProps {
  data: TagFrequencyItem[];
  title?: string;
}

export function TagFrequencyChart({data, title}: TagFrequencyChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>No check-in data for this period</Text>
      </View>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {data.map(item => (
        <View key={item.tagId} style={styles.row}>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
          <View style={styles.barContainer}>
            <View
              style={[styles.bar, {width: `${(item.count / maxCount) * 100}%`}]}
            />
          </View>
          <Text style={styles.count}>
            {item.count} ({item.percentage}%)
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {marginVertical: 8},
  title: {fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12},
  row: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  label: {width: 100, fontSize: 13, color: '#555'},
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#4A90D9',
    borderRadius: 4,
  },
  count: {width: 70, fontSize: 12, color: '#888', textAlign: 'right'},
  empty: {fontSize: 14, color: '#888', textAlign: 'center', padding: 20},
});

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {TagTrend} from '../../utils/analytics';

interface InsightCardProps {
  trend: TagTrend;
}

const TREND_ICONS = {
  up: '\u2191',
  down: '\u2193',
  stable: '\u2192',
};

const TREND_COLORS = {
  up: '#e74c3c',
  down: '#2ecc71',
  stable: '#888',
};

export function InsightCard({trend}: InsightCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>{trend.label}</Text>
        <Text style={[styles.trendIcon, {color: TREND_COLORS[trend.trend]}]}>
          {TREND_ICONS[trend.trend]}
        </Text>
      </View>
      <View style={styles.periods}>
        {trend.periods.map(p => (
          <View key={p.periodLabel} style={styles.period}>
            <Text style={styles.periodLabel}>{p.periodLabel}</Text>
            <Text style={styles.periodCount}>{p.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginRight: 12,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {fontSize: 14, fontWeight: '600', color: '#333'},
  trendIcon: {fontSize: 18, fontWeight: '700'},
  periods: {flexDirection: 'row', justifyContent: 'space-between'},
  period: {alignItems: 'center'},
  periodLabel: {fontSize: 11, color: '#888'},
  periodCount: {fontSize: 16, fontWeight: '600', color: '#333', marginTop: 2},
});

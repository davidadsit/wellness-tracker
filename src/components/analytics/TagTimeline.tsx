import React, {useState} from 'react';
import {View, Text, StyleSheet, LayoutChangeEvent} from 'react-native';
import {LineChart} from 'react-native-gifted-charts';
import {colors} from '../../theme';

interface TagTimelineProps {
  tagLabel: string;
  data: Array<{date: string; count: number}>;
  color?: string;
  maxFrequency?: number;
}

const Y_AXIS_WIDTH = 30;

export function TagTimeline({tagLabel, data, color = colors.primary, maxFrequency}: TagTimelineProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  if (data.length === 0) {
    return null;
  }

  const chartData = data.map(item => ({
    value: item.count,
  }));

  const rawMax = maxFrequency ?? Math.max(...data.map(d => d.count), 1);
  const maxValue = Math.max(rawMax, 1);
  const noOfSections = Math.min(maxValue, 4);
  const stepValue = Math.max(1, Math.ceil(maxValue / noOfSections));
  const adjustedMax = stepValue * noOfSections;

  const chartWidth = containerWidth > 0 ? containerWidth - Y_AXIS_WIDTH : 0;
  const spacing = data.length > 1 && chartWidth > 0
    ? chartWidth / (data.length - 1)
    : 24;

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Text style={styles.title}>{tagLabel}</Text>
      {containerWidth > 0 && (
        <LineChart
          data={chartData}
          color={color}
          thickness={2}
          hideDataPoints
          curved
          areaChart
          startFillColor={color}
          startOpacity={0.2}
          endOpacity={0.05}
          yAxisOffset={-.5}
          maxValue={adjustedMax}
          noOfSections={noOfSections}
          stepValue={stepValue}
          hideYAxisText={true}
          formatYLabel={(val: string) => String(Math.round(Number(val)))}
          yAxisColor={colors.divider}
          xAxisColor={colors.divider}
          yAxisTextStyle={styles.axisText}
          xAxisLabelsHeight={0}
          yAxisTextNumberOfLines={1}
          height={150}
          width={chartWidth}
          spacing={spacing}
          initialSpacing={0}
          endSpacing={0}
          hideRules
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {marginVertical: 8},
  title: {fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12},
  axisText: {fontSize: 10, color: colors.textSecondary},
});

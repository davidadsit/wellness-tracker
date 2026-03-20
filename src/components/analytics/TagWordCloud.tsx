import React, {useState} from 'react';
import {View, Text, StyleSheet, LayoutChangeEvent} from 'react-native';
import WordCloud from 'rn-wordcloud';
import {TagFrequencyItem} from '../../utils/analytics';
import {colors} from '../../theme';

interface TagWordCloudProps {
  data: TagFrequencyItem[];
  symptomTagIds?: Set<string>;
}

const BLUE_SHADES = [
  '#1A5276',
  '#2874A6',
  '#4A90D9',
  '#6AAFE6',
  '#85C1E9',
];

const GREEN_SHADES = [
  '#1E8449',
  '#27AE60',
  '#58D68D',
];

export function TagWordCloud({data, symptomTagIds}: TagWordCloudProps) {
  const [width, setWidth] = useState(0);

  if (data.length === 0) {
    return null;
  }

  let blueIdx = 0;
  let greenIdx = 0;
  const words = data.map(item => {
    if (symptomTagIds?.has(item.tagId)) {
      return {
        text: item.label,
        value: item.count,
        color: GREEN_SHADES[greenIdx++ % GREEN_SHADES.length],
      };
    }
    return {
      text: item.label,
      value: item.count,
      color: BLUE_SHADES[blueIdx++ % BLUE_SHADES.length],
    };
  });

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Text style={styles.title}>Word Cloud</Text>
      {width > 0 && (
        <WordCloud
          options={{
            words,
            width,
            height: Math.round(width * 0.6),
            minFont: 12,
            maxFont: 36,
            fontOffset: 0,
            verticalEnabled: false,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {marginVertical: 8},
  title: {fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12},
});

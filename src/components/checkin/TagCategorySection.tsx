import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tag } from '../../types';
import { TagChip } from './TagChip';
import { AddTagInline } from './AddTagInline';
import { colors } from '../../theme';

interface TagCategorySectionProps {
  categoryName: string;
  tags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onAddTag?: (label: string) => void;
  testID?: string;
}

export function TagCategorySection({
  categoryName,
  tags,
  selectedTagIds,
  onToggleTag,
  onAddTag,
  testID,
}: TagCategorySectionProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.categoryName}>{categoryName}</Text>
      <View style={styles.tagsWrap}>
        {tags.map(tag => (
          <TagChip
            key={tag.id}
            testID={`tag-${tag.id}`}
            label={tag.label}
            selected={selectedTagIds.includes(tag.id)}
            onPress={() => onToggleTag(tag.id)}
          />
        ))}
        {onAddTag && (
          <AddTagInline
            testID={`add-tag-${testID}`}
            onAdd={onAddTag}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

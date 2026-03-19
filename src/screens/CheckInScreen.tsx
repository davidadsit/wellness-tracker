import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCheckIn } from '../hooks/useCheckIn';
import { useTags } from '../hooks/useTags';
import { TagCategorySection } from '../components/checkin/TagCategorySection';
import { colors, commonStyles } from '../theme';

export function CheckInScreen() {
  const { submit } = useCheckIn();
  const { categories, tagsByCategory, loadTags, visibleCategories, addTag } = useTags();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [note, setNote] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadTags();
    }, [loadTags]),
  );

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleAddTag = async (categoryId: string, label: string) => {
    try {
      const newTag = await addTag(categoryId, label);
      setSelectedTagIds(prev => [...prev, newTag.id]);
    } catch {
      Alert.alert('Error', 'A tag with that name already exists in this category.');
    }
  };

  const handleSubmit = async () => {
    if (selectedTagIds.length === 0) {
      Alert.alert('Select Tags', 'Please select at least one tag for your check-in.');
      return;
    }

    await submit({ tagIds: selectedTagIds, note: note.trim() || undefined });
    setSelectedTagIds([]);
    setNote('');
    Alert.alert('Saved', 'Check-in recorded!');
  };

  const visible = visibleCategories(selectedTagIds);

  return (
    <ScrollView style={styles.container} testID="checkin-screen">
      <Text style={styles.title}>How are you feeling?</Text>
      <Text style={styles.subtitle}>Select all that apply</Text>

      <TouchableOpacity
        testID="checkin-submit"
        style={styles.submitButton}
        onPress={handleSubmit}>
        <Text style={styles.submitText}>Record Check-In</Text>
      </TouchableOpacity>

      {visible.map(category => {
        const categoryTags = tagsByCategory.get(category.id) ?? [];
        return (
          <TagCategorySection
            key={category.id}
            testID={`category-${category.id}`}
            categoryName={category.name}
            tags={categoryTags}
            selectedTagIds={selectedTagIds}
            onToggleTag={toggleTag}
            onAddTag={label => handleAddTag(category.id, label)}
          />
        );
      })}

      <Text style={styles.noteLabel}>Note (optional)</Text>
      <TextInput
        testID="checkin-note"
        style={[styles.noteInput, { height: 60 }]}
        value={note}
        onChangeText={setNote}
        placeholder="Anything else you want to capture..."
        multiline
        scrollEnabled
      />
      <Text>{/* Spacer to ensure content isn't hidden behind keyboard */}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: commonStyles.screenContainerPadded,
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  noteLabel: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 4, marginBottom: 8 },
  noteInput: {
    ...commonStyles.textInput,
    padding: 12,
    textAlignVertical: 'top',
    marginBottom: 16
  },
  submitButton: {
    ...commonStyles.primaryButton,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 12,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

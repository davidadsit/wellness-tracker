import React, {useState, useCallback} from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useCheckIn} from '../hooks/useCheckIn';
import {useTags} from '../hooks/useTags';
import {TagCategorySection} from '../components/checkin/TagCategorySection';

export function CheckInScreen() {
  const {submit} = useCheckIn();
  const {categories, tagsByCategory, loadTags, visibleCategories, addTag} = useTags();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [noteHeight, setNoteHeight] = useState(100);

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

    await submit({tagIds: selectedTagIds, note: note.trim() || undefined});
    setSelectedTagIds([]);
    setNote('');
    Alert.alert('Saved', 'Check-in recorded!');
  };

  const visible = visibleCategories(selectedTagIds);

  return (
    <ScrollView style={styles.container} testID="checkin-screen">
      <Text style={styles.title}>How are you feeling?</Text>
      <Text style={styles.subtitle}>Select all that apply</Text>

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
        style={[styles.noteInput, {height: Math.max(100, noteHeight)}]}
        value={note}
        onChangeText={setNote}
        onContentSizeChange={e =>
          setNoteHeight(e.nativeEvent.contentSize.height + 24)
        }
        placeholder="Anything else you want to capture..."
        multiline
        scrollEnabled={false}
      />

      <TouchableOpacity
        testID="checkin-submit"
        style={styles.submitButton}
        onPress={handleSubmit}>
        <Text style={styles.submitText}>Save Check-In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f8f9fa', padding: 16},
  title: {fontSize: 24, fontWeight: '700', color: '#333', marginBottom: 4},
  subtitle: {fontSize: 14, color: '#888', marginBottom: 20},
  noteLabel: {fontSize: 14, fontWeight: '600', color: '#333', marginTop: 8, marginBottom: 6},
  noteInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 12, fontSize: 15, textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#4A90D9', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 20, marginBottom: 40,
  },
  submitText: {color: '#fff', fontWeight: '700', fontSize: 16},
});

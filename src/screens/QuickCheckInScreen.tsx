import React, {useState, useCallback} from 'react';
import {View, Text, TouchableOpacity, Alert, StyleSheet} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useCheckIn} from '../hooks/useCheckIn';
import {useTags} from '../hooks/useTags';
import {TagCategorySection} from '../components/checkin/TagCategorySection';

export function QuickCheckInScreen() {
  const navigation = useNavigation();
  const {submit} = useCheckIn();
  const {tagsByCategory, loadTags, visibleCategories} = useTags();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

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

  const handleSubmit = async () => {
    if (selectedTagIds.length === 0) {
      Alert.alert('Select Tags', 'Please select at least one tag.');
      return;
    }
    await submit({tagIds: selectedTagIds, source: 'notification'});
    navigation.goBack();
  };

  const visible = visibleCategories(selectedTagIds);

  return (
    <View style={styles.container} testID="quick-checkin-screen">
      <Text style={styles.title}>Quick Check-In</Text>

      {visible.map(category => (
        <TagCategorySection
          key={category.id}
          categoryName={category.name}
          tags={tagsByCategory.get(category.id) ?? []}
          selectedTagIds={selectedTagIds}
          onToggleTag={toggleTag}
        />
      ))}

      <TouchableOpacity
        testID="quick-checkin-submit"
        style={styles.submitButton}
        onPress={handleSubmit}>
        <Text style={styles.submitText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f8f9fa', padding: 16},
  title: {fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 16},
  submitButton: {
    backgroundColor: '#4A90D9', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 20,
  },
  submitText: {color: '#fff', fontWeight: '700', fontSize: 16},
});

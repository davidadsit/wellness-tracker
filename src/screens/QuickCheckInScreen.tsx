import React, {useCallback} from 'react';
import {View, Text, TouchableOpacity, Alert, StyleSheet} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useCheckIn} from '../hooks/useCheckIn';
import {useTags} from '../hooks/useTags';
import {useTagSelection} from '../hooks/useTagSelection';
import {TagCategorySection} from '../components/checkin/TagCategorySection';
import {colors, commonStyles} from '../theme';

export function QuickCheckInScreen() {
  const navigation = useNavigation();
  const {submit} = useCheckIn();
  const {tagsByCategory, loadTags, visibleCategories} = useTags();
  const {selectedTagIds, toggleTag} = useTagSelection();

  useFocusEffect(
    useCallback(() => {
      loadTags();
    }, [loadTags]),
  );

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
  container: commonStyles.screenContainerPadded,
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  submitButton: {
    ...commonStyles.primaryButton,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 20,
  },
  submitText: commonStyles.primaryButtonText,
});

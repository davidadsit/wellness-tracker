import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useTags} from '../hooks/useTags';

export function TagManagementScreen() {
  const {categories, tagsByCategory, loadTags, addTag, addCategory} = useTags();
  const [newCategoryName, setNewCategoryName] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadTags();
    }, [loadTags]),
  );

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      return;
    }
    try {
      const maxOrder = Math.max(0, ...categories.map(c => c.sortOrder));
      await addCategory(name, maxOrder + 1);
      setNewCategoryName('');
      loadTags();
    } catch {
      Alert.alert('Error', 'Could not create category.');
    }
  };

  const handleAddTag = async (categoryId: string) => {
    Alert.prompt?.('New Tag', 'Enter tag name:', async (label: string) => {
      if (label?.trim()) {
        try {
          await addTag(categoryId, label.trim());
          loadTags();
        } catch {
          Alert.alert('Error', 'A tag with that name already exists in this category.');
        }
      }
    });
  };

  return (
    <ScrollView style={styles.container} testID="tag-management-screen">
      <Text style={styles.title}>Manage Tags</Text>

      {categories.map(category => {
        const tags = tagsByCategory.get(category.id) ?? [];
        return (
          <View key={category.id} style={styles.categoryBlock}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>{category.name}</Text>
              {category.triggerTagId && (
                <Text style={styles.triggerBadge}>conditional</Text>
              )}
            </View>
            <View style={styles.tagsWrap}>
              {tags.map(tag => (
                <View
                  key={tag.id}
                  style={[
                    styles.tagBadge,
                    tag.isDefault && styles.tagBadgeDefault,
                  ]}>
                  <Text style={styles.tagText}>{tag.label}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={() => handleAddTag(category.id)}>
              <Text style={styles.addTagText}>+ Add Tag</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={styles.newCategorySection}>
        <Text style={styles.sectionTitle}>New Category</Text>
        <View style={styles.newCategoryRow}>
          <TextInput
            testID="new-category-input"
            style={styles.input}
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            placeholder="Category name"
          />
          <TouchableOpacity
            testID="add-category-button"
            style={styles.addButton}
            onPress={handleAddCategory}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f8f9fa', padding: 16},
  title: {fontSize: 24, fontWeight: '700', color: '#333', marginBottom: 16},
  categoryBlock: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 12, shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  categoryHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  categoryName: {fontSize: 16, fontWeight: '600', color: '#333', flex: 1},
  triggerBadge: {
    fontSize: 11, color: '#f39c12', backgroundColor: '#FEF3E2',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  tagsWrap: {flexDirection: 'row', flexWrap: 'wrap'},
  tagBadge: {
    backgroundColor: '#E8F0FE', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, marginRight: 8, marginBottom: 8,
  },
  tagBadgeDefault: {borderWidth: 1, borderColor: '#B8D4F0'},
  tagText: {fontSize: 13, color: '#4A90D9'},
  addTagButton: {marginTop: 4},
  addTagText: {fontSize: 13, color: '#4A90D9', fontWeight: '600'},
  newCategorySection: {marginTop: 8, marginBottom: 40},
  sectionTitle: {fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8},
  newCategoryRow: {flexDirection: 'row', alignItems: 'center'},
  input: {
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: '#fff',
  },
  addButton: {
    marginLeft: 8, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#4A90D9', borderRadius: 8,
  },
  addButtonText: {color: '#fff', fontWeight: '600', fontSize: 14},
});

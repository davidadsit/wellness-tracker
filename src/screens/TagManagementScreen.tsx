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
  const {categories, tagsByCategory, loadTags, addTag, addCategory, editTag, removeTag} = useTags();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [addingToCategoryId, setAddingToCategoryId] = useState<string | null>(null);
  const [newTagLabel, setNewTagLabel] = useState('');

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

  const handleStartAddTag = (categoryId: string) => {
    setAddingToCategoryId(categoryId);
    setNewTagLabel('');
  };

  const handleSubmitNewTag = async () => {
    if (!addingToCategoryId) {
      return;
    }
    const label = newTagLabel.trim();
    if (!label) {
      setAddingToCategoryId(null);
      return;
    }
    try {
      await addTag(addingToCategoryId, label);
      setAddingToCategoryId(null);
      setNewTagLabel('');
      loadTags();
    } catch {
      Alert.alert('Error', 'A tag with that name already exists in this category.');
    }
  };

  const handleCancelAddTag = () => {
    setAddingToCategoryId(null);
    setNewTagLabel('');
  };

  const handleStartEdit = (tagId: string, currentLabel: string) => {
    setEditingTagId(tagId);
    setEditingLabel(currentLabel);
  };

  const handleSaveEdit = async () => {
    if (!editingTagId) {
      return;
    }
    const label = editingLabel.trim();
    if (!label) {
      setEditingTagId(null);
      return;
    }
    try {
      await editTag(editingTagId, label);
      setEditingTagId(null);
      loadTags();
    } catch {
      Alert.alert('Error', 'Could not update tag.');
    }
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
  };

  const handleRemoveTag = (tagId: string) => {
    Alert.alert(
      'Remove Tag',
      'Remove tag? If used in check-ins, it will be archived.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeTag(tagId);
              loadTags();
            } catch {
              Alert.alert('Error', 'Could not remove tag.');
            }
          },
        },
      ],
    );
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
              {tags.map(tag => {
                if (editingTagId === tag.id) {
                  return (
                    <View key={tag.id} style={styles.editRow}>
                      <TextInput
                        testID={`edit-tag-input-${tag.id}`}
                        style={styles.editInput}
                        value={editingLabel}
                        onChangeText={setEditingLabel}
                        autoFocus
                        onSubmitEditing={handleSaveEdit}
                      />
                      <TouchableOpacity
                        testID={`save-tag-${tag.id}`}
                        onPress={handleSaveEdit}
                        style={styles.editAction}>
                        <Text style={styles.saveText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID={`cancel-edit-${tag.id}`}
                        onPress={handleCancelEdit}
                        style={styles.editAction}>
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID={`delete-tag-${tag.id}`}
                        onPress={() => { handleCancelEdit(); handleRemoveTag(tag.id); }}
                        style={styles.editAction}>
                        <Text style={styles.deleteText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tagBadge,
                      tag.isDefault && styles.tagBadgeDefault,
                    ]}
                    onPress={!tag.isDefault ? () => handleStartEdit(tag.id, tag.label) : undefined}
                    onLongPress={!tag.isDefault ? () => handleRemoveTag(tag.id) : undefined}
                    activeOpacity={tag.isDefault ? 1 : 0.7}
                    testID={`tag-${tag.id}`}>
                    <Text style={styles.tagText}>{tag.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {addingToCategoryId === category.id ? (
              <View style={styles.addTagRow}>
                <TextInput
                  testID={`new-tag-input-${category.id}`}
                  style={styles.editInput}
                  value={newTagLabel}
                  onChangeText={setNewTagLabel}
                  placeholder="Tag name"
                  autoFocus
                  onSubmitEditing={handleSubmitNewTag}
                />
                <TouchableOpacity
                  testID={`submit-new-tag-${category.id}`}
                  onPress={handleSubmitNewTag}
                  style={styles.editAction}>
                  <Text style={styles.saveText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID={`cancel-new-tag-${category.id}`}
                  onPress={handleCancelAddTag}
                  style={styles.editAction}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={() => handleStartAddTag(category.id)}>
                <Text style={styles.addTagText}>+ Add Tag</Text>
              </TouchableOpacity>
            )}
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
  addTagRow: {flexDirection: 'row', alignItems: 'center', marginTop: 4},
  addTagButton: {marginTop: 4},
  addTagText: {fontSize: 13, color: '#4A90D9', fontWeight: '600'},
  editRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  editInput: {
    borderWidth: 1, borderColor: '#4A90D9', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, fontSize: 13,
    minWidth: 100, backgroundColor: '#fff',
  },
  editAction: {marginLeft: 8},
  saveText: {fontSize: 13, color: '#4A90D9', fontWeight: '600'},
  cancelText: {fontSize: 13, color: '#999'},
  deleteText: {fontSize: 13, color: '#e74c3c', fontWeight: '600'},
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

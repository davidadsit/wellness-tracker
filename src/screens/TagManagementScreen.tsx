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
import {Card} from '../components/common/Card';
import {colors, commonStyles} from '../theme';

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
          <Card key={category.id} style={styles.categoryBlock}>
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
          </Card>
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
            onSubmitEditing={handleAddCategory}
            returnKeyType="done"
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
  container: commonStyles.screenContainerPadded,
  title: {fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 16},
  categoryBlock: {marginHorizontal: 0, marginVertical: 4},
  categoryHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  categoryName: {fontSize: 16, fontWeight: '600', color: colors.text, flex: 1},
  triggerBadge: {
    fontSize: 11, color: colors.warning, backgroundColor: colors.warningBackground,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  tagsWrap: {flexDirection: 'row', flexWrap: 'wrap'},
  tagBadge: {
    backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, marginRight: 8, marginBottom: 8,
  },
  tagBadgeDefault: {borderWidth: 1, borderColor: colors.primaryBorder},
  tagText: {fontSize: 13, color: colors.primary},
  addTagRow: {flexDirection: 'row', alignItems: 'center', marginTop: 4},
  addTagButton: {marginTop: 4},
  addTagText: {fontSize: 13, color: colors.primary, fontWeight: '600'},
  editRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  editInput: {
    borderWidth: 1, borderColor: colors.primary, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, fontSize: 13,
    minWidth: 100, backgroundColor: colors.surface,
  },
  editAction: {marginLeft: 8},
  saveText: {fontSize: 13, color: colors.primary, fontWeight: '600'},
  cancelText: {fontSize: 13, color: colors.textMuted},
  deleteText: {fontSize: 13, color: colors.danger, fontWeight: '600'},
  newCategorySection: {marginTop: 8, marginBottom: 40},
  sectionTitle: commonStyles.sectionTitle,
  newCategoryRow: {flexDirection: 'row', alignItems: 'center'},
  input: {...commonStyles.textInput, flex: 1},
  addButton: {
    marginLeft: 8, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colors.primary, borderRadius: 8,
  },
  addButtonText: {color: '#fff', fontWeight: '600', fontSize: 14},
});

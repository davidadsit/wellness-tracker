import React, {useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import {colors, commonStyles} from '../../theme';

interface AddTagInlineProps {
  onAdd: (label: string) => void;
  testID?: string;
}

export function AddTagInline({onAdd, testID}: AddTagInlineProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed) {
      onAdd(trimmed);
      setText('');
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <TouchableOpacity
        testID={testID}
        style={styles.addButton}
        onPress={() => setIsEditing(true)}
        accessibilityRole="button"
        accessibilityLabel="Add new tag">
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.editingContainer}>
      <View style={styles.inputRow}>
        <TextInput
          testID={`${testID}-input`}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="New tag..."
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            testID={`${testID}-confirm`}
            style={styles.confirmButton}
            onPress={handleSubmit}>
            <Text style={styles.confirmText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID={`${testID}-cancel`}
            style={styles.cancelButton}
            onPress={() => {
              setText('');
              setIsEditing(false);
            }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  addButtonText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  editingContainer: {
    width: '100%',
  },
  inputRow: {
    width: '100%',
    marginBottom: 8,
  },
  input: {
    ...commonStyles.textInput,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

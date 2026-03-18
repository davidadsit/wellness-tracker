import React, {useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

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
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  addButtonActive: {
    borderStyle: 'solid',
    backgroundColor: '#e8e8e8',
  },
  addButtonText: {
    fontSize: 18,
    color: '#888',
  },
  editingContainer: {
    width: '100%',
  },
  inputRow: {
    width: '100%',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4A90D9',
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
    color: '#888',
    fontSize: 14,
  },
});

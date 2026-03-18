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
    <View style={styles.inputContainer}>
      <TextInput
        testID={`${testID}-input`}
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="New tag..."
        autoFocus
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
      />
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
  addButtonText: {
    fontSize: 18,
    color: '#888',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
  },
  confirmButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4A90D9',
    borderRadius: 8,
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    marginLeft: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cancelText: {
    color: '#888',
    fontSize: 14,
  },
});

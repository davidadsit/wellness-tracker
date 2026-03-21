import {useState, useCallback} from 'react';

export function useTagSelection() {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId],
    );
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedTagIds([]);
  }, []);

  return {selectedTagIds, toggleTag, resetSelection};
}

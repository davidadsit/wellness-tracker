import {useCallback, useMemo} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch} from '../store';
import {fetchAllTags, createTag, createCategory, updateTag, removeTag} from '../store/tagsSlice';
import {Tag, TagCategory} from '../types';

export function useTags() {
  const dispatch = useDispatch<AppDispatch>();
  const {categories, tags, loading} = useSelector(
    (state: RootState) => state.tags,
  );

  const loadTags = useCallback(() => {
    dispatch(fetchAllTags());
  }, [dispatch]);

  const tagsByCategory = useMemo(() => {
    const map = new Map<string, Tag[]>();
    for (const tag of tags) {
      const list = map.get(tag.categoryId) ?? [];
      list.push(tag);
      map.set(tag.categoryId, list);
    }
    return map;
  }, [tags]);

  const tagLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const tag of tags) {
      map[tag.id] = tag.label;
    }
    return map;
  }, [tags]);

  const visibleCategories = useCallback(
    (selectedTagIds: string[]): TagCategory[] => {
      return categories.filter(cat => {
        if (!cat.triggerTagId) {
          return true;
        }
        return selectedTagIds.includes(cat.triggerTagId);
      });
    },
    [categories],
  );

  const addTag = useCallback(
    (categoryId: string, label: string) => {
      return dispatch(createTag({categoryId, label})).unwrap();
    },
    [dispatch],
  );

  const addCategory = useCallback(
    (name: string, sortOrder: number) => {
      return dispatch(createCategory({name, sortOrder})).unwrap();
    },
    [dispatch],
  );

  const editTag = useCallback(
    (id: string, label: string) => {
      return dispatch(updateTag({id, label})).unwrap();
    },
    [dispatch],
  );

  const deleteTag = useCallback(
    (id: string) => {
      return dispatch(removeTag(id)).unwrap();
    },
    [dispatch],
  );

  return {
    categories,
    tags,
    tagsByCategory,
    tagLabels,
    loading,
    loadTags,
    visibleCategories,
    addTag,
    addCategory,
    editTag,
    removeTag: deleteTag,
  };
}

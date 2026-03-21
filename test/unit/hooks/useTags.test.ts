import React from 'react';
import {renderHook, act} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {makeStore} from '../../helpers/renderWithStore';
import {useTags} from '../../../src/hooks/useTags';
import {TagCategory, Tag} from '../../../src/types';

jest.mock('../../../src/services/database/tagRepository', () => ({
  tagRepository: {
    getAllCategories: jest.fn().mockReturnValue([]),
    getAllTags: jest.fn().mockReturnValue([]),
    getAllTagsIncludingArchived: jest.fn().mockReturnValue([]),
    createTag: jest.fn(),
    createCategory: jest.fn(),
    updateTag: jest.fn(),
    removeTag: jest.fn(),
  },
}));

const categories: TagCategory[] = [
  {id: 'cat-mental', name: 'Mental Health', sortOrder: 1, isDefault: true, createdAt: 0},
  {id: 'cat-physical', name: 'Physical Health', sortOrder: 2, isDefault: true, createdAt: 0},
  {id: 'cat-symptoms', name: 'Symptoms', sortOrder: 4, isDefault: true, triggerTagId: 'tag-ill', createdAt: 0},
];

const tags: Tag[] = [
  {id: 'tag-calm', categoryId: 'cat-mental', label: 'Calm', isDefault: true, isArchived: false, createdAt: 0},
  {id: 'tag-anxious', categoryId: 'cat-mental', label: 'Anxious', isDefault: true, isArchived: false, createdAt: 0},
  {id: 'tag-ill', categoryId: 'cat-physical', label: 'Ill', isDefault: true, isArchived: false, createdAt: 0},
  {id: 'tag-headache', categoryId: 'cat-symptoms', label: 'Headache', isDefault: true, isArchived: false, createdAt: 0},
];

function renderWithTags(preloadedTags?: {categories: TagCategory[]; tags: Tag[]}) {
  const state = preloadedTags
    ? {tags: {...preloadedTags, loading: false}}
    : undefined;
  const store = makeStore(state);
  const wrapper = ({children}: {children: React.ReactNode}) =>
    React.createElement(Provider, {store}, children);
  return renderHook(() => useTags(), {wrapper});
}

describe('useTags', () => {
  describe('tagsByCategory', () => {
    it('groups tags by their categoryId', () => {
      const {result} = renderWithTags({categories, tags});
      const grouped = result.current.tagsByCategory;

      expect(grouped.get('cat-mental')).toHaveLength(2);
      expect(grouped.get('cat-physical')).toHaveLength(1);
      expect(grouped.get('cat-symptoms')).toHaveLength(1);
    });

    it('returns empty map when no tags', () => {
      const {result} = renderWithTags({categories, tags: []});
      expect(result.current.tagsByCategory.size).toBe(0);
    });
  });

  describe('tagLabels', () => {
    it('maps tag ids to labels', () => {
      const {result} = renderWithTags({categories, tags});
      expect(result.current.tagLabels).toEqual({
        'tag-calm': 'Calm',
        'tag-anxious': 'Anxious',
        'tag-ill': 'Ill',
        'tag-headache': 'Headache',
      });
    });

    it('returns empty object when no tags', () => {
      const {result} = renderWithTags({categories, tags: []});
      expect(result.current.tagLabels).toEqual({});
    });
  });

  describe('visibleCategories', () => {
    it('returns categories without triggerTagId regardless of selection', () => {
      const {result} = renderWithTags({categories, tags});
      const visible = result.current.visibleCategories([]);
      const names = visible.map(c => c.name);

      expect(names).toContain('Mental Health');
      expect(names).toContain('Physical Health');
    });

    it('hides triggered category when trigger tag is not selected', () => {
      const {result} = renderWithTags({categories, tags});
      const visible = result.current.visibleCategories([]);

      expect(visible.find(c => c.name === 'Symptoms')).toBeUndefined();
    });

    it('shows triggered category when trigger tag is selected', () => {
      const {result} = renderWithTags({categories, tags});
      const visible = result.current.visibleCategories(['tag-ill']);

      expect(visible.find(c => c.name === 'Symptoms')).toBeDefined();
    });
  });
});

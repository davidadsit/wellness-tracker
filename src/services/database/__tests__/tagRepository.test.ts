import {tagRepository} from '../tagRepository';
import {resetDatabase} from '../database';
import {resetUuidCounter} from '../../../__mocks__/uuid';

beforeEach(() => {
  resetDatabase();
  resetUuidCounter();
});

describe('tagRepository', () => {
  describe('seed data', () => {
    it('seeds 4 default categories on first access', () => {
      const categories = tagRepository.getAllCategories();
      expect(categories).toHaveLength(4);
      expect(categories.map(c => c.name)).toEqual([
        'Mental Health',
        'Physical Health',
        'Emotional Health',
        'Symptoms',
      ]);
    });

    it('marks seed categories as default', () => {
      const categories = tagRepository.getAllCategories();
      expect(categories.every(c => c.isDefault)).toBe(true);
    });

    it('sets triggerTagId on Symptoms category', () => {
      const categories = tagRepository.getAllCategories();
      const symptoms = categories.find(c => c.name === 'Symptoms');
      expect(symptoms?.triggerTagId).toBe('tag-ill');
    });

    it('seeds Mental Health tags', () => {
      const tags = tagRepository.getTagsByCategory('cat-mental');
      expect(tags.length).toBe(7);
      expect(tags.map(t => t.label)).toContain('Focused');
      expect(tags.map(t => t.label)).toContain('Anxious');
    });

    it('seeds Physical Health tags including Ill', () => {
      const tags = tagRepository.getTagsByCategory('cat-physical');
      expect(tags.map(t => t.label)).toContain('Ill');
      expect(tags.map(t => t.label)).toContain('Energized');
    });

    it('seeds Symptoms tags', () => {
      const tags = tagRepository.getTagsByCategory('cat-symptoms');
      expect(tags.length).toBe(9);
      expect(tags.map(t => t.label)).toContain('Headache');
      expect(tags.map(t => t.label)).toContain('Fever');
    });

    it('seeds Emotional Health tags', () => {
      const tags = tagRepository.getTagsByCategory('cat-emotional');
      expect(tags.length).toBe(8);
      expect(tags.map(t => t.label)).toContain('Happy');
      expect(tags.map(t => t.label)).toContain('Stressed');
    });

    it('does not re-seed on second access', () => {
      tagRepository.getAllCategories();
      const categories = tagRepository.getAllCategories();
      expect(categories).toHaveLength(4);
    });
  });

  describe('getAllTags', () => {
    it('returns all tags across categories', () => {
      const tags = tagRepository.getAllTags();
      expect(tags.length).toBe(7 + 8 + 8 + 9); // mental + physical + emotional + symptoms
    });
  });

  describe('getTagById', () => {
    it('returns a tag by id', () => {
      const tag = tagRepository.getTagById('tag-focused');
      expect(tag).toBeDefined();
      expect(tag?.label).toBe('Focused');
      expect(tag?.categoryId).toBe('cat-mental');
    });

    it('returns undefined for unknown id', () => {
      expect(tagRepository.getTagById('nonexistent')).toBeUndefined();
    });
  });

  describe('getCategoryById', () => {
    it('returns a category by id', () => {
      const cat = tagRepository.getCategoryById('cat-physical');
      expect(cat).toBeDefined();
      expect(cat?.name).toBe('Physical Health');
    });

    it('returns undefined for unknown id', () => {
      expect(tagRepository.getCategoryById('nonexistent')).toBeUndefined();
    });
  });

  describe('createCategory', () => {
    it('creates a custom category', () => {
      const cat = tagRepository.createCategory('Social', 5);
      expect(cat.name).toBe('Social');
      expect(cat.sortOrder).toBe(5);
      expect(cat.isDefault).toBe(false);
      expect(cat.id).toBeDefined();

      const all = tagRepository.getAllCategories();
      expect(all).toHaveLength(5);
    });
  });

  describe('updateCategory', () => {
    it('updates a category name and sort order', () => {
      const cat = tagRepository.createCategory('Social', 5);
      tagRepository.updateCategory(cat.id, 'Social Life', 10);

      const updated = tagRepository.getCategoryById(cat.id);
      expect(updated?.name).toBe('Social Life');
      expect(updated?.sortOrder).toBe(10);
    });
  });

  describe('deleteCategory', () => {
    it('deletes a custom category and its tags', () => {
      const cat = tagRepository.createCategory('Social', 5);
      tagRepository.createTag(cat.id, 'Friendly');
      tagRepository.deleteCategory(cat.id);

      expect(tagRepository.getCategoryById(cat.id)).toBeUndefined();
      expect(tagRepository.getTagsByCategory(cat.id)).toHaveLength(0);
    });

    it('does not delete default categories', () => {
      tagRepository.deleteCategory('cat-mental');
      expect(tagRepository.getCategoryById('cat-mental')).toBeDefined();
    });
  });

  describe('createTag', () => {
    it('creates a custom tag in a category', () => {
      const tag = tagRepository.createTag('cat-mental', 'Motivated');
      expect(tag.label).toBe('Motivated');
      expect(tag.categoryId).toBe('cat-mental');
      expect(tag.isDefault).toBe(false);

      const tags = tagRepository.getTagsByCategory('cat-mental');
      expect(tags.find(t => t.label === 'Motivated')).toBeDefined();
    });

    it('enforces unique label within category', () => {
      expect(() => {
        tagRepository.createTag('cat-mental', 'Focused');
      }).toThrow();
    });

    it('allows same label in different categories', () => {
      const tag = tagRepository.createTag('cat-emotional', 'Focused');
      expect(tag.label).toBe('Focused');
    });
  });

  describe('updateTag', () => {
    it('updates a tag label', () => {
      const tag = tagRepository.createTag('cat-mental', 'Pumped');
      tagRepository.updateTag(tag.id, 'Super Pumped');
      const updated = tagRepository.getTagById(tag.id);
      expect(updated?.label).toBe('Super Pumped');
    });
  });

  describe('deleteTag', () => {
    it('deletes a custom tag', () => {
      const tag = tagRepository.createTag('cat-mental', 'Pumped');
      tagRepository.deleteTag(tag.id);
      expect(tagRepository.getTagById(tag.id)).toBeUndefined();
    });

    it('does not delete default tags', () => {
      tagRepository.deleteTag('tag-focused');
      expect(tagRepository.getTagById('tag-focused')).toBeDefined();
    });
  });

  describe('setCategoryTrigger', () => {
    it('sets a trigger tag on a category', () => {
      const cat = tagRepository.createCategory('Custom', 5);
      const tag = tagRepository.createTag('cat-physical', 'Injured');
      tagRepository.setCategoryTrigger(cat.id, tag.id);

      const updated = tagRepository.getCategoryById(cat.id);
      expect(updated?.triggerTagId).toBe(tag.id);
    });

    it('clears a trigger tag', () => {
      tagRepository.setCategoryTrigger('cat-symptoms', null);
      const updated = tagRepository.getCategoryById('cat-symptoms');
      expect(updated?.triggerTagId).toBeUndefined();
    });
  });
});

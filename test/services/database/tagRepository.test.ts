import {tagRepository} from '../../../src/services/database/tagRepository';
import {resetDatabase, initializeDatabase, getDatabase} from '../../../src/services/database/database';
beforeEach(async () => {
  resetDatabase();
  await initializeDatabase();
});

describe('tagRepository', () => {
  describe('seed data', () => {
    it('seeds 4 default categories on first access', async () => {
      const categories = await tagRepository.getAllCategories();
      expect(categories).toHaveLength(4);
      expect(categories.map(c => c.name)).toEqual([
        'Mental Health',
        'Physical Health',
        'Symptoms',
        'Emotional Health',
      ]);
    });

    it('marks seed categories as default', async () => {
      const categories = await tagRepository.getAllCategories();
      expect(categories.every(c => c.isDefault)).toBe(true);
    });

    it('sets triggerTagId on Symptoms category', async () => {
      const categories = await tagRepository.getAllCategories();
      const symptoms = categories.find(c => c.name === 'Symptoms');
      expect(symptoms?.triggerTagId).toBe('tag-ill');
    });

    it('seeds Mental Health tags', async () => {
      const tags = await tagRepository.getTagsByCategory('cat-mental');
      expect(tags.length).toBe(7);
      expect(tags.map(t => t.label)).toContain('Focused');
      expect(tags.map(t => t.label)).toContain('Anxious');
    });

    it('seeds Physical Health tags including Sick', async () => {
      const tags = await tagRepository.getTagsByCategory('cat-physical');
      expect(tags.map(t => t.label)).toContain('Sick');
      expect(tags.map(t => t.label)).toContain('Energized');
    });

    it('seeds Symptoms tags', async () => {
      const tags = await tagRepository.getTagsByCategory('cat-symptoms');
      expect(tags.length).toBe(9);
      expect(tags.map(t => t.label)).toContain('Headache');
      expect(tags.map(t => t.label)).toContain('Fever');
    });

    it('seeds Emotional Health tags', async () => {
      const tags = await tagRepository.getTagsByCategory('cat-emotional');
      expect(tags.length).toBe(8);
      expect(tags.map(t => t.label)).toContain('Happy');
      expect(tags.map(t => t.label)).toContain('Stressed');
    });

    it('does not re-seed on second access', async () => {
      await tagRepository.getAllCategories();
      const categories = await tagRepository.getAllCategories();
      expect(categories).toHaveLength(4);
    });
  });

  describe('getAllTags', () => {
    it('returns all tags across categories', async () => {
      const tags = await tagRepository.getAllTags();
      expect(tags.length).toBe(7 + 8 + 8 + 9); // mental + physical + emotional + symptoms
    });

    it('returns tags with isArchived false', async () => {
      const tags = await tagRepository.getAllTags();
      expect(tags.every(t => t.isArchived === false)).toBe(true);
    });
  });

  describe('getTagById', () => {
    it('returns a tag by id', async () => {
      const tag = await tagRepository.getTagById('tag-focused');
      expect(tag).toBeDefined();
      expect(tag?.label).toBe('Focused');
      expect(tag?.categoryId).toBe('cat-mental');
      expect(tag?.isArchived).toBe(false);
    });

    it('returns undefined for unknown id', async () => {
      expect(await tagRepository.getTagById('nonexistent')).toBeUndefined();
    });
  });

  describe('getCategoryById', () => {
    it('returns a category by id', async () => {
      const cat = await tagRepository.getCategoryById('cat-physical');
      expect(cat).toBeDefined();
      expect(cat?.name).toBe('Physical Health');
    });

    it('returns undefined for unknown id', async () => {
      expect(await tagRepository.getCategoryById('nonexistent')).toBeUndefined();
    });
  });

  describe('createCategory', () => {
    it('creates a custom category', async () => {
      const cat = await tagRepository.createCategory('Social', 5);
      expect(cat.name).toBe('Social');
      expect(cat.sortOrder).toBe(5);
      expect(cat.isDefault).toBe(false);
      expect(cat.id).toBeDefined();

      const all = await tagRepository.getAllCategories();
      expect(all).toHaveLength(5);
    });
  });

  describe('updateCategory', () => {
    it('updates a category name and sort order', async () => {
      const cat = await tagRepository.createCategory('Social', 5);
      await tagRepository.updateCategory(cat.id, 'Social Life', 10);

      const updated = await tagRepository.getCategoryById(cat.id);
      expect(updated?.name).toBe('Social Life');
      expect(updated?.sortOrder).toBe(10);
    });
  });

  describe('deleteCategory', () => {
    it('deletes a custom category and its tags', async () => {
      const cat = await tagRepository.createCategory('Social', 5);
      await tagRepository.createTag(cat.id, 'Friendly');
      await tagRepository.deleteCategory(cat.id);

      expect(await tagRepository.getCategoryById(cat.id)).toBeUndefined();
      expect(await tagRepository.getTagsByCategory(cat.id)).toHaveLength(0);
    });

    it('does not delete default categories', async () => {
      await tagRepository.deleteCategory('cat-mental');
      expect(await tagRepository.getCategoryById('cat-mental')).toBeDefined();
    });
  });

  describe('createTag', () => {
    it('creates a custom tag in a category', async () => {
      const tag = await tagRepository.createTag('cat-mental', 'Motivated');
      expect(tag.label).toBe('Motivated');
      expect(tag.categoryId).toBe('cat-mental');
      expect(tag.isDefault).toBe(false);
      expect(tag.isArchived).toBe(false);

      const tags = await tagRepository.getTagsByCategory('cat-mental');
      expect(tags.find(t => t.label === 'Motivated')).toBeDefined();
    });

    it('enforces unique label within category', async () => {
      await expect(
        tagRepository.createTag('cat-mental', 'Focused'),
      ).rejects.toThrow();
    });

    it('allows same label in different categories', async () => {
      const tag = await tagRepository.createTag('cat-emotional', 'Focused');
      expect(tag.label).toBe('Focused');
    });
  });

  describe('updateTag', () => {
    it('updates a tag label', async () => {
      const tag = await tagRepository.createTag('cat-mental', 'Pumped');
      await tagRepository.updateTag(tag.id, 'Super Pumped');
      const updated = await tagRepository.getTagById(tag.id);
      expect(updated?.label).toBe('Super Pumped');
    });
  });

  describe('deleteTag', () => {
    it('deletes a custom tag', async () => {
      const tag = await tagRepository.createTag('cat-mental', 'Pumped');
      await tagRepository.deleteTag(tag.id);
      expect(await tagRepository.getTagById(tag.id)).toBeUndefined();
    });

    it('does not delete default tags', async () => {
      await tagRepository.deleteTag('tag-focused');
      expect(await tagRepository.getTagById('tag-focused')).toBeDefined();
    });
  });

  describe('hasCheckInUsage', () => {
    it('returns false for unused tag', async () => {
      const tag = await tagRepository.createTag('cat-mental', 'Unused');
      expect(await tagRepository.hasCheckInUsage(tag.id)).toBe(false);
    });

    it('returns true for tag used in a check-in', async () => {
      const tag = await tagRepository.createTag('cat-mental', 'Used');
      const db = getDatabase();
      await db.execute(
        "INSERT INTO check_ins (id, timestamp, source) VALUES ('ci-1', ?, 'manual')",
        [Date.now()],
      );
      await db.execute(
        "INSERT INTO check_in_tags (check_in_id, tag_id) VALUES ('ci-1', ?)",
        [tag.id],
      );
      expect(await tagRepository.hasCheckInUsage(tag.id)).toBe(true);
    });
  });

  describe('archiveTag', () => {
    it('sets isArchived and hides from getAllTags', async () => {
      const tag = await tagRepository.createTag('cat-mental', 'ToArchive');
      await tagRepository.archiveTag(tag.id);

      const allTags = await tagRepository.getAllTags();
      expect(allTags.find(t => t.id === tag.id)).toBeUndefined();

      const byId = await tagRepository.getTagById(tag.id);
      expect(byId).toBeDefined();
      expect(byId?.isArchived).toBe(true);
    });

    it('does not archive default tags', async () => {
      await tagRepository.archiveTag('tag-focused');
      const tag = await tagRepository.getTagById('tag-focused');
      expect(tag?.isArchived).toBe(false);
    });
  });

  describe('removeTag', () => {
    it('archives tag when used in check-ins', async () => {
      const tag = await tagRepository.createTag('cat-mental', 'UsedTag');
      const db = getDatabase();
      await db.execute(
        "INSERT INTO check_ins (id, timestamp, source) VALUES ('ci-2', ?, 'manual')",
        [Date.now()],
      );
      await db.execute(
        "INSERT INTO check_in_tags (check_in_id, tag_id) VALUES ('ci-2', ?)",
        [tag.id],
      );

      await tagRepository.removeTag(tag.id);

      // Should be archived, not deleted
      const byId = await tagRepository.getTagById(tag.id);
      expect(byId).toBeDefined();
      expect(byId?.isArchived).toBe(true);

      // Should not appear in getAllTags
      const allTags = await tagRepository.getAllTags();
      expect(allTags.find(t => t.id === tag.id)).toBeUndefined();
    });

    it('hard-deletes tag when not used in check-ins', async () => {
      const tag = await tagRepository.createTag('cat-mental', 'UnusedTag');
      await tagRepository.removeTag(tag.id);

      expect(await tagRepository.getTagById(tag.id)).toBeUndefined();
    });
  });

  describe('setCategoryTrigger', () => {
    it('sets a trigger tag on a category', async () => {
      const cat = await tagRepository.createCategory('Custom', 5);
      const tag = await tagRepository.createTag('cat-physical', 'Injured');
      await tagRepository.setCategoryTrigger(cat.id, tag.id);

      const updated = await tagRepository.getCategoryById(cat.id);
      expect(updated?.triggerTagId).toBe(tag.id);
    });

    it('clears a trigger tag', async () => {
      await tagRepository.setCategoryTrigger('cat-symptoms', null);
      const updated = await tagRepository.getCategoryById('cat-symptoms');
      expect(updated?.triggerTagId).toBeUndefined();
    });
  });
});

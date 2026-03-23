import {tagRepository} from '../../../../src/services/database/tagRepository';
import {getDatabase} from '../../../../src/services/database/database';
import {setupTestDatabase} from '../../../helpers/database';
import {makeTag, makeCategory} from '../../../helpers/factories';
setupTestDatabase();

describe('tagRepository', () => {
  describe('seed data', () => {
    it('initializes with default categories and tags', async () => {
      const categories = await tagRepository.loadAllCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.every(c => c.isDefault)).toBe(true);
      expect(categories.every(c => c.name && c.id)).toBe(true);

      const tags = await tagRepository.loadAllTags();
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.every(t => t.isArchived === false)).toBe(true);
    });

    it('sets triggerTagId on Symptoms category', async () => {
      const categories = await tagRepository.loadAllCategories();
      const symptoms = categories.find(c => c.name === 'Symptoms');
      expect(symptoms?.triggerTagId).toBe('tag-ill');
    });

    it('does not re-seed on second access', async () => {
      const first = await tagRepository.loadAllCategories();
      const second = await tagRepository.loadAllCategories();
      expect(second).toHaveLength(first.length);
    });
  });

  describe('loadAllTags', () => {
    it('returns non-archived tags across all categories', async () => {
      const tags = await tagRepository.loadAllTags();
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.every(t => t.isArchived === false)).toBe(true);
    });
  });

  describe('loadAllTagsIncludingArchived', () => {
    it('includes archived tags that loadAllTags excludes', async () => {
      const tag = await tagRepository.saveTag(makeTag({label: 'ToArchive'}));
      await tagRepository.archiveTag(tag.id);

      const allTags = await tagRepository.loadAllTags();
      expect(allTags.find(t => t.id === tag.id)).toBeUndefined();

      const allIncludingArchived =
        await tagRepository.loadAllTagsIncludingArchived();
      const archived = allIncludingArchived.find(t => t.id === tag.id);
      expect(archived).toBeDefined();
      expect(archived?.isArchived).toBe(true);
    });
  });

  describe('loadTag', () => {
    it('returns a tag by id', async () => {
      const tag = await tagRepository.loadTag('tag-focused');
      expect(tag).toBeDefined();
      expect(tag?.label).toBe('Focused');
      expect(tag?.categoryId).toBe('cat-mental');
      expect(tag?.isArchived).toBe(false);
    });

    it('returns undefined for unknown id', async () => {
      expect(await tagRepository.loadTag('nonexistent')).toBeUndefined();
    });
  });

  describe('loadCategory', () => {
    it('returns a category by id', async () => {
      const cat = await tagRepository.loadCategory('cat-physical');
      expect(cat).toBeDefined();
      expect(cat?.name).toBe('Physical Health');
    });

    it('returns undefined for unknown id', async () => {
      expect(await tagRepository.loadCategory('nonexistent')).toBeUndefined();
    });
  });

  describe('saveCategory', () => {
    it('creates a custom category', async () => {
      const cat = await tagRepository.saveCategory(
        makeCategory({name: 'Social'}),
      );
      expect(cat.name).toBe('Social');
      expect(cat.sortOrder).toBe(5);
      expect(cat.isDefault).toBe(false);
      expect(cat.id).toBeDefined();

      const all = await tagRepository.loadAllCategories();
      expect(all).toHaveLength(5);
    });

    it('updates a category name and sort order', async () => {
      const cat = await tagRepository.saveCategory(
        makeCategory({name: 'Social'}),
      );
      await tagRepository.saveCategory({
        ...cat,
        name: 'Social Life',
        sortOrder: 10,
      });

      const updated = await tagRepository.loadCategory(cat.id);
      expect(updated?.name).toBe('Social Life');
      expect(updated?.sortOrder).toBe(10);
    });
  });

  describe('deleteCategory', () => {
    it('deletes a custom category and its tags', async () => {
      const cat = await tagRepository.saveCategory(
        makeCategory({name: 'Social'}),
      );
      await tagRepository.saveTag(
        makeTag({categoryId: cat.id, label: 'Friendly'}),
      );
      await tagRepository.deleteCategory(cat.id);

      expect(await tagRepository.loadCategory(cat.id)).toBeUndefined();
      expect(await tagRepository.loadTagsByCategory(cat.id)).toHaveLength(0);
    });

    it('does not delete default categories', async () => {
      await tagRepository.deleteCategory('cat-mental');
      expect(await tagRepository.loadCategory('cat-mental')).toBeDefined();
    });
  });

  describe('saveTag', () => {
    it('creates a custom tag in a category', async () => {
      const tag = await tagRepository.saveTag(makeTag({label: 'Motivated'}));
      expect(tag.label).toBe('Motivated');
      expect(tag.categoryId).toBe('cat-mental');
      expect(tag.isDefault).toBe(false);
      expect(tag.isArchived).toBe(false);

      const tags = await tagRepository.loadTagsByCategory('cat-mental');
      expect(tags.find(t => t.label === 'Motivated')).toBeDefined();
    });

    it('enforces unique label within category', async () => {
      await expect(
        tagRepository.saveTag(makeTag({label: 'Focused'})),
      ).rejects.toThrow();
    });

    it('allows same label in different categories', async () => {
      const tag = await tagRepository.saveTag(
        makeTag({categoryId: 'cat-emotional', label: 'Focused'}),
      );
      expect(tag.label).toBe('Focused');
    });

    it('updates a tag label', async () => {
      const tag = await tagRepository.saveTag(makeTag({label: 'Pumped'}));
      await tagRepository.saveTag({...tag, label: 'Super Pumped'});
      const updated = await tagRepository.loadTag(tag.id);
      expect(updated?.label).toBe('Super Pumped');
    });
  });

  describe('deleteTag', () => {
    it('deletes a custom tag', async () => {
      const tag = await tagRepository.saveTag(makeTag({label: 'Pumped'}));
      await tagRepository.deleteTag(tag.id);
      expect(await tagRepository.loadTag(tag.id)).toBeUndefined();
    });

    it('does not delete default tags', async () => {
      await tagRepository.deleteTag('tag-focused');
      expect(await tagRepository.loadTag('tag-focused')).toBeDefined();
    });
  });

  describe('hasCheckInUsage', () => {
    it('returns false for unused tag', async () => {
      const tag = await tagRepository.saveTag(makeTag({label: 'Unused'}));
      expect(await tagRepository.hasCheckInUsage(tag.id)).toBe(false);
    });

    it('returns true for tag used in a check-in', async () => {
      const tag = await tagRepository.saveTag(makeTag({label: 'Used'}));
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
    it('sets isArchived and hides from loadAllTags', async () => {
      const tag = await tagRepository.saveTag(makeTag({label: 'ToArchive'}));
      await tagRepository.archiveTag(tag.id);

      const allTags = await tagRepository.loadAllTags();
      expect(allTags.find(t => t.id === tag.id)).toBeUndefined();

      const byId = await tagRepository.loadTag(tag.id);
      expect(byId).toBeDefined();
      expect(byId?.isArchived).toBe(true);
    });

    it('does not archive default tags', async () => {
      await tagRepository.archiveTag('tag-focused');
      const tag = await tagRepository.loadTag('tag-focused');
      expect(tag?.isArchived).toBe(false);
    });
  });

  describe('removeTag', () => {
    it('archives tag when used in check-ins', async () => {
      const tag = await tagRepository.saveTag(makeTag({label: 'UsedTag'}));
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
      const byId = await tagRepository.loadTag(tag.id);
      expect(byId).toBeDefined();
      expect(byId?.isArchived).toBe(true);

      // Should not appear in loadAllTags
      const allTags = await tagRepository.loadAllTags();
      expect(allTags.find(t => t.id === tag.id)).toBeUndefined();
    });

    it('hard-deletes tag when not used in check-ins', async () => {
      const tag = await tagRepository.saveTag(makeTag({label: 'UnusedTag'}));
      await tagRepository.removeTag(tag.id);

      expect(await tagRepository.loadTag(tag.id)).toBeUndefined();
    });
  });

  describe('setCategoryTrigger', () => {
    it('sets a trigger tag on a category', async () => {
      const cat = await tagRepository.saveCategory(
        makeCategory({name: 'Custom'}),
      );
      const tag = await tagRepository.saveTag(
        makeTag({categoryId: 'cat-physical', label: 'Injured'}),
      );
      await tagRepository.setCategoryTrigger(cat.id, tag.id);

      const updated = await tagRepository.loadCategory(cat.id);
      expect(updated?.triggerTagId).toBe(tag.id);
    });

    it('clears a trigger tag', async () => {
      await tagRepository.setCategoryTrigger('cat-symptoms', null);
      const updated = await tagRepository.loadCategory('cat-symptoms');
      expect(updated?.triggerTagId).toBeUndefined();
    });
  });
});

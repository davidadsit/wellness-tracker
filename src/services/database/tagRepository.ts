import {getDatabase} from './database';
import {TagCategory, Tag} from '../../types';

function mapCategory(row: any): TagCategory {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    isDefault: row.is_default === 1,
    triggerTagId: row.trigger_tag_id ?? undefined,
    createdAt: row.created_at,
  };
}

function mapTag(row: any): Tag {
  return {
    id: row.id,
    categoryId: row.category_id,
    label: row.label,
    isDefault: row.is_default === 1,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
  };
}

export const tagRepository = {
  async loadAllCategories(): Promise<TagCategory[]> {
    const db = getDatabase();
    const result = await db.execute(
      'SELECT * FROM tag_categories ORDER BY sort_order ASC',
    );
    return result.rows.map(mapCategory);
  },

  async loadCategory(id: string): Promise<TagCategory | undefined> {
    const db = getDatabase();
    const result = await db.execute(
      'SELECT * FROM tag_categories WHERE id = ?',
      [id],
    );
    return result.rows.length > 0 ? mapCategory(result.rows[0]) : undefined;
  },

  async loadTagsByCategory(categoryId: string): Promise<Tag[]> {
    const db = getDatabase();
    const result = await db.execute(
      'SELECT * FROM tags WHERE category_id = ? AND is_archived = 0 ORDER BY label ASC',
      [categoryId],
    );
    return result.rows.map(mapTag);
  },

  async loadAllTags(): Promise<Tag[]> {
    const db = getDatabase();
    const result = await db.execute(
      'SELECT * FROM tags WHERE is_archived = 0 ORDER BY label ASC',
    );
    return result.rows.map(mapTag);
  },

  async loadAllTagsIncludingArchived(): Promise<Tag[]> {
    const db = getDatabase();
    const result = await db.execute('SELECT * FROM tags ORDER BY label ASC');
    return result.rows.map(mapTag);
  },

  async loadTag(id: string): Promise<Tag | undefined> {
    const db = getDatabase();
    const result = await db.execute('SELECT * FROM tags WHERE id = ?', [id]);
    return result.rows.length > 0 ? mapTag(result.rows[0]) : undefined;
  },

  async saveCategory(category: TagCategory): Promise<TagCategory> {
    const db = getDatabase();
    await db.execute(
      'INSERT INTO tag_categories (id, name, sort_order, is_default, trigger_tag_id, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, sort_order = excluded.sort_order, is_default = excluded.is_default, trigger_tag_id = excluded.trigger_tag_id, created_at = excluded.created_at',
      [
        category.id,
        category.name,
        category.sortOrder,
        category.isDefault ? 1 : 0,
        category.triggerTagId ?? null,
        category.createdAt,
      ],
    );
    return category;
  },

  async saveTag(tag: Tag): Promise<Tag> {
    const db = getDatabase();
    const existing = await db.execute('SELECT id FROM tags WHERE id = ?', [
      tag.id,
    ]);
    if (existing.rows.length > 0) {
      await db.execute(
        'UPDATE tags SET category_id = ?, label = ?, is_default = ?, is_archived = ?, created_at = ? WHERE id = ?',
        [
          tag.categoryId,
          tag.label,
          tag.isDefault ? 1 : 0,
          tag.isArchived ? 1 : 0,
          tag.createdAt,
          tag.id,
        ],
      );
      return tag;
    }

    const archived = await db.execute(
      'SELECT * FROM tags WHERE category_id = ? AND label = ? AND is_archived = 1',
      [tag.categoryId, tag.label],
    );
    if (archived.rows.length > 0) {
      const restoredTag = mapTag({...archived.rows[0], is_archived: 0});
      await db.execute('UPDATE tags SET is_archived = 0 WHERE id = ?', [
        restoredTag.id,
      ]);
      return restoredTag;
    }

    await db.execute(
      'INSERT INTO tags (id, category_id, label, is_default, is_archived, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        tag.id,
        tag.categoryId,
        tag.label,
        tag.isDefault ? 1 : 0,
        tag.isArchived ? 1 : 0,
        tag.createdAt,
      ],
    );
    return tag;
  },

  async deleteCategory(id: string): Promise<void> {
    const db = getDatabase();
    await db.execute('DELETE FROM tags WHERE category_id = ?', [id]);
    await db.execute(
      'DELETE FROM tag_categories WHERE id = ? AND is_default = 0',
      [id],
    );
  },

  async hasCheckInUsage(tagId: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.execute(
      'SELECT COUNT(*) as count FROM check_in_tags WHERE tag_id = ?',
      [tagId],
    );
    return (result.rows[0]?.count ?? 0) > 0;
  },

  async archiveTag(id: string): Promise<void> {
    const db = getDatabase();
    await db.execute(
      'UPDATE tags SET is_archived = 1 WHERE id = ? AND is_default = 0',
      [id],
    );
  },

  async removeTag(id: string): Promise<void> {
    const hasUsage = await this.hasCheckInUsage(id);
    if (hasUsage) {
      await this.archiveTag(id);
    } else {
      await this.deleteTag(id);
    }
  },

  async deleteTag(id: string): Promise<void> {
    const db = getDatabase();
    await db.execute('DELETE FROM check_in_tags WHERE tag_id = ?', [id]);
    await db.execute('DELETE FROM tags WHERE id = ? AND is_default = 0', [id]);
  },

  async setCategoryTrigger(
    categoryId: string,
    triggerTagId: string | null,
  ): Promise<void> {
    const db = getDatabase();
    await db.execute(
      'UPDATE tag_categories SET trigger_tag_id = ? WHERE id = ?',
      [triggerTagId, categoryId],
    );
  },
};

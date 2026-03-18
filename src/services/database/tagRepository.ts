import {getDatabase} from './database';
import {TagCategory, Tag} from '../../types';
import {uuid} from '../../utils/uuid';

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
    createdAt: row.created_at,
  };
}

export const tagRepository = {
  async getAllCategories(): Promise<TagCategory[]> {
    const db = getDatabase();
    const result = await db.execute(
      'SELECT * FROM tag_categories ORDER BY sort_order ASC',
    );
    return result.rows.map(mapCategory);
  },

  async getCategoryById(id: string): Promise<TagCategory | undefined> {
    const db = getDatabase();
    const result = await db.execute(
      'SELECT * FROM tag_categories WHERE id = ?',
      [id],
    );
    return result.rows.length > 0
      ? mapCategory(result.rows[0])
      : undefined;
  },

  async getTagsByCategory(categoryId: string): Promise<Tag[]> {
    const db = getDatabase();
    const result = await db.execute(
      'SELECT * FROM tags WHERE category_id = ? ORDER BY label ASC',
      [categoryId],
    );
    return result.rows.map(mapTag);
  },

  async getAllTags(): Promise<Tag[]> {
    const db = getDatabase();
    const result = await db.execute('SELECT * FROM tags ORDER BY label ASC');
    return result.rows.map(mapTag);
  },

  async getTagById(id: string): Promise<Tag | undefined> {
    const db = getDatabase();
    const result = await db.execute('SELECT * FROM tags WHERE id = ?', [id]);
    return result.rows.length > 0
      ? mapTag(result.rows[0])
      : undefined;
  },

  async createCategory(name: string, sortOrder: number): Promise<TagCategory> {
    const db = getDatabase();
    const id = uuid();
    const now = Date.now();
    await db.execute(
      'INSERT INTO tag_categories (id, name, sort_order, is_default, created_at) VALUES (?, ?, ?, 0, ?)',
      [id, name, sortOrder, now],
    );
    return {id, name, sortOrder, isDefault: false, createdAt: now};
  },

  async updateCategory(id: string, name: string, sortOrder: number): Promise<void> {
    const db = getDatabase();
    await db.execute(
      'UPDATE tag_categories SET name = ?, sort_order = ? WHERE id = ?',
      [name, sortOrder, id],
    );
  },

  async deleteCategory(id: string): Promise<void> {
    const db = getDatabase();
    await db.execute('DELETE FROM tags WHERE category_id = ?', [id]);
    await db.execute('DELETE FROM tag_categories WHERE id = ? AND is_default = 0', [id]);
  },

  async createTag(categoryId: string, label: string): Promise<Tag> {
    const db = getDatabase();
    const id = uuid();
    const now = Date.now();
    await db.execute(
      'INSERT INTO tags (id, category_id, label, is_default, created_at) VALUES (?, ?, ?, 0, ?)',
      [id, categoryId, label, now],
    );
    return {id, categoryId, label, isDefault: false, createdAt: now};
  },

  async updateTag(id: string, label: string): Promise<void> {
    const db = getDatabase();
    await db.execute('UPDATE tags SET label = ? WHERE id = ?', [label, id]);
  },

  async deleteTag(id: string): Promise<void> {
    const db = getDatabase();
    await db.execute('DELETE FROM check_in_tags WHERE tag_id = ?', [id]);
    await db.execute('DELETE FROM tags WHERE id = ? AND is_default = 0', [id]);
  },

  async setCategoryTrigger(categoryId: string, triggerTagId: string | null): Promise<void> {
    const db = getDatabase();
    await db.execute(
      'UPDATE tag_categories SET trigger_tag_id = ? WHERE id = ?',
      [triggerTagId, categoryId],
    );
  },
};

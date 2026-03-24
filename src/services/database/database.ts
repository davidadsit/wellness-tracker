import {open} from '@op-engineering/op-sqlite';
import {DEFAULT_CATEGORIES} from '../../seed/defaultTags';
import {runMigrations} from './migrations';

const DB_NAME = 'wellness-tracker.db';

type DB = ReturnType<typeof open>;

let db: DB | null = null;
let initialized = false;

export function getDatabase(): DB {
  if (!db) {
    db = open({name: DB_NAME});
  }
  return db;
}

export async function initializeDatabase(): Promise<void> {
  if (initialized) {
    return;
  }
  const database = getDatabase();
  await initSchema(database);
  initialized = true;
}

async function initSchema(database: DB): Promise<void> {
  await runMigrations(database);
  await seedDefaultData(database);
}

async function seedDefaultData(database: DB): Promise<void> {
  const result = await database.execute(
    'SELECT COUNT(*) as count FROM tag_categories WHERE is_default = 1',
  );
  const count = result.rows[0]?.count ?? 0;
  if (count > 0) {
    return;
  }

  const now = Date.now();

  for (const category of DEFAULT_CATEGORIES) {
    await database.execute(
      'INSERT INTO tag_categories (id, name, sort_order, is_default, trigger_tag_id, created_at) VALUES (?, ?, ?, 1, ?, ?)',
      [
        category.id,
        category.name,
        category.sortOrder,
        category.triggerTagId ?? null,
        now,
      ],
    );

    for (const tag of category.tags) {
      await database.execute(
        'INSERT INTO tags (id, category_id, label, is_default, created_at) VALUES (?, ?, ?, 1, ?)',
        [tag.id, category.id, tag.label, now],
      );
    }
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    initialized = false;
  }
}

export function resetDatabase(): void {
  closeDatabase();
}

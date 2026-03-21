import {open} from '@op-engineering/op-sqlite';
import {DEFAULT_CATEGORIES} from '../../seed/defaultTags';

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
  await database.execute('PRAGMA foreign_keys = ON;');

  await database.execute(`
    CREATE TABLE IF NOT EXISTS tag_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      trigger_tag_id TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES tag_categories(id),
      label TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      UNIQUE(category_id, label)
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS check_ins (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      note TEXT,
      source TEXT NOT NULL DEFAULT 'manual'
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS check_in_tags (
      check_in_id TEXT NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id),
      PRIMARY KEY (check_in_id, tag_id)
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS habit_completions (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      completed_at INTEGER NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual',
      UNIQUE(habit_id, date)
    );
  `);

  await database.execute(
    'CREATE INDEX IF NOT EXISTS idx_checkin_ts ON check_ins(timestamp);',
  );
  await database.execute(
    'CREATE INDEX IF NOT EXISTS idx_checkin_tags_tag ON check_in_tags(tag_id);',
  );
  await database.execute(
    'CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category_id);',
  );
  await database.execute(
    'CREATE INDEX IF NOT EXISTS idx_completions ON habit_completions(habit_id, date);',
  );
  await database.execute(
    'CREATE INDEX IF NOT EXISTS idx_completions_date ON habit_completions(date);',
  );

  await database.execute(`
    CREATE TABLE IF NOT EXISTS notification_outcomes (
      id TEXT PRIMARY KEY,
      reminder_period TEXT NOT NULL,
      outcome TEXT,
      scheduled_time TEXT NOT NULL,
      sent_at INTEGER NOT NULL,
      responded_at INTEGER
    );
  `);
  await database.execute(
    'CREATE INDEX IF NOT EXISTS idx_outcomes_period ON notification_outcomes(reminder_period);',
  );
  await database.execute(
    'CREATE INDEX IF NOT EXISTS idx_outcomes_sent ON notification_outcomes(sent_at);',
  );

  try {
    await database.execute(
      'ALTER TABLE tags ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0;',
    );
  } catch {
    // Column already exists — expected after first migration
  }

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
  db = null;
  initialized = false;
}

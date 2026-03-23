import {open} from '@op-engineering/op-sqlite';

type DB = ReturnType<typeof open>;
type Migration = (db: DB) => Promise<void>;

async function getVersion(db: DB): Promise<number> {
  const result = await db.execute('PRAGMA user_version');
  return (result.rows[0] as any)?.user_version ?? 0;
}

async function setVersion(db: DB, version: number): Promise<void> {
  await db.execute(`PRAGMA user_version = ${version}`);
}

async function migrationV1(db: DB): Promise<void> {
  await db.execute('PRAGMA foreign_keys = ON;');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tag_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      trigger_tag_id TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  await db.execute(`
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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS check_ins (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      note TEXT,
      source TEXT NOT NULL DEFAULT 'manual'
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS check_in_tags (
      check_in_id TEXT NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id),
      PRIMARY KEY (check_in_id, tag_id)
    );
  `);

  await db.execute(`
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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS notification_outcomes (
      id TEXT PRIMARY KEY,
      reminder_period TEXT NOT NULL,
      outcome TEXT,
      scheduled_time TEXT NOT NULL,
      sent_at INTEGER NOT NULL,
      responded_at INTEGER
    );
  `);

  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_checkin_ts ON check_ins(timestamp);',
  );
  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_checkin_tags_tag ON check_in_tags(tag_id);',
  );
  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category_id);',
  );
  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_completions ON habit_completions(habit_id, date);',
  );
  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_completions_date ON habit_completions(date);',
  );
  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_outcomes_period ON notification_outcomes(reminder_period);',
  );
  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_outcomes_sent ON notification_outcomes(sent_at);',
  );
}

const migrations: Migration[] = [migrationV1];

export async function runMigrations(db: DB): Promise<void> {
  const currentVersion = await getVersion(db);
  for (let i = currentVersion; i < migrations.length; i++) {
    await migrations[i](db);
    await setVersion(db, i + 1);
  }
}

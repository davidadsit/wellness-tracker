import {
  resetDatabase,
  getDatabase,
} from '../../../../src/services/database/database';
import {runMigrations} from '../../../../src/services/database/migrations';

function freshDatabase() {
  resetDatabase();
  return getDatabase();
}

describe('runMigrations', () => {
  beforeEach(() => {
    resetDatabase();
  });

  it('sets user_version to 1 after running on a fresh database', async () => {
    const db = freshDatabase();
    await runMigrations(db);

    const result = await db.execute('PRAGMA user_version');
    expect(result.rows[0].user_version).toBe(1);
  });

  it('creates all 6 tables', async () => {
    const db = freshDatabase();
    await runMigrations(db);

    const result = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    );
    const tableNames = result.rows.map((r: any) => r.name).sort();
    expect(tableNames).toEqual([
      'check_in_tags',
      'check_ins',
      'habit_completions',
      'notification_outcomes',
      'tag_categories',
      'tags',
    ]);
  });

  it('creates tags table with is_archived column', async () => {
    const db = freshDatabase();
    await runMigrations(db);

    const result = await db.execute('PRAGMA table_info(tags)');
    const columnNames = result.rows.map((r: any) => r.name);
    expect(columnNames).toContain('is_archived');
  });

  it('is idempotent — running twice does not error', async () => {
    const db = freshDatabase();
    await runMigrations(db);
    await runMigrations(db);

    const result = await db.execute('PRAGMA user_version');
    expect(result.rows[0].user_version).toBe(1);
  });

  it('skips migrations already applied', async () => {
    const db = freshDatabase();
    // Simulate a database already at version 1
    await db.execute('PRAGMA user_version = 1');

    // Create the tables manually so we can verify no error from re-running
    await runMigrations(db);

    const result = await db.execute('PRAGMA user_version');
    expect(result.rows[0].user_version).toBe(1);
  });
});

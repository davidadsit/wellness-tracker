import Database from 'better-sqlite3';

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function dropAllTables(instance: Database.Database): void {
  const tables = instance
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )
    .all() as Array<{name: string}>;
  instance.pragma('foreign_keys = OFF');
  for (const {name} of tables) {
    instance.prepare(`DROP TABLE IF EXISTS "${name}"`).run();
  }
  instance.pragma('foreign_keys = ON');
  instance.pragma('user_version = 0');
}

export function open(_options: {name: string; location?: string}) {
  const instance = getDb();
  return {
    execute: async (sql: string, params?: any[]) => {
      const stmt = instance.prepare(sql);
      const upper = sql.trimStart().toUpperCase();
      const isRead =
        upper.startsWith('SELECT') ||
        upper.startsWith('WITH') ||
        (upper.startsWith('PRAGMA') && !upper.includes('='));
      if (isRead) {
        const rows = params ? stmt.all(...params) : stmt.all();
        return {rows, rowsAffected: 0};
      }
      const result = params ? stmt.run(...params) : stmt.run();
      return {
        rows: [],
        rowsAffected: result.changes,
        insertId: result.lastInsertRowid,
      };
    },
    executeBatch: async (commands: Array<{sql: string; params?: any[]}>) => {
      const transaction = instance.transaction(() => {
        for (const cmd of commands) {
          const stmt = instance.prepare(cmd.sql);
          if (cmd.params) {
            stmt.run(...cmd.params);
          } else {
            stmt.run();
          }
        }
      });
      transaction();
    },
    close: () => {
      if (db) {
        dropAllTables(db);
      }
    },
    _getTestDb: () => instance,
  };
}

export function resetTestDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

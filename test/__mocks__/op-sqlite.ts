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

export function open(options: {name: string; location?: string}) {
  const instance = getDb();
  return {
    execute: async (sql: string, params?: any[]) => {
      const stmt = instance.prepare(sql);
      if (
        sql.trimStart().toUpperCase().startsWith('SELECT') ||
        sql.trimStart().toUpperCase().startsWith('WITH')
      ) {
        const rows = params ? stmt.all(...params) : stmt.all();
        return {rows, rowsAffected: 0};
      }
      const result = params ? stmt.run(...params) : stmt.run();
      return {rows: [], rowsAffected: result.changes, insertId: result.lastInsertRowid};
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
        db.close();
        db = null;
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

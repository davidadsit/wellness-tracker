import {
  resetDatabase,
  initializeDatabase,
} from '../../src/services/database/database';

export function setupTestDatabase() {
  beforeEach(async () => {
    resetDatabase();
    await initializeDatabase();
  });
}

import {getDatabase} from './database';
import {CheckIn} from '../../types';
import {v4 as uuid} from 'uuid';

function mapCheckIn(row: any, tagIds: string[]): CheckIn {
  return {
    id: row.id,
    timestamp: row.timestamp,
    tagIds,
    note: row.note ?? undefined,
    source: row.source,
  };
}

async function getTagIdsForCheckIn(db: ReturnType<typeof getDatabase>, checkInId: string): Promise<string[]> {
  const result = await db.execute(
    'SELECT tag_id FROM check_in_tags WHERE check_in_id = ?',
    [checkInId],
  );
  return result.rows.map((r: any) => r.tag_id);
}

export const checkInRepository = {
  async create(params: {
    tagIds: string[];
    note?: string;
    source?: 'manual' | 'notification';
  }): Promise<CheckIn> {
    const db = getDatabase();
    const id = uuid();
    const now = Date.now();
    const source = params.source ?? 'manual';

    await db.execute(
      'INSERT INTO check_ins (id, timestamp, note, source) VALUES (?, ?, ?, ?)',
      [id, now, params.note ?? null, source],
    );

    for (const tagId of params.tagIds) {
      await db.execute(
        'INSERT INTO check_in_tags (check_in_id, tag_id) VALUES (?, ?)',
        [id, tagId],
      );
    }

    return {id, timestamp: now, tagIds: params.tagIds, note: params.note, source};
  },

  async getById(id: string): Promise<CheckIn | undefined> {
    const db = getDatabase();
    const result = await db.execute('SELECT * FROM check_ins WHERE id = ?', [id]);
    if (result.rows.length === 0) {
      return undefined;
    }
    const row = result.rows[0];
    const tagIds = await getTagIdsForCheckIn(db, id);
    return mapCheckIn(row, tagIds);
  },

  async getByDateRange(startTimestamp: number, endTimestamp: number): Promise<CheckIn[]> {
    const db = getDatabase();
    const result = await db.execute(
      'SELECT * FROM check_ins WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC',
      [startTimestamp, endTimestamp],
    );
    const checkIns: CheckIn[] = [];
    for (const row of result.rows) {
      const tagIds = await getTagIdsForCheckIn(db, row.id);
      checkIns.push(mapCheckIn(row, tagIds));
    }
    return checkIns;
  },

  async getToday(todayStart: number, todayEnd: number): Promise<CheckIn[]> {
    return this.getByDateRange(todayStart, todayEnd);
  },

  async getRecent(limit: number): Promise<CheckIn[]> {
    const db = getDatabase();
    const result = await db.execute(
      'SELECT * FROM check_ins ORDER BY timestamp DESC LIMIT ?',
      [limit],
    );
    const checkIns: CheckIn[] = [];
    for (const row of result.rows) {
      const tagIds = await getTagIdsForCheckIn(db, row.id);
      checkIns.push(mapCheckIn(row, tagIds));
    }
    return checkIns;
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    await db.execute('DELETE FROM check_ins WHERE id = ?', [id]);
  },

  async getTagFrequency(
    startTimestamp: number,
    endTimestamp: number,
  ): Promise<Array<{tagId: string; count: number}>> {
    const db = getDatabase();
    const result = await db.execute(
      `SELECT ct.tag_id, COUNT(*) as count
       FROM check_in_tags ct
       JOIN check_ins ci ON ci.id = ct.check_in_id
       WHERE ci.timestamp >= ? AND ci.timestamp <= ?
       GROUP BY ct.tag_id
       ORDER BY count DESC`,
      [startTimestamp, endTimestamp],
    );
    return result.rows.map((row: any) => ({
      tagId: row.tag_id,
      count: row.count,
    }));
  },

  async getTagCoOccurrence(
    tagId: string,
    startTimestamp: number,
    endTimestamp: number,
  ): Promise<Array<{tagId: string; count: number}>> {
    const db = getDatabase();
    const result = await db.execute(
      `SELECT ct2.tag_id, COUNT(*) as count
       FROM check_in_tags ct1
       JOIN check_in_tags ct2 ON ct1.check_in_id = ct2.check_in_id AND ct1.tag_id != ct2.tag_id
       JOIN check_ins ci ON ci.id = ct1.check_in_id
       WHERE ct1.tag_id = ? AND ci.timestamp >= ? AND ci.timestamp <= ?
       GROUP BY ct2.tag_id
       ORDER BY count DESC`,
      [tagId, startTimestamp, endTimestamp],
    );
    return result.rows.map((row: any) => ({
      tagId: row.tag_id,
      count: row.count,
    }));
  },
};

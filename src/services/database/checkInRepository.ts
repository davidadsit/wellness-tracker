import {getDatabase} from './database';
import {CheckIn} from '../../types';
import {formatDateString} from '../../utils/dateUtils';

function groupRowsIntoCheckIns(rows: any[]): CheckIn[] {
  const checkIns: CheckIn[] = [];
  const seen = new Map<string, CheckIn>();

  for (const row of rows) {
    let checkIn = seen.get(row.id);
    if (!checkIn) {
      checkIn = {
        id: row.id,
        timestamp: row.timestamp,
        tagIds: [],
        note: row.note ?? undefined,
        source: row.source,
      };
      seen.set(row.id, checkIn);
      checkIns.push(checkIn);
    }
    if (row.tag_id != null) {
      checkIn.tagIds.push(row.tag_id);
    }
  }

  return checkIns;
}

export const checkInRepository = {
  async save(checkIn: CheckIn): Promise<CheckIn> {
    const db = getDatabase();

    await db.execute(
      'INSERT OR REPLACE INTO check_ins (id, timestamp, note, source) VALUES (?, ?, ?, ?)',
      [checkIn.id, checkIn.timestamp, checkIn.note ?? null, checkIn.source],
    );

    await db.execute('DELETE FROM check_in_tags WHERE check_in_id = ?', [
      checkIn.id,
    ]);
    for (const tagId of checkIn.tagIds) {
      await db.execute(
        'INSERT INTO check_in_tags (check_in_id, tag_id) VALUES (?, ?)',
        [checkIn.id, tagId],
      );
    }

    return checkIn;
  },

  async load(id: string): Promise<CheckIn | undefined> {
    const db = getDatabase();
    const result = await db.execute(
      `SELECT ci.id, ci.timestamp, ci.note, ci.source, ct.tag_id
       FROM check_ins ci
       LEFT JOIN check_in_tags ct ON ci.id = ct.check_in_id
       WHERE ci.id = ?`,
      [id],
    );
    const checkIns = groupRowsIntoCheckIns(result.rows);
    return checkIns[0];
  },

  async loadDateRange(
    startTimestamp: number,
    endTimestamp: number,
  ): Promise<CheckIn[]> {
    const db = getDatabase();
    const result = await db.execute(
      `SELECT ci.id, ci.timestamp, ci.note, ci.source, ct.tag_id
       FROM check_ins ci
       LEFT JOIN check_in_tags ct ON ci.id = ct.check_in_id
       WHERE ci.timestamp >= ? AND ci.timestamp <= ?
       ORDER BY ci.timestamp DESC`,
      [startTimestamp, endTimestamp],
    );
    return groupRowsIntoCheckIns(result.rows);
  },

  async loadToday(todayStart: number, todayEnd: number): Promise<CheckIn[]> {
    return this.loadDateRange(todayStart, todayEnd);
  },

  async loadRecent(limit: number): Promise<CheckIn[]> {
    const db = getDatabase();
    const result = await db.execute(
      `SELECT ci.id, ci.timestamp, ci.note, ci.source, ct.tag_id
       FROM (SELECT * FROM check_ins ORDER BY timestamp DESC LIMIT ?) ci
       LEFT JOIN check_in_tags ct ON ci.id = ct.check_in_id
       ORDER BY ci.timestamp DESC`,
      [limit],
    );
    return groupRowsIntoCheckIns(result.rows);
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    await db.execute('DELETE FROM check_ins WHERE id = ?', [id]);
  },

  async loadTagFrequency(
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

  async loadTagDailyFrequency(
    tagId: string,
    startTimestamp: number,
    endTimestamp: number,
  ): Promise<Array<{date: string; count: number}>> {
    const db = getDatabase();
    const result = await db.execute(
      `SELECT ci.timestamp
       FROM check_in_tags ct
       JOIN check_ins ci ON ci.id = ct.check_in_id
       WHERE ct.tag_id = ? AND ci.timestamp >= ? AND ci.timestamp <= ?
       ORDER BY ci.timestamp ASC`,
      [tagId, startTimestamp, endTimestamp],
    );
    const counts = new Map<string, number>();
    for (const row of result.rows) {
      const date = new Date(row.timestamp);
      const key = formatDateString(date);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([date, count]) => ({date, count}))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  async loadTagCoOccurrence(
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

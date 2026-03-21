import {checkInRepository} from '../../../src/services/database/checkInRepository';
import {setupTestDatabase} from '../../helpers/database';
setupTestDatabase();

function rangeAroundNow() {
  const now = Date.now();
  const margin = 10000;
  return {start: now - margin, end: now + margin};
}

describe('checkInRepository', () => {
  describe('create', () => {
    it('creates a check-in with tags', async () => {
      const checkIn = await checkInRepository.create({
        tagIds: ['tag-happy', 'tag-energized'],
        note: 'Great morning',
      });

      expect(checkIn.id).toBeDefined();
      expect(checkIn.tagIds).toEqual(['tag-happy', 'tag-energized']);
      expect(checkIn.note).toBe('Great morning');
      expect(checkIn.source).toBe('manual');
      expect(checkIn.timestamp).toBeGreaterThan(0);
    });

    it('creates a check-in without note', async () => {
      const checkIn = await checkInRepository.create({
        tagIds: ['tag-calm'],
      });
      expect(checkIn.note).toBeUndefined();
    });

    it('creates a check-in with notification source', async () => {
      const checkIn = await checkInRepository.create({
        tagIds: ['tag-tired'],
        source: 'notification',
      });
      expect(checkIn.source).toBe('notification');
    });

    it('creates a check-in with empty tags', async () => {
      const checkIn = await checkInRepository.create({tagIds: []});
      expect(checkIn.tagIds).toEqual([]);
    });
  });

  describe('getById', () => {
    it('retrieves a check-in by id', async () => {
      const created = await checkInRepository.create({
        tagIds: ['tag-happy', 'tag-focused'],
        note: 'Test',
      });

      const fetched = await checkInRepository.getById(created.id);
      expect(fetched).toBeDefined();
      expect(fetched?.tagIds).toHaveLength(2);
      expect(fetched?.tagIds).toContain('tag-happy');
      expect(fetched?.tagIds).toContain('tag-focused');
      expect(fetched?.note).toBe('Test');
    });

    it('returns undefined for unknown id', async () => {
      expect(await checkInRepository.getById('nonexistent')).toBeUndefined();
    });
  });

  describe('getByDateRange', () => {
    it('returns check-ins within the date range', async () => {
      const c1 = await checkInRepository.create({tagIds: ['tag-happy']});
      const c2 = await checkInRepository.create({tagIds: ['tag-sad']});
      const beforeFirstCheckIn = c1.timestamp - 1000;
      const afterLastCheckIn = c2.timestamp + 1000;

      const results = await checkInRepository.getByDateRange(
        beforeFirstCheckIn,
        afterLastCheckIn,
      );
      expect(results).toHaveLength(2);
    });

    it('excludes check-ins outside the range', async () => {
      await checkInRepository.create({tagIds: ['tag-happy']});
      const distantPastStart = 0;
      const distantPastEnd = 1;

      const results = await checkInRepository.getByDateRange(distantPastStart, distantPastEnd);
      expect(results).toHaveLength(0);
    });

    it('returns results in descending timestamp order', async () => {
      await checkInRepository.create({tagIds: ['tag-happy']});
      await checkInRepository.create({tagIds: ['tag-sad']});

      const {start, end} = rangeAroundNow();
      const results = await checkInRepository.getByDateRange(start, end);
      if (results.length >= 2) {
        expect(results[0].timestamp).toBeGreaterThanOrEqual(results[1].timestamp);
      }
    });
  });

  describe('getRecent', () => {
    it('returns the most recent check-ins up to the limit', async () => {
      await checkInRepository.create({tagIds: ['tag-happy']});
      await checkInRepository.create({tagIds: ['tag-sad']});
      await checkInRepository.create({tagIds: ['tag-calm']});

      const results = await checkInRepository.getRecent(2);
      expect(results).toHaveLength(2);
    });
  });

  describe('delete', () => {
    it('deletes a check-in and its tags via cascade', async () => {
      const checkIn = await checkInRepository.create({
        tagIds: ['tag-happy', 'tag-focused'],
      });

      await checkInRepository.delete(checkIn.id);
      expect(await checkInRepository.getById(checkIn.id)).toBeUndefined();
    });
  });

  describe('getTagFrequency', () => {
    it('returns tag counts for check-ins in date range', async () => {
      await checkInRepository.create({tagIds: ['tag-happy', 'tag-energized']});
      await checkInRepository.create({tagIds: ['tag-happy', 'tag-focused']});
      await checkInRepository.create({tagIds: ['tag-sad']});

      const {start, end} = rangeAroundNow();
      const freq = await checkInRepository.getTagFrequency(start, end);

      const happyCount = freq.find(f => f.tagId === 'tag-happy');
      expect(happyCount?.count).toBe(2);

      const sadCount = freq.find(f => f.tagId === 'tag-sad');
      expect(sadCount?.count).toBe(1);
    });

    it('returns results ordered by count descending', async () => {
      await checkInRepository.create({tagIds: ['tag-happy']});
      await checkInRepository.create({tagIds: ['tag-happy']});
      await checkInRepository.create({tagIds: ['tag-sad']});

      const {start, end} = rangeAroundNow();
      const freq = await checkInRepository.getTagFrequency(start, end);
      expect(freq[0].tagId).toBe('tag-happy');
    });

    it('returns empty array when no check-ins in range', async () => {
      const freq = await checkInRepository.getTagFrequency(0, 1);
      expect(freq).toEqual([]);
    });
  });

  describe('getTagCoOccurrence', () => {
    it('returns tags that co-occur with the given tag', async () => {
      await checkInRepository.create({tagIds: ['tag-happy', 'tag-energized', 'tag-focused']});
      await checkInRepository.create({tagIds: ['tag-happy', 'tag-energized']});
      await checkInRepository.create({tagIds: ['tag-sad']});

      const {start, end} = rangeAroundNow();
      const coOccurrences = await checkInRepository.getTagCoOccurrence(
        'tag-happy',
        start,
        end,
      );

      const energized = coOccurrences.find(c => c.tagId === 'tag-energized');
      expect(energized?.count).toBe(2);

      const focused = coOccurrences.find(c => c.tagId === 'tag-focused');
      expect(focused?.count).toBe(1);

      expect(coOccurrences.find(c => c.tagId === 'tag-sad')).toBeUndefined();
    });

    it('returns empty array for tag with no co-occurrences', async () => {
      await checkInRepository.create({tagIds: ['tag-sad']});

      const {start, end} = rangeAroundNow();
      const coOccurrences = await checkInRepository.getTagCoOccurrence(
        'tag-sad',
        start,
        end,
      );
      expect(coOccurrences).toEqual([]);
    });
  });

  describe('getToday', () => {
    it('returns check-ins created today', async () => {
      await checkInRepository.create({tagIds: ['tag-happy']});

      const {start, end} = rangeAroundNow();
      const results = await checkInRepository.getToday(start, end);
      expect(results).toHaveLength(1);
      expect(results[0].tagIds).toContain('tag-happy');
    });
  });

  describe('getTagDailyFrequency', () => {
    it('groups check-ins by local date and returns counts', async () => {
      await checkInRepository.create({tagIds: ['tag-happy']});
      await checkInRepository.create({tagIds: ['tag-happy']});

      const {start, end} = rangeAroundNow();
      const freq = await checkInRepository.getTagDailyFrequency('tag-happy', start, end);

      expect(freq).toHaveLength(1);
      expect(freq[0].count).toBe(2);
      expect(freq[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns results sorted by date ascending', async () => {
      await checkInRepository.create({tagIds: ['tag-happy']});

      const {start, end} = rangeAroundNow();
      const freq = await checkInRepository.getTagDailyFrequency('tag-happy', start, end);
      expect(freq.length).toBeGreaterThan(0);
      for (let i = 1; i < freq.length; i++) {
        expect(freq[i].date >= freq[i - 1].date).toBe(true);
      }
    });

    it('returns empty array when tag has no check-ins in range', async () => {
      const freq = await checkInRepository.getTagDailyFrequency('tag-happy', 0, 1);
      expect(freq).toEqual([]);
    });
  });
});

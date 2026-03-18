import {checkInRepository} from '../../../src/services/database/checkInRepository';
import {resetDatabase, initializeDatabase} from '../../../src/services/database/database';
beforeEach(async () => {
  resetDatabase();
  await initializeDatabase();
});

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

      const results = await checkInRepository.getByDateRange(
        c1.timestamp - 1000,
        c2.timestamp + 1000,
      );
      expect(results).toHaveLength(2);
    });

    it('excludes check-ins outside the range', async () => {
      await checkInRepository.create({tagIds: ['tag-happy']});

      const results = await checkInRepository.getByDateRange(0, 1);
      expect(results).toHaveLength(0);
    });

    it('returns results in descending timestamp order', async () => {
      await checkInRepository.create({tagIds: ['tag-happy']});
      await checkInRepository.create({tagIds: ['tag-sad']});

      const now = Date.now();
      const results = await checkInRepository.getByDateRange(now - 10000, now + 10000);
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

      const now = Date.now();
      const freq = await checkInRepository.getTagFrequency(now - 10000, now + 10000);

      const happyCount = freq.find(f => f.tagId === 'tag-happy');
      expect(happyCount?.count).toBe(2);

      const sadCount = freq.find(f => f.tagId === 'tag-sad');
      expect(sadCount?.count).toBe(1);
    });

    it('returns results ordered by count descending', async () => {
      await checkInRepository.create({tagIds: ['tag-happy']});
      await checkInRepository.create({tagIds: ['tag-happy']});
      await checkInRepository.create({tagIds: ['tag-sad']});

      const now = Date.now();
      const freq = await checkInRepository.getTagFrequency(now - 10000, now + 10000);
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

      const now = Date.now();
      const coOccurrences = await checkInRepository.getTagCoOccurrence(
        'tag-happy',
        now - 10000,
        now + 10000,
      );

      const energized = coOccurrences.find(c => c.tagId === 'tag-energized');
      expect(energized?.count).toBe(2);

      const focused = coOccurrences.find(c => c.tagId === 'tag-focused');
      expect(focused?.count).toBe(1);

      expect(coOccurrences.find(c => c.tagId === 'tag-sad')).toBeUndefined();
    });

    it('returns empty array for tag with no co-occurrences', async () => {
      await checkInRepository.create({tagIds: ['tag-sad']});

      const now = Date.now();
      const coOccurrences = await checkInRepository.getTagCoOccurrence(
        'tag-sad',
        now - 10000,
        now + 10000,
      );
      expect(coOccurrences).toEqual([]);
    });
  });
});

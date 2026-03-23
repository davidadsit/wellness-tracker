import {checkInRepository} from '../../../../src/services/database/checkInRepository';
import {setupTestDatabase} from '../../../helpers/database';
import {makeCheckIn} from '../../../helpers/factories';

setupTestDatabase();

function rangeAroundNow() {
  const now = Date.now();
  const margin = 10000;
  return {start: now - margin, end: now + margin};
}

describe('checkInRepository', () => {
  describe('save', () => {
    it('persists a check-in with tags', async () => {
      const checkIn = makeCheckIn({
        tagIds: ['tag-happy', 'tag-energized'],
        note: 'Great morning',
      });

      const saved = await checkInRepository.save(checkIn);

      expect(saved.id).toBe(checkIn.id);
      expect(saved.tagIds).toEqual(['tag-happy', 'tag-energized']);
      expect(saved.note).toBe('Great morning');
      expect(saved.source).toBe('manual');
    });

    it('persists a check-in without note', async () => {
      const checkIn = makeCheckIn({tagIds: ['tag-calm']});
      const saved = await checkInRepository.save(checkIn);
      expect(saved.note).toBeUndefined();
    });

    it('persists a check-in with notification source', async () => {
      const checkIn = makeCheckIn({
        tagIds: ['tag-tired'],
        source: 'notification',
      });
      const saved = await checkInRepository.save(checkIn);
      expect(saved.source).toBe('notification');
    });

    it('persists a check-in with empty tags', async () => {
      const checkIn = makeCheckIn();
      const saved = await checkInRepository.save(checkIn);
      expect(saved.tagIds).toEqual([]);
    });

    it('upserts when saving a check-in with an existing id', async () => {
      const checkIn = makeCheckIn({
        tagIds: ['tag-happy'],
        note: 'original',
      });
      await checkInRepository.save(checkIn);

      const updated = {...checkIn, note: 'updated', tagIds: ['tag-sad']};
      await checkInRepository.save(updated);

      const loaded = await checkInRepository.load(checkIn.id);
      expect(loaded?.note).toBe('updated');
      expect(loaded?.tagIds).toEqual(['tag-sad']);
    });
  });

  describe('load', () => {
    it('retrieves a check-in by id', async () => {
      const checkIn = makeCheckIn({
        tagIds: ['tag-happy', 'tag-focused'],
        note: 'Test',
      });
      await checkInRepository.save(checkIn);

      const fetched = await checkInRepository.load(checkIn.id);
      expect(fetched).toBeDefined();
      expect(fetched?.tagIds).toHaveLength(2);
      expect(fetched?.tagIds).toContain('tag-happy');
      expect(fetched?.tagIds).toContain('tag-focused');
      expect(fetched?.note).toBe('Test');
    });

    it('returns undefined for unknown id', async () => {
      expect(await checkInRepository.load('nonexistent')).toBeUndefined();
    });
  });

  describe('loadDateRange', () => {
    it('returns check-ins within the date range', async () => {
      const c1 = makeCheckIn({tagIds: ['tag-happy']});
      const c2 = makeCheckIn({tagIds: ['tag-sad']});
      await checkInRepository.save(c1);
      await checkInRepository.save(c2);

      const results = await checkInRepository.loadDateRange(
        c1.timestamp - 1000,
        c2.timestamp + 1000,
      );
      expect(results).toHaveLength(2);
    });

    it('excludes check-ins outside the range', async () => {
      await checkInRepository.save(makeCheckIn({tagIds: ['tag-happy']}));

      const results = await checkInRepository.loadDateRange(0, 1);
      expect(results).toHaveLength(0);
    });

    it('returns results in descending timestamp order', async () => {
      await checkInRepository.save(makeCheckIn({tagIds: ['tag-happy']}));
      await checkInRepository.save(makeCheckIn({tagIds: ['tag-sad']}));

      const {start, end} = rangeAroundNow();
      const results = await checkInRepository.loadDateRange(start, end);
      if (results.length >= 2) {
        expect(results[0].timestamp).toBeGreaterThanOrEqual(
          results[1].timestamp,
        );
      }
    });
  });

  describe('loadRecent', () => {
    it('returns the most recent check-ins up to the limit', async () => {
      await checkInRepository.save(makeCheckIn({tagIds: ['tag-happy']}));
      await checkInRepository.save(makeCheckIn({tagIds: ['tag-sad']}));
      await checkInRepository.save(makeCheckIn({tagIds: ['tag-calm']}));

      const results = await checkInRepository.loadRecent(2);
      expect(results).toHaveLength(2);
    });
  });

  describe('delete', () => {
    it('deletes a check-in and its tags via cascade', async () => {
      const checkIn = makeCheckIn({tagIds: ['tag-happy', 'tag-focused']});
      await checkInRepository.save(checkIn);

      await checkInRepository.delete(checkIn.id);
      expect(await checkInRepository.load(checkIn.id)).toBeUndefined();
    });
  });

  describe('loadTagFrequency', () => {
    it('returns tag counts for check-ins in date range', async () => {
      await checkInRepository.save(
        makeCheckIn({tagIds: ['tag-happy', 'tag-energized']}),
      );
      await checkInRepository.save(
        makeCheckIn({tagIds: ['tag-happy', 'tag-focused']}),
      );
      await checkInRepository.save(makeCheckIn({tagIds: ['tag-sad']}));

      const {start, end} = rangeAroundNow();
      const freq = await checkInRepository.loadTagFrequency(start, end);

      const happyCount = freq.find(f => f.tagId === 'tag-happy');
      expect(happyCount?.count).toBe(2);

      const sadCount = freq.find(f => f.tagId === 'tag-sad');
      expect(sadCount?.count).toBe(1);
    });

    it('returns results ordered by count descending', async () => {
      await checkInRepository.save(makeCheckIn({tagIds: ['tag-happy']}));
      await checkInRepository.save(makeCheckIn({tagIds: ['tag-happy']}));
      await checkInRepository.save(makeCheckIn({tagIds: ['tag-sad']}));

      const {start, end} = rangeAroundNow();
      const freq = await checkInRepository.loadTagFrequency(start, end);
      expect(freq[0].tagId).toBe('tag-happy');
    });

    it('returns empty array when no check-ins in range', async () => {
      const freq = await checkInRepository.loadTagFrequency(0, 1);
      expect(freq).toEqual([]);
    });
  });

  describe('loadTagCoOccurrence', () => {
    it('returns tags that co-occur with the given tag', async () => {
      await checkInRepository.save(
        makeCheckIn({tagIds: ['tag-happy', 'tag-energized', 'tag-focused']}),
      );
      await checkInRepository.save(
        makeCheckIn({tagIds: ['tag-happy', 'tag-energized']}),
      );
      await checkInRepository.save(makeCheckIn({tagIds: ['tag-sad']}));

      const {start, end} = rangeAroundNow();
      const coOccurrences = await checkInRepository.loadTagCoOccurrence(
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
      await checkInRepository.save(makeCheckIn({tagIds: ['tag-sad']}));

      const {start, end} = rangeAroundNow();
      const coOccurrences = await checkInRepository.loadTagCoOccurrence(
        'tag-sad',
        start,
        end,
      );
      expect(coOccurrences).toEqual([]);
    });
  });

  describe('loadToday', () => {
    it('returns check-ins created today', async () => {
      await checkInRepository.save(makeCheckIn({tagIds: ['tag-happy']}));

      const {start, end} = rangeAroundNow();
      const results = await checkInRepository.loadToday(start, end);
      expect(results).toHaveLength(1);
      expect(results[0].tagIds).toContain('tag-happy');
    });
  });

  describe('loadTagDailyFrequency', () => {
    it('groups check-ins by local date and returns counts', async () => {
      await checkInRepository.save(makeCheckIn({tagIds: ['tag-happy']}));
      await checkInRepository.save(makeCheckIn({tagIds: ['tag-happy']}));

      const {start, end} = rangeAroundNow();
      const freq = await checkInRepository.loadTagDailyFrequency(
        'tag-happy',
        start,
        end,
      );

      expect(freq).toHaveLength(1);
      expect(freq[0].count).toBe(2);
      expect(freq[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns results sorted by date ascending', async () => {
      await checkInRepository.save(makeCheckIn({tagIds: ['tag-happy']}));

      const {start, end} = rangeAroundNow();
      const freq = await checkInRepository.loadTagDailyFrequency(
        'tag-happy',
        start,
        end,
      );
      expect(freq.length).toBeGreaterThan(0);
      for (let i = 1; i < freq.length; i++) {
        expect(freq[i].date >= freq[i - 1].date).toBe(true);
      }
    });

    it('returns empty array when tag has no check-ins in range', async () => {
      const freq = await checkInRepository.loadTagDailyFrequency(
        'tag-happy',
        0,
        1,
      );
      expect(freq).toEqual([]);
    });
  });
});

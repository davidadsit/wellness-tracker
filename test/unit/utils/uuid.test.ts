import {uuid} from '../../../src/utils/uuid';

describe('uuid', () => {
  it('returns a 36-character string', () => {
    expect(uuid()).toHaveLength(36);
  });

  it('matches UUID v4 format', () => {
    const id = uuid();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('always places 4 at position 14 (version digit)', () => {
    for (let i = 0; i < 20; i++) {
      expect(uuid()[14]).toBe('4');
    }
  });

  it('always places 8, 9, a, or b at position 19 (variant digit)', () => {
    for (let i = 0; i < 20; i++) {
      expect('89ab').toContain(uuid()[19]);
    }
  });

  it('returns unique values across calls', () => {
    const ids = new Set(Array.from({length: 50}, () => uuid()));
    expect(ids.size).toBe(50);
  });
});

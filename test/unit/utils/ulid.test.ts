import {ulid} from '../../../src/utils/ulid';

describe('ulid', () => {
  it('returns a 26-character string', () => {
    expect(ulid()).toHaveLength(26);
  });

  it('contains only Crockford base32 characters', () => {
    const id = ulid();
    expect(id).toMatch(/^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/);
  });

  it('returns unique values across calls', () => {
    const ids = new Set(Array.from({length: 50}, () => ulid()));
    expect(ids.size).toBe(50);
  });

  it('shares the same timestamp prefix for calls within the same millisecond', () => {
    const first = ulid();
    const second = ulid();
    expect(second.slice(0, 10)).toBe(first.slice(0, 10));
  });

  it('encodes current time in the first 10 characters', () => {
    const before = Date.now();
    const id = ulid();
    const after = Date.now();

    const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let decoded = 0;
    for (let i = 0; i < 10; i++) {
      decoded = decoded * 32 + CROCKFORD.indexOf(id[i]);
    }

    expect(decoded).toBeGreaterThanOrEqual(before);
    expect(decoded).toBeLessThanOrEqual(after);
  });
});

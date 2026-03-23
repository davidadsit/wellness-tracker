const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeTime(time: number, length: number): string {
  let str = '';
  for (let i = length - 1; i >= 0; i--) {
    const mod = time % 32;
    str = CROCKFORD[mod] + str;
    time = Math.floor(time / 32);
  }
  return str;
}

function encodeRandom(length: number): string {
  let str = '';
  for (let i = 0; i < length; i++) {
    str += CROCKFORD[Math.floor(Math.random() * 32)];
  }
  return str;
}

export function ulid(): string {
  return encodeTime(Date.now(), 10) + encodeRandom(16);
}

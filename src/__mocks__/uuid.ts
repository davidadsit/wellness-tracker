let counter = 0;

export function v4(): string {
  counter += 1;
  return `test-uuid-${counter}`;
}

export function resetUuidCounter(): void {
  counter = 0;
}

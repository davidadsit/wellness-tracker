const store: Record<string, string> = {};

export class MMKV {
  getString(key: string): string | undefined {
    return store[key];
  }
  set(key: string, value: string): void {
    store[key] = value;
  }
  delete(key: string): void {
    delete store[key];
  }
  contains(key: string): boolean {
    return key in store;
  }
  getAllKeys(): string[] {
    return Object.keys(store);
  }
  clearAll(): void {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
  }
}

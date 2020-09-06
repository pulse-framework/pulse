export class MockAsyncStorage {
  private store: Map<string, string> = new Map();
  constructor() {}
  public async getItem(key: string) {
    return this.store.get(key);
  }
  public async setItem(key: string, value) {
    if (typeof value !== 'string') value = JSON.stringify(value);
    this.store.set(key, value);
  }
  public async removeItem(key: string) {
    this.store.delete(key);
  }
}
export class MockLocalStorage {
  private store: Map<string, string> = new Map();
  constructor() {}
  public getItem(key: string) {
    return this.store.get(key);
  }
  public setItem(key: string, value) {
    if (typeof value !== 'string') value = JSON.stringify(value);
    this.store.set(key, value);
  }
  public removeItem(key: string) {
    this.store.delete(key);
  }
}

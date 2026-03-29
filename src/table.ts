import { Entry } from './entry';
import { Entity } from './entity';

export class Table<T extends typeof Entity> {
  entityType: T;
  private entries: Entry<T>[] = [];

  constructor(entityType: T) {
    this.entityType = entityType;
  }

  insert(entry: Entry<T>): void {
    if (entry.entityType !== this.entityType)
      throw new TypeError(`Entry's entity type does not match this Table`);
    entry.setTable(this);
    entry._index = this.entries.length;
    this.entries.push(entry);
  }

  delete(entry: Entry<T>): void {
    const idx = this.entries.indexOf(entry);
    if (idx < 0) return;
    entry.setTable(undefined);
    entry._index = -1;
    const last = this.entries.pop();
    if (last !== entry) {
      last._index = idx;
      this.entries[idx] = last;
    }
  }

  has(entry: Entry<T>): boolean {
    return this.entries.includes(entry);
  }

  *[Symbol.iterator](): Iterator<Entry<T>> {
    yield* this.entries;
  }
}

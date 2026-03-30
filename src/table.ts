import type { ComponentCtor } from './component';
import { Entry } from './entry';
import { Entity } from './entity';

type ComponentsOf<C extends readonly ComponentCtor[]> = {
  [K in keyof C]: C[K] extends new (...args: any[]) => infer I ? I : never;
};

export class Table<T extends typeof Entity> {
  entityType: T;
  private entries: Entry<T>[] = [];

  constructor(entityType: T) {
    this.entityType = entityType;
  }

  insert(componentsOrEntry: ComponentsOf<T['columns']> | Entry<T>): WeakRef<Entry<T>> {
    let entry: Entry<T>;
    if (Array.isArray(componentsOrEntry)) {
      entry = new Entry(this.entityType, componentsOrEntry);
    } else {
      entry = componentsOrEntry;
    }
    if (entry.entityType !== this.entityType)
      throw new TypeError(`Entry's entity type does not match this Table`);
    entry.setTable(this);
    entry._index = this.entries.length;
    this.entries.push(entry);
    return entry.weak();
  }

  delete(ref: WeakRef<Entry<T>>): void {
    const entry = ref.deref();
    if (entry === undefined) return;
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

  getAt(index: number): WeakRef<Entry<T>> | undefined {
    if (index < 0 || index >= this.entries.length) return undefined;
    return this.entries[index].weak();
  }

  *[Symbol.iterator](): Iterator<Entry<T>> {
    yield* this.entries;
  }

  serialize(): Record<string, unknown>[][] {
    return this.entries.map(entry => entry.serialize());
  }

  static deserialize<T extends typeof Entity>(
    this: new (entityType: T) => Table<T>,
    data: Record<string, unknown>[][],
    entityType: T,
  ): Table<T> {
    const table = new this(entityType);
    for (let i = 0; i < data.length; i++) {
      const entry = Entry.deserialize(data[i], entityType, table, i);
      table.entries.push(entry);
    }
    return table;
  }
}

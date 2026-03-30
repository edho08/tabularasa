import type { ComponentCtor } from '../entity/component';
import { Entry } from './entry';
import { Entity } from '../entity/entity';
import type { TableManager } from './manager';

type ComponentsOf<C extends readonly ComponentCtor[]> = {
  [K in keyof C]: C[K] extends new (...args: any[]) => infer I ? I : never;
};

export class Table<T extends typeof Entity> {
  readonly entityType: T;
  readonly manager: TableManager;
  private entries: Entry<T>[] = [];

  constructor(entityType: T, manager: TableManager) {
    this.entityType = entityType;
    this.manager = manager;
  }

  insert(components: ComponentsOf<T['columns']>): WeakRef<Entry<T>> {
    const entry = new Entry(this.entityType, components, this, this.entries.length);
    this.entries.push(entry);
    return entry.weak();
  }

  delete(ref: WeakRef<Entry<T>>): void {
    const entry = ref.deref();
    if (entry === undefined) return;
    const idx = this.entries.indexOf(entry);
    if (idx < 0) return;
    entry.callDead();
    entry._table = undefined;
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

  clear(count: number): void {
    for (const entry of this.entries) {
      entry.callDead();
      entry._table = undefined;
      entry._index = -1;
    }
    this.entries = [];
    for (let i = 0; i < count; i++) {
      const entry = new Entry(this.entityType, [], this, i);
      this.entries.push(entry);
    }
  }

  populate(data: Record<string, unknown>[]): void {
    if (data.length !== this.entries.length)
      throw new TypeError(
        `Data length ${data.length} does not match entry count ${this.entries.length}`,
      );
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      const components = this.entityType.columns.map((ctor, j) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ctor as any).deserialize(data[i][j], entry),
      );
      entry.components = components;
      for (const comp of components) {
        comp.onAttached(entry);
      }
      for (const comp of components) {
        comp.onAlive(entry);
      }
    }
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
}

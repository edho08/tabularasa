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
    // @ts-expect-error - internal field access, Table is the owner of Entry index
    entry._index = -1;
    const last = this.entries.pop();
    if (last === undefined) return;
    if (last !== entry) {
      // @ts-expect-error - internal field access, Table is the owner of Entry index
      last._index = idx;
      this.entries[idx] = last;
    }
  }

  has(entry: Entry<T>): boolean {
    return this.entries.includes(entry);
  }

  deserialize(data: Record<string, unknown>[][]): void {
    for (const entry of this.entries) {
      entry.callDead();
    }
    this.entries = [];
    for (let i = 0; i < data.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = Entry.deserialize(this.entityType, data[i] as any, this, i);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.entries.push(entry as any);
    }
  }

  onDeserialized(): void {
    for (const entry of this.entries) {
      entry.callDeserialized();
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

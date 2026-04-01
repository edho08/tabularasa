import type { ComponentCtor } from '../entity/component';
import { Entry, EntryLifecycle } from './entry';
import { Entity } from '../entity/entity';
import type { TableManager } from './manager';

type ComponentsOf<C extends readonly ComponentCtor[]> = {
  -readonly [K in keyof C]: C[K] extends new (...args: any[]) => infer I ? I : never;
};

export class Table<T extends typeof Entity> {
  readonly entityType: T;
  readonly columns: readonly ComponentCtor[];
  readonly manager: TableManager;
  private entries: Entry<T>[] = [];

  constructor(entityType: T, manager: TableManager) {
    this.entityType = entityType;
    this.columns = entityType.columns as readonly ComponentCtor[];
    this.manager = manager;
  }

  insert(components: ComponentsOf<T['columns']>): WeakRef<Entry<T>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry = new Entry(components as any, this, this.entries.length);
    this.entries.push(entry);
    return entry.weak();
  }

  delete(ref: WeakRef<Entry<T>>): ComponentsOf<T['columns']> {
    const entry = ref.deref();
    if (entry === undefined) return [] as ComponentsOf<T['columns']>;
    if (entry.lifecycle === EntryLifecycle.DYING || entry.lifecycle === EntryLifecycle.DEAD)
      return [] as ComponentsOf<T['columns']>;
    const idx = this.entries.indexOf(entry);
    if (idx < 0) return [] as ComponentsOf<T['columns']>;
    // @ts-expect-error - internal field access, Table is the owner of Entry lifecycle
    entry._lifecycle = EntryLifecycle.DYING;
    entry.callDetached();
    const last = this.entries.pop();
    if (last === undefined) return [] as ComponentsOf<T['columns']>;
    if (last !== entry) {
      // @ts-expect-error - internal field access, Table is the owner of Entry index
      last._index = idx;
      last.table = this;
      this.entries[idx] = last;
    }
    return entry.components;
  }

  has(entry: Entry<T>): boolean {
    return this.entries.includes(entry);
  }

  deserialize(data: Record<string, unknown>[][]): void {
    for (const entry of this.entries) {
      // @ts-expect-error - internal field access, Table is the owner of Entry lifecycle
      entry._lifecycle = EntryLifecycle.DYING;
      entry.callDetached();
    }
    this.entries = [];
    for (let i = 0; i < data.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = Entry.deserialize(data[i] as any, this, i);
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

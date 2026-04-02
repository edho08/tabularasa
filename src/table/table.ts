import { Component, ComponentCtor } from '../entity/component';
import { Entry, EntryLifecycle, TableEntry } from './entry';
import { Entity } from '../entity/entity';
import type { TableManager } from './manager';

export class Table<T extends Entity<Component[]>> {
  readonly entityType: new () => T;
  readonly manager: TableManager;
  private entries: TableEntry<T>[] = [];
  private _columns: readonly ComponentCtor[] | undefined;

  constructor(entityType: new () => T, manager: TableManager) {
    this.entityType = entityType;
    this.manager = manager;
  }

  serializeable(): this {
    this.manager.addSerializable(this);
    return this;
  }

  insert(
    _entity: T,
    components: NoInfer<T extends Entity<infer C> ? C : never>,
  ): WeakRef<Entry<T>> {
    if (this._columns === undefined) {
      this._columns = components.map(c => c.constructor as ComponentCtor);
    }
    const entry = new TableEntry(components, this, this.entries.length);
    this.entries.push(entry);
    return entry.weak();
  }

  delete(ref: WeakRef<Entry<T>>): NoInfer<T extends Entity<infer C> ? C : never> {
    const entry = ref.deref() as TableEntry<T> | undefined;
    if (entry === undefined) return [] as any;
    if (entry.lifecycle === EntryLifecycle.DYING || entry.lifecycle === EntryLifecycle.DEAD)
      return [] as any;
    const idx = this.entries.indexOf(entry);
    if (idx < 0) return [] as any;
    entry.lifecycle = EntryLifecycle.DYING;
    entry.callDetached();
    const last = this.entries.pop();
    if (last === undefined) return [] as any;
    if (last !== entry) {
      last.index = idx;
      last.table = this as any;
      this.entries[idx] = last;
    }
    return entry.components as any;
  }

  has(entry: Entry<T>): boolean {
    return this.entries.includes(entry as TableEntry<T>);
  }

  deserialize(data: Record<string, unknown>[][]): void {
    for (const entry of this.entries) {
      entry.lifecycle = EntryLifecycle.DYING;
      entry.callDetached();
    }
    this.entries = [];
    for (let i = 0; i < data.length; i++) {
      const entry = TableEntry.deserialize(data[i], this, i);
      this.entries.push(entry as unknown as TableEntry<T>);
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
    if (this._columns === undefined && this.entries.length > 0) {
      throw new TypeError('Table has no columns defined');
    }
    if (this._columns === undefined) return [];
    return this.entries.map(entry => entry.serialize());
  }
}

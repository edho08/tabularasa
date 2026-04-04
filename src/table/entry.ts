import { Component, ComponentCtor } from '../entity/component';
import { Entity } from '../entity/entity';
import { EntityRegistry } from '../entity/registry';
import type { Table } from './table';

export enum EntryLifecycle {
  CONSTRUCTED = 0,
  ALIVE = 1,
  DYING = 2,
  DEAD = 3,
}

export interface AnyEntry {
  readonly index: number;
  readonly lifecycle: EntryLifecycle;
  readonly table: Table<any>;
  getAny(ctor: ComponentCtor): Component | undefined;
  getAllAny(ctor: ComponentCtor): Component[];
  setAny(value: Component): Component | undefined;
  setAtAny(value: Component, index: number): Component;
  hasAny(ctor: ComponentCtor): boolean;
  asAny(): AnyEntry;
}

export interface Entry<E extends Entity<any[]>> extends AnyEntry {
  readonly table: Table<E>;
  get<C extends E['columns'][number]>(ctor: { new (...args: any): C }): C;
  getAll<C extends E['columns'][number]>(ctor: { new (...args: any): C }): C[];
  getAt<const K extends keyof E['columns']>(
    index: K,
  ): K extends keyof E['columns'] ? E['columns'][K] : never;

  set<C extends E['columns'][number]>(value: C): C;
  setAt<const K extends keyof E['columns']>(
    index: K,
    value: E['columns'][K],
  ): K extends keyof E['columns'] ? E['columns'][K] : never;

  has<C extends E['columns'][number]>(ctor: { new (...args: any): C }): boolean;

  weak(): WeakRef<Entry<E>>;
  asEntry(): Entry<E>;
  asAny(): AnyEntry;
}

export class TableEntry<const E extends Entity<any[]>> implements Entry<E> {
  private _lifecycle: EntryLifecycle = EntryLifecycle.CONSTRUCTED;
  private _index: number = -1;
  private _table: Table<E> | undefined;
  components!: NoInfer<E extends Entity<infer C> ? C : never>;
  private backRefs = new Map<number, Set<TableEntry<any>>>();
  private _restrictCount = 0;
  private _ownCount = 0;

  set restrictCount(v: number) {
    this._restrictCount = v;
  }

  get restrictCount(): number {
    return this._restrictCount;
  }

  set ownCount(v: number) {
    this._ownCount = v;
  }

  get ownCount(): number {
    return this._ownCount;
  }

  set lifecycle(v: EntryLifecycle) {
    this._lifecycle = v;
  }

  set index(v: number) {
    this._index = v;
  }

  set table(v: Table<E> | undefined) {
    this._table = v;
  }

  get table(): Table<E> {
    if (this._table === undefined) throw new TypeError('Entry is not alive');
    return this._table;
  }

  get index(): number {
    if (this._lifecycle !== EntryLifecycle.ALIVE) throw new TypeError('Entry is not alive');
    return this._index;
  }

  get lifecycle(): EntryLifecycle {
    return this._lifecycle;
  }

  weak(): WeakRef<Entry<E>> {
    return new WeakRef(this);
  }

  asEntry(): Entry<E> {
    return this as unknown as Entry<E>;
  }

  asAny(): AnyEntry {
    return this;
  }

  constructor(
    components: NoInfer<E extends Entity<infer C> ? C : never>,
    table: Table<E>,
    index: number,
  ) {
    this.components = [...components] as NoInfer<E extends Entity<infer C> ? C : never>;
    this._table = table;
    this._index = index;
    this._lifecycle = EntryLifecycle.CONSTRUCTED;
    this.callAttached();
  }

  callAttached(): void {
    if (this._lifecycle !== EntryLifecycle.CONSTRUCTED)
      throw new TypeError('Entry is not constructed');
    this._lifecycle = EntryLifecycle.ALIVE;
    for (let i = 0; i < this.components.length; i++) {
      this.components[i].onAttached(this as unknown as AnyEntry, i);
    }
  }

  callDeserialized(): void {
    if (this._lifecycle !== EntryLifecycle.ALIVE) throw new TypeError('Entry is not alive');
    for (let i = 0; i < this.components.length; i++) {
      this.components[i].onDeserialized(this as unknown as AnyEntry, i);
    }
  }

  callDetached(): void {
    for (let i = 0; i < this.components.length; i++) {
      this.components[i].onDetached(this as unknown as AnyEntry, i);
    }
    if (this._lifecycle === EntryLifecycle.DYING) {
      this._lifecycle = EntryLifecycle.DEAD;
      this._table = undefined;
    }
  }

  get<C extends E['columns'][number]>(ctor: { new (...args: any): C }): C {
    if (this._lifecycle !== EntryLifecycle.ALIVE) throw new TypeError('Entry is not alive');
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0) throw new TypeError(`Component ${ctor.name} is not in component set`);
    return this.components[idx] as C;
  }

  getAny(ctor: ComponentCtor): Component | undefined {
    if (this._lifecycle !== EntryLifecycle.ALIVE) throw new TypeError('Entry is not alive');
    return this.components.find(c => c instanceof ctor);
  }

  getAll<C extends E['columns'][number]>(ctor: { new (...args: any): C }): C[] {
    if (this._lifecycle !== EntryLifecycle.ALIVE) throw new TypeError('Entry is not alive');
    return this.components.filter(c => c instanceof ctor) as C[];
  }

  getAllAny(ctor: ComponentCtor): Component[] {
    if (this._lifecycle !== EntryLifecycle.ALIVE) throw new TypeError('Entry is not alive');
    return this.components.filter(c => c instanceof ctor);
  }

  getAt<const K extends keyof E['columns']>(
    index: K,
  ): K extends keyof E['columns'] ? E['columns'][K] : never {
    if (this._lifecycle !== EntryLifecycle.ALIVE) throw new TypeError('Entry is not alive');
    const numIndex = index as number;
    if (numIndex < 0 || numIndex >= this.components.length)
      throw new TypeError(`Index ${String(index)} is out of bounds`);
    return this.components[numIndex] as K extends keyof E['columns'] ? E['columns'][K] : never;
  }

  has<C extends E['columns'][number]>(ctor: { new (...args: any): C }): boolean {
    if (this._lifecycle !== EntryLifecycle.ALIVE) throw new TypeError('Entry is not alive');
    return this.components.some(c => c instanceof ctor);
  }

  hasAny(ctor: ComponentCtor): boolean {
    if (this._lifecycle !== EntryLifecycle.ALIVE) throw new TypeError('Entry is not alive');
    return this.components.some(c => c instanceof ctor);
  }

  set<C extends E['columns'][number]>(value: C): C {
    if (this._lifecycle !== EntryLifecycle.ALIVE) throw new TypeError('Entry is not alive');
    const ctor = value.constructor as ComponentCtor;
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0) throw new TypeError(`Component ${ctor.name} is not in component set`);
    const old = this.components[idx];
    old.onDetached(this as unknown as AnyEntry, idx);
    this.components[idx] = value;
    value.onAttached(this as unknown as AnyEntry, idx);
    return old as C;
  }

  setAny(value: Component): Component | undefined {
    if (this._lifecycle !== EntryLifecycle.ALIVE) throw new TypeError('Entry is not alive');
    const ctor = value.constructor as ComponentCtor;
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0) throw new TypeError(`Component ${ctor.name} is not in component set`);
    const old = this.components[idx];
    old.onDetached(this as unknown as AnyEntry, idx);
    this.components[idx] = value as E['columns'][number];
    value.onAttached(this as unknown as AnyEntry, idx);
    return old;
  }

  setAt<const K extends keyof E['columns']>(
    index: K,
    value: E['columns'][K],
  ): K extends keyof E['columns'] ? E['columns'][K] : never {
    if (this._lifecycle !== EntryLifecycle.ALIVE) throw new TypeError('Entry is not alive');
    const numIndex = index as number;
    if (numIndex < 0 || numIndex >= this.components.length)
      throw new TypeError(`Index ${String(index)} is out of bounds`);
    const old = this.components[numIndex] as Component;
    old.onDetached(this as unknown as AnyEntry, numIndex);
    this.components[numIndex] = value as Component;
    (value as Component).onAttached(this as unknown as AnyEntry, numIndex);
    return old as K extends keyof E['columns'] ? E['columns'][K] : never;
  }

  setAtAny(value: Component, index: number): Component {
    if (this._lifecycle !== EntryLifecycle.ALIVE) throw new TypeError('Entry is not alive');
    const ctor = value.constructor as ComponentCtor;
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0) throw new TypeError(`Component ${ctor.name} is not in component set`);
    if (index < 0 || index >= this.components.length)
      throw new TypeError(`Index ${index} is out of bounds`);
    const old = this.components[index] as Component;
    old.onDetached(this as unknown as AnyEntry, index);
    this.components[index] = value as E['columns'][number];
    value.onAttached(this as unknown as AnyEntry, index);
    return old;
  }

  serialize(): Record<string, unknown>[] {
    return this.components.map(c => c.serialize(this as unknown as AnyEntry));
  }

  getBackRef<T extends Entity<any[]>>(
    entityType: new () => T,
    column: number,
  ): ReadonlySet<TableEntry<T>> {
    const key = (EntityRegistry.get(entityType) << 16) | column;
    const set = this.backRefs.get(key);
    if (set === undefined) return new Set() as ReadonlySet<TableEntry<T>>;
    return set as unknown as ReadonlySet<TableEntry<T>>;
  }

  setBackRef<T extends Entity<any[]>>(
    entityType: new () => T,
    column: number,
    entry: TableEntry<T>,
  ): void {
    const key = (EntityRegistry.get(entityType) << 16) | column;
    let set = this.backRefs.get(key);
    if (set === undefined) {
      set = new Set();
      this.backRefs.set(key, set);
    }
    set.add(entry as TableEntry<any>);
  }

  deleteBackRef<T extends Entity<any[]>>(
    entityType: new () => T,
    column: number,
    entry: TableEntry<T>,
  ): void {
    const key = (EntityRegistry.get(entityType) << 16) | column;
    const set = this.backRefs.get(key);
    if (set === undefined) return;
    set.delete(entry as TableEntry<any>);
    if (set.size === 0) this.backRefs.delete(key);
  }

  enforceBackRefs(): void {
    for (const [key, entries] of this.backRefs) {
      const column = key & 0xffff;
      for (const refEntry of entries) {
        const refComponent = refEntry.getAt(column) as { constructor: { policy: number } };
        const policy = refComponent.constructor.policy;
        if (policy === 1) {
          throw new TypeError('Cannot delete entry: restricted by reference');
        }
      }
    }

    for (const [key, entries] of this.backRefs) {
      const column = key & 0xffff;
      for (const refEntry of entries) {
        const refComponent = refEntry.getAt(column) as {
          constructor: { policy: number };
          target: AnyEntry | undefined;
        };
        const policy = refComponent.constructor.policy;

        if (policy === 0) {
          refEntry.table.delete(refEntry.weak());
        } else if (policy === 2 || policy === 3) {
          refComponent.target = undefined;
        }
      }
    }

    this.backRefs.clear();
  }

  static deserialize(
    componentsData: Record<string, unknown>[],
    table: Table<any>,
    index: number,
  ): Entry<Entity<any[]>> {
    const columns = table.columns;
    const components = columns.map((ctor: ComponentCtor, i: number) =>
      ctor.deserialize(componentsData[i]),
    );
    return new TableEntry(components as any, table as any, index);
  }
}

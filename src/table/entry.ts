import { Component, ComponentCtor } from '../entity/component';
import { Entity } from '../entity/entity';
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
  setAny(value: Component): Component | undefined;
  asAny(): AnyEntry;
}

export interface Entry<E extends Entity<Component[]>> extends AnyEntry {
  readonly table: Table<E>;
  get<C extends E['columns'][number]>(ctor: { new (...args: any): C }): C;
  getAt<const K extends keyof E['columns']>(
    index: K,
  ): K extends keyof E['columns'] ? E['columns'][K] : never;

  set<C extends E['columns'][number]>(ctor: { new (...args: any): C }, value: C): C;
  setAt<const K extends keyof E['columns']>(
    index: K,
    value: E['columns'][K],
  ): K extends keyof E['columns'] ? E['columns'][K] : never;

  has<C extends E['columns'][number]>(ctor: { new (...args: any): C }): boolean;

  weak(): WeakRef<Entry<E>>;
  asEntry(): Entry<E>;
  asAny(): AnyEntry;
}

export class TableEntry<const E extends Entity<Component[]>> implements Entry<E> {
  private _lifecycle: EntryLifecycle = EntryLifecycle.CONSTRUCTED;
  private _index: number = -1;
  private _table: Table<E> | undefined;
  components!: NoInfer<E extends Entity<infer C> ? C : never>;

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
    this._lifecycle = EntryLifecycle.ALIVE;
    for (const comp of this.components) {
      comp.onAttached(this as unknown as AnyEntry);
    }
  }

  callDeserialized(): void {
    if (this._lifecycle !== EntryLifecycle.ALIVE) throw new TypeError('Entry is not alive');
    for (const comp of this.components) comp.onDeserialized(this as unknown as AnyEntry);
  }

  callDetached(): void {
    for (const comp of this.components) comp.onDetached(this as unknown as AnyEntry);
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

  set<C extends E['columns'][number]>(ctor: { new (...args: any): C }, value: C): C {
    if (this._lifecycle !== EntryLifecycle.ALIVE) throw new TypeError('Entry is not alive');
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0) throw new TypeError(`Component ${ctor.name} is not in component set`);
    const old = this.components[idx];
    old.onDetached(this as unknown as AnyEntry);
    this.components[idx] = value;
    value.onAttached(this as unknown as AnyEntry);
    return old as C;
  }

  setAny(value: Component): Component | undefined {
    if (this._lifecycle !== EntryLifecycle.ALIVE) throw new TypeError('Entry is not alive');
    const ctor = value.constructor as ComponentCtor;
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0) throw new TypeError(`Component ${ctor.name} is not in component set`);
    const old = this.components[idx];
    old.onDetached(this as unknown as AnyEntry);
    this.components[idx] = value as E['columns'][number];
    value.onAttached(this as unknown as AnyEntry);
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
    old.onDetached(this as unknown as AnyEntry);
    this.components[numIndex] = value as Component;
    (value as Component).onAttached(this as unknown as AnyEntry);
    return old as K extends keyof E['columns'] ? E['columns'][K] : never;
  }

  serialize(): Record<string, unknown>[] {
    return this.components.map(c => c.serialize(this as unknown as AnyEntry));
  }

  static deserialize(
    componentsData: Record<string, unknown>[],
    table: Table<any>,
    index: number,
  ): Entry<Entity<Component[]>> {
    const columns = table.columns;
    const components = columns.map((ctor: ComponentCtor, i: number) =>
      ctor.deserialize(componentsData[i]),
    );
    return new TableEntry(components as any, table as Table<Entity<Component[]>>, index);
  }
}

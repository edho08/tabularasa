import { Component, ComponentCtor } from '../entity/component';
import { Entity } from '../entity/entity';
import type { Table } from './table';

type ComponentsOf<C extends readonly ComponentCtor[]> = {
  -readonly [K in keyof C]: C[K] extends new (...args: any[]) => infer I ? I : never;
};

export interface AnyEntry {
  readonly index: number;
  readonly isAlive: boolean;
  readonly table: Table<any>;
  getAny(ctor: ComponentCtor): Component | undefined;
  setAny(value: Component): Component | undefined;
}

export class Entry<T extends typeof Entity> implements AnyEntry {
  components: ComponentsOf<T['columns']>;
  readonly table: Table<T>;
  private _index: number = -1;
  private _alive: boolean = true;

  get index(): number {
    this.assertAlive();
    return this._index;
  }

  get isAlive(): boolean {
    return this._alive;
  }

  weak(): WeakRef<Entry<T>> {
    return new WeakRef(this);
  }

  private assertAlive(): void {
    if (!this._alive) throw new TypeError('Entry is not managed by any Table');
  }

  constructor(components: ComponentsOf<T['columns']>, table: Table<T>, index: number) {
    this.components = [...components];
    this.table = table;
    this._index = index;
    for (const comp of this.components) {
      comp.onAttached(this);
    }
  }

  callDeserialized(): void {
    this.assertAlive();
    for (const comp of this.components) comp.onDeserialized(this);
  }

  callDetached(): void {
    for (const comp of this.components) comp.onDetached(this);
  }

  callDead(): void {
    this._alive = false;
    for (const comp of this.components) comp.onDead(this);
  }

  get<Ctor extends T['columns'][number]>(ctor: Ctor): InstanceType<Ctor> {
    this.assertAlive();
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0)
      throw new TypeError(
        `Component ${ctor.name} is not in component set of [${this.table.entityType.columns.map(c => c.name).join(', ')}]`,
      );
    return this.components[idx] as InstanceType<Ctor>;
  }

  getAny(ctor: ComponentCtor): Component | undefined {
    this.assertAlive();
    return this.components.find(c => c instanceof ctor);
  }

  getAt<I extends number>(index: I): InstanceType<T['columns'][I]> {
    this.assertAlive();
    if (index < 0 || index >= this.table.entityType.columns.length)
      throw new TypeError(`Index ${index} is out of bounds`);
    return this.components[index] as InstanceType<T['columns'][I]>;
  }

  has<Ctor extends T['columns'][number]>(ctor: Ctor): boolean {
    this.assertAlive();
    return this.components.some(c => c instanceof ctor);
  }

  set<Ctor extends T['columns'][number]>(
    ctor: Ctor,
    value: InstanceType<Ctor>,
  ): InstanceType<Ctor> | undefined {
    this.assertAlive();
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0)
      throw new TypeError(
        `Component ${ctor.name} is not in component set of [${this.table.entityType.columns.map(c => c.name).join(', ')}]`,
      );
    const old = this.components[idx];
    old.onDetached(this);
    this.components[idx] = value;
    value.onAttached(this);
    return old as InstanceType<Ctor>;
  }

  setAny(value: Component): Component | undefined {
    this.assertAlive();
    const ctor = value.constructor as ComponentCtor;
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0)
      throw new TypeError(
        `Component ${ctor.name} is not in component set of [${this.table.entityType.columns.map(c => c.name).join(', ')}]`,
      );
    const old = this.components[idx];
    old.onDetached(this);
    this.components[idx] = value;
    value.onAttached(this);
    return old;
  }

  setAt<I extends number>(index: I, value: Component): Component | undefined {
    this.assertAlive();
    if (index < 0 || index >= this.table.entityType.columns.length)
      throw new TypeError(`Index ${index} is out of bounds`);
    const Expected = this.table.entityType.columns[index];
    const valueCtor = value.constructor as ComponentCtor;
    if (!(value instanceof Expected)) {
      throw new TypeError(
        `Type mismatch: expected ${Expected.name} at index ${index}, got ${valueCtor.name}`,
      );
    }
    const old = this.components[index] as Component;
    old.onDetached(this);
    this.components[index] = value as ComponentsOf<T['columns']>[number];
    value.onAttached(this);
    return old;
  }

  serialize(): Record<string, unknown>[] {
    return this.components.map(c => c.serialize(this));
  }

  static deserialize(
    componentsData: Record<string, unknown>[],
    table: Table<any>,
    index: number,
  ): Entry<typeof Entity> {
    const entityType = table.entityType;
    const components = entityType.columns.map((ctor: ComponentCtor, i: number) =>
      ctor.deserialize(componentsData[i]),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Entry(components as any, table, index);
  }
}

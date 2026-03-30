import { Component, ComponentCtor } from '../entity/component';
import { Entity } from '../entity/entity';
import type { Table } from './table';

type ComponentsOf<C extends readonly ComponentCtor[]> = {
  [K in keyof C]: C[K] extends new (...args: any[]) => infer I ? I : never;
};

export class Entry<T extends typeof Entity> {
  entityType: T;
  components: Component[];
  private _table?: Table<T>;
  private _index: number = -1;

  get table(): Table<T> | undefined {
    return this._table;
  }

  get index(): number {
    this.assertAlive();
    return this._index;
  }

  get isAlive(): boolean {
    return this._table !== undefined;
  }

  weak(): WeakRef<Entry<T>> {
    return new WeakRef(this);
  }

  private assertAlive(): void {
    if (this._table === undefined) throw new TypeError('Entry is not managed by any Table');
  }

  constructor(
    entityType: T,
    components: ComponentsOf<T['columns']>,
    table: Table<T>,
    index: number,
  ) {
    this.entityType = entityType;
    this.components = [...components] as Component[];
    this._table = table;
    this._index = index;
    for (const comp of this.components) {
      comp.onAttached(this);
    }
    for (const comp of this.components) {
      comp.onAlive(this);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callAlive(): void {
    for (const comp of this.components) comp.onAlive(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private callDead(): void {
    for (const comp of this.components) comp.onDead(this);
  }

  get<Ctor extends T['columns'][number]>(ctor: Ctor): InstanceType<Ctor> {
    this.assertAlive();
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0)
      throw new TypeError(
        `Component ${ctor.name} is not in component set of [${this.entityType.columns.map(c => c.name).join(', ')}]`,
      );
    return this.components[idx] as InstanceType<Ctor>;
  }

  getAt<I extends number>(index: I): InstanceType<T['columns'][I]> {
    if (index < 0 || index >= this.entityType.columns.length)
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
        `Component ${ctor.name} is not in component set of [${this.entityType.columns.map(c => c.name).join(', ')}]`,
      );
    const old = this.components[idx];
    old.onDetached(this);
    this.components[idx] = value;
    value.onAttached(this);
    if (this._table !== undefined) value.onAlive(this);
    return old as InstanceType<Ctor>;
  }

  setAny(value: Component): Component | undefined {
    this.assertAlive();
    const ctor = value.constructor as ComponentCtor;
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0)
      throw new TypeError(
        `Component ${ctor.name} is not in component set of [${this.entityType.columns.map(c => c.name).join(', ')}]`,
      );
    const old = this.components[idx];
    old.onDetached(this);
    this.components[idx] = value;
    value.onAttached(this);
    if (this._table !== undefined) value.onAlive(this);
    return old;
  }

  setAt<I extends number>(index: I, value: Component): Component | undefined {
    this.assertAlive();
    if (index < 0 || index >= this.entityType.columns.length)
      throw new TypeError(`Index ${index} is out of bounds`);
    const Expected = this.entityType.columns[index];
    const valueCtor = value.constructor as ComponentCtor;
    if (!(value instanceof Expected)) {
      throw new TypeError(
        `Type mismatch: expected ${Expected.name} at index ${index}, got ${valueCtor.name}`,
      );
    }
    const old = this.components[index];
    old.onDetached(this);
    this.components[index] = value;
    value.onAttached(this);
    if (this._table !== undefined) value.onAlive(this);
    return old;
  }

  serialize(): Record<string, unknown>[] {
    return this.components.map(c => c.serialize(this));
  }
}

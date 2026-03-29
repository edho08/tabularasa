import { Component, ComponentCtor } from './component';
import { Entity } from './entity';
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
    if (this._index < 0) throw new TypeError(`Entry does not have an index`);
    return this._index;
  }

  constructor(entityType: T, components: ComponentsOf<T['columns']>) {
    this.entityType = entityType;
    this.components = [...components] as Component[];
    for (const comp of components) {
      comp.attach(this);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private callAlive(): void {
    for (const comp of this.components) comp.alive(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private callDead(): void {
    for (const comp of this.components) comp.dead(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private setTable(t: Table<T> | undefined): void {
    if (this._table !== undefined && t !== undefined)
      throw new TypeError(`Entry already belongs to a Table`);
    if (this._table === undefined && t === undefined)
      throw new TypeError(`Entry is not in any Table`);
    this._table = t;
    if (t !== undefined) this.callAlive();
    else this.callDead();
  }

  get<Ctor extends T['columns'][number]>(ctor: Ctor): InstanceType<Ctor> {
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
    return this.components.some(c => c instanceof ctor);
  }

  set<Ctor extends T['columns'][number]>(
    ctor: Ctor,
    value: InstanceType<Ctor>,
  ): InstanceType<Ctor> | undefined {
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0)
      throw new TypeError(
        `Component ${ctor.name} is not in component set of [${this.entityType.columns.map(c => c.name).join(', ')}]`,
      );
    const old = this.components[idx];
    old.detach(this);
    this.components[idx] = value;
    value.attach(this);
    if (this._table !== undefined) value.alive(this);
    return old as InstanceType<Ctor>;
  }

  setAny(value: Component): Component | undefined {
    const ctor = value.constructor as ComponentCtor;
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0)
      throw new TypeError(
        `Component ${ctor.name} is not in component set of [${this.entityType.columns.map(c => c.name).join(', ')}]`,
      );
    const old = this.components[idx];
    old.detach(this);
    this.components[idx] = value;
    value.attach(this);
    if (this._table !== undefined) value.alive(this);
    return old;
  }

  setAt<I extends number>(index: I, value: Component): Component | undefined {
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
    old.detach(this);
    this.components[index] = value;
    value.attach(this);
    if (this._table !== undefined) value.alive(this);
    return old;
  }

  serialize(): Record<string, unknown>[] {
    return this.components.map(c => c.serialize(this));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static deserialize<T extends typeof Entity>(
    this: new (entityType: T, components: any) => Entry<T>,
    data: Record<string, unknown>[],
    entityType: T,
    table?: Table<T>,
    index?: number,
  ): Entry<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry = new this(entityType, [] as any);
    const components = entityType.columns.map((ctor, i) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctor as any).deserialize(data[i], entry),
    );
    entry.components = components;
    if (table && index !== undefined) {
      entry._table = table;
      entry._index = index;
    }
    return entry;
  }
}

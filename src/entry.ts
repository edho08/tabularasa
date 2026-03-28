import { Component, ComponentCtor } from './component';
import { Entity } from './entity';

export class Entry<E extends typeof Entity = typeof Entity> {
  entityType: E;
  components: Component[];
  readonly columns: readonly ComponentCtor[];

  constructor(entityType: E, components: Component[]) {
    this.entityType = entityType;
    this.components = components;
    this.columns = entityType.columns;
  }

  get<C extends ComponentCtor>(ctor: C): InstanceType<C> {
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0) throw new TypeError(`Component ${ctor.name} is not in this Entry`);
    return this.components[idx] as InstanceType<C>;
  }

  getAt<I extends number>(index: I): InstanceType<E['columns'][number]> {
    if (index < 0 || index >= this.columns.length)
      throw new TypeError(`Index ${index} is out of bounds`);
    return this.components[index] as InstanceType<E['columns'][number]>;
  }

  set<V extends InstanceType<E['columns'][number]>>(value: V): V | undefined {
    const ctor = value.constructor as ComponentCtor;
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0) throw new TypeError(`Component ${ctor.name} is not in this Entry`);
    const old = this.components[idx];
    this.components[idx] = value;
    return old as V;
  }

  setAny(value: Component): Component | undefined {
    const ctor = value.constructor as ComponentCtor;
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0) throw new TypeError(`Component ${value.constructor.name} is not in this Entry`);
    const old = this.components[idx];
    this.components[idx] = value;
    return old;
  }

  setAt<I extends number>(index: I, value: Component): Component | undefined {
    if (index < 0 || index >= this.columns.length)
      throw new TypeError(`Index ${index} is out of bounds`);
    const Expected = this.columns[index];
    const valueCtor = value.constructor as ComponentCtor;
    if (!(value instanceof Expected)) {
      throw new TypeError(
        `Type mismatch: expected ${Expected.name} at index ${index}, got ${valueCtor.name}`,
      );
    }
    const old = this.components[index];
    this.components[index] = value;
    return old;
  }
}

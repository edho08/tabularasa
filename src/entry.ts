import { Component, ComponentCtor } from './component';

type ComponentsOf<C extends readonly ComponentCtor[]> = {
  [K in keyof C]: C[K] extends new (...args: any[]) => infer I ? I : never;
};

export class Entry<
  T extends { columns: readonly ComponentCtor[] },
  C extends readonly ComponentCtor[] = T['columns'],
> {
  entityType: T;
  components: Component[];

  constructor(entityType: T, components: ComponentsOf<C>) {
    this.entityType = entityType;
    this.components = components as Component[];
    for (const comp of components) {
      comp.attach(this);
    }
  }

  get<Ctor extends C[number]>(ctor: Ctor): InstanceType<Ctor> {
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0) throw new TypeError(`Component ${ctor.name} is not in this Entry`);
    return this.components[idx] as InstanceType<Ctor>;
  }

  getAt<I extends number>(index: I): InstanceType<ComponentCtor> {
    if (index < 0 || index >= this.entityType.columns.length)
      throw new TypeError(`Index ${index} is out of bounds`);
    return this.components[index] as InstanceType<ComponentCtor>;
  }

  has<Ctor extends C[number]>(ctor: Ctor): boolean {
    return this.components.some(c => c instanceof ctor);
  }

  set<Ctor extends C[number]>(
    ctor: Ctor,
    value: InstanceType<Ctor>,
  ): InstanceType<Ctor> | undefined {
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0) throw new TypeError(`Component ${ctor.name} is not in this Entry`);
    const old = this.components[idx];
    old.detach(this);
    this.components[idx] = value;
    value.attach(this);
    return old as InstanceType<Ctor>;
  }

  setAny(value: Component): Component | undefined {
    const ctor = value.constructor as ComponentCtor;
    const idx = this.components.findIndex(c => c instanceof ctor);
    if (idx < 0) throw new TypeError(`Component ${ctor.name} is not in this Entry`);
    const old = this.components[idx];
    old.detach(this);
    this.components[idx] = value;
    value.attach(this);
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
    return old;
  }
}

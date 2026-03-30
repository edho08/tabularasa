import { Component } from '../component';
import type { Entry } from '../../table/entry';
import type { ComponentCtor } from '../component';

interface SubDefinition {
  ctor: ComponentCtor;
  reviver?: (data: unknown) => Component;
}

export class DerivedComponent<T extends Component = Component> extends Component {
  value: T;

  static base!: ComponentCtor;
  static subs: Map<string, SubDefinition> = new Map();
  static fallback?: (type: string, data: unknown) => Component;

  constructor(value: T) {
    super();
    this.value = value;
  }

  is<C extends ComponentCtor>(ctor: C): boolean {
    return this.value.constructor === ctor;
  }

  instanceOf<C extends ComponentCtor>(ctor: C): boolean {
    return this.value instanceof ctor;
  }

  override onAttached(entry: Entry<any>): void {
    this.value.onAttached(entry);
  }

  override onDetached(entry: Entry<any>): void {
    this.value.onDetached(entry);
  }

  override onAlive(entry: Entry<any>): void {
    this.value.onAlive(entry);
  }

  override onDead(entry: Entry<any>): void {
    this.value.onDead(entry);
  }

  override serialize(entry: Entry<any>): { type: string; data: Record<string, unknown> } {
    return {
      type: this.value.constructor.name,
      data: this.value.serialize(entry),
    };
  }

  static override deserialize(
    this: new (value: Component) => DerivedComponent,
    data: { type: string; data: Record<string, unknown> },
  ): DerivedComponent {
    const instance = new this(Object.create(null)) as DerivedComponent;
    const subs = (this as typeof DerivedComponent).subs;
    const fallback = (this as typeof DerivedComponent).fallback;
    const base = (this as typeof DerivedComponent).base;
    const sub = subs.get(data.type);

    if (sub) {
      if (sub.reviver) {
        instance.value = sub.reviver(data.data) as Component as DerivedComponent['value'];
      } else {
        instance.value = sub.ctor.deserialize(data.data) as Component as DerivedComponent['value'];
      }
    } else if (fallback) {
      instance.value = fallback(data.type, data.data) as Component as DerivedComponent['value'];
    } else {
      instance.value = base.deserialize(data.data) as Component as DerivedComponent['value'];
    }

    return instance;
  }
}

const derivedCache = new Map<string, typeof DerivedComponent>();

export function Derived<C extends ComponentCtor>(base: C): typeof DerivedComponent {
  const key = `Derived<${base.name}>`;
  let DerivedClass = derivedCache.get(key);
  if (!DerivedClass) {
    DerivedClass = class extends DerivedComponent {
      static override name = key;
      static base!: ComponentCtor;
      static subs: Map<string, SubDefinition> = new Map();
      static fallback?: (type: string, data: unknown) => Component;
      static sub<C extends ComponentCtor>(
        ctor: C,
        reviverFn?: (data: unknown) => InstanceType<C>,
      ): typeof DerivedComponent {
        this.subs.set(ctor.name, { ctor, reviver: reviverFn });
        return this;
      }
      static reviver(fn: (type: string, data: unknown) => Component): typeof DerivedComponent {
        this.fallback = fn;
        return this;
      }
    };
    DerivedClass.base = base;
    derivedCache.set(key, DerivedClass);
  }
  return DerivedClass;
}

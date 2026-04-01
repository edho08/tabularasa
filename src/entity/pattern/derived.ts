import { Component } from '../component';
import type { AnyEntry } from '../../table/entry';
import type { ComponentCtor } from '../component';

interface SubDefinition {
  ctor: ComponentCtor;
  reviver?: (data: unknown) => Component;
}

export class DerivedComponent<T extends Component = Component> extends Component {
  value: T;

  static base: ComponentCtor = undefined as unknown as ComponentCtor;
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

  override onAttached(entry: AnyEntry): void {
    this.value.onAttached(entry);
  }

  override onDetached(entry: AnyEntry): void {
    this.value.onDetached(entry);
  }

  override onDeserialized(entry: AnyEntry): void {
    this.value.onDeserialized(entry);
  }

  override serialize(entry: AnyEntry): { type: string; data: Record<string, unknown> } {
    return {
      type: this.value.constructor.name,
      data: this.value.serialize(entry),
    };
  }

  static deserialize(data: { type: string; data: Record<string, unknown> }): DerivedComponent {
    const instance = Object.create(this.prototype) as DerivedComponent;
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
  const cached = derivedCache.get(key);
  if (cached !== undefined) return cached;

  class DerivedClass extends DerivedComponent {
    static override name = key;
    static base: ComponentCtor = base;
    static subs: Map<string, SubDefinition> = new Map();
    static fallback?: (type: string, data: unknown) => Component;

    static sub<C2 extends ComponentCtor>(
      ctor: C2,
      reviverFn?: (data: unknown) => InstanceType<C2>,
    ): typeof DerivedComponent {
      this.subs.set(ctor.name, { ctor, reviver: reviverFn });
      return this as typeof DerivedComponent;
    }

    static reviver(fn: (type: string, data: unknown) => Component): typeof DerivedComponent {
      this.fallback = fn;
      return this as typeof DerivedComponent;
    }
  }

  derivedCache.set(key, DerivedClass as unknown as typeof DerivedComponent);
  return DerivedClass as unknown as typeof DerivedComponent;
}

import { Component } from '../component';
import { EntryLifecycle } from '../../table/entry';
import type { AnyEntry } from '../../table/entry';
import type { ComponentCtor } from '../component';

export class ReadonlyComponent<T extends Component = Component> extends Component {
  readonly value: T;

  static ctor: ComponentCtor;

  constructor(value: T) {
    super();
    this.value = value;
  }

  override onAttached(entry: AnyEntry): void {
    this.value.onAttached(entry);
  }

  override onDetached(entry: AnyEntry): void {
    if (entry.lifecycle === EntryLifecycle.ALIVE) {
      throw new TypeError(`cannot change readonly component`);
    }
    this.value.onDetached(entry);
  }

  override onDeserialized(entry: AnyEntry): void {
    this.value.onDeserialized(entry);
  }

  override serialize(entry: AnyEntry): Record<string, unknown> {
    return this.value.serialize(entry);
  }

  static deserialize(data: Record<string, unknown>): ReadonlyComponent {
    const instance = Object.create(this.prototype) as ReadonlyComponent;
    Object.defineProperty(instance, 'value', {
      value: this.ctor.deserialize(data),
      writable: false,
      enumerable: true,
      configurable: true,
    });
    return instance;
  }
}

const readonlyCache = new WeakMap<ComponentCtor, typeof ReadonlyComponent>();

export function Readonly<C extends ComponentCtor>(ctor: C): typeof ReadonlyComponent {
  const cached = readonlyCache.get(ctor);
  if (cached !== undefined) return cached;

  class ReadonlyClass extends ReadonlyComponent {
    static override name = `Readonly<${ctor.name}>`;
    static ctor: ComponentCtor = ctor;
  }

  readonlyCache.set(ctor, ReadonlyClass as unknown as typeof ReadonlyComponent);
  return ReadonlyClass as unknown as typeof ReadonlyComponent;
}

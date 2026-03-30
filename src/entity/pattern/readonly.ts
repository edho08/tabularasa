import { Component } from '../component';
import type { Entry } from '../../table/entry';
import type { ComponentCtor } from '../component';

export class ReadonlyComponent<T extends Component = Component> extends Component {
  readonly value: T;

  static ctor: ComponentCtor;

  constructor(value: T) {
    super();
    this.value = value;
  }

  override onAttached(entry: Entry<any>): void {
    this.value.onAttached(entry);
  }

  override onDetached(_entry: Entry<any>): void {
    throw new TypeError(`cannot change readonly component`);
  }

  override onAlive(entry: Entry<any>): void {
    this.value.onAlive(entry);
  }

  override onDead(entry: Entry<any>): void {
    this.value.onDead(entry);
  }

  override onDeserialized(entry: Entry<any>): void {
    this.value.onDeserialized(entry);
  }

  override serialize(entry: Entry<any>): Record<string, unknown> {
    return this.value.serialize(entry);
  }

  static deserialize(data: Record<string, unknown>): ReadonlyComponent {
    const instance = Object.create(this.prototype) as ReadonlyComponent;
    // @ts-expect-error - readonly property set during deserialization
    instance.value = this.ctor.deserialize(data) as ReadonlyComponent['value'];
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

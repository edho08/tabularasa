import { Component } from './component';
import type { Entry } from './entry';
import type { ComponentCtor } from './component';

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

  override serialize(entry: Entry<any>): Record<string, unknown> {
    return this.value.serialize(entry);
  }

  static override deserialize(
    this: new (value: Component) => ReadonlyComponent,
    data: Record<string, unknown>,
  ): ReadonlyComponent {
    const instance = new this(this.ctor.deserialize(data));
    return instance;
  }
}

const readonlyCache = new WeakMap<ComponentCtor, typeof ReadonlyComponent>();

export function Readonly<C extends ComponentCtor>(ctor: C): typeof ReadonlyComponent {
  let ReadonlyClass = readonlyCache.get(ctor);
  if (!ReadonlyClass) {
    const name = `Readonly<${ctor.name}>`;
    ReadonlyClass = class extends ReadonlyComponent {
      static override name = name;
    };
    ReadonlyClass.ctor = ctor;
    readonlyCache.set(ctor, ReadonlyClass);
  }
  return ReadonlyClass;
}

import { Component } from '../component';
import type { Entry } from '../../table/entry';
import type { ComponentCtor } from '../component';

export class OptionComponent<T extends Component = Component> extends Component {
  value?: T;

  static ctor: ComponentCtor;

  static create<T extends Component>(
    this: new (value?: T) => OptionComponent<T>,
    value: T,
  ): OptionComponent<T> {
    return new this(value);
  }

  constructor(value?: T) {
    super();
    this.value = value;
  }

  isSome(): boolean {
    return this.value !== undefined;
  }

  isNone(): boolean {
    return this.value === undefined;
  }

  unwrap(): T {
    if (this.value === undefined) throw new TypeError(`${this.constructor.name} has no value`);
    return this.value;
  }

  unwrapOr(defaultValue: T): T {
    return this.value ?? defaultValue;
  }

  onSome(fn: (value: T) => void): void {
    if (this.value !== undefined) fn(this.value);
  }

  onNone(fn: () => void): void {
    if (this.value === undefined) fn();
  }

  override onAttached(entry: Entry<any>): void {
    if (this.value) this.value.onAttached(entry);
  }

  override onDetached(entry: Entry<any>): void {
    if (this.value) this.value.onDetached(entry);
  }

  override onAlive(entry: Entry<any>): void {
    if (this.value) this.value.onAlive(entry);
  }

  override onDead(entry: Entry<any>): void {
    if (this.value) this.value.onDead(entry);
  }

  override serialize(entry: Entry<any>): Record<string, unknown> | null {
    return this.value ? this.value.serialize(entry) : null;
  }

  static override deserialize(
    this: new (...args: any[]) => OptionComponent,
    data: Record<string, unknown> | null,
  ): OptionComponent {
    const instance = new this() as OptionComponent;
    if (data !== null) {
      instance.value = this.ctor.deserialize(data) as OptionComponent['value'];
    }
    return instance;
  }
}

const optionCache = new WeakMap<ComponentCtor, typeof OptionComponent>();

export function Option<C extends ComponentCtor>(ctor: C): typeof OptionComponent {
  let OptionClass = optionCache.get(ctor);
  if (!OptionClass) {
    const name = `Option<${ctor.name}>`;
    OptionClass = class extends OptionComponent {
      static override name = name;
    };
    OptionClass.ctor = ctor;
    optionCache.set(ctor, OptionClass);
  }
  return OptionClass;
}

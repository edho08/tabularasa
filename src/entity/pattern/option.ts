import { Component } from '../component';
import type { AnyEntry } from '../../table/entry';
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

  override onAttached(entry: AnyEntry): void {
    if (this.value) this.value.onAttached(entry);
  }

  override onDetached(entry: AnyEntry): void {
    if (this.value) this.value.onDetached(entry);
  }

  override onDeserialized(entry: AnyEntry): void {
    if (this.value) this.value.onDeserialized(entry);
  }

  // @ts-expect-error - returns null for None case, base returns Record<string, unknown>
  override serialize(entry: AnyEntry): Record<string, unknown> | null {
    return this.value ? this.value.serialize(entry) : null;
  }

  static deserialize(data: Record<string, unknown> | null): OptionComponent {
    const instance = Object.create(this.prototype) as OptionComponent;
    if (data !== null) {
      instance.value = this.ctor.deserialize(data) as OptionComponent['value'];
    }
    return instance;
  }
}

const optionCache = new WeakMap<ComponentCtor, typeof OptionComponent>();

export function Option<C extends ComponentCtor>(ctor: C): typeof OptionComponent {
  const cached = optionCache.get(ctor);
  if (cached !== undefined) return cached;

  class OptionClass extends OptionComponent {
    static override name = `Option<${ctor.name}>`;
    static ctor: ComponentCtor = ctor;
  }

  optionCache.set(ctor, OptionClass as unknown as typeof OptionComponent);
  return OptionClass as unknown as typeof OptionComponent;
}

import { Component } from './component';
import type { Entry } from './entry';
import type { ComponentCtor } from './component';

export class Option<T extends Component = Component> extends Component {
  value?: T;

  static ctor: ComponentCtor;

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
    if (this.value === undefined) throw new TypeError('Option has no value');
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

  override attach(entry: Entry<any>): void {
    if (this.value) this.value.attach(entry);
  }

  override detach(entry: Entry<any>): void {
    if (this.value) this.value.detach(entry);
  }

  override alive(entry: Entry<any>): void {
    if (this.value) this.value.alive(entry);
  }

  override dead(entry: Entry<any>): void {
    if (this.value) this.value.dead(entry);
  }

  override serialize(entry: Entry<any>): Record<string, unknown> | null {
    return this.value ? this.value.serialize(entry) : null;
  }

  static override deserialize(
    this: new (...args: any[]) => Option,
    data: Record<string, unknown> | null,
  ): Option {
    const instance = new this() as Option;
    if (data !== null) {
      instance.value = this.ctor.deserialize(data) as Option['value'];
    }
    return instance;
  }
}

const optionCache = new WeakMap<ComponentCtor, typeof Option>();

export function Optional<C extends ComponentCtor>(ctor: C): typeof Option {
  let OptionClass = optionCache.get(ctor);
  if (!OptionClass) {
    const name = `Optional(${ctor.name})`;
    OptionClass = class extends Option {
      static override name = name;
    };
    OptionClass.ctor = ctor;
    optionCache.set(ctor, OptionClass);
  }
  return OptionClass;
}

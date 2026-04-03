import { Component, ComponentCtor } from '../entity/component';

class Option<C> {
  constructor(protected value: C | undefined) {}

  isSome(): boolean {
    return this.value !== undefined;
  }

  isNone(): boolean {
    return this.value === undefined;
  }

  unwrap(): C {
    if (this.value === undefined) {
      throw new TypeError('Cannot unwrap None');
    }
    return this.value;
  }

  static make<C>(value: C): Option<C> {
    return new this(value) as Option<C>;
  }

  static some<C>(value: C): Option<C> {
    return new this(value) as Option<C>;
  }

  static none<C>(): Option<C> {
    return new this(undefined) as Option<C>;
  }

  private static cache = new Map<ComponentCtor, new (value: any) => Option<any>>();

  static for<C extends Component>(ctor: new () => C): new (value: C | undefined) => Option<C> {
    const cached = Option.cache.get(ctor);
    if (cached !== undefined) {
      return cached as new (value: C | undefined) => Option<C>;
    }

    const MonoOption = class extends Option<C> {
      constructor(value: C | undefined) {
        super(value);
      }
    };

    Option.cache.set(ctor, MonoOption);
    return MonoOption as new (value: C | undefined) => Option<C>;
  }
}

export { Option };

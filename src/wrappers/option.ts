import { Component, ComponentCtor } from '../entity/component';
import type { AnyEntry } from '../table/entry';

class Option<C extends Component> extends Component {
  constructor(protected value: C | undefined) {
    super();
  }

  private static _ctor: ComponentCtor;

  get inner(): C | undefined {
    return this.value;
  }

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

  onAttached(entry: AnyEntry, index: number): void {
    if (this.value !== undefined) {
      this.value.onAttached(entry, index);
    }
  }

  onDetached(entry: AnyEntry, index: number): void {
    if (this.value !== undefined) {
      this.value.onDetached(entry, index);
    }
  }

  onDeserialized(entry: AnyEntry, index: number): void {
    if (this.value !== undefined) {
      this.value.onDeserialized(entry, index);
    }
  }

  serialize(_entry: AnyEntry): Record<string, unknown> {
    if (this.value === undefined) {
      return {};
    }
    return this.value.serialize(_entry);
  }

  static override deserialize(data: Record<string, unknown>): Option<Component> {
    const ctor = (this as any)._ctor;
    if (Object.keys(data).length === 0) {
      return new this(undefined) as Option<Component>;
    }
    const value = ctor.deserialize(data);
    return new this(value) as Option<Component>;
  }

  static make<C extends Component>(value: C | undefined): Option<C> {
    return new this(value) as Option<C>;
  }

  static some<C extends Component>(value: C): Option<C> {
    return new this(value) as Option<C>;
  }

  static none<C extends Component>(): Option<C> {
    return new this(undefined) as Option<C>;
  }

  private static ctorCache = new Map<new () => Component, new (value: any) => Option<any>>();
  private static methodCache = new Map<new () => Component, OptionStaticMethods<any>>();

  static for<C extends Component>(
    ctor: new () => C,
  ): (new (value: C | undefined) => Option<C>) & OptionStaticMethods<C> {
    const cachedCtor = Option.ctorCache.get(ctor);
    const cachedMethods = Option.methodCache.get(ctor);
    if (cachedCtor !== undefined && cachedMethods !== undefined) {
      return Object.assign(cachedCtor, cachedMethods) as (new (value: C | undefined) => Option<C>) &
        OptionStaticMethods<C>;
    }

    const MonoOption = class extends Option<C> {
      constructor(value: C | undefined) {
        super(value);
      }
    };
    (MonoOption as any)._ctor = ctor;

    const methods: OptionStaticMethods<C> = {
      make: (value: C | undefined) => new MonoOption(value) as Option<C>,
      some: (value: C) => new MonoOption(value) as Option<C>,
      none: () => new MonoOption(undefined) as Option<C>,
    };

    Option.ctorCache.set(ctor, MonoOption);
    Option.methodCache.set(ctor, methods);

    return Object.assign(MonoOption, methods) as (new (value: C | undefined) => Option<C>) &
      OptionStaticMethods<C>;
  }
}

interface OptionStaticMethods<C extends Component> {
  make(value: C | undefined): Option<C>;
  some(value: C): Option<C>;
  none(): Option<C>;
}

export { Option };

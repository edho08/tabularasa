import { Component, ComponentCtor } from '../entity/component';
import type { AnyEntry } from '../table/entry';

class Union extends Component {
  constructor(
    readonly inner: Component,
    private _variant: number,
  ) {
    super();
  }

  variant(): number {
    return this._variant;
  }

  onAttached(entry: AnyEntry, index: number): void {
    this.inner.onAttached(entry, index);
  }

  onDetached(entry: AnyEntry, index: number): void {
    this.inner.onDetached(entry, index);
  }

  onDeserialized(entry: AnyEntry, index: number): void {
    this.inner.onDeserialized(entry, index);
  }

  serialize(_entry: AnyEntry): Record<string, unknown> {
    return {
      variant: this._variant,
      data: this.inner.serialize(_entry),
    };
  }

  static override deserialize(data: Record<string, unknown>): Union {
    const ctors = (this as any)._ctors as ComponentCtor[];
    const variant = data.variant as number;
    const ctor = ctors[variant];
    const value = ctor.deserialize(data.data as Record<string, unknown>);
    return new this(value, variant);
  }

  static make(value: Component): Union {
    const ctors = (this as any)._ctors as ComponentCtor[];
    const variant = ctors.findIndex(c => c === value.constructor);
    if (variant < 0) throw new TypeError('Value constructor not in union');
    return new this(value, variant);
  }

  private static _ctors: ComponentCtor[];
  private static ctorCache = new Map<string, new (value: any) => Union>();
  private static methodCache = new Map<string, UnionStaticMethods>();

  static for<C extends Component[]>(
    ...ctors: C
  ): (new (value: C[number]) => Union) & UnionStaticMethods {
    const sortedCtors = ctors
      .map(c => c)
      .sort((a, b) => (a as any).name.localeCompare((b as any).name)) as ComponentCtor[];
    const key = sortedCtors.map(c => (c as any).name).join(',');
    const cachedCtor = Union.ctorCache.get(key);
    const cachedMethods = Union.methodCache.get(key);
    if (cachedCtor !== undefined && cachedMethods !== undefined) {
      return Object.assign(cachedCtor, cachedMethods) as (new (value: C[number]) => Union) &
        UnionStaticMethods;
    }

    const MonoUnion = class extends Union {
      constructor(value: Component) {
        const variant = sortedCtors.findIndex(c => c === value.constructor);
        if (variant < 0) throw new TypeError('Value constructor not in union');
        super(value, variant);
      }
    };
    (MonoUnion as any)._ctors = sortedCtors;

    const methods: UnionStaticMethods = {
      make: (value: Component) => new MonoUnion(value),
    };

    Union.ctorCache.set(key, MonoUnion);
    Union.methodCache.set(key, methods);

    return Object.assign(MonoUnion, methods) as (new (value: C[number]) => Union) &
      UnionStaticMethods;
  }
}

interface UnionStaticMethods {
  make(value: Component): Union;
}

export { Union };

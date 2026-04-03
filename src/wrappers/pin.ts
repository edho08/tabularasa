import { Component, ComponentCtor } from '../entity/component';
import { EntryLifecycle } from '../table/entry';
import type { AnyEntry } from '../table/entry';

class Pin<C extends Component> extends Component {
  constructor(readonly inner: C) {
    super();
  }

  private static _ctor: ComponentCtor;

  onAttached(entry: AnyEntry, index: number): void {
    this.inner.onAttached(entry, index);
  }

  onDetached(entry: AnyEntry, index: number): void {
    if (entry.lifecycle === EntryLifecycle.ALIVE) {
      throw new TypeError('Cannot remove pinned component');
    }
    this.inner.onDetached(entry, index);
  }

  onDeserialized(entry: AnyEntry, index: number): void {
    this.inner.onDeserialized(entry, index);
  }

  serialize(_entry: AnyEntry): Record<string, unknown> {
    return this.inner.serialize(_entry);
  }

  static override deserialize(data: Record<string, unknown>): Pin<Component> {
    const ctor = (this as any)._ctor;
    const value = ctor.deserialize(data);
    return new this(value) as Pin<Component>;
  }

  static make<C extends Component>(value: C): Pin<C> {
    return new this(value) as Pin<C>;
  }

  private static ctorCache = new Map<new () => Component, new (value: any) => Pin<any>>();
  private static methodCache = new Map<new () => Component, PinStaticMethods<any>>();

  static for<C extends Component>(
    ctor: new () => C,
  ): (new (value: C) => Pin<C>) & PinStaticMethods<C> {
    const cachedCtor = Pin.ctorCache.get(ctor);
    const cachedMethods = Pin.methodCache.get(ctor);
    if (cachedCtor !== undefined && cachedMethods !== undefined) {
      return Object.assign(cachedCtor, cachedMethods) as (new (value: C) => Pin<C>) &
        PinStaticMethods<C>;
    }

    const MonoPin = class extends Pin<C> {
      constructor(value: C) {
        super(value);
      }
    };
    (MonoPin as any)._ctor = ctor;

    const methods: PinStaticMethods<C> = {
      make: (value: C) => new MonoPin(value) as Pin<C>,
    };

    Pin.ctorCache.set(ctor, MonoPin);
    Pin.methodCache.set(ctor, methods);

    return Object.assign(MonoPin, methods) as (new (value: C) => Pin<C>) & PinStaticMethods<C>;
  }
}

interface PinStaticMethods<C extends Component> {
  make(value: C): Pin<C>;
}

export { Pin };

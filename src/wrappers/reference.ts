import { Component } from '../entity/component';
import { Entity } from '../entity/entity';
import type { AnyEntry, TableEntry } from '../table/entry';
import { EntryLifecycle } from '../table/entry';

export enum DeletePolicy {
  CASCADE = 0,
  RESTRICT = 1,
  SETNULL = 2,
  OWN = 3,
}

class Reference<E extends Entity<any[]>> extends Component {
  declare readonly _entityType: E;
  static entityCtor: new () => Entity<any[]>;
  static policy: DeletePolicy;

  constructor(public target: AnyEntry | undefined) {
    super();
  }

  onAttached(entry: AnyEntry, index: number): void {
    if (this.target === undefined) return;
    const targetEntry = this.target as TableEntry<any>;
    if (
      targetEntry.lifecycle === EntryLifecycle.DYING ||
      targetEntry.lifecycle === EntryLifecycle.DEAD
    )
      return;

    const policy = (this.constructor as typeof Reference).policy;
    const entityCtor = (this.constructor as typeof Reference).entityCtor;
    const entryTable = entry as unknown as TableEntry<any>;

    if (policy === DeletePolicy.OWN) {
      if (targetEntry.ownCount > 0) throw new TypeError('Target is already owned');
      targetEntry.ownCount++;
    }
    if (policy === DeletePolicy.RESTRICT) {
      targetEntry.restrictCount++;
    }
    targetEntry.setBackRef(entityCtor, index, entryTable);
  }

  onDetached(entry: AnyEntry, index: number): void {
    if (this.target === undefined) return;
    const targetEntry = this.target as TableEntry<any>;
    if (
      targetEntry.lifecycle === EntryLifecycle.DYING ||
      targetEntry.lifecycle === EntryLifecycle.DEAD
    )
      return;

    const policy = (this.constructor as typeof Reference).policy;
    const entityCtor = (this.constructor as typeof Reference).entityCtor;
    const entryTable = entry as unknown as TableEntry<any>;

    targetEntry.deleteBackRef(entityCtor, index, entryTable);
    if (policy === DeletePolicy.RESTRICT) {
      targetEntry.restrictCount--;
    }
    if (policy === DeletePolicy.OWN) {
      targetEntry.ownCount--;
    }

    if (policy === DeletePolicy.OWN) {
      targetEntry.table.delete(targetEntry.weak());
    }
  }

  static make<E extends Entity<any[]>>(target: AnyEntry | undefined): Reference<E> {
    return new this(target) as Reference<E>;
  }

  private static ctorCache = new Map<
    string,
    new (target: AnyEntry | undefined) => Reference<any>
  >();
  private static methodCache = new Map<string, ReferenceStaticMethods<any>>();

  static for<E extends Entity<any[]>>(
    entityCtor: new () => E,
    policy: DeletePolicy,
  ): (new (target: AnyEntry | undefined) => Reference<E>) & ReferenceStaticMethods<E> {
    const key = `${(entityCtor as any).name}:${policy}`;
    const cachedCtor = Reference.ctorCache.get(key);
    const cachedMethods = Reference.methodCache.get(key);
    if (cachedCtor !== undefined && cachedMethods !== undefined) {
      return Object.assign(cachedCtor, cachedMethods) as (new (
        target: AnyEntry | undefined,
      ) => Reference<E>) &
        ReferenceStaticMethods<E>;
    }

    const MonoReference = class extends Reference<E> {
      constructor(target: AnyEntry | undefined) {
        super(target);
      }
    };
    (MonoReference as any).entityCtor = entityCtor;
    (MonoReference as any).policy = policy;

    const methods: ReferenceStaticMethods<E> = {
      make: (target: AnyEntry | undefined) => new MonoReference(target) as Reference<E>,
    };

    Reference.ctorCache.set(key, MonoReference);
    Reference.methodCache.set(key, methods);

    return Object.assign(MonoReference, methods) as (new (
      target: AnyEntry | undefined,
    ) => Reference<E>) &
      ReferenceStaticMethods<E>;
  }
}

interface ReferenceStaticMethods<E extends Entity<any[]>> {
  make(target: AnyEntry | undefined): Reference<E>;
}

export { Reference };

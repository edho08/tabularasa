import { Component } from '../component';
import { EntryLifecycle } from '../../table/entry';
import type { AnyEntry, Entry } from '../../table/entry';
import type { Entity } from '../entity';
import { Resource } from '../../world/resource';

export class OwnManager extends Resource {
  private ownedToOwner = new WeakMap<Entry<any>, Entry<any>>();
  private ownerToOwned = new WeakMap<Entry<any>, Set<Entry<any>>>();

  register(owner: Entry<any>, owned: Entry<any>): void {
    const existing = this.ownedToOwner.get(owned);
    if (existing !== undefined) {
      throw new TypeError(`Entry is already owned by another entity`);
    }

    this.ownedToOwner.set(owned, owner);

    let ownedSet = this.ownerToOwned.get(owner);
    if (ownedSet === undefined) {
      ownedSet = new Set();
      this.ownerToOwned.set(owner, ownedSet);
    }
    ownedSet.add(owned);
  }

  unregister(owned: Entry<any>): void {
    const owner = this.ownedToOwner.get(owned);
    if (owner === undefined) return;

    this.ownedToOwner.delete(owned);

    const ownedSet = this.ownerToOwned.get(owner);
    if (ownedSet !== undefined) {
      ownedSet.delete(owned);
      if (ownedSet.size === 0) {
        this.ownerToOwned.delete(owner);
      }
    }
  }

  getOwner(owned: Entry<any>): Entry<any> | undefined {
    return this.ownedToOwner.get(owned);
  }
}

export class OwnedComponent extends Component {
  private _entry?: AnyEntry;

  override onAttached(entry: AnyEntry): void {
    this._entry = entry;
  }

  override onDetached(_entry: AnyEntry): void {
    this._entry = undefined;
  }

  get owner(): AnyEntry | undefined {
    if (!this._entry) return undefined;
    const manager = this._entry.table?.manager.world?.getResource(OwnManager);
    if (!manager) return undefined;
    return manager.getOwner(this._entry as any);
  }
}

export class OwnComponent<T extends typeof Entity = typeof Entity> extends Component {
  private _ref: WeakRef<Entry<T>> | null = null;
  private _owner?: AnyEntry;

  static create<E extends typeof Entity>(
    this: new (entry: Entry<E>) => OwnComponent<E>,
    entry?: Entry<E>,
  ): OwnComponent<E> {
    return new this(entry as Entry<E>);
  }

  constructor(entry?: Entry<T>) {
    super();
    if (entry) {
      this._ref = new WeakRef(entry);
    }
  }

  setRef(entry: Entry<T>): void {
    this._ref = new WeakRef(entry);
  }

  get ref(): WeakRef<Entry<T>> | null {
    return this._ref;
  }

  override onAttached(owner: AnyEntry): void {
    this._owner = owner;
    const owned = this._ref?.deref();
    if (owned) {
      const manager = owner.table?.manager.world?.getResource(OwnManager);
      if (manager) {
        manager.register(owner as Entry<typeof Entity>, owned as Entry<typeof Entity>);
      }
    }
  }

  override onDetached(owner: AnyEntry): void {
    const owned = this._ref?.deref() as Entry<T> | undefined;
    if (owner.lifecycle === EntryLifecycle.DYING && owned && owned.table !== undefined) {
      owned.table.delete(owned.weak());
    }
    if (owned) {
      const manager = this._owner?.table?.manager.world?.getResource(OwnManager);
      if (manager) {
        manager.unregister(owned as Entry<typeof Entity>);
      }
    }
    this._owner = undefined;
  }
}

const ownCache = new WeakMap<typeof Entity, typeof OwnComponent>();

export function Own<E extends typeof Entity>(entity: E): typeof OwnComponent {
  const cached = ownCache.get(entity);
  if (cached !== undefined) return cached as unknown as typeof OwnComponent;

  class OwnClass extends OwnComponent<E> {
    static override name = `Own<${entity.name}>`;
  }

  ownCache.set(entity, OwnClass as unknown as typeof OwnComponent);
  return OwnClass as unknown as typeof OwnComponent;
}

import { Entity } from '../entity/entity';
import { TableManager } from '../table/manager';
import { Table } from '../table/table';
import { Resource } from './resource';

export class World {
  private resources = new Map<typeof Resource, Resource>();

  constructor() {
    this.setResource(TableManager, new TableManager());
  }

  getResource<T extends Resource>(type: new (...args: never[]) => T): T | undefined {
    return this.resources.get(type) as T | undefined;
  }

  setResource<T extends Resource>(type: new (...args: never[]) => T, resource: T): void {
    this.resources.set(type, resource);
    resource.attach(this);
  }

  getTable<E extends typeof Entity>(entity: E): Table<E> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.getResource(TableManager)!.getTable(entity);
  }

  serialize(entities: (typeof Entity)[]): unknown[][] {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.getResource(TableManager)!.serialize(entities);
  }

  deserialize(entities: (typeof Entity)[], data: unknown[][]): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.getResource(TableManager)!.deserialize(entities, data);
  }
}

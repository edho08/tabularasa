import { OwnManager } from '../entity/pattern/own';
import { TableManager } from '../table/manager';
import { Resource } from './resource';

export class World {
  private resources = new Map<typeof Resource, Resource>();

  constructor() {
    this.setResource(TableManager, new TableManager());
    this.setResource(OwnManager, new OwnManager());
  }

  getResource<T extends Resource>(type: new (...args: never[]) => T): T | undefined {
    return this.resources.get(type) as T | undefined;
  }

  setResource<T extends Resource>(type: new (...args: never[]) => T, resource: T): void {
    this.resources.set(type, resource);
    resource.attach(this);
  }

  get tables(): TableManager {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.getResource(TableManager)!;
  }
}

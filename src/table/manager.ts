import { Entity } from '../entity/entity';
import { Resource } from '../world/resource';
import { Table } from './table';

export class TableManager extends Resource {
  private tables: Map<typeof Entity, Table<any>> = new Map();

  getTable<E extends typeof Entity>(entityType: E): Table<E> {
    let table = this.tables.get(entityType);
    if (!table) {
      table = new Table(entityType, this);
      this.tables.set(entityType, table);
    }
    return table as Table<E>;
  }

  hasTable<E extends typeof Entity>(entityType: E): boolean {
    return this.tables.has(entityType);
  }

  serialize(entities: (typeof Entity)[]): unknown[][] {
    const result: unknown[][] = [];
    for (const entity of entities) {
      const table = this.tables.get(entity);
      if (!table) throw new TypeError(`No table for entity ${entity.name}`);
      result.push(table.serialize());
    }
    return result;
  }

  deserialize(entities: (typeof Entity)[], data: unknown[][]): void {
    if (entities.length !== data.length)
      throw new TypeError(
        `Entity count ${entities.length} does not match data length ${data.length}`,
      );
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const table = this.tables.get(entity);
      if (!table) throw new TypeError(`No table for entity ${entity.name}`);
      table.deserialize(data[i] as Record<string, unknown>[]);
    }
    for (const entity of entities) {
      const table = this.tables.get(entity);
      if (table) table.onDeserialized();
    }
  }
}

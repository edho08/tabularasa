import { Entity } from '../entity/entity';
import { Resource } from '../world/resource';
import type { Table } from './table';
import { TableInner } from './table';

export class TableManager extends Resource {
  private tables: Map<any, TableInner<any>> = new Map();
  private serializableTables: Set<TableInner<any>> = new Set();

  get<E extends Entity<any[]>>(entityType: new () => E): Table<E> {
    let table = this.tables.get(entityType);
    if (!table) {
      table = new TableInner(entityType, this);
      this.tables.set(entityType, table);
    }
    return table as TableInner<E>;
  }

  addSerializable(table: TableInner<any>): void {
    this.serializableTables.add(table);
  }

  serialize(): Map<any, unknown[]> {
    const result = new Map<any, unknown[]>();
    for (const table of this.serializableTables) {
      result.set(table.entityType, table.serialize());
    }
    return result;
  }

  deserialize(data: Map<any, unknown[]>): void {
    for (const table of this.serializableTables) {
      const tableData = data.get(table.entityType);
      if (tableData !== undefined) {
        table.deserialize(tableData as Record<string, unknown>[][]);
      }
    }
    for (const table of this.serializableTables) {
      table.onDeserialized();
    }
  }
}

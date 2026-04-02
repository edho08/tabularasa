import { Component } from '../entity/component';
import { Entity } from '../entity/entity';
import { Resource } from '../world/resource';
import { Table } from './table';

export class TableManager extends Resource {
  private tables: Map<Entity<Component[]>, Table<any>> = new Map();
  private serializableTables: Set<Table<any>> = new Set();

  getTable<E extends Entity<Component[]>>(entityType: E): Table<E> {
    let table = this.tables.get(entityType);
    if (!table) {
      table = new Table(entityType, this);
      this.tables.set(entityType, table);
    }
    return table as Table<E>;
  }

  hasTable<E extends Entity<Component[]>>(entityType: E): boolean {
    return this.tables.has(entityType);
  }

  addSerializable(table: Table<any>): void {
    this.serializableTables.add(table);
  }

  serialize(): Map<Entity<Component[]>, unknown[]> {
    const result = new Map<Entity<Component[]>, unknown[]>();
    for (const table of this.serializableTables) {
      result.set(table.entityType, table.serialize());
    }
    return result;
  }

  deserialize(data: Map<Entity<Component[]>, unknown[]>): void {
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

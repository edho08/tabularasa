import { Entity } from '../entity/entity';
import { Table } from './table';
export { Table };

export class TableManager {
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
}

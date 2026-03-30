import { describe, it, expect } from 'vitest';
import { Component } from '../../src/entity/component';
import { Entity } from '../../src/entity/entity';
import { Columns } from '../../src/entity/entity';
import { Table } from '../../src/table/table';
import { TableManager } from '../../src/table/manager';

class Position extends Component {
  x = 0;
  y = 0;
}

class Velocity extends Component {
  vx = 0;
  vy = 0;
}

class Actor extends Entity {
  static columns = Columns(Position, Velocity);
}

class Enemy extends Entity {
  static columns = Columns(Position);
}

describe('TableManager', () => {
  const manager = new TableManager();

  describe('getTable', () => {
    it('creates and returns a new table for unknown entity', () => {
      const table = manager.getTable(Actor);

      expect(table).toBeDefined();
      expect(table).toBeInstanceOf(Table);
    });

    it('returns same table on multiple calls', () => {
      const table1 = manager.getTable(Actor);
      const table2 = manager.getTable(Actor);

      expect(table1).toBe(table2);
    });

    it('table has manager reference', () => {
      const table = manager.getTable(Actor);

      expect(table.manager).toBe(manager);
    });
  });

  describe('hasTable', () => {
    it('returns true after getTable', () => {
      manager.getTable(Actor);

      expect(manager.hasTable(Actor)).toBe(true);
    });

    it('returns false for unknown entity', () => {
      expect(manager.hasTable(Enemy)).toBe(false);
    });
  });

  describe('multiple entity types', () => {
    it('returns different tables for different entities', () => {
      const actorTable = manager.getTable(Actor);
      const enemyTable = manager.getTable(Enemy);

      expect(actorTable).not.toBe(enemyTable);
    });
  });
});

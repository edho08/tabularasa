import { describe, it, expect } from 'vitest';
import { Component } from '../../src/entity/component';
import { Entity } from '../../src/entity/entity';
import { TableInner } from '../../src/table/table';
import { TableManager } from '../../src/table/manager';

class Position extends Component {
  x = 0;
  y = 0;
  onAttached(): void {}
  onDetached(): void {}
  onAlive(): void {}
  onDead(): void {}
}

class Velocity extends Component {
  vx = 0;
  vy = 0;
  onAttached(): void {}
  onDetached(): void {}
  onAlive(): void {}
  onDead(): void {}
}

class Actor extends Entity<[typeof Position, typeof Velocity]> {}
class Enemy extends Entity<[typeof Position]> {}

describe('TableManager', () => {
  const manager = new TableManager();

  describe('get', () => {
    it('creates and returns a new table for unknown entity', () => {
      const table = manager.get(Actor);

      expect(table).toBeDefined();
      expect(table).toBeInstanceOf(TableInner);
    });

    it('returns same table on multiple calls', () => {
      const table1 = manager.get(Actor);
      const table2 = manager.get(Actor);

      expect(table1).toBe(table2);
    });

    it('table has manager reference', () => {
      const table = manager.get(Actor);

      expect(table.manager).toBe(manager);
    });
  });

  describe('multiple entity types', () => {
    it('returns different tables for different entities', () => {
      const actorTable = manager.get(Actor);
      const enemyTable = manager.get(Enemy);

      expect(actorTable).not.toBe(enemyTable);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { Component } from '../../src/entity/component';
import { Entity } from '../../src/entity/entity';
import { TableInner } from '../../src/table/table';
import { TableManager } from '../../src/table/manager';
import { World } from '../../src/world/world';

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

class Actor extends Entity<[Position, Velocity]> {}

describe('World', () => {
  describe('constructor', () => {
    it('registers TableManager as a resource', () => {
      const world = new World();
      const manager = world.getResource(TableManager);

      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(TableManager);
    });

    it('sets world reference on TableManager', () => {
      const world = new World();
      const manager = world.getResource(TableManager);

      expect(manager?.world).toBe(world);
    });
  });

  describe('getResource', () => {
    it('returns undefined for unknown resource', () => {
      const world = new World();

      expect(world.getResource(World)).toBeUndefined();
    });
  });

  describe('tables', () => {
    it('returns the TableManager resource', () => {
      const world = new World();

      expect(world.tables).toBeDefined();
      expect(world.tables).toBeInstanceOf(TableManager);
    });

    it('returns table for entity type', () => {
      const world = new World();

      const table = world.tables.get(Actor);

      expect(table).toBeDefined();
      expect(table).toBeInstanceOf(TableInner);
    });

    it('returns same table on multiple calls', () => {
      const world = new World();

      const table1 = world.tables.get(Actor);
      const table2 = world.tables.get(Actor);

      expect(table1).toBe(table2);
    });

    it('creates entries in the table', () => {
      const world = new World();
      const table = world.tables.get(Actor) as TableInner<Actor>;
      const ref = table.insert([new Position(), new Velocity()]);

      expect(ref.deref()).toBeDefined();
    });
  });
});

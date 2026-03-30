import { describe, it, expect } from 'vitest';
import { Component } from '../../src/entity/component';
import { Entity, Columns } from '../../src/entity/entity';
import { TableManager } from '../../src/table/manager';
import { Resource } from '../../src/world/resource';
import { World } from '../../src/world/world';

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

class CustomResource extends Resource {
  data = 'custom';
}

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

      expect(world.getResource(CustomResource)).toBeUndefined();
    });

    it('returns resource after setResource', () => {
      const world = new World();
      const resource = new CustomResource();

      world.setResource(CustomResource, resource);

      expect(world.getResource(CustomResource)).toBe(resource);
    });

    it('returns same resource on multiple calls', () => {
      const world = new World();
      const resource = new CustomResource();

      world.setResource(CustomResource, resource);

      expect(world.getResource(CustomResource)).toBe(resource);
      expect(world.getResource(CustomResource)).toBe(resource);
    });

    it('attaches world to resource on setResource', () => {
      const world = new World();
      const resource = new CustomResource();

      world.setResource(CustomResource, resource);

      expect(resource.world).toBe(world);
    });
  });

  describe('setResource', () => {
    it('overwrites existing resource', () => {
      const world = new World();
      const resource1 = new CustomResource();
      const resource2 = new CustomResource();

      world.setResource(CustomResource, resource1);
      world.setResource(CustomResource, resource2);

      expect(world.getResource(CustomResource)).toBe(resource2);
      expect(world.getResource(CustomResource)).not.toBe(resource1);
    });
  });

  describe('getTable', () => {
    it('returns table for entity type', () => {
      const world = new World();

      const table = world.getTable(Actor);

      expect(table).toBeDefined();
      expect(table.entityType).toBe(Actor);
    });

    it('returns same table on multiple calls', () => {
      const world = new World();

      const table1 = world.getTable(Actor);
      const table2 = world.getTable(Actor);

      expect(table1).toBe(table2);
    });

    it('creates entries in the table', () => {
      const world = new World();
      const table = world.getTable(Actor);
      const ref = table.insert([new Position(), new Velocity()]);

      expect(ref.deref()).toBeDefined();
    });
  });

  describe('TableManager integration', () => {
    it('getTable uses the registered TableManager resource', () => {
      const world = new World();

      const table = world.getTable(Actor);
      const manager = world.getResource(TableManager);

      expect(table.manager).toBe(manager);
    });
  });
});

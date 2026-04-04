import { describe, it, expect, beforeEach } from 'vitest';
import { Entity } from '../../src/entity/entity';
import { EntityRegistry } from '../../src/entity/registry';
import { Component } from '../../src/entity/component';
import { World } from '../../src/world/world';

class Position extends Component {}
class Velocity extends Component {}

class Actor extends Entity<[Position, Velocity]> {}
class Enemy extends Entity<[Position]> {}
class NPC extends Entity<[Position, Velocity]> {}

describe('EntityRegistry', () => {
  beforeEach(() => {
    (EntityRegistry as any).nextId = 0;
    (EntityRegistry as any).ids = new Map();
    (Actor as any).id = undefined;
    (Enemy as any).id = undefined;
    (NPC as any).id = undefined;
  });

  describe('get', () => {
    it('assigns sequential IDs', () => {
      const id1 = EntityRegistry.get(Actor);
      const id2 = EntityRegistry.get(Enemy);
      const id3 = EntityRegistry.get(NPC);

      expect(id1).toBe(0);
      expect(id2).toBe(1);
      expect(id3).toBe(2);
    });

    it('returns the same ID for the same constructor', () => {
      const id1 = EntityRegistry.get(Actor);
      const id2 = EntityRegistry.get(Actor);

      expect(id1).toBe(id2);
    });

    it('sets the id property on the constructor', () => {
      EntityRegistry.get(Actor);

      expect(Actor.id).toBe(0);
    });

    it('does not reassign if id is already set', () => {
      const id1 = EntityRegistry.get(Actor);
      const id2 = EntityRegistry.get(Actor);

      expect(id1).toBe(id2);
      expect(Actor.id).toBe(id1);
    });
  });
});

describe('Entity static id', () => {
  beforeEach(() => {
    (EntityRegistry as any).nextId = 0;
    (EntityRegistry as any).ids = new Map();
    (Actor as any).id = undefined;
    (Enemy as any).id = undefined;
    (NPC as any).id = undefined;
  });

  it('starts as undefined', () => {
    expect(Actor.id).toBeUndefined();
  });

  it('gets assigned via EntityRegistry.get', () => {
    EntityRegistry.get(Actor);

    expect(Actor.id).toBe(0);
  });
});

describe('Entity id via TableManager', () => {
  beforeEach(() => {
    (EntityRegistry as any).nextId = 0;
    (EntityRegistry as any).ids = new Map();
    (Actor as any).id = undefined;
    (Enemy as any).id = undefined;
    (NPC as any).id = undefined;
  });

  it('assigns entity id on first world.tables.get', () => {
    const world = new World();

    world.tables.get(Actor);

    expect(Actor.id).toBe(0);
  });

  it('assigns different ids to different entity types', () => {
    const world = new World();

    world.tables.get(Actor);
    world.tables.get(Enemy);

    expect(Actor.id).toBe(0);
    expect(Enemy.id).toBe(1);
    expect(Actor.id).not.toBe(Enemy.id);
  });

  it('does not reassign on second world.tables.get', () => {
    const world1 = new World();
    const world2 = new World();

    world1.tables.get(Actor);
    const id1 = Actor.id;

    world2.tables.get(Actor);
    const id2 = Actor.id;

    expect(id1).toBe(id2);
  });

  it('works with composite key pattern (entity_id << 16 | column)', () => {
    const world = new World();

    world.tables.get(Actor);

    expect(Actor.id).toBeDefined();
    const key0 = ((Actor.id as number) << 16) | 0;
    const key1 = ((Actor.id as number) << 16) | 1;

    expect(key0).toBe(0);
    expect(key1).toBe(1);
    expect(key0).not.toBe(key1);
  });

  it('composite keys are unique across entities', () => {
    const world = new World();

    world.tables.get(Actor);
    world.tables.get(Enemy);

    expect(Actor.id).toBeDefined();
    expect(Enemy.id).toBeDefined();
    const actorKey0 = ((Actor.id as number) << 16) | 0;
    const enemyKey0 = ((Enemy.id as number) << 16) | 0;

    expect(actorKey0).not.toBe(enemyKey0);
  });
});

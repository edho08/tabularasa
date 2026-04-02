import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '../../src/entity/component';
import { Entity } from '../../src/entity/entity';
import { Entry, EntryLifecycle } from '../../src/table/entry';
import { TableInner } from '../../src/table/table';
import { TableManager } from '../../src/table/manager';

const manager = new TableManager();

class Position extends Component {
  x = 0;
  y = 0;
}

class Velocity extends Component {
  vx = 0;
  vy = 0;
}

class Health extends Component {
  hp = 100;
}

class Unused extends Component {
  value = 'unused';
}

class Actor extends Entity<[Position, Velocity]> {}

class TrackedPosition extends Position {
  static attachCalls = 0;
  static detachCalls = 0;
  static aliveCalls = 0;
  static deadCalls = 0;

  onAttached(): void {
    TrackedPosition.attachCalls++;
  }

  onDetached(): void {
    TrackedPosition.detachCalls++;
  }

  onAlive(): void {
    TrackedPosition.aliveCalls++;
  }

  onDead(): void {
    TrackedPosition.deadCalls++;
  }
}

class TrackedVelocity extends Velocity {
  static attachCalls = 0;
  static detachCalls = 0;
  static aliveCalls = 0;
  static deadCalls = 0;

  onAttached(): void {
    TrackedVelocity.attachCalls++;
  }

  onDetached(): void {
    TrackedVelocity.detachCalls++;
  }

  onAlive(): void {
    TrackedVelocity.aliveCalls++;
  }

  onDead(): void {
    TrackedVelocity.deadCalls++;
  }
}

describe('Entry', () => {
  beforeEach(() => {
    TrackedPosition.attachCalls = 0;
    TrackedPosition.detachCalls = 0;
    TrackedPosition.aliveCalls = 0;
    TrackedPosition.deadCalls = 0;
    TrackedVelocity.attachCalls = 0;
    TrackedVelocity.detachCalls = 0;
    TrackedVelocity.aliveCalls = 0;
    TrackedVelocity.deadCalls = 0;
  });

  function createEntry<T extends Entity<any[]>>(
    entityType: new () => T,
    components: Component[],
  ): Entry<T> {
    const table = manager.get(entityType) as TableInner<T>;
    const actor = new entityType();
    return table.insert(components as any).deref()!;
  }

  describe('typed Entry<Actor>', () => {
    it('can be created with entity type and components', () => {
      const pos = new Position();
      const vel = new Velocity();
      const actor = createEntry(Actor, [pos, vel]);
      expect(actor).toBeDefined();
    });

    describe('get', () => {
      it('returns component by class', () => {
        const pos = new Position();
        pos.x = 10;
        pos.y = 20;
        const vel = new Velocity();
        vel.vx = 1;
        vel.vy = 2;
        const actor = createEntry(Actor, [pos, vel]);

        const found = actor.get(Position);
        expect(found).toBe(pos);
        expect(found.x).toBe(10);
        expect(found.y).toBe(20);
      });

      it('throws for missing component', () => {
        const pos = new Position();
        const vel = new Velocity();
        const actor = createEntry(Actor, [pos, vel]);

        expect(() => actor.get(Health)).toThrow(TypeError);
      });
    });

    describe('getAt', () => {
      it('returns component by index', () => {
        const pos = new Position();
        pos.x = 100;
        const vel = new Velocity();
        vel.vx = 50;
        const actor = createEntry(Actor, [pos, vel]);

        const found0 = actor.getAt(0);
        const found1 = actor.getAt(1);

        expect(found0).toBe(pos);
        expect(found1).toBe(vel);
        expect(found0.x).toBe(100);
        expect(found1.vx).toBe(50);
      });

      it('throws for negative index', () => {
        const pos = new Position();
        const vel = new Velocity();
        const actor = createEntry(Actor, [pos, vel]);

        expect(() => actor.getAt(-1)).toThrow(TypeError);
      });

      it('throws for index >= length', () => {
        const pos = new Position();
        const vel = new Velocity();
        const actor = createEntry(Actor, [pos, vel]);

        expect(() => actor.getAt(2)).toThrow(TypeError);
        expect(() => actor.getAt(100)).toThrow(TypeError);
      });
    });

    describe('set', () => {
      it('replaces component by class and returns old', () => {
        const pos = new Position();
        pos.x = 1;
        const vel = new Velocity();
        const actor = createEntry(Actor, [pos, vel]);

        const newPos = new Position();
        newPos.x = 999;

        const old = actor.set(Position, newPos);

        expect(old).toBe(pos);
        expect(old?.x).toBe(1);

        const found = actor.get(Position);
        expect(found).toBe(newPos);
        expect(found.x).toBe(999);
      });

      it('throws for missing component', () => {
        const pos = new Position();
        const actor = createEntry(Actor, [pos, new Velocity()]);

        const newHealth = new Health();
        expect(() => actor.set(Health, newHealth)).toThrow(TypeError);
      });
    });

    describe('setAny', () => {
      it('replaces component by value constructor and returns old', () => {
        const pos = new Position();
        pos.x = 1;
        const vel = new Velocity();
        const actor = createEntry(Actor, [pos, vel]);

        const newPos = new Position();
        newPos.x = 777;

        const old = actor.setAny(newPos);

        expect(old).toBe(pos);
        expect(old?.x).toBe(1);

        const found = actor.get(Position);
        expect(found).toBe(newPos);
        expect(found.x).toBe(777);
      });

      it('throws for value constructor not in columns', () => {
        const pos = new Position();
        const actor = createEntry(Actor, [pos, new Velocity()]);

        const unused = new Unused();
        expect(() => actor.setAny(unused)).toThrow(TypeError);
      });
    });

    describe('setAt', () => {
      it('replaces component by index and returns old', () => {
        const pos = new Position();
        pos.x = 1;
        const vel = new Velocity();
        const actor = createEntry(Actor, [pos, vel]);

        const newPos = new Position();
        newPos.x = 888;

        const old = actor.setAt(0, newPos);

        expect(old).toBe(pos);
        expect(old?.x).toBe(1);

        const found = actor.getAt(0);
        expect(found).toBe(newPos);
        expect(found.x).toBe(888);
      });

      it('throws for index out of bounds', () => {
        const pos = new Position();
        const actor = createEntry(Actor, [pos, new Velocity()]);

        const newVel = new Velocity();
        expect(() => actor.setAt(2, newVel)).toThrow(TypeError);
        expect(() => actor.setAt(-1, newVel)).toThrow(TypeError);
      });
    });
  });

  describe('lifecycle hooks', () => {
    describe('constructor', () => {
      it('calls attach on all components', () => {
        const pos = new TrackedPosition();
        const vel = new TrackedVelocity();
        createEntry(Actor, [pos, vel]);

        expect(TrackedPosition.attachCalls).toBe(1);
        expect(TrackedVelocity.attachCalls).toBe(1);
      });
    });

    describe('set', () => {
      it('calls detach on old component and attach on new', () => {
        const pos = new TrackedPosition();
        const vel = new TrackedVelocity();
        const entry = createEntry(Actor, [pos, vel]);

        TrackedPosition.attachCalls = 0;
        TrackedVelocity.attachCalls = 0;

        const newPos = new TrackedPosition();
        entry.set(Position, newPos);

        expect(TrackedPosition.detachCalls).toBe(1);
        expect(TrackedPosition.attachCalls).toBe(1);
        expect(TrackedVelocity.attachCalls).toBe(0);
        expect(TrackedVelocity.detachCalls).toBe(0);
      });
    });

    describe('setAny', () => {
      it('calls detach on old component and attach on new', () => {
        const pos = new TrackedPosition();
        const vel = new TrackedVelocity();
        const entry = createEntry(Actor, [pos, vel]);

        TrackedPosition.attachCalls = 0;
        TrackedVelocity.attachCalls = 0;

        const newPos = new TrackedPosition();
        entry.setAny(newPos);

        expect(TrackedPosition.detachCalls).toBe(1);
        expect(TrackedPosition.attachCalls).toBe(1);
        expect(TrackedVelocity.attachCalls).toBe(0);
        expect(TrackedVelocity.detachCalls).toBe(0);
      });
    });

    describe('setAt', () => {
      it('calls detach on old component and attach on new', () => {
        const pos = new TrackedPosition();
        const vel = new TrackedVelocity();
        const entry = createEntry(Actor, [pos, vel]);

        TrackedPosition.attachCalls = 0;
        TrackedVelocity.attachCalls = 0;

        const newPos = new TrackedPosition();
        entry.setAt(0, newPos);

        expect(TrackedPosition.detachCalls).toBe(1);
        expect(TrackedPosition.attachCalls).toBe(1);
        expect(TrackedVelocity.attachCalls).toBe(0);
        expect(TrackedVelocity.detachCalls).toBe(0);
      });
    });
  });

  describe('lifecycle state', () => {
    it('entry starts as ALIVE', () => {
      const pos = new Position();
      const vel = new Velocity();
      const actor = createEntry(Actor, [pos, vel]);

      expect(actor.lifecycle).toBe(EntryLifecycle.ALIVE);
    });

    it('entry is DEAD after table delete', () => {
      const pos = new Position();
      const vel = new Velocity();
      const table = manager.get(Actor) as TableInner<Actor>;
      const ref = table.insert([pos, vel]);
      const entry = ref.deref()!;

      table.delete(ref);

      expect(entry.lifecycle).toBe(EntryLifecycle.DEAD);
    });
  });

  describe('weak', () => {
    it('returns a WeakRef to the entry', () => {
      const pos = new Position();
      const vel = new Velocity();
      const entry = createEntry(Actor, [pos, vel]);

      const ref = entry.weak();

      expect(ref).toBeInstanceOf(WeakRef);
      expect(ref.deref()).toBe(entry);
    });
  });
});

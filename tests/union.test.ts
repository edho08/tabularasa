import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '../src/entity/component';
import { Entity } from '../src/entity/entity';
import { Columns } from '../src/entity/entity';
import { Entry } from '../src/table/entry';
import { Table } from '../src/table/table';
import { Union } from '../src/entity/pattern/union';

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

class Damage extends Component {
  damage = 10;
}

class TrackedPosition extends Position {
  static attachCalls = 0;
  static detachCalls = 0;
  static aliveCalls = 0;
  static deadCalls = 0;

  override onAttached(): void {
    TrackedPosition.attachCalls++;
  }

  override onDetached(): void {
    TrackedPosition.detachCalls++;
  }

  override onAlive(): void {
    TrackedPosition.aliveCalls++;
  }

  override onDead(): void {
    TrackedPosition.deadCalls++;
  }
}

const UnionPosVel = Union(Position, Velocity);

class ActorWithUnion extends Entity {
  static columns = Columns(Position, Velocity, UnionPosVel);
}

describe('Union', () => {
  beforeEach(() => {
    TrackedPosition.attachCalls = 0;
    TrackedPosition.detachCalls = 0;
    TrackedPosition.aliveCalls = 0;
    TrackedPosition.deadCalls = 0;
  });

  describe('constructor', () => {
    it('creates union with Position value', () => {
      const pos = new Position();
      pos.x = 1;
      pos.y = 2;
      const union = new UnionPosVel(pos);

      expect(union.value).toBe(pos);
      expect(union.value.x).toBe(1);
    });

    it('creates union with Velocity value', () => {
      const vel = new Velocity();
      vel.vx = 3;
      vel.vy = 4;
      const union = new UnionPosVel(vel);

      expect(union.value).toBe(vel);
      expect(union.value.vx).toBe(3);
    });
  });

  describe('is', () => {
    it('returns true for matching type', () => {
      const pos = new Position();
      const union = new UnionPosVel(pos);

      expect(union.is(Position)).toBe(true);
    });

    it('returns false for non-matching type', () => {
      const pos = new Position();
      const union = new UnionPosVel(pos);

      expect(union.is(Velocity)).toBe(false);
    });

    it('returns true when stored as first type but checking second', () => {
      const vel = new Velocity();
      const union = new UnionPosVel(vel);

      expect(union.is(Velocity)).toBe(true);
    });
  });

  describe('as', () => {
    it('returns value when type matches', () => {
      const pos = new Position();
      pos.x = 5;
      pos.y = 6;
      const union = new UnionPosVel(pos);

      expect(union.as(Position)).toBe(pos);
      expect(union.as(Position)?.x).toBe(5);
    });

    it('returns undefined when type does not match', () => {
      const pos = new Position();
      const union = new UnionPosVel(pos);

      expect(union.as(Velocity)).toBeUndefined();
    });
  });

  describe('lifecycle propagation', () => {
    it('onAttached propagates to inner value', () => {
      const tracked = new TrackedPosition();
      const UnionTracked = Union(TrackedPosition);
      class ActorWithTracked extends Entity {
        static columns = Columns(UnionTracked);
      }
      new Entry(ActorWithTracked, [new UnionTracked(tracked)]);

      expect(TrackedPosition.attachCalls).toBe(1);
    });

    it('onDetached propagates to inner value', () => {
      const tracked = new TrackedPosition();
      const UnionTracked = Union(TrackedPosition);
      class ActorWithTracked extends Entity {
        static columns = Columns(UnionTracked);
      }
      const table = new Table(ActorWithTracked);
      const ref = table.insert([new UnionTracked(tracked)]);
      const entry = ref.deref();
      if (!entry) throw new Error('insert failed');

      TrackedPosition.detachCalls = 0;
      tracked.onDetached(entry);

      expect(TrackedPosition.detachCalls).toBe(1);
    });

    it('onAlive propagates to inner value', () => {
      const tracked = new TrackedPosition();
      const UnionTracked = Union(TrackedPosition);
      class ActorWithTracked extends Entity {
        static columns = Columns(UnionTracked);
      }
      const table = new Table(ActorWithTracked);

      table.insert([new UnionTracked(tracked)]);

      expect(TrackedPosition.aliveCalls).toBe(1);
    });

    it('onDead propagates to inner value', () => {
      const tracked = new TrackedPosition();
      const UnionTracked = Union(TrackedPosition);
      class ActorWithTracked extends Entity {
        static columns = Columns(UnionTracked);
      }
      const table = new Table(ActorWithTracked);
      const ref = table.insert([new UnionTracked(tracked)]);

      TrackedPosition.deadCalls = 0;
      table.delete(ref);

      expect(TrackedPosition.deadCalls).toBe(1);
    });
  });

  describe('serialize', () => {
    it('outputs type index and data for Position', () => {
      const pos = new Position();
      pos.x = 7;
      pos.y = 8;
      const union = new UnionPosVel(pos);
      const entry = new Entry(ActorWithUnion, [new Position(), new Velocity(), union]);

      const data = union.serialize(entry);

      expect(data).toEqual({ type: 0, data: { x: 7, y: 8 } });
    });

    it('outputs type index and data for Velocity', () => {
      const vel = new Velocity();
      vel.vx = 9;
      vel.vy = 10;
      const union = new UnionPosVel(vel);
      const entry = new Entry(ActorWithUnion, [new Position(), new Velocity(), union]);

      const data = union.serialize(entry);

      expect(data).toEqual({ type: 1, data: { vx: 9, vy: 10 } });
    });
  });

  describe('deserialize', () => {
    it('reconstructs Position variant', () => {
      const data = { type: 0, data: { x: 11, y: 12 } };
      const union = UnionPosVel.deserialize(data);

      expect(union.value).toBeInstanceOf(Position);
      expect((union.value as Position).x).toBe(11);
      expect((union.value as Position).y).toBe(12);
    });

    it('reconstructs Velocity variant', () => {
      const data = { type: 1, data: { vx: 13, vy: 14 } };
      const union = UnionPosVel.deserialize(data);

      expect(union.value).toBeInstanceOf(Velocity);
      expect((union.value as Velocity).vx).toBe(13);
      expect((union.value as Velocity).vy).toBe(14);
    });

    it('throws for invalid type index', () => {
      const data = { type: 99, data: {} };

      expect(() => UnionPosVel.deserialize(data)).toThrow('Invalid type index');
    });
  });

  describe('memoization', () => {
    it('returns same class for same constructors', () => {
      const U1 = Union(Position, Velocity);
      const U2 = Union(Position, Velocity);

      expect(U1).toBe(U2);
    });

    it('returns same class regardless of order', () => {
      const U1 = Union(Position, Velocity);
      const U2 = Union(Velocity, Position);

      expect(U1).toBe(U2);
    });

    it('returns different classes for different constructor sets', () => {
      const U1 = Union(Position, Velocity);
      const U2 = Union(Health, Damage);

      expect(U1).not.toBe(U2);
    });

    it('memoized class has correct name', () => {
      const U = Union(Position, Velocity);
      const instance = new U(new Position());

      expect(U.name).toBe('Union<Position|Velocity>');
      expect(instance.constructor.name).toBe('Union<Position|Velocity>');
    });

    it('memoized class has static ctors', () => {
      const U = Union(Position, Velocity);

      expect(U.ctors).toHaveLength(2);
      expect(U.ctors).toContain(Position);
      expect(U.ctors).toContain(Velocity);
    });
  });

  describe('in Entry', () => {
    function createEntryWithPosition(): Entry<typeof ActorWithUnion> {
      const table = new Table(ActorWithUnion);
      const pos = new Position();
      pos.x = 1;
      pos.y = 2;
      const union = new UnionPosVel(pos);

      const ref = table.insert([new Position(), new Velocity(), union]);
      const entry = ref.deref();
      if (!entry) throw new Error('insert failed');
      return entry;
    }

    function createEntryWithVelocity(): Entry<typeof ActorWithUnion> {
      const table = new Table(ActorWithUnion);
      const vel = new Velocity();
      vel.vx = 3;
      vel.vy = 4;
      const union = new UnionPosVel(vel);

      const ref = table.insert([new Position(), new Velocity(), union]);
      const entry = ref.deref();
      if (!entry) throw new Error('insert failed');
      return entry;
    }

    it('entry can store union with Position', () => {
      const entry = createEntryWithPosition();

      expect(entry.get(UnionPosVel).value).toBeInstanceOf(Position);
      expect((entry.get(UnionPosVel).value as Position).x).toBe(1);
    });

    it('entry can store union with Velocity', () => {
      const entry = createEntryWithVelocity();

      expect(entry.get(UnionPosVel).value).toBeInstanceOf(Velocity);
      expect((entry.get(UnionPosVel).value as Velocity).vx).toBe(3);
    });

    it('entry.has returns true for union slot', () => {
      const entry = createEntryWithPosition();

      expect(entry.has(UnionPosVel)).toBe(true);
    });

    it('set replaces union with new union', () => {
      const entry = createEntryWithPosition();

      const newVel = new Velocity();
      newVel.vx = 5;
      newVel.vy = 6;
      const newUnion = new UnionPosVel(newVel);
      entry.set(UnionPosVel, newUnion);

      expect(entry.get(UnionPosVel).value).toBeInstanceOf(Velocity);
      expect((entry.get(UnionPosVel).value as Velocity).vx).toBe(5);
    });
  });
});

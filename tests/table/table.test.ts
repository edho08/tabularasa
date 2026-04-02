import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '../../src/entity/component';
import { Entity } from '../../src/entity/entity';
import { EntryLifecycle } from '../../src/table/entry';
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

class Actor extends Entity<[TrackedPosition, TrackedVelocity]> {}

describe('Table', () => {
  let manager: TableManager;

  beforeEach(() => {
    manager = new TableManager();
    TrackedPosition.attachCalls = 0;
    TrackedPosition.detachCalls = 0;
    TrackedPosition.aliveCalls = 0;
    TrackedPosition.deadCalls = 0;
    TrackedVelocity.attachCalls = 0;
    TrackedVelocity.detachCalls = 0;
    TrackedVelocity.aliveCalls = 0;
    TrackedVelocity.deadCalls = 0;
  });

  describe('insert', () => {
    it('adds entry to table', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const table = manager.get(Actor) as TableInner<Actor>;
      const actor = new Actor();

      const ref = table.insert([pos, vel]);
      const entry = ref.deref()!;

      expect(entry.lifecycle).toBe(EntryLifecycle.ALIVE);
    });

    it('calls attach on all components when entry is inserted', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const table = manager.get(Actor) as TableInner<Actor>;
      const actor = new Actor();

      table.insert([pos, vel]);

      expect(TrackedPosition.attachCalls).toBe(1);
      expect(TrackedVelocity.attachCalls).toBe(1);
    });

    it('returns WeakRef to entry', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const table = manager.get(Actor) as TableInner<Actor>;
      const actor = new Actor();

      const ref = table.insert([pos, vel]);

      expect(ref).toBeInstanceOf(WeakRef);
      expect(ref.deref()).toBeDefined();
    });
  });

  describe('delete', () => {
    it('removes entry from table', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const table = manager.get(Actor) as TableInner<Actor>;
      const actor = new Actor();

      const ref = table.insert([pos, vel]);
      const entry = ref.deref()!;

      table.delete(ref);

      expect(entry.lifecycle).toBe(EntryLifecycle.DEAD);
    });

    it('calls detach on all components when entry is deleted', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const table = manager.get(Actor) as TableInner<Actor>;
      const actor = new Actor();

      table.insert([pos, vel]);
      const ref2 = table.insert([new TrackedPosition(), new TrackedVelocity()]);

      table.delete(ref2);

      expect(TrackedPosition.detachCalls).toBe(1);
      expect(TrackedVelocity.detachCalls).toBe(1);
    });

    it('swap-and-pop works correctly with multiple entries', () => {
      const pos1 = new TrackedPosition();
      const vel1 = new TrackedVelocity();
      const pos2 = new TrackedPosition();
      const vel2 = new TrackedVelocity();

      const table = manager.get(Actor) as TableInner<Actor>;
      const actor1 = new Actor();
      const actor2 = new Actor();
      const ref1 = table.insert([pos1, vel1]);
      const ref2 = table.insert([pos2, vel2]);
      const entry2 = ref2.deref()!;

      table.delete(ref1);

      expect(entry2.index).toBe(0);
    });
  });

  describe('getAt', () => {
    it('returns WeakRef for valid index', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const table = manager.get(Actor) as TableInner<Actor>;
      const actor = new Actor();

      table.insert([pos, vel]);

      const ref = table.getAt(0);

      expect(ref).toBeInstanceOf(WeakRef);
      expect(ref?.deref()).toBeDefined();
    });

    it('returns undefined for negative index', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const table = manager.get(Actor) as TableInner<Actor>;
      const actor = new Actor();

      table.insert([pos, vel]);

      expect(table.getAt(-1)).toBeUndefined();
    });

    it('returns undefined for index >= length', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const table = manager.get(Actor) as TableInner<Actor>;
      const actor = new Actor();

      table.insert([pos, vel]);

      expect(table.getAt(1)).toBeUndefined();
      expect(table.getAt(100)).toBeUndefined();
    });
  });

  describe('iteration', () => {
    it('iterates over all entries with for...of', () => {
      const pos1 = new TrackedPosition();
      const vel1 = new TrackedVelocity();
      const pos2 = new TrackedPosition();
      const vel2 = new TrackedVelocity();

      const table = manager.get(Actor) as TableInner<Actor>;
      const actor1 = new Actor();
      const actor2 = new Actor();
      const ref1 = table.insert([pos1, vel1]);
      const ref2 = table.insert([pos2, vel2]);
      const entry1 = ref1.deref()!;
      const entry2 = ref2.deref()!;

      const entries = [];
      for (const _entry of table) {
        entries.push(_entry);
      }

      expect(entries).toContain(entry1);
      expect(entries).toContain(entry2);
      expect(entries).toHaveLength(2);
    });

    it('can spread into array', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const table = manager.get(Actor) as TableInner<Actor>;
      const actor = new Actor();

      const ref = table.insert([pos, vel]);
      const entry = ref.deref()!;

      const entries = [...table];
      expect(entries).toContain(entry);
      expect(entries).toHaveLength(1);
    });
  });

  describe('index', () => {
    it('returns correct index after insert', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const table = manager.get(Actor) as TableInner<Actor>;
      const actor = new Actor();

      const ref = table.insert([pos, vel]);
      const entry = ref.deref()!;

      expect(entry.index).toBe(0);
    });

    it('indices are sequential for multiple entries', () => {
      const pos1 = new TrackedPosition();
      const vel1 = new TrackedVelocity();
      const pos2 = new TrackedPosition();
      const vel2 = new TrackedVelocity();

      const table = manager.get(Actor) as TableInner<Actor>;
      const actor1 = new Actor();
      const actor2 = new Actor();
      const ref1 = table.insert([pos1, vel1]);
      const ref2 = table.insert([pos2, vel2]);
      const entry1 = ref1.deref()!;
      const entry2 = ref2.deref()!;

      expect(entry1.index).toBe(0);
      expect(entry2.index).toBe(1);
    });

    it('throws after delete', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const table = manager.get(Actor) as TableInner<Actor>;
      const actor = new Actor();

      const ref = table.insert([pos, vel]);
      const entry = ref.deref()!;

      table.delete(ref);

      expect(() => entry.index).toThrow(TypeError);
    });

    it('updates index after swap-pop delete', () => {
      const pos1 = new TrackedPosition();
      const vel1 = new TrackedVelocity();
      const pos2 = new TrackedPosition();
      const vel2 = new TrackedVelocity();

      const table = manager.get(Actor) as TableInner<Actor>;
      const actor1 = new Actor();
      const actor2 = new Actor();
      const ref1 = table.insert([pos1, vel1]);
      const ref2 = table.insert([pos2, vel2]);
      const entry1 = ref1.deref()!;
      const entry2 = ref2.deref()!;

      expect(entry1.index).toBe(0);
      expect(entry2.index).toBe(1);

      table.delete(ref1);

      expect(entry1.lifecycle).toBe(EntryLifecycle.DEAD);
      expect(entry2.index).toBe(0);
      expect(entry2.lifecycle).toBe(EntryLifecycle.ALIVE);
    });
  });

  describe('serialize', () => {
    it('serializes entry components to array of objects', () => {
      const pos = new Position();
      pos.x = 10;
      pos.y = 20;
      const vel = new Velocity();
      vel.vx = 1;
      vel.vy = 2;

      const table = manager.get(Actor) as TableInner<Actor>;
      const actor = new Actor();
      table.insert([pos, vel]);
      const entry = table.getAt(0)!.deref()!;

      const data = entry.serialize();

      expect(data).toHaveLength(2);
      expect(data[0]).toEqual({ x: 10, y: 20 });
      expect(data[1]).toEqual({ vx: 1, vy: 2 });
    });
  });

  describe('deserialize', () => {
    it('creates entries with deserialized components', () => {
      const table = manager.get(Actor) as TableInner<Actor>;
      table.serializeable([TrackedPosition, TrackedVelocity]);
      const data = [
        [
          { x: 100, y: 200 },
          { vx: 3, vy: 4 },
        ],
        [
          { x: 50, y: 60 },
          { vx: 7, vy: 8 },
        ],
      ];

      table.deserialize(data);

      expect([...table]).toHaveLength(2);
      const entry0 = table.getAt(0)!.deref()!;
      const entry1 = table.getAt(1)!.deref()!;
      expect((entry0 as any).get(Position).x).toBe(100);
      expect((entry1 as any).get(Velocity).vx).toBe(7);
    });

    it('calls onAttached for deserialized components', () => {
      const table = manager.get(Actor) as TableInner<Actor>;
      table.serializeable([TrackedPosition, TrackedVelocity]);
      const data = [
        [
          { x: 100, y: 200 },
          { vx: 3, vy: 4 },
        ],
      ];

      TrackedPosition.attachCalls = 0;
      TrackedVelocity.attachCalls = 0;

      table.deserialize(data);

      expect(TrackedPosition.attachCalls).toBe(1);
      expect(TrackedVelocity.attachCalls).toBe(1);
    });

    it('disposes old entries before creating new ones', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const table = manager.get(Actor) as TableInner<Actor>;
      table.serializeable([TrackedPosition, TrackedVelocity]);
      const actor = new Actor();
      table.insert([pos, vel]);

      TrackedPosition.detachCalls = 0;
      TrackedVelocity.detachCalls = 0;

      const data = [
        [
          { x: 100, y: 200 },
          { vx: 3, vy: 4 },
        ],
      ];

      table.deserialize(data);

      expect(TrackedPosition.detachCalls).toBe(1);
      expect(TrackedVelocity.detachCalls).toBe(1);
    });
  });

  describe('onDeserialized', () => {
    it('calls onDeserialized on all entries', () => {
      class TrackedPositionWithDeserialize extends TrackedPosition {
        static deserializedCalls = 0;
        onDeserialized(): void {
          TrackedPositionWithDeserialize.deserializedCalls++;
        }
      }

      class TrackedVelocityWithDeserialize extends TrackedVelocity {
        static deserializedCalls = 0;
        onDeserialized(): void {
          TrackedVelocityWithDeserialize.deserializedCalls++;
        }
      }

      class ActorWithDeserialize extends Entity<
        [typeof TrackedPositionWithDeserialize, typeof TrackedVelocityWithDeserialize]
      > {}

      const table2 = manager.get(ActorWithDeserialize) as TableInner<ActorWithDeserialize>;
      table2.serializeable([TrackedPositionWithDeserialize, TrackedVelocityWithDeserialize]);
      const data = [
        [
          { x: 100, y: 200 },
          { vx: 3, vy: 4 },
        ],
      ];

      table2.deserialize(data);

      TrackedPositionWithDeserialize.deserializedCalls = 0;
      TrackedVelocityWithDeserialize.deserializedCalls = 0;

      table2.onDeserialized();

      expect(TrackedPositionWithDeserialize.deserializedCalls).toBe(1);
      expect(TrackedVelocityWithDeserialize.deserializedCalls).toBe(1);
    });
  });

  describe('TableInner.serialize', () => {
    it('serializes all entries', () => {
      const pos1 = new Position();
      pos1.x = 1;
      const vel1 = new Velocity();
      vel1.vx = 2;
      const pos2 = new Position();
      pos2.x = 3;
      const vel2 = new Velocity();
      vel2.vx = 4;

      const table = manager.get(Actor) as TableInner<Actor>;
      const actor1 = new Actor();
      const actor2 = new Actor();
      table.insert([pos1, vel1]);
      table.insert([pos2, vel2]);

      const data = table.serialize();

      expect(data).toHaveLength(2);
      expect(data[0]).toEqual([
        { x: 1, y: 0 },
        { vx: 2, vy: 0 },
      ]);
      expect(data[1]).toEqual([
        { x: 3, y: 0 },
        { vx: 4, vy: 0 },
      ]);
    });
  });
});

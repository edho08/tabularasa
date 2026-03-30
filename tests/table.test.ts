import { describe, it, expect, beforeEach } from 'vitest';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Component } from '../src/component';
import { Entity } from '../src/entity';
import { Entry } from '../src/entry';
import { Columns } from '../src/entity';
import { Table } from '../src/table';

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

class TrackedPosition extends Position {
  static attachCalls = 0;
  static detachCalls = 0;
  static aliveCalls = 0;
  static deadCalls = 0;

  attach(_entry: any): void {
    TrackedPosition.attachCalls++;
  }

  detach(_entry: any): void {
    TrackedPosition.detachCalls++;
  }

  alive(_entry: any): void {
    TrackedPosition.aliveCalls++;
  }

  dead(_entry: any): void {
    TrackedPosition.deadCalls++;
  }
}

class TrackedVelocity extends Velocity {
  static attachCalls = 0;
  static detachCalls = 0;
  static aliveCalls = 0;
  static deadCalls = 0;

  attach(_entry: any): void {
    TrackedVelocity.attachCalls++;
  }

  detach(_entry: any): void {
    TrackedVelocity.detachCalls++;
  }

  alive(_entry: any): void {
    TrackedVelocity.aliveCalls++;
  }

  dead(_entry: any): void {
    TrackedVelocity.deadCalls++;
  }
}

class Actor extends Entity {
  static columns = Columns(TrackedPosition, TrackedVelocity);
}

class Enemy extends Entity {
  static columns = Columns(Position, Velocity, Health);
}

describe('Table', () => {
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

  describe('insert', () => {
    it('adds entry to table', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const entry = new Entry(Actor, [pos, vel]);
      const table = new Table(Actor);

      table.insert(entry);

      expect(table.has(entry)).toBe(true);
    });

    it('calls alive on all components when entry is inserted', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const entry = new Entry(Actor, [pos, vel]);
      const table = new Table(Actor);

      table.insert(entry);

      expect(TrackedPosition.aliveCalls).toBe(1);
      expect(TrackedVelocity.aliveCalls).toBe(1);
    });

    it('throws when entry already belongs to a table', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const entry = new Entry(Actor, [pos, vel]);
      const table1 = new Table(Actor);
      const table2 = new Table(Actor);

      table1.insert(entry);

      expect(() => table2.insert(entry)).toThrow(TypeError);
      expect(() => table2.insert(entry)).toThrow('Entry already belongs to a Table');
    });

    it('throws when entity type does not match', () => {
      const pos = new Position();
      const vel = new Velocity();
      const hp = new Health();
      const entry = new Entry(Enemy, [pos, vel, hp]);
      const table = new Table(Actor);

      expect(() => table.insert(entry)).toThrow(TypeError);
      expect(() => table.insert(entry)).toThrow("Entry's entity type does not match this Table");
    });
  });

  describe('delete', () => {
    it('removes entry from table', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const entry = new Entry(Actor, [pos, vel]);
      const table = new Table(Actor);

      table.insert(entry);
      table.delete(entry.weak());

      expect(table.has(entry)).toBe(false);
    });

    it('calls dead on all components when entry is deleted', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const entry = new Entry(Actor, [pos, vel]);
      const table = new Table(Actor);

      table.insert(entry);
      TrackedPosition.aliveCalls = 0;
      TrackedVelocity.aliveCalls = 0;

      table.delete(entry.weak());

      expect(TrackedPosition.deadCalls).toBe(1);
      expect(TrackedVelocity.deadCalls).toBe(1);
    });

    it('does nothing when entry is not in table', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const entry = new Entry(Actor, [pos, vel]);
      const table = new Table(Actor);

      table.delete(entry.weak());

      expect(table.has(entry)).toBe(false);
    });

    it('swaps-and-pop works correctly with multiple entries', () => {
      const pos1 = new TrackedPosition();
      const vel1 = new TrackedVelocity();
      const entry1 = new Entry(Actor, [pos1, vel1]);

      const pos2 = new TrackedPosition();
      const vel2 = new TrackedVelocity();
      const entry2 = new Entry(Actor, [pos2, vel2]);

      const table = new Table(Actor);
      table.insert(entry1);
      table.insert(entry2);

      table.delete(entry1.weak());

      expect(table.has(entry1)).toBe(false);
      expect(table.has(entry2)).toBe(true);

      let count = 0;
      for (const _entry of table) {
        count++;
        expect(_entry).toBe(entry2);
      }
      expect(count).toBe(1);
    });
  });

  describe('has', () => {
    it('returns true for inserted entry', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const entry = new Entry(Actor, [pos, vel]);
      const table = new Table(Actor);

      table.insert(entry);

      expect(table.has(entry)).toBe(true);
    });

    it('returns false after deletion', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const entry = new Entry(Actor, [pos, vel]);
      const table = new Table(Actor);

      table.insert(entry);
      table.delete(entry.weak());

      expect(table.has(entry)).toBe(false);
    });

    it('returns false for entry never inserted', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const entry = new Entry(Actor, [pos, vel]);
      const table = new Table(Actor);

      expect(table.has(entry)).toBe(false);
    });
  });

  describe('getAt', () => {
    it('returns WeakRef for valid index', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const entry = new Entry(Actor, [pos, vel]);
      const table = new Table(Actor);
      table.insert(entry);

      const ref = table.getAt(0);

      expect(ref).toBeInstanceOf(WeakRef);
      expect(ref?.deref()).toBe(entry);
    });

    it('returns undefined for negative index', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const entry = new Entry(Actor, [pos, vel]);
      const table = new Table(Actor);
      table.insert(entry);

      expect(table.getAt(-1)).toBeUndefined();
    });

    it('returns undefined for index >= length', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const entry = new Entry(Actor, [pos, vel]);
      const table = new Table(Actor);
      table.insert(entry);

      expect(table.getAt(1)).toBeUndefined();
      expect(table.getAt(100)).toBeUndefined();
    });

    it('derefd entry matches original after operations', () => {
      const pos1 = new TrackedPosition();
      const vel1 = new TrackedVelocity();
      const entry1 = new Entry(Actor, [pos1, vel1]);

      const pos2 = new TrackedPosition();
      const vel2 = new TrackedVelocity();
      const entry2 = new Entry(Actor, [pos2, vel2]);

      const table = new Table(Actor);
      table.insert(entry1);
      table.insert(entry2);

      expect(table.getAt(0)?.deref()).toBe(entry1);
      expect(table.getAt(1)?.deref()).toBe(entry2);
    });
  });

  describe('iteration', () => {
    it('iterates over all entries with for...of', () => {
      const pos1 = new TrackedPosition();
      const vel1 = new TrackedVelocity();
      const entry1 = new Entry(Actor, [pos1, vel1]);

      const pos2 = new TrackedPosition();
      const vel2 = new TrackedVelocity();
      const entry2 = new Entry(Actor, [pos2, vel2]);

      const table = new Table(Actor);
      table.insert(entry1);
      table.insert(entry2);

      const entries = [];
      for (const entry of table) {
        entries.push(entry);
      }

      expect(entries).toContain(entry1);
      expect(entries).toContain(entry2);
      expect(entries).toHaveLength(2);
    });

    it('can spread into array', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const entry = new Entry(Actor, [pos, vel]);

      const table = new Table(Actor);
      table.insert(entry);

      const entries = [...table];
      expect(entries).toContain(entry);
      expect(entries).toHaveLength(1);
    });
  });

  describe('index', () => {
    it('throws before entry is inserted', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const entry = new Entry(Actor, [pos, vel]);

      expect(() => entry.index).toThrow(TypeError);
      expect(() => entry.index).toThrow('Entry is not managed by any Table');
    });

    it('returns correct index after insert', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const entry = new Entry(Actor, [pos, vel]);
      const table = new Table(Actor);

      table.insert(entry);

      expect(entry.index).toBe(0);
    });

    it('indices are sequential for multiple entries', () => {
      const pos1 = new TrackedPosition();
      const vel1 = new TrackedVelocity();
      const entry1 = new Entry(Actor, [pos1, vel1]);

      const pos2 = new TrackedPosition();
      const vel2 = new TrackedVelocity();
      const entry2 = new Entry(Actor, [pos2, vel2]);

      const table = new Table(Actor);
      table.insert(entry1);
      table.insert(entry2);

      expect(entry1.index).toBe(0);
      expect(entry2.index).toBe(1);
    });

    it('throws after delete', () => {
      const pos = new TrackedPosition();
      const vel = new TrackedVelocity();
      const entry = new Entry(Actor, [pos, vel]);
      const table = new Table(Actor);

      table.insert(entry);
      table.delete(entry.weak());

      expect(() => entry.index).toThrow(TypeError);
      expect(() => entry.index).toThrow('Entry is not managed by any Table');
    });

    it('updates index after swap-pop delete', () => {
      const pos1 = new TrackedPosition();
      const vel1 = new TrackedVelocity();
      const entry1 = new Entry(Actor, [pos1, vel1]);

      const pos2 = new TrackedPosition();
      const vel2 = new TrackedVelocity();
      const entry2 = new Entry(Actor, [pos2, vel2]);

      const table = new Table(Actor);
      table.insert(entry1);
      table.insert(entry2);

      expect(entry1.index).toBe(0);
      expect(entry2.index).toBe(1);

      table.delete(entry1.weak());

      expect(() => entry1.index).toThrow(TypeError);
      expect(entry2.index).toBe(0);
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
      const entry = new Entry(Actor, [pos, vel]);

      const data = entry.serialize();

      expect(data).toHaveLength(2);
      expect(data[0]).toEqual({ x: 10, y: 20 });
      expect(data[1]).toEqual({ vx: 1, vy: 2 });
    });
  });

  describe('deserialize', () => {
    it('reconstructs entry from serialized data', () => {
      const data = [
        { x: 100, y: 200 },
        { vx: 3, vy: 4 },
      ];

      const table = new Table(Actor);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = Entry.deserialize(data, Actor, table, 0) as Entry<any>;
      table.entries.push(entry);

      expect(entry).toBeInstanceOf(Entry);
      expect(entry.get(Position).x).toBe(100);
      expect(entry.get(Position).y).toBe(200);
      expect(entry.get(Velocity).vx).toBe(3);
      expect(entry.get(Velocity).vy).toBe(4);
    });

    it('does not attach components during deserialize', () => {
      TrackedPosition.attachCalls = 0;
      TrackedVelocity.attachCalls = 0;

      const data = [
        { x: 1, y: 2 },
        { vx: 3, vy: 4 },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Entry.deserialize(data, Actor as any, undefined, undefined);

      expect(TrackedPosition.attachCalls).toBe(0);
      expect(TrackedVelocity.attachCalls).toBe(0);
    });

    it('sets table and index when provided', () => {
      const data = [
        { x: 1, y: 2 },
        { vx: 3, vy: 4 },
      ];

      const table = new Table(Actor);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = Entry.deserialize(data, Actor, table, 5) as Entry<any>;

      expect(entry.table).toBe(table);
      expect(entry.index).toBe(5);
    });
  });

  describe('Table.serialize', () => {
    it('serializes all entries', () => {
      const pos1 = new Position();
      pos1.x = 1;
      const vel1 = new Velocity();
      vel1.vx = 2;
      const entry1 = new Entry(Actor, [pos1, vel1]);

      const pos2 = new Position();
      pos2.x = 3;
      const vel2 = new Velocity();
      vel2.vx = 4;
      const entry2 = new Entry(Actor, [pos2, vel2]);

      const table = new Table(Actor);
      table.insert(entry1);
      table.insert(entry2);

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

  describe('Table.deserialize', () => {
    it('reconstructs table from serialized data', () => {
      const data = [
        [
          { x: 10, y: 20 },
          { vx: 30, vy: 40 },
        ],
        [
          { x: 50, y: 60 },
          { vx: 70, vy: 80 },
        ],
      ];

      const table = Table.deserialize(data, Actor);

      expect(table).toBeInstanceOf(Table);
      expect([...table]).toHaveLength(2);

      const entries = [...table];
      expect(entries[0].get(Position).x).toBe(10);
      expect(entries[0].get(Position).y).toBe(20);
      expect(entries[1].get(Velocity).vx).toBe(70);
    });

    it('does not trigger alive during deserialize', () => {
      TrackedPosition.aliveCalls = 0;
      TrackedVelocity.aliveCalls = 0;

      const data = [
        [
          { x: 1, y: 2 },
          { vx: 3, vy: 4 },
        ],
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Table.deserialize(data, Actor as any);

      expect(TrackedPosition.aliveCalls).toBe(0);
      expect(TrackedVelocity.aliveCalls).toBe(0);
    });

    it('entries have correct table reference and indices', () => {
      const data = [
        [
          { x: 1, y: 2 },
          { vx: 3, vy: 4 },
        ],
        [
          { x: 5, y: 6 },
          { vx: 7, vy: 8 },
        ],
      ];

      const table = Table.deserialize(data, Actor);

      const entries = [...table];
      expect(entries[0].table).toBe(table);
      expect(entries[0].index).toBe(0);
      expect(entries[1].table).toBe(table);
      expect(entries[1].index).toBe(1);
    });
  });
});

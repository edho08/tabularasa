import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '../../../src/entity/component';
import { Entity } from '../../../src/entity/entity';
import { Columns } from '../../../src/entity/entity';
import { Entry } from '../../../src/table/entry';
import { Table } from '../../../src/table/table';
import { TableManager } from '../../../src/table/manager';
import { Derived } from '../../../src/entity/pattern/derived';

const manager = new TableManager();

class Position extends Component {
  x = 0;
  y = 0;
}

class Position3D extends Position {
  z = 0;
}

class Position2D extends Position {
  w = 0;
}

class Velocity extends Component {
  vx = 0;
  vy = 0;
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

const DerivedPos = Derived(Position);

class ActorWithDerived extends Entity {
  static columns = Columns(Position, Velocity, DerivedPos);
}

describe('Derived', () => {
  beforeEach(() => {
    TrackedPosition.attachCalls = 0;
    TrackedPosition.detachCalls = 0;
    TrackedPosition.aliveCalls = 0;
    TrackedPosition.deadCalls = 0;
  });

  describe('constructor', () => {
    it('creates derived component with derived instance', () => {
      const pos3d = new Position3D();
      pos3d.x = 1;
      pos3d.y = 2;
      pos3d.z = 3;
      const dp = new DerivedPos(pos3d);

      expect(dp.value).toBe(pos3d);
      expect(dp.value.x).toBe(1);
      expect(dp.value.y).toBe(2);
      expect(dp.value.z).toBe(3);
    });

    it('creates derived component with base instance', () => {
      const pos = new Position();
      pos.x = 10;
      pos.y = 20;
      const dp = new DerivedPos(pos);

      expect(dp.value).toBe(pos);
      expect(dp.value.x).toBe(10);
      expect(dp.value.y).toBe(20);
    });
  });

  describe('is', () => {
    it('returns true for exact type match', () => {
      const pos3d = new Position3D();
      const dp = new DerivedPos(pos3d);

      expect(dp.is(Position3D)).toBe(true);
    });

    it('returns false for base type', () => {
      const pos3d = new Position3D();
      const dp = new DerivedPos(pos3d);

      expect(dp.is(Position)).toBe(false);
    });

    it('returns false for unrelated type', () => {
      const pos3d = new Position3D();
      const dp = new DerivedPos(pos3d);

      expect(dp.is(Velocity)).toBe(false);
    });

    it('returns true for exact type even with base instance', () => {
      const pos = new Position();
      const dp = new DerivedPos(pos);

      expect(dp.is(Position)).toBe(true);
    });
  });

  describe('instanceOf', () => {
    it('returns true for ancestor type', () => {
      const pos3d = new Position3D();
      const dp = new DerivedPos(pos3d);

      expect(dp.instanceOf(Position)).toBe(true);
    });

    it('returns true for exact type', () => {
      const pos3d = new Position3D();
      const dp = new DerivedPos(pos3d);

      expect(dp.instanceOf(Position3D)).toBe(true);
    });

    it('returns false for unrelated type', () => {
      const pos3d = new Position3D();
      const dp = new DerivedPos(pos3d);

      expect(dp.instanceOf(Velocity)).toBe(false);
    });

    it('returns false for sibling type', () => {
      const pos3d = new Position3D();
      const dp = new DerivedPos(pos3d);

      expect(dp.instanceOf(Position2D)).toBe(false);
    });
  });

  describe('serialize', () => {
    it('outputs type and data', () => {
      const pos3d = new Position3D();
      pos3d.x = 1;
      pos3d.y = 2;
      pos3d.z = 3;
      const dp = new DerivedPos(pos3d);
      const table = new Table(ActorWithDerived, manager);
      const ref = table.insert([new Position(), new Velocity(), dp]);
      const entry = ref.deref();
      if (!entry) throw new Error('insert failed');

      const data = dp.serialize(entry);

      expect(data).toEqual({
        type: 'Position3D',
        data: { x: 1, y: 2, z: 3 },
      });
    });

    it('outputs base type name for base instance', () => {
      const pos = new Position();
      pos.x = 5;
      pos.y = 10;
      const dp = new DerivedPos(pos);
      const table = new Table(ActorWithDerived, manager);
      const ref = table.insert([new Position(), new Velocity(), dp]);
      const entry = ref.deref();
      if (!entry) throw new Error('insert failed');

      const data = dp.serialize(entry);

      expect(data).toEqual({
        type: 'Position',
        data: { x: 5, y: 10 },
      });
    });
  });

  describe('deserialize with sub reviver', () => {
    it('calls sub reviver with data only', () => {
      const DerivedWithSub = Derived(Position).sub(Position3D, data => {
        const d = data as { x: number; y: number; z: number };
        const p = new Position3D();
        p.x = d.x;
        p.y = d.y;
        p.z = d.z;
        return p;
      });

      const data = { type: 'Position3D', data: { x: 1, y: 2, z: 3 } };
      const dp = DerivedWithSub.deserialize(data) as any;

      expect(dp.value).toBeInstanceOf(Position3D);
      expect(dp.value.x).toBe(1);
      expect(dp.value.y).toBe(2);
      expect(dp.value.z).toBe(3);
    });
  });

  describe('deserialize with sub no reviver', () => {
    it('calls sub deserialize directly', () => {
      const DerivedWithSub = Derived(Position).sub(Position3D);

      const data = { type: 'Position3D', data: { x: 1, y: 2, z: 3 } };
      const dp = DerivedWithSub.deserialize(data) as any;

      expect(dp.value).toBeInstanceOf(Position3D);
      expect(dp.value.x).toBe(1);
      expect(dp.value.y).toBe(2);
      expect(dp.value.z).toBe(3);
    });
  });

  describe('deserialize with main reviver fallback', () => {
    it('calls main reviver when type not in subs', () => {
      const DerivedWithReviver = Derived(Position)
        .sub(Position3D)
        .reviver((type, data) => {
          const d = data as { x: number; y: number };
          if (type === 'Position2D') {
            const p = new Position2D();
            p.x = d.x;
            p.y = d.y;
            p.w = 100;
            return p;
          }
          const p = new Position();
          p.x = d.x;
          p.y = d.y;
          return p;
        });

      const data = { type: 'Position2D', data: { x: 5, y: 10 } };
      const dp = DerivedWithReviver.deserialize(data) as any;

      expect(dp.value).toBeInstanceOf(Position2D);
      expect(dp.value.x).toBe(5);
      expect(dp.value.y).toBe(10);
      expect(dp.value.w).toBe(100);
    });
  });

  describe('deserialize with base fallback', () => {
    it('calls base deserialize when no sub and no reviver', () => {
      const data = { type: 'UnknownType', data: { x: 7, y: 8 } };
      const dp = DerivedPos.deserialize(data) as any;

      expect(dp.value).toBeInstanceOf(Position);
      expect(dp.value.x).toBe(7);
      expect(dp.value.y).toBe(8);
    });
  });

  describe('lifecycle propagation', () => {
    it('onAttached propagates to inner value', () => {
      const DerivedTracked = Derived(TrackedPosition);
      class ActorWithTracked extends Entity {
        static columns = Columns(DerivedTracked);
      }

      const pos = new TrackedPosition();
      const dp = new DerivedTracked(pos);
      const table = new Table(ActorWithTracked, manager);
      table.insert([dp]);

      expect(TrackedPosition.attachCalls).toBe(1);
    });

    it('onDetached propagates to inner value', () => {
      const DerivedTracked = Derived(TrackedPosition);
      class ActorWithTracked extends Entity {
        static columns = Columns(DerivedTracked);
      }

      const pos = new TrackedPosition();
      const dp = new DerivedTracked(pos);
      const table = new Table(ActorWithTracked, manager);
      const ref = table.insert([dp]);
      const entry = ref.deref();
      if (!entry) throw new Error('insert failed');

      TrackedPosition.detachCalls = 0;
      dp.onDetached(entry);

      expect(TrackedPosition.detachCalls).toBe(1);
    });

    it('onAttached propagates to inner value', () => {
      const DerivedTracked = Derived(TrackedPosition);
      class ActorWithTracked extends Entity {
        static columns = Columns(DerivedTracked);
      }

      const pos = new TrackedPosition();
      const dp = new DerivedTracked(pos);
      const table = new Table(ActorWithTracked, manager);

      table.insert([dp]);

      expect(TrackedPosition.attachCalls).toBe(1);
    });

    it('onDead propagates to inner value', () => {
      const DerivedTracked = Derived(TrackedPosition);
      class ActorWithTracked extends Entity {
        static columns = Columns(DerivedTracked);
      }

      const pos = new TrackedPosition();
      const dp = new DerivedTracked(pos);
      const table = new Table(ActorWithTracked, manager);
      const ref = table.insert([dp]);
      const entry = ref.deref();
      if (!entry) throw new Error('Failed to insert entry');

      TrackedPosition.deadCalls = 0;
      table.delete(ref);

      expect(TrackedPosition.deadCalls).toBe(1);
    });
  });

  describe('in Entry', () => {
    function createEntry(): Entry<typeof ActorWithDerived> {
      const table = new Table(ActorWithDerived, manager);
      const pos = new Position();
      const vel = new Velocity();
      const pos3d = new Position3D();
      pos3d.x = 1;
      pos3d.y = 2;
      pos3d.z = 3;
      const dp = new DerivedPos(pos3d);

      const ref = table.insert([pos, vel, dp]);
      const entry = ref.deref();
      if (!entry) throw new Error('Failed to insert entry');
      return entry;
    }

    it('entry can store derived component', () => {
      const entry = createEntry();

      expect(entry.get(DerivedPos)).toBeDefined();
      expect(entry.get(DerivedPos).value).toBeDefined();
    });

    it('entry.has returns true for derived slot', () => {
      const entry = createEntry();

      expect(entry.has(DerivedPos)).toBe(true);
    });

    it('set replaces derived component', () => {
      const entry = createEntry();

      const pos3d2 = new Position3D();
      pos3d2.x = 4;
      pos3d2.y = 5;
      pos3d2.z = 6;
      const dp2 = new DerivedPos(pos3d2);
      entry.set(DerivedPos, dp2);

      expect(entry.get(DerivedPos).value.x).toBe(4);
    });
  });

  describe('method chaining', () => {
    it('allows chaining sub and reviver', () => {
      const DerivedPos2 = Derived(Position)
        .sub(Position3D, data => {
          const p = new Position3D();
          p.x = (data as any).x;
          p.y = (data as any).y;
          p.z = (data as any).z;
          return p;
        })
        .sub(Position2D)
        .reviver((type, data) => {
          const d = data as { x: number; y: number };
          const p = new Position();
          p.x = d.x;
          p.y = d.y;
          return p;
        });

      const data = { type: 'Unknown', data: { x: 1, y: 2 } };
      const dp = DerivedPos2.deserialize(data) as any;

      expect(dp.value).toBeInstanceOf(Position);
      expect(dp.value.x).toBe(1);
    });

    it('allows chaining reviver and sub', () => {
      const DerivedPos3 = Derived(Position)
        .reviver((type, data) => {
          const p = new Position();
          p.x = (data as any).x;
          p.y = (data as any).y;
          return p;
        })
        .sub(Position3D, data => {
          const p = new Position3D();
          p.x = (data as any).x;
          p.y = (data as any).y;
          p.z = (data as any).z;
          return p;
        });

      const data = { type: 'Position3D', data: { x: 1, y: 2, z: 3 } };
      const dp = DerivedPos3.deserialize(data) as any;

      expect(dp.value).toBeInstanceOf(Position3D);
      expect(dp.value.z).toBe(3);
    });
  });

  describe('polymorphic insertion', () => {
    it('allows Position3D via Derived when Position column would reject it', () => {
      const DerivedPosPoly = Derived(Position);

      class ActorWithPolymorphic extends Entity {
        static columns = Columns(DerivedPosPoly);
      }

      const pos3d = new Position3D();
      pos3d.x = 1;
      pos3d.y = 2;
      pos3d.z = 3;
      const dp = new DerivedPosPoly(pos3d);

      const table = new Table(ActorWithPolymorphic, manager);
      const ref = table.insert([dp]);
      const entry = ref.deref();
      if (!entry) throw new Error('insert failed');

      expect(entry.get(DerivedPosPoly).value).toBe(pos3d);
      expect(entry.get(DerivedPosPoly).value.z).toBe(3);
    });

    it('still allows Velocity in Position column because Entry does not validate on construction', () => {
      class ActorWithPosition extends Entity {
        static columns = Columns(Position);
      }

      const vel = new Velocity();
      const table = new Table(ActorWithPosition, manager);
      const ref = table.insert([vel] as any);
      const entry = ref.deref();
      if (!entry) throw new Error('insert failed');

      expect(entry.components[0]).toBeInstanceOf(Velocity);
    });
  });
});

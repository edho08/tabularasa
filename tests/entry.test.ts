import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '../src/component';
import { Entity } from '../src/entity';
import { Entry } from '../src/entry';
import { Columns } from '../src/entity';

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

class Actor extends Entity {
  static columns = Columns(Position, Velocity);
}

class Enemy extends Entity {
  static columns = Columns(Position, Velocity, Health);
}

class TrackedComponent extends Component {
  static attachCalls = 0;
  static detachCalls = 0;

  attach(_entry: any): void {
    TrackedComponent.attachCalls++;
  }

  detach(_entry: any): void {
    TrackedComponent.detachCalls++;
  }
}

class TrackedPosition extends Position {
  static attachCalls = 0;
  static detachCalls = 0;

  attach(_entry: any): void {
    TrackedPosition.attachCalls++;
  }

  detach(_entry: any): void {
    TrackedPosition.detachCalls++;
  }
}

class TrackedVelocity extends Velocity {
  static attachCalls = 0;
  static detachCalls = 0;

  attach(_entry: any): void {
    TrackedVelocity.attachCalls++;
  }

  detach(_entry: any): void {
    TrackedVelocity.detachCalls++;
  }
}

describe('Entry', () => {
  beforeEach(() => {
    TrackedComponent.attachCalls = 0;
    TrackedComponent.detachCalls = 0;
    TrackedPosition.attachCalls = 0;
    TrackedPosition.detachCalls = 0;
    TrackedVelocity.attachCalls = 0;
    TrackedVelocity.detachCalls = 0;
  });

  describe('typed Entry<Actor>', () => {
    it('can be created with entity type and components', () => {
      const pos = new Position();
      const vel = new Velocity();
      const actor = new Entry(Actor, [pos, vel]);
      expect(actor).toBeDefined();
      expect(actor.components).toHaveLength(2);
    });

    describe('get', () => {
      it('returns component by class', () => {
        const pos = new Position();
        pos.x = 10;
        pos.y = 20;
        const vel = new Velocity();
        vel.vx = 1;
        vel.vy = 2;
        const actor = new Entry(Actor, [pos, vel]);

        const found = actor.get(Position);
        expect(found).toBe(pos);
        expect(found.x).toBe(10);
        expect(found.y).toBe(20);
      });

      it('throws for missing component', () => {
        const pos = new Position();
        const vel = new Velocity();
        const actor = new Entry(Actor, [pos, vel]);

        expect(() => actor.get(Health)).toThrow(TypeError);
        expect(() => actor.get(Health)).toThrow('Component Health is not in this Entry');
      });
    });

    describe('getAt', () => {
      it('returns component by index', () => {
        const pos = new Position();
        pos.x = 100;
        const vel = new Velocity();
        vel.vx = 50;
        const actor = new Entry(Actor, [pos, vel]);

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
        const actor = new Entry(Actor, [pos, vel]);

        expect(() => actor.getAt(-1)).toThrow(TypeError);
        expect(() => actor.getAt(-1)).toThrow('Index -1 is out of bounds');
      });

      it('throws for index >= length', () => {
        const pos = new Position();
        const vel = new Velocity();
        const actor = new Entry(Actor, [pos, vel]);

        expect(() => actor.getAt(2)).toThrow(TypeError);
        expect(() => actor.getAt(2)).toThrow('Index 2 is out of bounds');
        expect(() => actor.getAt(100)).toThrow(TypeError);
        expect(() => actor.getAt(100)).toThrow('Index 100 is out of bounds');
      });
    });

    describe('set', () => {
      it('replaces component by class and returns old', () => {
        const pos = new Position();
        pos.x = 1;
        const vel = new Velocity();
        const actor = new Entry(Actor, [pos, vel]);

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
        const actor = new Entry(Actor, [pos, new Velocity()]);

        const newHealth = new Health();
        expect(() => actor.set(Health, newHealth)).toThrow(TypeError);
        expect(() => actor.set(Health, newHealth)).toThrow('Component Health is not in this Entry');
      });
    });

    describe('setAny', () => {
      it('replaces component by value constructor and returns old', () => {
        const pos = new Position();
        pos.x = 1;
        const vel = new Velocity();
        const actor = new Entry(Actor, [pos, vel]);

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
        const actor = new Entry(Actor, [pos, new Velocity()]);

        const unused = new Unused();
        expect(() => actor.setAny(unused)).toThrow(TypeError);
        expect(() => actor.setAny(unused)).toThrow('Component Unused is not in this Entry');
      });
    });

    describe('setAt', () => {
      it('replaces component by index and returns old', () => {
        const pos = new Position();
        pos.x = 1;
        const vel = new Velocity();
        const actor = new Entry(Actor, [pos, vel]);

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
        const actor = new Entry(Actor, [pos, new Velocity()]);

        const newVel = new Velocity();
        expect(() => actor.setAt(2, newVel)).toThrow(TypeError);
        expect(() => actor.setAt(2, newVel)).toThrow('Index 2 is out of bounds');
        expect(() => actor.setAt(-1, newVel)).toThrow(TypeError);
        expect(() => actor.setAt(-1, newVel)).toThrow('Index -1 is out of bounds');
      });

      it('throws for type mismatch at index', () => {
        const pos = new Position();
        const vel = new Velocity();
        const actor = new Entry(Actor, [pos, vel]);

        const wrong = new Health();
        expect(() => actor.setAt(0, wrong)).toThrow(TypeError);
        expect(() => actor.setAt(0, wrong)).toThrow(
          'Type mismatch: expected Position at index 0, got Health',
        );

        expect(() => actor.setAt(1, wrong)).toThrow(TypeError);
        expect(() => actor.setAt(1, wrong)).toThrow(
          'Type mismatch: expected Velocity at index 1, got Health',
        );
      });
    });
  });

  describe('Entry<any> (untyped)', () => {
    it('can be created without type', () => {
      const pos = new Position();
      const vel = new Velocity();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = new Entry(Actor, [pos, vel]) as Entry<any>;
      expect(entry).toBeDefined();
    });

    it('get works with any component class', () => {
      const pos = new Position();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = new Entry(Actor, [pos, new Velocity()]) as Entry<any>;

      const found = entry.get(Position);
      expect(found).toBe(pos);

      expect(() => entry.get(Health)).toThrow('Component Health is not in this Entry');
    });

    it('getAt works with any index', () => {
      const pos = new Position();
      const vel = new Velocity();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = new Entry(Actor, [pos, vel]) as Entry<any>;

      expect(entry.getAt(0)).toBe(pos);
      expect(entry.getAt(1)).toBe(vel);

      expect(() => entry.getAt(2)).toThrow('Index 2 is out of bounds');
    });

    it('set works with any component', () => {
      const pos = new Position();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = new Entry(Actor, [pos, new Velocity()]) as Entry<any>;

      const newPos = new Position();
      newPos.x = 123;

      const old = entry.set(Position, newPos);

      expect(old).toBe(pos);
      expect(entry.get(Position)).toBe(newPos);
    });

    it('setAny works with any component', () => {
      const pos = new Position();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = new Entry(Actor, [pos, new Velocity()]) as Entry<any>;

      const newPos = new Position();
      newPos.x = 456;

      const old = entry.setAny(newPos);

      expect(old).toBe(pos);
      expect(entry.get(Position)).toBe(newPos);
    });

    it('setAt works with any index but still checks type at runtime', () => {
      const pos = new Position();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = new Entry(Actor, [pos, new Velocity()]) as Entry<any>;

      const newVel = new Velocity();

      // Entry<any> still does runtime type check - index 0 expects Position, not Velocity
      expect(() => entry.setAt(0, newVel)).toThrow(
        'Type mismatch: expected Position at index 0, got Velocity',
      );
    });
  });

  describe('different entity types', () => {
    it('Enemy has 3 columns', () => {
      const pos = new Position();
      const vel = new Velocity();
      const hp = new Health();
      const enemy = new Entry(Enemy, [pos, vel, hp]);

      expect(enemy.get(Position)).toBe(pos);
      expect(enemy.get(Velocity)).toBe(vel);
      expect(enemy.get(Health)).toBe(hp);

      expect(enemy.getAt(0)).toBe(pos);
      expect(enemy.getAt(1)).toBe(vel);
      expect(enemy.getAt(2)).toBe(hp);
    });

    it('setAt on Enemy checks type at each index', () => {
      const pos = new Position();
      const vel = new Velocity();
      const hp = new Health();
      const enemy = new Entry(Enemy, [pos, vel, hp]);

      const newPos = new Position();
      expect(enemy.setAt(0, newPos)).toBe(pos);

      const newVel = new Velocity();
      expect(enemy.setAt(1, newVel)).toBe(vel);

      const newHp = new Health();
      expect(enemy.setAt(2, newHp)).toBe(hp);

      expect(() => enemy.setAt(0, newVel)).toThrow(
        'Type mismatch: expected Position at index 0, got Velocity',
      );
      expect(() => enemy.setAt(1, newHp)).toThrow(
        'Type mismatch: expected Velocity at index 1, got Health',
      );
      expect(() => enemy.setAt(2, newPos)).toThrow(
        'Type mismatch: expected Health at index 2, got Position',
      );
    });
  });

  describe('has', () => {
    it('returns true for component that exists', () => {
      const pos = new Position();
      const vel = new Velocity();
      const actor = new Entry(Actor, [pos, vel]);

      expect(actor.has(Position)).toBe(true);
      expect(actor.has(Velocity)).toBe(true);
    });

    it('returns false for component that does not exist', () => {
      const pos = new Position();
      const vel = new Velocity();
      const actor = new Entry(Actor, [pos, vel]);

      expect(actor.has(Health)).toBe(false);
    });
  });

  describe('lifecycle hooks', () => {
    describe('constructor', () => {
      it('calls attach on all components', () => {
        const pos = new TrackedPosition();
        const vel = new TrackedVelocity();
        new Entry(Actor, [pos, vel]);

        expect(TrackedPosition.attachCalls).toBe(1);
        expect(TrackedVelocity.attachCalls).toBe(1);
      });
    });

    describe('set', () => {
      it('calls detach on old component and attach on new', () => {
        const pos = new TrackedPosition();
        const vel = new TrackedVelocity();
        const entry = new Entry(Actor, [pos, vel]);

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
        const entry = new Entry(Actor, [pos, vel]);

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
        const entry = new Entry(Actor, [pos, vel]);

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
});

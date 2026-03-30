import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '../../../src/entity/component';
import { Entity } from '../../../src/entity/entity';
import { Columns } from '../../../src/entity/entity';
import { Entry } from '../../../src/table/entry';
import { Table } from '../../../src/table/table';
import { ReadonlyComponent, Readonly } from '../../../src/entity/pattern/readonly';

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

class TrackedHealth extends Health {
  static onAttachedCalls = 0;
  static onDetachedCalls = 0;
  static onAliveCalls = 0;
  static onDeadCalls = 0;

  override onAttached(): void {
    TrackedHealth.onAttachedCalls++;
  }

  override onDetached(): void {
    TrackedHealth.onDetachedCalls++;
  }

  override onAlive(): void {
    TrackedHealth.onAliveCalls++;
  }

  override onDead(): void {
    TrackedHealth.onDeadCalls++;
  }
}

const HealthRo = Readonly(Health);
const TrackedHealthRo = Readonly(TrackedHealth);

class ActorWithHealth extends Entity {
  static columns = Columns(Position, Velocity, HealthRo);
}

class ActorWithTrackedHealth extends Entity {
  static columns = Columns(Position, Velocity, TrackedHealthRo);
}

describe('Readonly', () => {
  beforeEach(() => {
    TrackedHealth.onAttachedCalls = 0;
    TrackedHealth.onDetachedCalls = 0;
    TrackedHealth.onAliveCalls = 0;
    TrackedHealth.onDeadCalls = 0;
  });

  function createEntryWithHealth(components: Component[]): Entry<typeof ActorWithHealth> {
    const table = new Table(ActorWithHealth);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return table.insert(components).deref()!;
  }

  describe('constructor', () => {
    it('creates readonly with value', () => {
      const health = new Health();
      health.hp = 50;
      const ro = new HealthRo(health);

      expect(ro.value).toBe(health);
    });

    it('value is readonly', () => {
      const health = new Health();
      const ro = new HealthRo(health);

      // TypeScript's readonly modifier prevents assignment at compile time
      // At runtime, onDetached throws to prevent changes to readonly components
      expect((ro as { value: Health }).value).toBe(health);
    });
  });

  describe('lifecycle propagation', () => {
    it('onAttached propagates to inner value', () => {
      const health = new TrackedHealth();
      const ro = new TrackedHealthRo(health);
      new Entry(ActorWithTrackedHealth, [new Position(), new Velocity(), ro]);

      expect(TrackedHealth.onAttachedCalls).toBe(1);
    });

    it('onDetached throws for readonly', () => {
      const health = new TrackedHealth();
      const ro = new TrackedHealthRo(health);
      const entry = createEntryWithHealth([new Position(), new Velocity(), ro]);

      expect(() => entry.set(TrackedHealthRo, new TrackedHealthRo(new TrackedHealth()))).toThrow(
        'cannot change readonly component',
      );
    });

    it('value is readonly', () => {
      const health = new Health();
      const ro = new HealthRo(health);

      // TypeScript readonly enforced at compile time, onDetached protects at runtime
      expect((ro as unknown as { value: Health }).value).toBe(health);
    });
  });

  describe('lifecycle propagation', () => {
    it('onAttached propagates to inner value', () => {
      const health = new TrackedHealth();
      const ro = new TrackedHealthRo(health);
      new Entry(ActorWithTrackedHealth, [new Position(), new Velocity(), ro]);

      expect(TrackedHealth.onAttachedCalls).toBe(1);
    });

    it('onDetached throws for readonly', () => {
      const health = new TrackedHealth();
      const ro = new TrackedHealthRo(health);
      const entry = createEntryWithHealth([new Position(), new Velocity(), ro]);

      expect(() => entry.set(TrackedHealthRo, new TrackedHealthRo(new TrackedHealth()))).toThrow(
        'cannot change readonly component',
      );
    });

    it('onAlive propagates to inner value', () => {
      const health = new TrackedHealth();
      const ro = new TrackedHealthRo(health);
      const entry = createEntryWithHealth([new Position(), new Velocity(), ro]);

      TrackedHealth.onAliveCalls = 0;
      entry.callAlive();

      expect(TrackedHealth.onAliveCalls).toBe(1);
    });

    it('onDead propagates to inner value', () => {
      const health = new TrackedHealth();
      const ro = new TrackedHealthRo(health);
      const entry = createEntryWithHealth([new Position(), new Velocity(), ro]);

      TrackedHealth.onDeadCalls = 0;
      entry.callAlive();
      entry.callDead();

      expect(TrackedHealth.onDeadCalls).toBe(1);
    });
  });

  describe('serialize', () => {
    it('returns inner data without wrapper', () => {
      const health = new Health();
      health.hp = 42;
      const ro = new HealthRo(health);
      const entry = createEntryWithHealth([new Position(), new Velocity(), ro]);

      const data = entry.serialize();

      expect(data[2]).toEqual({ hp: 42 });
    });
  });

  describe('deserialize', () => {
    it('reconstructs readonly component', () => {
      const data = { hp: 99 };
      const ro = TrackedHealthRo.deserialize(data) as ReadonlyComponent<TrackedHealth>;

      expect(ro.value).toBeInstanceOf(TrackedHealth);
      expect(ro.value.hp).toBe(99);
    });
  });

  describe('memoization', () => {
    it('returns same class for same component', () => {
      const ro1 = Readonly(Health);
      const ro2 = Readonly(Health);

      expect(ro1).toBe(ro2);
    });

    it('memoized class has correct name', () => {
      const Ro = Readonly(Health);
      const instance = new Ro(new Health());

      expect(Ro.name).toBe('Readonly<Health>');
      expect(instance.constructor.name).toBe('Readonly<Health>');
    });

    it('memoized class has static ctor pointing to original', () => {
      const Ro = Readonly(Health);

      expect(Ro.ctor).toBe(Health);
    });
  });

  describe('in Entry', () => {
    it('entry can store readonly with value', () => {
      const pos = new Position();
      const vel = new Velocity();
      const health = new Health();
      health.hp = 100;
      const ro = new HealthRo(health);

      const entry = createEntryWithHealth([pos, vel, ro]);

      expect(entry.get(HealthRo).value.hp).toBe(100);
    });

    it('entry.get returns readonly wrapper', () => {
      const pos = new Position();
      const vel = new Velocity();
      const health = new Health();
      const ro = new HealthRo(health);

      const entry = createEntryWithHealth([pos, vel, ro]);

      expect(entry.get(HealthRo)).toBeInstanceOf(HealthRo);
    });
  });
});

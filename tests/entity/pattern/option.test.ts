import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '../../../src/entity/component';
import { Entity } from '../../../src/entity/entity';
import { Columns } from '../../../src/entity/entity';
import { Entry } from '../../../src/table/entry';
import { Table } from '../../../src/table/table';
import { TableManager } from '../../../src/table/manager';
import { Option } from '../../../src/entity/pattern/option';

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

class TrackedHealth extends Health {
  static attachCalls = 0;
  static detachCalls = 0;
  static aliveCalls = 0;
  static deadCalls = 0;

  override onAttached(): void {
    TrackedHealth.attachCalls++;
  }

  override onDetached(): void {
    TrackedHealth.detachCalls++;
  }

  override onAlive(): void {
    TrackedHealth.aliveCalls++;
  }

  override onDead(): void {
    TrackedHealth.deadCalls++;
  }
}

const HealthOpt = Option(Health);
const TrackedHealthOpt = Option(TrackedHealth);

class ActorWithHealth extends Entity {
  static columns = Columns(Position, Velocity, HealthOpt);
}

class ActorWithTrackedHealth extends Entity {
  static columns = Columns(Position, Velocity, TrackedHealthOpt);
}

describe('Option', () => {
  beforeEach(() => {
    TrackedHealth.attachCalls = 0;
    TrackedHealth.detachCalls = 0;
    TrackedHealth.aliveCalls = 0;
    TrackedHealth.deadCalls = 0;
  });

  function createEntryWithHealth(components: Component[]): Entry<typeof ActorWithHealth> {
    const table = new Table(ActorWithHealth, manager);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return table.insert(components).deref()!;
  }

  function createEntryWithTracked(components: Component[]): Entry<typeof ActorWithTrackedHealth> {
    const table = new Table(ActorWithTrackedHealth, manager);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return table.insert(components).deref()!;
  }

  describe('constructor', () => {
    it('creates option with value', () => {
      const health = new Health();
      health.hp = 50;
      const opt = new HealthOpt(health);

      expect(opt.value).toBe(health);
      expect(opt.isSome()).toBe(true);
      expect(opt.isNone()).toBe(false);
    });

    it('creates option without value (undefined)', () => {
      const opt = new HealthOpt(undefined);

      expect(opt.value).toBeUndefined();
      expect(opt.isSome()).toBe(false);
      expect(opt.isNone()).toBe(true);
    });
  });

  describe('create', () => {
    it('creates option with value using static method', () => {
      const health = new Health();
      health.hp = 42;
      const opt = HealthOpt.create(health);

      expect(opt.value).toBe(health);
      expect(opt.isSome()).toBe(true);
      expect(opt.unwrap().hp).toBe(42);
    });
  });

  describe('isSome', () => {
    it('returns true when value is set', () => {
      const opt = new HealthOpt(new Health());
      expect(opt.isSome()).toBe(true);
    });

    it('returns false when value is undefined', () => {
      const opt = new HealthOpt(undefined);
      expect(opt.isSome()).toBe(false);
    });
  });

  describe('isNone', () => {
    it('returns true when value is undefined', () => {
      const opt = new HealthOpt(undefined);
      expect(opt.isNone()).toBe(true);
    });

    it('returns false when value is set', () => {
      const opt = new HealthOpt(new Health());
      expect(opt.isNone()).toBe(false);
    });
  });

  describe('unwrap', () => {
    it('returns the value when present', () => {
      const health = new Health();
      health.hp = 75;
      const opt = new HealthOpt(health);

      expect(opt.unwrap()).toBe(health);
      expect(opt.unwrap().hp).toBe(75);
    });

    it('throws TypeError when no value', () => {
      const opt = new HealthOpt(undefined);

      expect(() => opt.unwrap()).toThrow(TypeError);
      expect(() => opt.unwrap()).toThrow('Option<Health> has no value');
    });
  });

  describe('unwrapOr', () => {
    it('returns value when present', () => {
      const health = new Health();
      health.hp = 42;
      const opt = new HealthOpt(health);
      const defaultHealth = new Health();
      defaultHealth.hp = 999;

      expect(opt.unwrapOr(defaultHealth)).toBe(health);
      expect(opt.unwrapOr(defaultHealth).hp).toBe(42);
    });

    it('returns default value when no value', () => {
      const opt = new HealthOpt(undefined);
      const defaultHealth = new Health();
      defaultHealth.hp = 999;

      expect(opt.unwrapOr(defaultHealth)).toBe(defaultHealth);
      expect(opt.unwrapOr(defaultHealth).hp).toBe(999);
    });

    it('returns undefined value when no default and no value', () => {
      const opt = new HealthOpt(undefined);
      expect(opt.unwrapOr(undefined as any)).toBeUndefined();
    });
  });

  describe('onSome', () => {
    it('calls callback when value is present', () => {
      const health = new Health();
      health.hp = 60;
      const opt = new HealthOpt(health);
      let called = false;
      let receivedValue: Health | undefined;

      opt.onSome(v => {
        called = true;
        receivedValue = v;
      });

      expect(called).toBe(true);
      expect(receivedValue).toBe(health);
      expect(receivedValue?.hp).toBe(60);
    });

    it('does not call callback when no value', () => {
      const opt = new HealthOpt(undefined);
      let called = false;

      opt.onSome(() => {
        called = true;
      });

      expect(called).toBe(false);
    });
  });

  describe('onNone', () => {
    it('calls callback when no value', () => {
      const opt = new HealthOpt(undefined);
      let called = false;

      opt.onNone(() => {
        called = true;
      });

      expect(called).toBe(true);
    });

    it('does not call callback when value is present', () => {
      const opt = new HealthOpt(new Health());
      let called = false;

      opt.onNone(() => {
        called = true;
      });

      expect(called).toBe(false);
    });
  });

  describe('lifecycle propagation', () => {
    it('attach propagates to inner value', () => {
      const health = new TrackedHealth();
      const opt = new TrackedHealthOpt(health);
      createEntryWithTracked([new Position(), new Velocity(), opt]);

      expect(TrackedHealth.attachCalls).toBe(1);
    });

    it('attach does not call on inner when none', () => {
      const opt = new TrackedHealthOpt(undefined);
      createEntryWithTracked([new Position(), new Velocity(), opt]);

      expect(TrackedHealth.attachCalls).toBe(0);
    });

    it('detach propagates to inner value', () => {
      const health = new TrackedHealth();
      const opt = new TrackedHealthOpt(health);
      const entry = createEntryWithTracked([new Position(), new Velocity(), opt]);

      TrackedHealth.detachCalls = 0;
      opt.onDetached(entry);

      expect(TrackedHealth.detachCalls).toBe(1);
    });

    it('detach does not call on inner when none', () => {
      const opt = new TrackedHealthOpt(undefined);
      const entry = createEntryWithTracked([new Position(), new Velocity(), opt]);

      TrackedHealth.detachCalls = 0;
      opt.onDetached(entry);

      expect(TrackedHealth.detachCalls).toBe(0);
    });

    it('attach propagates to inner value', () => {
      const health = new TrackedHealth();
      const opt = new TrackedHealthOpt(health);
      const table = new Table(ActorWithTrackedHealth, manager);

      table.insert([new Position(), new Velocity(), opt]);

      expect(TrackedHealth.attachCalls).toBe(1);
    });

    it('attach does not call on inner when none', () => {
      const opt = new TrackedHealthOpt(undefined);
      const table = new Table(ActorWithTrackedHealth, manager);

      table.insert([new Position(), new Velocity(), opt]);

      expect(TrackedHealth.attachCalls).toBe(0);
    });

    it('dead propagates to inner value', () => {
      const health = new TrackedHealth();
      const opt = new TrackedHealthOpt(health);
      const table = new Table(ActorWithTrackedHealth, manager);
      const ref = table.insert([new Position(), new Velocity(), opt]);
      const entry = ref.deref();
      if (!entry) throw new Error('insert failed');

      TrackedHealth.deadCalls = 0;
      table.delete(ref);

      expect(TrackedHealth.deadCalls).toBe(1);
    });

    it('detach does not call on inner when none', () => {
      const opt = new TrackedHealthOpt(undefined);
      const table = new Table(ActorWithTrackedHealth, manager);
      const ref = table.insert([new Position(), new Velocity(), opt]);
      const entry = ref.deref();
      if (!entry) throw new Error('insert failed');

      TrackedHealth.detachCalls = 0;
      table.delete(ref);

      expect(TrackedHealth.detachCalls).toBe(0);
    });
  });

  describe('serialize', () => {
    it('returns inner component data when present', () => {
      const health = new Health();
      health.hp = 88;
      const opt = new HealthOpt(health);
      const table = new Table(ActorWithHealth, manager);
      const ref = table.insert([new Position(), new Velocity(), opt]);
      const entry = ref.deref();
      if (!entry) throw new Error('insert failed');

      const data = opt.serialize(entry);

      expect(data).toEqual({ hp: 88 });
    });

    it('returns null when no value', () => {
      const opt = new HealthOpt(undefined);
      const table = new Table(ActorWithHealth, manager);
      const ref = table.insert([new Position(), new Velocity(), opt]);
      const entry = ref.deref();
      if (!entry) throw new Error('insert failed');

      const data = opt.serialize(entry);

      expect(data).toBeNull();
    });
  });

  describe('deserialize', () => {
    it('creates option with value from data', () => {
      const data = { hp: 55 };

      const opt = HealthOpt.deserialize(data);

      expect(opt.isSome()).toBe(true);
      expect(opt.unwrap()).toBeInstanceOf(Health);
      expect(opt.unwrap().hp).toBe(55);
    });

    it('creates empty option from null', () => {
      const opt = HealthOpt.deserialize(null);

      expect(opt.isNone()).toBe(true);
      expect(opt.value).toBeUndefined();
    });
  });

  describe('Optional memoization', () => {
    it('returns same class for same constructor', () => {
      const Opt1 = Option(Health);
      const Opt2 = Option(Health);

      expect(Opt1).toBe(Opt2);
    });

    it('returns different classes for different constructors', () => {
      const HealthOptClass = Option(Health);
      const VelocityOptClass = Option(Velocity);

      expect(HealthOptClass).not.toBe(VelocityOptClass);
    });

    it('memoized class has correct name', () => {
      const Opt = Option(Health);
      const instance = new Opt(new Health());

      expect(Opt.name).toBe('Option<Health>');
      expect(instance.constructor.name).toBe('Option<Health>');
    });

    it('memoized class has static ctor pointing to original', () => {
      const Opt = Option(Health);

      expect(Opt.ctor).toBe(Health);
    });
  });

  describe('in Entry', () => {
    it('entry can store option with value', () => {
      const pos = new Position();
      const vel = new Velocity();
      const health = new Health();
      health.hp = 100;
      const opt = new HealthOpt(health);

      const entry = createEntryWithHealth([pos, vel, opt]);

      expect(entry.get(HealthOpt)).toBe(opt);
      expect(entry.get(HealthOpt).unwrap().hp).toBe(100);
    });

    it('entry can store option without value', () => {
      const pos = new Position();
      const vel = new Velocity();
      const opt = new HealthOpt(undefined);

      const entry = createEntryWithHealth([pos, vel, opt]);

      expect(entry.get(HealthOpt).isNone()).toBe(true);
    });

    it('entry.has returns true for option slot regardless of value', () => {
      const entry1 = createEntryWithHealth([
        new Position(),
        new Velocity(),
        new HealthOpt(new Health()),
      ]);
      const entry2 = createEntryWithHealth([
        new Position(),
        new Velocity(),
        new HealthOpt(undefined),
      ]);

      expect(entry1.has(HealthOpt)).toBe(true);
      expect(entry2.has(HealthOpt)).toBe(true);
    });

    it('set replaces option with new option', () => {
      const pos = new Position();
      const vel = new Velocity();
      const entry = createEntryWithHealth([pos, vel, new HealthOpt(undefined)]);

      const newOpt = new HealthOpt(new Health());
      entry.set(HealthOpt, newOpt);

      expect(entry.get(HealthOpt)).toBe(newOpt);
    });
  });
});

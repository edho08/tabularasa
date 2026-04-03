import { describe, it, expect } from 'vitest';
import { Component } from '../../src/entity/component';
import { Option } from '../../src/wrappers/option';
import type { AnyEntry } from '../../src/table/entry';

class Position extends Component {
  x = 0;
  y = 0;
}

class Velocity extends Component {
  vx = 0;
  vy = 0;
}

class TrackedComponent extends Component {
  attached = false;
  detached = false;
  deserialized = false;

  onAttached(_entry: AnyEntry, _index: number): void {
    this.attached = true;
  }

  onDetached(_entry: AnyEntry, _index: number): void {
    this.detached = true;
  }

  onDeserialized(_entry: AnyEntry, _index: number): void {
    this.deserialized = true;
  }
}

describe('Option', () => {
  describe('Option.for(Component)', () => {
    it('creates a specialized Option class for the component', () => {
      const OptPos = Option.for(Position);

      const opt = OptPos.some(new Position());

      expect(opt).toBeInstanceOf(Object);
      expect(opt.isSome()).toBe(true);
      expect(opt.isNone()).toBe(false);
    });

    it('memoizes specialized classes', () => {
      const OptPos1 = Option.for(Position);
      const OptPos2 = Option.for(Position);

      expect(OptPos1).toBe(OptPos2);
    });

    it('different components get different classes', () => {
      const OptPos = Option.for(Position);
      const OptVel = Option.for(Velocity);

      expect(OptPos).not.toBe(OptVel);
    });
  });

  describe('specialized class methods', () => {
    it('.some() creates Option with value', () => {
      const OptPos = Option.for(Position);
      const pos = new Position();
      pos.x = 10;
      pos.y = 20;

      const opt = OptPos.some(pos);

      expect(opt.isSome()).toBe(true);
      expect(opt.isNone()).toBe(false);
      expect(opt.inner).toBe(pos);
    });

    it('.none() creates Option without value', () => {
      const OptPos = Option.for(Position);

      const opt = OptPos.none();

      expect(opt.isSome()).toBe(false);
      expect(opt.isNone()).toBe(true);
      expect(opt.inner).toBeUndefined();
    });

    it('.make() creates Option with value (alias for some)', () => {
      const OptPos = Option.for(Position);
      const pos = new Position();

      const opt = OptPos.make(pos);

      expect(opt.isSome()).toBe(true);
      expect(opt.inner).toBe(pos);
    });
  });

  describe('unwrap', () => {
    it('returns the value when present', () => {
      const OptPos = Option.for(Position);
      const pos = new Position();
      pos.x = 5;

      const opt = OptPos.some(pos);
      const unwrapped = opt.unwrap();

      expect(unwrapped).toBe(pos);
      expect(unwrapped.x).toBe(5);
    });

    it('throws when value is undefined', () => {
      const OptPos = Option.for(Position);
      const opt = OptPos.none();

      expect(() => opt.unwrap()).toThrow(TypeError);
    });
  });

  describe('in Entity type', () => {
    it('can be used as entity component type', () => {
      const OptPos = Option.for(Position);

      const opt = OptPos.some(new Position());
      if (opt.inner === undefined) throw new Error('inner should be defined');
      opt.inner.x = 100;

      expect(opt.inner.x).toBe(100);
    });
  });

  describe('lifecycle propagation', () => {
    it('propagates onAttached to wrapped component when Some', () => {
      const OptTracked = Option.for(TrackedComponent);
      const tracked = new TrackedComponent();
      const opt = OptTracked.some(tracked);

      opt.onAttached({} as AnyEntry, 0);

      expect(tracked.attached).toBe(true);
    });

    it('does not throw onAttached when None', () => {
      const OptTracked = Option.for(TrackedComponent);
      const opt = OptTracked.none();

      expect(() => opt.onAttached({} as AnyEntry, 0)).not.toThrow();
    });

    it('propagates onDetached to wrapped component when Some', () => {
      const OptTracked = Option.for(TrackedComponent);
      const tracked = new TrackedComponent();
      const opt = OptTracked.some(tracked);

      opt.onDetached({} as AnyEntry, 0);

      expect(tracked.detached).toBe(true);
    });

    it('does not throw onDetached when None', () => {
      const OptTracked = Option.for(TrackedComponent);
      const opt = OptTracked.none();

      expect(() => opt.onDetached({} as AnyEntry, 0)).not.toThrow();
    });

    it('propagates onDeserialized to wrapped component when Some', () => {
      const OptTracked = Option.for(TrackedComponent);
      const tracked = new TrackedComponent();
      const opt = OptTracked.some(tracked);

      opt.onDeserialized({} as AnyEntry, 0);

      expect(tracked.deserialized).toBe(true);
    });

    it('does not throw onDeserialized when None', () => {
      const OptTracked = Option.for(TrackedComponent);
      const opt = OptTracked.none();

      expect(() => opt.onDeserialized({} as AnyEntry, 0)).not.toThrow();
    });
  });
});

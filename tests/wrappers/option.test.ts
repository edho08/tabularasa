import { describe, it, expect } from 'vitest';
import { Component } from '../../src/entity/component';
import { Option } from '../../src/wrappers/option';

class Position extends Component {
  x = 0;
  y = 0;
}

class Velocity extends Component {
  vx = 0;
  vy = 0;
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
      expect(opt.value).toBe(pos);
    });

    it('.none() creates Option without value', () => {
      const OptPos = Option.for(Position);

      const opt = OptPos.none();

      expect(opt.isSome()).toBe(false);
      expect(opt.isNone()).toBe(true);
      expect(opt.value).toBeUndefined();
    });

    it('.make() creates Option with value (alias for some)', () => {
      const OptPos = Option.for(Position);
      const pos = new Position();

      const opt = OptPos.make(pos);

      expect(opt.isSome()).toBe(true);
      expect(opt.value).toBe(pos);
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
      opt.value!.x = 100;

      expect(opt.value!.x).toBe(100);
    });
  });
});

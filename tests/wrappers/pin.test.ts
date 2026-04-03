import { describe, it, expect } from 'vitest';
import { Component } from '../../src/entity/component';
import { Pin } from '../../src/wrappers/pin';
import { EntryLifecycle } from '../../src/table/entry';
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

describe('Pin', () => {
  describe('Pin.for(Component)', () => {
    it('creates a specialized Pin class for the component', () => {
      const PinPos = Pin.for(Position);

      const pin = PinPos.make(new Position());

      expect(pin.inner).toBeInstanceOf(Position);
    });

    it('memoizes specialized classes', () => {
      const PinPos1 = Pin.for(Position);
      const PinPos2 = Pin.for(Position);

      expect(PinPos1).toBe(PinPos2);
    });

    it('different components get different classes', () => {
      const PinPos = Pin.for(Position);
      const PinVel = Pin.for(Velocity);

      expect(PinPos).not.toBe(PinVel);
    });
  });

  describe('inner', () => {
    it('returns the wrapped component', () => {
      const PinPos = Pin.for(Position);
      const pos = new Position();
      pos.x = 10;
      pos.y = 20;

      const pin = PinPos.make(pos);

      expect(pin.inner).toBe(pos);
      expect(pin.inner.x).toBe(10);
      expect(pin.inner.y).toBe(20);
    });
  });

  describe('lifecycle propagation', () => {
    it('propagates onAttached to wrapped component', () => {
      const PinTracked = Pin.for(TrackedComponent);
      const tracked = new TrackedComponent();
      const pin = PinTracked.make(tracked);

      pin.onAttached({} as AnyEntry, 0);

      expect(tracked.attached).toBe(true);
    });

    it('propagates onDetached when entry is DYING', () => {
      const PinTracked = Pin.for(TrackedComponent);
      const tracked = new TrackedComponent();
      const pin = PinTracked.make(tracked);

      const dyingEntry = { lifecycle: EntryLifecycle.DYING } as AnyEntry;
      pin.onDetached(dyingEntry, 0);

      expect(tracked.detached).toBe(true);
    });

    it('propagates onDetached when entry is DEAD', () => {
      const PinTracked = Pin.for(TrackedComponent);
      const tracked = new TrackedComponent();
      const pin = PinTracked.make(tracked);

      const deadEntry = { lifecycle: EntryLifecycle.DEAD } as AnyEntry;
      pin.onDetached(deadEntry, 0);

      expect(tracked.detached).toBe(true);
    });

    it('throws onDetached when entry is ALIVE', () => {
      const PinTracked = Pin.for(TrackedComponent);
      const tracked = new TrackedComponent();
      const pin = PinTracked.make(tracked);

      const aliveEntry = { lifecycle: EntryLifecycle.ALIVE } as AnyEntry;

      expect(() => pin.onDetached(aliveEntry, 0)).toThrow(TypeError);
      expect(tracked.detached).toBe(false);
    });
  });

  describe('serialize', () => {
    it('passes through to inner serialize', () => {
      const PinPos = Pin.for(Position);
      const pos = new Position();
      pos.x = 5;
      const pin = PinPos.make(pos);

      const serialized = pin.serialize({} as AnyEntry);

      expect(serialized).toEqual({ x: 5, y: 0 });
    });
  });
});

import { describe, it, expect } from 'vitest';
import { Component } from '../../src/entity/component';
import { Union } from '../../src/wrappers/union';
import type { AnyEntry } from '../../src/table/entry';

class Idle extends Component {
  duration = 0;
}

class Walking extends Component {
  distance = 0;
}

class Running extends Component {
  speed = 0;
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

describe('Union', () => {
  describe('Union.for(Component1, Component2, ...)', () => {
    it('creates a specialized Union class for the components', () => {
      const StateUnion = Union.for(Idle, Walking, Running);

      const state = StateUnion.make(new Idle());

      expect(state.inner).toBeInstanceOf(Idle);
    });

    it('memoizes specialized classes', () => {
      const StateUnion1 = Union.for(Idle, Walking, Running);
      const StateUnion2 = Union.for(Idle, Walking, Running);

      expect(StateUnion1).toBe(StateUnion2);
    });

    it('different component sets get different classes', () => {
      const StateUnion = Union.for(Idle, Walking, Running);
      const OtherUnion = Union.for(Walking, Running, Idle);

      expect(StateUnion).toBe(OtherUnion);
    });
  });

  describe('variant', () => {
    it('returns the correct variant index', () => {
      const StateUnion = Union.for(Idle, Walking, Running);

      const idle = StateUnion.make(new Idle());
      const walking = StateUnion.make(new Walking());
      const running = StateUnion.make(new Running());

      expect(idle.variant()).toBe(0);
      expect(walking.variant()).toBe(1);
      expect(running.variant()).toBe(2);
    });
  });

  describe('make', () => {
    it('creates union with correct inner component', () => {
      const StateUnion = Union.for(Idle, Walking, Running);
      const idle = new Idle();
      idle.duration = 5;

      const state = StateUnion.make(idle);

      expect(state.inner).toBe(idle);
      expect(state.inner.duration).toBe(5);
    });

    it('throws if value constructor not in union', () => {
      const StateUnion = Union.for(Idle, Walking);

      expect(() => StateUnion.make(new Running() as any)).toThrow(TypeError);
    });
  });

  describe('lifecycle propagation', () => {
    it('propagates onAttached to wrapped component', () => {
      const TrackedUnion = Union.for(TrackedComponent, Idle);
      const tracked = new TrackedComponent();
      const union = TrackedUnion.make(tracked);

      union.onAttached({} as AnyEntry, 0);

      expect(tracked.attached).toBe(true);
    });

    it('propagates onDetached to wrapped component', () => {
      const TrackedUnion = Union.for(TrackedComponent, Idle);
      const tracked = new TrackedComponent();
      const union = TrackedUnion.make(tracked);

      union.onDetached({} as AnyEntry, 0);

      expect(tracked.detached).toBe(true);
    });

    it('propagates onDeserialized to wrapped component', () => {
      const TrackedUnion = Union.for(TrackedComponent, Idle);
      const tracked = new TrackedComponent();
      const union = TrackedUnion.make(tracked);

      union.onDeserialized({} as AnyEntry, 0);

      expect(tracked.deserialized).toBe(true);
    });
  });

  describe('serialize', () => {
    it('returns variant and inner serialize data', () => {
      const StateUnion = Union.for(Idle, Walking, Running);
      const idle = new Idle();
      idle.duration = 10;
      const state = StateUnion.make(idle);

      const serialized = state.serialize({} as AnyEntry);

      expect(serialized).toEqual({
        variant: 0,
        data: { duration: 10 },
      });
    });
  });
});

import { describe, it, expect } from 'vitest';
import { Component } from '../src/entity/component';
import type { Entry } from '../src/table/entry';

class TestComponent extends Component {
  attachCalled = false;
  detachCalled = false;
  aliveCalled = false;
  deadCalled = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAttached(_entry: Entry<any>): void {
    this.attachCalled = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDetached(_entry: Entry<any>): void {
    this.detachCalled = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAlive(_entry: Entry<any>): void {
    this.aliveCalled = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDead(_entry: Entry<any>): void {
    this.deadCalled = true;
  }
}

class DataComponent extends Component {
  x = 0;
  y = 0;
  name = 'unnamed';
  tags: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAttached(_entry: Entry<any>): void {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDetached(_entry: Entry<any>): void {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAlive(_entry: Entry<any>): void {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDead(_entry: Entry<any>): void {}
}

describe('Component', () => {
  it('can be subclassed', () => {
    const comp = new TestComponent();
    expect(comp).toBeInstanceOf(Component);
    expect(comp).toBeInstanceOf(TestComponent);
  });

  it('attach can be called', () => {
    const comp = new TestComponent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comp.onAttached(undefined as any);
    expect(comp.attachCalled).toBe(true);
  });

  it('detach can be called', () => {
    const comp = new TestComponent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comp.onDetached(undefined as any);
    expect(comp.detachCalled).toBe(true);
  });

  it('alive can be called', () => {
    const comp = new TestComponent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comp.onAlive(undefined as any);
    expect(comp.aliveCalled).toBe(true);
  });

  it('dead can be called', () => {
    const comp = new TestComponent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comp.onDead(undefined as any);
    expect(comp.deadCalled).toBe(true);
  });

  it('all hooks can be called in sequence', () => {
    const comp = new TestComponent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry = undefined as any;
    comp.onAttached(entry);
    comp.onAlive(entry);
    comp.onDetached(entry);
    comp.onDead(entry);
    expect(comp.attachCalled).toBe(true);
    expect(comp.aliveCalled).toBe(true);
    expect(comp.detachCalled).toBe(true);
    expect(comp.deadCalled).toBe(true);
  });

  describe('serialize', () => {
    it('returns plain object with component data', () => {
      const comp = new DataComponent();
      comp.x = 10;
      comp.y = 20;
      comp.name = 'test';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = comp.serialize(undefined as any);

      expect(data).toEqual({
        x: 10,
        y: 20,
        name: 'test',
        tags: [],
      });
    });

    it('skips function properties', () => {
      const comp = new DataComponent();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = comp.serialize(undefined as any);

      expect(data.attach).toBeUndefined();
      expect(data.detach).toBeUndefined();
      expect(data.alive).toBeUndefined();
      expect(data.dead).toBeUndefined();
    });
  });

  describe('deserialize', () => {
    it('creates new instance with data from plain object', () => {
      const data = {
        x: 100,
        y: 200,
        name: 'deserialized',
        tags: ['a', 'b'],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const comp = DataComponent.deserialize(data, undefined as any);

      expect(comp).toBeInstanceOf(DataComponent);
      expect(comp.x).toBe(100);
      expect(comp.y).toBe(200);
      expect(comp.name).toBe('deserialized');
      expect(comp.tags).toEqual(['a', 'b']);
    });

    it('does not call constructor (no side effects)', () => {
      let constructed = false;
      class TestConstructed extends Component {
        x = 0;
        y = 0;
        name = 'test';
        tags: string[] = [];
        constructor() {
          super();
          constructed = true;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onAttached(_entry: Entry<any>): void {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onDetached(_entry: Entry<any>): void {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onAlive(_entry: Entry<any>): void {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onDead(_entry: Entry<any>): void {}
      }

      const data = { x: 5, y: 10, name: 'test', tags: [] };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const comp = TestConstructed.deserialize(data, undefined as any);

      expect(constructed).toBe(false);
      expect(comp).toBeInstanceOf(TestConstructed);
    });
  });
});

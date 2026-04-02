import { describe, it, expect } from 'vitest';
import { Component } from '../../src/entity/component';

class TestComponent extends Component {
  attachCalled = false;
  detachCalled = false;
  aliveCalled = false;
  deadCalled = false;

  onAttached(): void {
    this.attachCalled = true;
  }

  onDetached(): void {
    this.detachCalled = true;
  }

  onAlive(): void {
    this.aliveCalled = true;
  }

  onDead(): void {
    this.deadCalled = true;
  }
}

class DataComponent extends Component {
  x = 0;
  y = 0;
  name = 'unnamed';
  tags: string[] = [];

  onAttached(): void {}
  onDetached(): void {}
  onAlive(): void {}
  onDead(): void {}
}

describe('Component', () => {
  it('can be subclassed', () => {
    const comp = new TestComponent();
    expect(comp).toBeInstanceOf(Component);
    expect(comp).toBeInstanceOf(TestComponent);
  });

  it('attach can be called', () => {
    const comp = new TestComponent();
    comp.onAttached();
    expect(comp.attachCalled).toBe(true);
  });

  it('detach can be called', () => {
    const comp = new TestComponent();
    comp.onDetached();
    expect(comp.detachCalled).toBe(true);
  });

  it('alive can be called', () => {
    const comp = new TestComponent();
    comp.onAlive();
    expect(comp.aliveCalled).toBe(true);
  });

  it('dead can be called', () => {
    const comp = new TestComponent();
    comp.onDead();
    expect(comp.deadCalled).toBe(true);
  });

  it('all hooks can be called in sequence', () => {
    const comp = new TestComponent();
    comp.onAttached();
    comp.onAlive();
    comp.onDetached();
    comp.onDead();
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

      const comp = DataComponent.deserialize(data) as DataComponent;

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
        onAttached(): void {}
        onDetached(): void {}
        onAlive(): void {}
        onDead(): void {}
      }

      const data = { x: 5, y: 10, name: 'test', tags: [] };
      const comp = TestConstructed.deserialize(data) as TestConstructed;

      expect(constructed).toBe(false);
      expect(comp).toBeInstanceOf(TestConstructed);
    });
  });
});

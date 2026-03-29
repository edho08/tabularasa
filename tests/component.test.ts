import { describe, it, expect } from 'vitest';
import { Component } from '../src/component';
import type { Entry } from '../src/entry';

class TestComponent extends Component {
  attachCalled = false;
  detachCalled = false;
  aliveCalled = false;
  deadCalled = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attach(_entry: Entry<any>): void {
    this.attachCalled = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detach(_entry: Entry<any>): void {
    this.detachCalled = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  alive(_entry: Entry<any>): void {
    this.aliveCalled = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dead(_entry: Entry<any>): void {
    this.deadCalled = true;
  }
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
    comp.attach(undefined as any);
    expect(comp.attachCalled).toBe(true);
  });

  it('detach can be called', () => {
    const comp = new TestComponent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comp.detach(undefined as any);
    expect(comp.detachCalled).toBe(true);
  });

  it('alive can be called', () => {
    const comp = new TestComponent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comp.alive(undefined as any);
    expect(comp.aliveCalled).toBe(true);
  });

  it('dead can be called', () => {
    const comp = new TestComponent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comp.dead(undefined as any);
    expect(comp.deadCalled).toBe(true);
  });

  it('all hooks can be called in sequence', () => {
    const comp = new TestComponent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry = undefined as any;
    comp.attach(entry);
    comp.alive(entry);
    comp.detach(entry);
    comp.dead(entry);
    expect(comp.attachCalled).toBe(true);
    expect(comp.aliveCalled).toBe(true);
    expect(comp.detachCalled).toBe(true);
    expect(comp.deadCalled).toBe(true);
  });
});

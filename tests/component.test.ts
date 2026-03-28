import { describe, it, expect } from 'vitest'
import { Component } from '../src/component'

class TestComponent extends Component {
  attachCalled = false
  detachCalled = false
  aliveCalled = false
  deadCalled = false

  attach(): void {
    this.attachCalled = true
  }

  detach(): void {
    this.detachCalled = true
  }

  alive(): void {
    this.aliveCalled = true
  }

  dead(): void {
    this.deadCalled = true
  }
}

describe('Component', () => {
  it('can be subclassed', () => {
    const comp = new TestComponent()
    expect(comp).toBeInstanceOf(Component)
    expect(comp).toBeInstanceOf(TestComponent)
  })

  it('attach can be called', () => {
    const comp = new TestComponent()
    comp.attach()
    expect(comp.attachCalled).toBe(true)
  })

  it('detach can be called', () => {
    const comp = new TestComponent()
    comp.detach()
    expect(comp.detachCalled).toBe(true)
  })

  it('alive can be called', () => {
    const comp = new TestComponent()
    comp.alive()
    expect(comp.aliveCalled).toBe(true)
  })

  it('dead can be called', () => {
    const comp = new TestComponent()
    comp.dead()
    expect(comp.deadCalled).toBe(true)
  })

  it('all hooks can be called in sequence', () => {
    const comp = new TestComponent()
    comp.attach()
    comp.alive()
    comp.detach()
    comp.dead()
    expect(comp.attachCalled).toBe(true)
    expect(comp.aliveCalled).toBe(true)
    expect(comp.detachCalled).toBe(true)
    expect(comp.deadCalled).toBe(true)
  })
})

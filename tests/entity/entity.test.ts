import { describe, it, expect } from 'vitest';
import { Component } from '../../src/entity/component';
import { Entity } from '../../src/entity/entity';

class Position extends Component {}
class Velocity extends Component {}
class Health extends Component {}

class Actor extends Entity<[Position, Velocity]> {}
class Enemy extends Entity<[Position, Velocity, Health]> {}

describe('Entity', () => {
  describe('generic type parameters', () => {
    it('creates entity with positional components', () => {
      expect(Actor).toBeDefined();
      expect(Enemy).toBeDefined();
    });
  });
});

import { describe, it, expect } from 'vitest';
import { Component } from '../src/component';
import { Entity } from '../src/entity';
import { Columns } from '../src/columns';

class Position extends Component {}
class Velocity extends Component {}
class Health extends Component {}

class Actor extends Entity {
  static columns = Columns(Position, Velocity);
}

class Enemy extends Entity {
  static columns = Columns(Position, Velocity, Health);
}

describe('Entity', () => {
  describe('class syntax with Columns function', () => {
    it('creates entity class with columns', () => {
      expect(Actor.columns).toEqual([Position, Velocity]);
      expect(Actor.columns.length).toBe(2);
    });

    it('different entities can have different columns', () => {
      expect(Actor.columns).toEqual([Position, Velocity]);
      expect(Enemy.columns).toEqual([Position, Velocity, Health]);
      expect(Enemy.columns.length).toBe(3);
    });

    it('columns are constructor functions', () => {
      for (const col of Actor.columns) {
        expect(col).toBeInstanceOf(Function);
        expect(col.prototype).toBeInstanceOf(Component);
      }
    });

    it('columns are in order', () => {
      expect(Actor.columns[0]).toBe(Position);
      expect(Actor.columns[1]).toBe(Velocity);
      expect(Enemy.columns[2]).toBe(Health);
    });

    it('throws for duplicate components', () => {
      expect(() => Columns(Position, Velocity, Position)).toThrow(
        'Duplicate component in Columns: Position',
      );
    });
  });
});

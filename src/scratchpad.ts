import { Component } from './entity/component';

class Entity<const C extends Component[]> {
  declare readonly columns: C;
}

class Position extends Component {
  x = 0;
  y = 0;
}

class Velocity extends Component {
  vx = 0;
  vy = 0;
}

class Health extends Component {
  hp = 100;
}

class Actor extends Entity<[Position, Velocity]> {}
class B extends Entity<[Position, Health]> {}

// Entry<E, C> where C is derived from E, not inferred from components
class Entry<
  E extends Entity<Component[]>,
  C extends Component[] = E extends Entity<infer U> ? U : never,
> {
  constructor(
    public readonly entity: E,
    public readonly components: NoInfer<C>,
  ) {}
}

// WIDENING TESTS - should error
const actor = new Actor();

// ERROR 1: Wrong type (Velocity instead of Position)
const entry_err1 = new Entry(actor, [new Velocity(), new Velocity()]);

// ERROR 2: Wrong order
const entry_err2 = new Entry(actor, [new Velocity(), new Position()]);

// ERROR 3: Missing component
const entry_err3 = new Entry(actor, [new Position()]);

// ERROR 4: Extra component
const entry_err4 = new Entry(actor, [new Position(), new Velocity(), new Health()]);

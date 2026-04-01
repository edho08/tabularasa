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

// Entry<E> with get method
class Entry<E extends Entity<Component[]>> {
  constructor(
    public readonly entity: E,
    public readonly components: NoInfer<E extends Entity<infer C> ? C : never>,
  ) {}

  get<C extends E['columns'][number]>(ctor: { new (...args: any): C }): C {
    return undefined as C;
  }

  getAt<const K extends number>(index: K): K extends keyof E['columns'] ? E['columns'][K] : never {
    return undefined as any;
  }
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

// GET TESTS
const entry_ok = new Entry(actor, [new Position(), new Velocity()]);

// Should work
const pos = entry_ok.get(Position);
const vel = entry_ok.get(Velocity);

// pos and vel should be Position and Velocity
pos.x;
vel.vx;

// GETAT TESTS - should return specific types with const
const posAt = entry_ok.getAt(0 as const);
const velAt = entry_ok.getAt(1 as const);

posAt.x;
velAt.vx;

// GETAT ERROR TESTS
// Should error - index 3 doesn't exist
const outOfBounds = entry_ok.getAt(3);
if (outOfBounds) {
  outOfBounds.x; // What happens here?
}

// Should error or warn - no const means K is number, not literal 0
const notConst = entry_ok.getAt(0);
notConst.x; // Works - Position has x
notConst.vx; // Should error - Velocity has vx but Position doesn't

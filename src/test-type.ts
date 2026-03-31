import { Component } from './entity/component';
import { Entity, Columns } from './entity/entity';
import { Own, OwnComponent } from './entity/pattern/own';

class Position extends Component {
  x = 0;
  y = 0;
}

class Velocity extends Component {
  vx = 0;
  vy = 0;
}

class BulletForCycle extends Entity {
  static override get columns(): readonly [
    typeof Position,
    typeof OwnComponent<typeof ActorForCycle>,
  ] {
    return Columns(Position, Own(ActorForCycle));
  }
}

class ActorForCycle extends Entity {
  static override get columns(): readonly [
    typeof Position,
    typeof Velocity,
    typeof OwnComponent<typeof BulletForCycle>,
  ] {
    return Columns(Position, Velocity, Own(BulletForCycle));
  }
}

const world = new (await import('./world/world')).World();
const actorTable = world.tables.getTable(ActorForCycle);
const bulletTable = world.tables.getTable(BulletForCycle);

const actorRef = actorTable.insert([new Position(), new Velocity(), Own(BulletForCycle).create()]);
const bulletRef = bulletTable.insert([new Position(), Own(ActorForCycle).create()]);

const actor = actorRef.deref();
const bullet = bulletRef.deref();

if (actor && bullet) {
  actor.get(Own(BulletForCycle)).setRef(bullet);
  bullet.get(Own(ActorForCycle)).setRef(actor);
  actorTable.delete(actorRef);
}

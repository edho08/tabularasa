import { Component } from './entity/component';
import { Entity, Columns } from './entity/entity';
import { Own } from './entity/pattern/own';

class Position extends Component {
  x = 0;
  y = 0;
}

class ActorForSelf extends Entity {
  static get columns() {
    return Columns(Position, Own(ActorForSelf));
  }
}

const world = new (await import('./world/world')).World();
const actorTable = world.tables.getTable(ActorForSelf);

const actorRef = actorTable.insert([new Position(), Own(ActorForSelf).create()]);
const actor = actorRef.deref();

if (actor) {
  actor.get(Own(ActorForSelf)).setRef(actor);
  actorTable.delete(actorRef);
}

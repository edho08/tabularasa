import { describe, it, expect } from 'vitest';
import { Component } from '../../../src/entity/component';
import { Entity } from '../../../src/entity/entity';
import { Columns } from '../../../src/entity/entity';
import { World } from '../../../src/world/world';
import { Own, OwnManager } from '../../../src/entity/pattern/own';

class Position extends Component {
  x = 0;
  y = 0;
}

class Velocity extends Component {
  vx = 0;
  vy = 0;
}

class RigidBody extends Component {
  mass = 1;
}

const OwnRigidBody = Own(RigidBody);

class Actor extends Entity {
  static columns = Columns(Position, Velocity, OwnRigidBody);
}

describe('OwnManager', () => {
  it('getOwner returns undefined for unowned entry', () => {
    const world = new World();
    const rigidBodyTable = world.tables.getTable(RigidBody);
    const rigidBodyRef = rigidBodyTable.insert([new RigidBody()]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rigidBody = rigidBodyRef.deref()!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const manager = world.getResource(OwnManager)!;

    expect(manager.getOwner(rigidBody)).toBeUndefined();
  });

  it('throws when entry is already owned', () => {
    const world = new World();
    const actorTable = world.tables.getTable(Actor);
    const rigidBodyTable = world.tables.getTable(RigidBody);

    const rigidBodyRef = rigidBodyTable.insert([new RigidBody()]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rigidBody = rigidBodyRef.deref()!;

    actorTable.insert([new Position(), new Velocity(), OwnRigidBody.create(rigidBody)]);

    expect(() => {
      actorTable.insert([new Position(), new Velocity(), OwnRigidBody.create(rigidBody)]);
    }).toThrow();
  });
});

describe('Own', () => {
  it('creates component with owned entry', () => {
    const world = new World();
    const rigidBodyTable = world.tables.getTable(RigidBody);
    const rigidBodyRef = rigidBodyTable.insert([new RigidBody()]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rigidBody = rigidBodyRef.deref()!;

    const actorTable = world.tables.getTable(Actor);
    const actorRef = actorTable.insert([
      new Position(),
      new Velocity(),
      OwnRigidBody.create(rigidBody),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const actor = actorRef.deref()!;

    expect(actor.get(OwnRigidBody).ref?.deref()).toBe(rigidBody);
  });

  it('registers with OwnManager on attached', () => {
    const world = new World();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const manager = world.getResource(OwnManager)!;
    const rigidBodyTable = world.tables.getTable(RigidBody);
    const rigidBodyRef = rigidBodyTable.insert([new RigidBody()]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rigidBody = rigidBodyRef.deref()!;

    const actorTable = world.tables.getTable(Actor);
    actorTable.insert([new Position(), new Velocity(), OwnRigidBody.create(rigidBody)]);

    expect(manager.getOwner(rigidBody)).toBeDefined();
  });

  it('unregisters from OwnManager on detached', () => {
    const world = new World();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const manager = world.getResource(OwnManager)!;
    const rigidBodyTable = world.tables.getTable(RigidBody);
    const rigidBodyRef = rigidBodyTable.insert([new RigidBody()]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rigidBody = rigidBodyRef.deref()!;

    const actorTable = world.tables.getTable(Actor);
    const actorRef = actorTable.insert([
      new Position(),
      new Velocity(),
      OwnRigidBody.create(rigidBody),
    ]);

    expect(manager.getOwner(rigidBody)).toBeDefined();

    actorTable.delete(actorRef);

    expect(manager.getOwner(rigidBody)).toBeUndefined();
  });

  it('deletes owned entry when owner is deleted (cascading delete)', () => {
    const world = new World();
    const rigidBodyTable = world.tables.getTable(RigidBody);
    const rigidBodyRef = rigidBodyTable.insert([new RigidBody()]);

    const actorTable = world.tables.getTable(Actor);
    const actorRef = actorTable.insert([
      new Position(),
      new Velocity(),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      OwnRigidBody.create(rigidBodyRef.deref()!),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(rigidBodyRef.deref()!.isAlive).toBe(true);

    actorTable.delete(actorRef);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(rigidBodyRef.deref()!.isAlive).toBe(false);
  });

  it('handles circular ownership (A owns B, B owns A)', () => {
    const world = new World();

    const getOwnActor = () => Own(ActorForCycle);
    const getOwnBullet = () => Own(BulletForCycle);

    class ActorForCycle extends Entity {
      static get columns() {
        return Columns(Position, Velocity, getOwnBullet());
      }
    }

    class BulletForCycle extends Entity {
      static get columns() {
        return Columns(Position, getOwnActor());
      }
    }

    const actorTable = world.tables.getTable(ActorForCycle);
    const bulletTable = world.tables.getTable(BulletForCycle);

    const actorRef = actorTable.insert([new Position(), new Velocity(), getOwnBullet().create()]);
    const bulletRef = bulletTable.insert([new Position(), getOwnActor().create()]);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const actor = actorRef.deref()!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const bullet = bulletRef.deref()!;
    actor.get(getOwnBullet()).setRef(bullet);
    bullet.get(getOwnActor()).setRef(actor);

    expect(() => actorTable.delete(actorRef)).not.toThrow();
    expect(actor.isAlive).toBe(false);
    expect(bullet.isAlive).toBe(false);
  });

  it('handles circular ownership (A owns B, B owns C, C owns A)', () => {
    const world = new World();

    const getOwnActor = () => Own(ActorForCycle);
    const getOwnBullet = () => Own(BulletForCycle);
    const getOwnRigidBody = () => Own(RigidBodyForCycle);

    class ActorForCycle extends Entity {
      static get columns() {
        return Columns(Position, Velocity, getOwnBullet());
      }
    }

    class BulletForCycle extends Entity {
      static get columns() {
        return Columns(Position, getOwnRigidBody());
      }
    }

    class RigidBodyForCycle extends Entity {
      static get columns() {
        return Columns(RigidBody, getOwnActor());
      }
    }

    const actorTable = world.tables.getTable(ActorForCycle);
    const bulletTable = world.tables.getTable(BulletForCycle);
    const rigidBodyTable = world.tables.getTable(RigidBodyForCycle);

    const actorRef = actorTable.insert([new Position(), new Velocity(), getOwnBullet().create()]);
    const bulletRef = bulletTable.insert([new Position(), getOwnRigidBody().create()]);
    const rigidBodyRef = rigidBodyTable.insert([new RigidBody(), getOwnActor().create()]);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const actor = actorRef.deref()!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const bullet = bulletRef.deref()!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rigidBody = rigidBodyRef.deref()!;
    actor.get(getOwnBullet()).setRef(bullet);
    bullet.get(getOwnRigidBody()).setRef(rigidBody);
    rigidBody.get(getOwnActor()).setRef(actor);

    expect(() => actorTable.delete(actorRef)).not.toThrow();
    expect(actor.isAlive).toBe(false);
    expect(bullet.isAlive).toBe(false);
    expect(rigidBody.isAlive).toBe(false);
  });
});

describe('Owned', () => {
  it('returns owner via OwnManager', () => {
    const world = new World();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const manager = world.getResource(OwnManager)!;
    const rigidBodyTable = world.tables.getTable(RigidBody);
    const rigidBodyRef = rigidBodyTable.insert([new RigidBody()]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rigidBody = rigidBodyRef.deref()!;

    const actorTable = world.tables.getTable(Actor);
    const actorRef = actorTable.insert([
      new Position(),
      new Velocity(),
      OwnRigidBody.create(rigidBody),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const actor = actorRef.deref()!;

    expect(manager.getOwner(rigidBody)).toBe(actor);
  });
});

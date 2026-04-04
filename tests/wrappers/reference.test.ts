import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '../../src/entity/component';
import { Entity } from '../../src/entity/entity';
import { EntityRegistry } from '../../src/entity/registry';
import { EntryLifecycle, TableEntry } from '../../src/table/entry';
import { TableInner } from '../../src/table/table';
import { TableManager } from '../../src/table/manager';
import { Reference, DeletePolicy } from '../../src/wrappers/reference';

class Position extends Component {
  x = 0;
  y = 0;
}

class Velocity extends Component {
  vx = 0;
  vy = 0;
}

class Actor extends Entity<[Position, Velocity]> {}
class Target extends Entity<[Position]> {}
class Other extends Entity<[Velocity]> {}

const CascadeRef = Reference.for(Target, DeletePolicy.CASCADE);
const RestrictRef = Reference.for(Target, DeletePolicy.RESTRICT);
const SetNullRef = Reference.for(Target, DeletePolicy.SETNULL);
const OwnRef = Reference.for(Target, DeletePolicy.OWN);

class ActorWithCascadeRef extends Entity<[Position, Velocity, InstanceType<typeof CascadeRef>]> {}
class ActorWithRestrictRef extends Entity<[Position, Velocity, InstanceType<typeof RestrictRef>]> {}
class ActorWithSetNullRef extends Entity<[Position, Velocity, InstanceType<typeof SetNullRef>]> {}
class ActorWithOwnRef extends Entity<[Position, Velocity, InstanceType<typeof OwnRef>]> {}
class ActorWithRefCol0 extends Entity<[InstanceType<typeof CascadeRef>, Position, Velocity]> {}
class OtherWithOwnRef extends Entity<[Velocity, InstanceType<typeof OwnRef>]> {}

describe('Reference', () => {
  let manager: TableManager;

  beforeEach(() => {
    manager = new TableManager();
    (EntityRegistry as any).nextId = 0;
    (EntityRegistry as any).ids = new Map();
    (Actor as any).id = undefined;
    (Target as any).id = undefined;
    (Other as any).id = undefined;
  });

  function createEntry<T extends Entity<any[]>>(
    entityType: new () => T,
    components: Component[],
  ): TableEntry<T> {
    const table = manager.get(entityType) as TableInner<T>;
    const ref = table.insert(components as any);
    const entry = ref.deref();
    if (entry === undefined) throw new Error('Entry should exist');
    return entry as unknown as TableEntry<T>;
  }

  describe('for', () => {
    it('creates a cached Reference class for entity and policy', () => {
      const Ref = Reference.for(Actor, DeletePolicy.CASCADE);
      expect(Ref).toBeDefined();
      expect(Ref.make).toBeDefined();
    });

    it('returns same class for same entity and policy', () => {
      const Ref1 = Reference.for(Actor, DeletePolicy.CASCADE);
      const Ref2 = Reference.for(Actor, DeletePolicy.CASCADE);
      expect(Ref1).toBe(Ref2);
    });

    it('returns different classes for different policies', () => {
      const Ref1 = Reference.for(Actor, DeletePolicy.CASCADE);
      const Ref2 = Reference.for(Actor, DeletePolicy.RESTRICT);
      expect(Ref1).not.toBe(Ref2);
    });

    it('returns different classes for different entities', () => {
      const Ref1 = Reference.for(Actor, DeletePolicy.CASCADE);
      const Ref2 = Reference.for(Target, DeletePolicy.CASCADE);
      expect(Ref1).not.toBe(Ref2);
    });
  });

  describe('make', () => {
    it('creates Reference with target', () => {
      const Ref = Reference.for(Actor, DeletePolicy.CASCADE);
      const target = createEntry(Actor, [new Position(), new Velocity()]);

      const ref = Ref.make(target);

      expect(ref.target).toBe(target);
    });

    it('creates Reference with undefined target', () => {
      const Ref = Reference.for(Actor, DeletePolicy.CASCADE);

      const ref = Ref.make(undefined);

      expect(ref.target).toBeUndefined();
    });
  });

  describe('CASCADE', () => {
    it('deletes referencing entry when target is deleted', () => {
      const target = createEntry(Target, [new Position()]);
      const refComponent = CascadeRef.make(target);

      const source = createEntry(ActorWithCascadeRef, [
        new Position(),
        new Velocity(),
        refComponent,
      ]);

      manager.get(Target).delete(target.weak());

      expect(source.lifecycle).toBe(EntryLifecycle.DEAD);
    });

    it('deletes all referencing entries when target is deleted', () => {
      const target = createEntry(Target, [new Position()]);

      const source1 = createEntry(ActorWithCascadeRef, [
        new Position(),
        new Velocity(),
        CascadeRef.make(target),
      ]);
      const source2 = createEntry(ActorWithCascadeRef, [
        new Position(),
        new Velocity(),
        CascadeRef.make(target),
      ]);

      manager.get(Target).delete(target.weak());

      expect(source1.lifecycle).toBe(EntryLifecycle.DEAD);
      expect(source2.lifecycle).toBe(EntryLifecycle.DEAD);
    });
  });

  describe('RESTRICT', () => {
    it('throws when deleting target with restrict references', () => {
      const target = createEntry(Target, [new Position()]);

      createEntry(ActorWithRestrictRef, [new Position(), new Velocity(), RestrictRef.make(target)]);

      expect(() => manager.get(Target).delete(target.weak())).toThrow(TypeError);
    });

    it('does not throw after reference is removed', () => {
      const target = createEntry(Target, [new Position()]);
      const refComponent = RestrictRef.make(target);

      const source = createEntry(ActorWithRestrictRef, [
        new Position(),
        new Velocity(),
        refComponent,
      ]);

      source.setAt(2, RestrictRef.make(undefined));

      expect(() => manager.get(Target).delete(target.weak())).not.toThrow();
    });

    it('increments restrictCount on attach', () => {
      const target = createEntry(Target, [new Position()]);

      createEntry(ActorWithRestrictRef, [new Position(), new Velocity(), RestrictRef.make(target)]);

      expect(target.restrictCount).toBe(1);
    });

    it('decrements restrictCount on detach', () => {
      const target = createEntry(Target, [new Position()]);
      const refComponent = RestrictRef.make(target);

      const source = createEntry(ActorWithRestrictRef, [
        new Position(),
        new Velocity(),
        refComponent,
      ]);

      source.setAt(2, RestrictRef.make(undefined));

      expect(target.restrictCount).toBe(0);
    });
  });

  describe('SETNULL', () => {
    it('sets target to undefined when target is deleted', () => {
      const target = createEntry(Target, [new Position()]);
      const refComponent = SetNullRef.make(target);

      createEntry(ActorWithSetNullRef, [new Position(), new Velocity(), refComponent]);

      manager.get(Target).delete(target.weak());

      expect(refComponent.target).toBeUndefined();
    });

    it('does not delete the referencing entry', () => {
      const target = createEntry(Target, [new Position()]);
      const refComponent = SetNullRef.make(target);

      const source = createEntry(ActorWithSetNullRef, [
        new Position(),
        new Velocity(),
        refComponent,
      ]);

      manager.get(Target).delete(target.weak());

      expect(source.lifecycle).toBe(EntryLifecycle.ALIVE);
    });
  });

  describe('OWN', () => {
    it('throws when targeting an already-owned entry', () => {
      const target = createEntry(Target, [new Position()]);

      createEntry(ActorWithOwnRef, [new Position(), new Velocity(), OwnRef.make(target)]);

      expect(() => createEntry(OtherWithOwnRef, [new Velocity(), OwnRef.make(target)])).toThrow(
        TypeError,
      );
    });

    it('deletes owned target when owner is deleted', () => {
      const target = createEntry(Target, [new Position()]);

      const source = createEntry(ActorWithOwnRef, [
        new Position(),
        new Velocity(),
        OwnRef.make(target),
      ]);

      manager.get(ActorWithOwnRef).delete(source.weak());

      expect(target.lifecycle).toBe(EntryLifecycle.DEAD);
    });

    it('increments ownCount on attach', () => {
      const target = createEntry(Target, [new Position()]);

      createEntry(ActorWithOwnRef, [new Position(), new Velocity(), OwnRef.make(target)]);

      expect(target.ownCount).toBe(1);
    });

    it('decrements ownCount on detach', () => {
      const target = createEntry(Target, [new Position()]);
      const refComponent = OwnRef.make(target);

      const source = createEntry(ActorWithOwnRef, [new Position(), new Velocity(), refComponent]);

      source.setAt(2, OwnRef.make(undefined));

      expect(target.ownCount).toBe(0);
    });
  });

  describe('undefined target', () => {
    it('does not register backRef when target is undefined', () => {
      const target = createEntry(Target, [new Position()]);

      createEntry(ActorWithCascadeRef, [
        new Position(),
        new Velocity(),
        CascadeRef.make(undefined),
      ]);

      const backRefs = target.getBackRef(ActorWithCascadeRef, 2);
      expect(backRefs.size).toBe(0);
    });
  });

  describe('backRef iteration', () => {
    it('getBackRef returns all referencing entries', () => {
      const target = createEntry(Target, [new Position()]);

      const source1 = createEntry(ActorWithCascadeRef, [
        new Position(),
        new Velocity(),
        CascadeRef.make(target),
      ]);
      const source2 = createEntry(ActorWithCascadeRef, [
        new Position(),
        new Velocity(),
        CascadeRef.make(target),
      ]);

      const backRefs = target.getBackRef(Target, 2);

      expect(backRefs.size).toBe(2);
    });

    it('getBackRef is empty after all references are removed', () => {
      const target = createEntry(Target, [new Position()]);
      const refComponent = CascadeRef.make(target);

      const source = createEntry(ActorWithCascadeRef, [
        new Position(),
        new Velocity(),
        refComponent,
      ]);

      source.setAt(2, CascadeRef.make(undefined));

      const backRefs = target.getBackRef(Target, 2);
      expect(backRefs.size).toBe(0);
    });

    it('different columns have separate backRef sets', () => {
      const target = createEntry(Target, [new Position()]);

      createEntry(ActorWithCascadeRef, [new Position(), new Velocity(), CascadeRef.make(target)]);
      createEntry(ActorWithRefCol0, [CascadeRef.make(target), new Position(), new Velocity()]);

      const backRefsCol2 = target.getBackRef(Target, 2);
      const backRefsCol0 = target.getBackRef(Target, 0);

      expect(backRefsCol2.size).toBe(1);
      expect(backRefsCol0.size).toBe(1);
    });
  });
});

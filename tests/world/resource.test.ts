import { describe, it, expect } from 'vitest';
import { Resource } from '../../src/world/resource';
import { World } from '../../src/world/world';

class TestResource extends Resource {
  value = 42;
}

describe('Resource', () => {
  describe('world property', () => {
    it('is undefined before attach', () => {
      const resource = new TestResource();

      expect(resource.world).toBeUndefined();
    });

    it('is set after attach', () => {
      const resource = new TestResource();
      const world = new World();

      resource.attach(world);

      expect(resource.world).toBe(world);
    });

    it('cannot be changed after attach', () => {
      const resource = new TestResource();
      const world1 = new World();
      const world2 = new World();

      resource.attach(world1);
      resource.attach(world2);

      expect(resource.world).toBe(world2);
    });

    it('is readonly', () => {
      const resource = new TestResource();
      const world = new World();

      resource.attach(world);

      expect(Object.getOwnPropertyDescriptor(resource, 'world')?.writable).toBe(false);
    });
  });
});

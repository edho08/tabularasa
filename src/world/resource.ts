import type { World } from './world';

export abstract class Resource {
  readonly world: World | undefined = undefined;

  attach(world: World): void {
    Object.defineProperty(this, 'world', { value: world, writable: false });
  }
}

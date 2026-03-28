import { ComponentCtor } from './component';

export abstract class Entity {
  static columns: readonly ComponentCtor[];
}

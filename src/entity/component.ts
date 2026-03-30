import type { AnyEntry } from '../table/entry';

export interface ComponentCtor {
  new (...args: unknown[]): Component;
  deserialize(data: Record<string, unknown>): Component;
}

export abstract class Component {
  onAttached(_entry: AnyEntry): void {}
  onDetached(_entry: AnyEntry): void {}
  onAlive(_entry: AnyEntry): void {}
  onDead(_entry: AnyEntry): void {}
  onDeserialized(_entry: AnyEntry): void {}

  serialize(_entry: AnyEntry): Record<string, unknown> {
    // eslint-disable-next-line no-undef
    return structuredClone(this) as Record<string, unknown>;
  }

  static deserialize(_data: Record<string, unknown>): Component {
    const instance = Object.create(this.prototype);
    for (const [key, value] of Object.entries(_data)) {
      (instance as any)[key] = value;
    }
    return instance;
  }
}

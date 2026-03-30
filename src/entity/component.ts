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
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(this)) {
      const value = (this as any)[key];
      if (typeof value !== 'function') {
        result[key] = value;
      }
    }
    return result;
  }

  static deserialize(_data: Record<string, unknown>): Component {
    const instance = Object.create(this.prototype);
    for (const [key, value] of Object.entries(_data)) {
      (instance as any)[key] = value;
    }
    return instance;
  }
}

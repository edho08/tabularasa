import type { AnyEntry } from '../table/entry';

export interface ComponentCtor {
  new (...args: unknown[]): Component;
  deserialize(data: Record<string, unknown>): Component;
}

export abstract class Component {
  onAttached(_entry: AnyEntry, _index: number): void {}
  onDetached(_entry: AnyEntry, _index: number): void {}
  onDeserialized(_entry: AnyEntry, _index: number): void {}

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

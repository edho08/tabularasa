import type { Entry } from '../table/entry';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentCtor = new (...args: any[]) => Component;

export abstract class Component {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAttached(_entry: Entry<any>): void {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDetached(_entry: Entry<any>): void {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAlive(_entry: Entry<any>): void {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDead(_entry: Entry<any>): void {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDeserialized(_entry: Entry<any>): void {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serialize(_entry: Entry<any>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(this)) {
      const value = (this as any)[key];
      if (typeof value !== 'function') {
        result[key] = value;
      }
    }
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static deserialize<T extends Component>(
    this: new (...args: any[]) => T,
    _data: Record<string, unknown>,
  ): T {
    const instance = Object.create(this.prototype);
    for (const [key, value] of Object.entries(_data)) {
      (instance as any)[key] = value;
    }
    return instance;
  }
}

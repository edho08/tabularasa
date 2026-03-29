import type { Entry } from './entry';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentCtor = new (...args: any[]) => Component;

export abstract class Component {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attach(_entry: Entry<any>): void {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detach(_entry: Entry<any>): void {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  alive(_entry: Entry<any>): void {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dead(_entry: Entry<any>): void {}

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
    _entry?: Entry<any>,
  ): T {
    const instance = Object.create(this.prototype);
    for (const [key, value] of Object.entries(_data)) {
      (instance as any)[key] = value;
    }
    return instance;
  }
}

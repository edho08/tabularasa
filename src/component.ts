import type { Entry } from './entry';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentCtor = new (...args: any[]) => Component;

export abstract class Component {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attach(_entry: Entry<any>): void {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detach(_entry: Entry<any>): void {}
  alive(): void {}
  dead(): void {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentCtor = new (...args: any[]) => Component;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Entry {}

export abstract class Component {
  attach(_entry: Entry): void {}
  detach(_entry: Entry): void {}
  alive(): void {}
  dead(): void {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentCtor = new (...args: any[]) => Component

export abstract class Component {
  attach(): void {}
  detach(): void {}
  alive(): void {}
  dead(): void {}
}

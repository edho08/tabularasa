// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Entity<const C extends any[]> {
  static id: number | undefined = undefined;
  declare readonly columns: C;
}

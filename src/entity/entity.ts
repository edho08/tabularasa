// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Entity<const C extends any[]> {
  declare readonly columns: C;
}

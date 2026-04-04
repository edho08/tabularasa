export class EntityRegistry {
  private static nextId = 0;
  private static ids = new Map<abstract new (...args: any[]) => any, number>();

  static get<E extends abstract new (...args: any[]) => any>(ctor: E): number {
    let id = this.ids.get(ctor);
    if (id === undefined) {
      id = this.nextId++;
      this.ids.set(ctor, id);
      (ctor as any).id = id;
    }
    return id;
  }
}

import { ComponentCtor } from './component';

export abstract class Entity {
  static columns: readonly ComponentCtor[];
}

export function Columns<const C extends ComponentCtor[]>(...columns: C): readonly [...C] {
  const seen = new Set<ComponentCtor>();
  for (const col of columns) {
    if (seen.has(col)) {
      throw new Error(`Duplicate component in Columns: ${col.name}`);
    }
    seen.add(col);
  }
  return columns as readonly [...C];
}

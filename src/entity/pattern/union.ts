import { Component } from '../component';
import type { AnyEntry } from '../../table/entry';
import type { ComponentCtor } from '../component';

export class UnionComponent<T extends Component = Component> extends Component {
  value: T;

  static ctors: ComponentCtor[];

  constructor(value: T) {
    super();
    this.value = value;
  }

  is<C extends ComponentCtor>(ctor: C): boolean {
    return this.value instanceof ctor;
  }

  as<C extends ComponentCtor>(ctor: C): InstanceType<C> | undefined {
    if (this.value instanceof ctor) {
      return this.value as InstanceType<C>;
    }
    return undefined;
  }

  override onAttached(entry: AnyEntry): void {
    this.value.onAttached(entry);
  }

  override onDetached(entry: AnyEntry): void {
    this.value.onDetached(entry);
  }

  override onDead(entry: AnyEntry): void {
    this.value.onDead(entry);
  }

  override onDeserialized(entry: AnyEntry): void {
    this.value.onDeserialized(entry);
  }

  override serialize(entry: AnyEntry): { type: number; data: Record<string, unknown> } {
    const idx = (this.constructor as typeof UnionComponent).ctors.indexOf(
      this.value.constructor as ComponentCtor,
    );
    return { type: idx, data: this.value.serialize(entry) };
  }

  static deserialize(data: { type: number; data: Record<string, unknown> }): UnionComponent {
    const ctor = this.ctors[data.type];
    if (!ctor) throw new TypeError(`Invalid type index: ${data.type}`);
    const instance = Object.create(this.prototype) as UnionComponent;
    instance.value = ctor.deserialize(data.data) as UnionComponent['value'];
    return instance;
  }
}

const unionCache = new Map<string, typeof UnionComponent>();

function getKey(ctors: ComponentCtor[]): string {
  return ctors
    .map(c => c.name)
    .sort()
    .join(',');
}

export function Union<C extends ComponentCtor[]>(...ctors: C): typeof UnionComponent {
  const key = getKey(ctors);
  const cached = unionCache.get(key);
  if (cached !== undefined) return cached;

  class UnionClass extends UnionComponent {
    static override name = `Union<${ctors
      .map(c => c.name)
      .sort()
      .join('|')}>`;
    static ctors: ComponentCtor[] = ctors;
  }

  unionCache.set(key, UnionClass as unknown as typeof UnionComponent);
  return UnionClass as unknown as typeof UnionComponent;
}

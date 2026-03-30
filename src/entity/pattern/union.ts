import { Component } from '../component';
import type { Entry } from '../../table/entry';
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

  override onAttached(entry: Entry<any>): void {
    this.value.onAttached(entry);
  }

  override onDetached(entry: Entry<any>): void {
    this.value.onDetached(entry);
  }

  override onAlive(entry: Entry<any>): void {
    this.value.onAlive(entry);
  }

  override onDead(entry: Entry<any>): void {
    this.value.onDead(entry);
  }

  override serialize(entry: Entry<any>): { type: number; data: Record<string, unknown> } {
    const idx = (this.constructor as typeof UnionComponent).ctors.indexOf(
      this.value.constructor as ComponentCtor,
    );
    return { type: idx, data: this.value.serialize(entry) };
  }

  static override deserialize<C extends Component>(
    this: new (value: Component) => UnionComponent<C>,
    data: { type: number; data: Record<string, unknown> },
  ): UnionComponent<C> {
    const ctor = this.ctors[data.type];
    if (!ctor) throw new TypeError(`Invalid type index: ${data.type}`);
    return new this(ctor.deserialize(data.data) as C);
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
  let UnionClass = unionCache.get(key);
  if (!UnionClass) {
    const name = `Union<${ctors
      .map(c => c.name)
      .sort()
      .join('|')}>`;
    UnionClass = class extends UnionComponent {
      static override name = name;
      static ctors = ctors;
    };
    unionCache.set(key, UnionClass);
  }
  return UnionClass;
}

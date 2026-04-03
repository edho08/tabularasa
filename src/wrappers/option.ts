import { Component, ComponentCtor } from '../entity/component';

export interface Option<C extends Component> {
  readonly value: C | undefined;
  isSome(): boolean;
  isNone(): boolean;
  unwrap(): C;
}

export interface OptionClass<C extends Component> {
  new (value: C | undefined): Option<C>;
  make(value: C): Option<C>;
  some(value: C): Option<C>;
  none(): Option<C>;
}

const optionCache = new Map<ComponentCtor, OptionClass<any>>();

export const Option = {
  for<C extends Component>(ctor: ComponentCtor): OptionClass<C> {
    if (optionCache.has(ctor)) {
      return optionCache.get(ctor) as OptionClass<C>;
    }

    class OptionInstance implements Option<C> {
      constructor(public readonly value: C | undefined) {}

      isSome(): boolean {
        return this.value !== undefined;
      }

      isNone(): boolean {
        return this.value === undefined;
      }

      unwrap(): C {
        if (this.value === undefined) {
          throw new TypeError('Cannot unwrap None');
        }
        return this.value;
      }

      static make(value: C): OptionInstance {
        return new OptionInstance(value);
      }

      static some(value: C): OptionInstance {
        return new OptionInstance(value);
      }

      static none(): OptionInstance {
        return new OptionInstance(undefined);
      }
    }

    optionCache.set(ctor, OptionInstance as OptionClass<C>);
    return OptionInstance as OptionClass<C>;
  },
};

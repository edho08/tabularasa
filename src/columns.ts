import { ComponentCtor } from './component';

export function Columns<const C extends ComponentCtor[]>(...columns: C): C {
  return columns;
}

import { Component } from './component';

export class Entity<const C extends Component[]> {
  declare readonly columns: C;
}

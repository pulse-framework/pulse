import Dep from '../dep';
import Pulse from '../pulse';
import State from '../state';
import Collection from './collection';

export type PrimaryKey = string | number;
export type GroupName = string | number;
export type Index = Array<PrimaryKey>;

export default class Group extends State {
  private func: Function;
  output: Array<any> = null;
  constructor(private collection: () => Collection) {
    super(() => collection().instance(), []);

    this.mutation = () => this.build(this.value);

    // initial build
    this.build(this.value);
  }
  public build(newIndex: Index) {
    let group = newIndex.map(primaryKey => {
      return this.collection().data[primaryKey];
    });
    this.output = group;
  }
  public has(primaryKey: PrimaryKey) {
    return this.value.includes(primaryKey) || false;
  }

  public add(primaryKey: PrimaryKey) {}
}

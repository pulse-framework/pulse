import Dep from '../dep';
import Pulse, { State } from '../';
import Collection from './collection';

export type PrimaryKey = string | number;
export type Index = Array<PrimaryKey>;

export default class Group extends State {
  private func: Function;
  output: Array<any> = null;
  constructor(instance: Pulse, private collection: Collection) {
    super(instance, []);

    this.mutation = () => this.build(this.value);

    // initial build
    this.build(this.value);
  }
  public build(newIndex: Index) {
    console.log('buildtime');
    let group = newIndex.map(primaryKey => {
      return this.collection.data[primaryKey];
    });
    this.output = group;
  }

  public add(primaryKey: PrimaryKey) {}
}

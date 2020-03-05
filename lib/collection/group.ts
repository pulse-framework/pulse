import Dep from '../dep';
import Pulse from '../pulse';
import State from '../state';
import Collection from './collection';

export type PrimaryKey = string | number;
export type GroupName = string | number;
export type Index = Array<PrimaryKey>;

export default class Group extends State {
  masterOutput: Array<any> = [];
  public get output(): Array<any> {
    if (this.instance().runtime.trackState) this.instance().runtime.foundState.add(this);
    return this.masterOutput;
  }
  constructor(private collection: () => Collection) {
    super(() => collection().instance(), []);

    this.sideEffects = () => this.build();

    // initial build
    this.build();
  }
  public build() {
    let group = this.masterValue.map(primaryKey => {
      return this.collection().data[primaryKey].value;
    });
    this.masterOutput = group;
  }
  public has(primaryKey: PrimaryKey) {
    return this.value.includes(primaryKey) || false;
  }

  public add(primaryKey: PrimaryKey) {}
}

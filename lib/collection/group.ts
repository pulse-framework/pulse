import Dep from '../dep';
import Pulse from '../pulse';
import State from '../state';
import Collection, { DefaultDataItem } from './collection';
import Computed from '../computed';

export type PrimaryKey = string | number;
export type GroupName = string | number;
export type Index = Array<PrimaryKey>;

export class Group<DataType = DefaultDataItem> extends State<Array<PrimaryKey>> {
  masterOutput: Array<any> = [];
  missingPrimaryKeys: Array<PrimaryKey> = [];
  computedFunc?: (data: DataType) => DataType;

  public get output(): Array<any> {
    if (this.instance().runtime.trackState) this.instance().runtime.foundState.add(this);
    return this.masterOutput;
  }
  constructor(private collection: () => Collection) {
    super(() => collection().instance(), []);

    this.sideEffects = () => this.build();

    this.mutation = () => this.value;

    // initial build
    this.build();
  }
  public build() {
    this.missingPrimaryKeys = [];
    let group = this.masterValue
      .map(primaryKey => {
        let data = this.collection().data[primaryKey];
        if (!data) {
          this.missingPrimaryKeys.push(primaryKey);
          return undefined;
        }
        // on each data item in this group, run compute
        if (this.computedFunc) {
          // this.instance().runtime.trackState = true;
          let dataComputed = this.computedFunc(data.copy());
          // let found = this.instance().runtime.getFoundState();
          // found.forEach(dep => this.dep.dynamic.add(dep));
          return dataComputed;
        }

        return data.getPublicValue();
      })
      .filter(item => item !== undefined);

    this.dep.dynamic.forEach(state => state.dep.depend(this));

    this.masterOutput = group;
  }

  public compute(func: (data: DataType) => DataType): void {
    this.computedFunc = func;
  }

  public has(primaryKey: PrimaryKey) {
    return this.value.includes(primaryKey) || false;
  }

  public add(primaryKey: PrimaryKey) {}
}

export default Group;

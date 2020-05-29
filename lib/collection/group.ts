import Dep from '../dep';
import Pulse from '../pulse';
import State from '../state';
import Collection, { DefaultDataItem } from './collection';
import Computed from '../computed';

export type PrimaryKey = string | number;
export type GroupName = string | number;
export type Index = Array<PrimaryKey>;

export class Group<DataType = DefaultDataItem> extends State<Array<PrimaryKey>> {
  _masterOutput: Array<DataType> = [];
  missingPrimaryKeys: Array<PrimaryKey> = [];
  computedFunc?: (data: DataType) => DataType;
  _length: State;
  public get output(): Array<DataType> {
    if (this.instance().runtime.trackState) this.instance().runtime.foundState.add(this);
    return this._masterOutput;
  }
  constructor(private collection: () => Collection, initialIndex?: Array<PrimaryKey>) {
    super(() => collection().instance(), initialIndex || []);

    this.type(Array);

    this.sideEffects = () => this.build();

    this.mutation = () => this.value;

    // initial build
    this.build();
  }
  public build() {
    this.missingPrimaryKeys = [];
    let group = this._masterValue
      .map(primaryKey => {
        let data = this.collection().data[primaryKey];
        if (!data) {
          this.missingPrimaryKeys.push(primaryKey);
          return undefined;
        }
        // on each data item in this group, run compute
        if (this.computedFunc) {
          let dataComputed = this.computedFunc(data.copy());
          return dataComputed;
          // use collection level computed func if local does not exist
        } else if (this.collection().computedFunc) {
          let dataComputed = this.collection().computedFunc(data.copy());
          return dataComputed;
        }

        return data.getPublicValue();
      })
      .filter(item => item !== undefined);

    this.dep.dynamic.forEach(state => state.dep.depend(this));
    //@ts-ignore
    this._masterOutput = group;
  }

  public has(primaryKey: PrimaryKey) {
    return this.value.includes(primaryKey) || false;
  }

  public get size(): number {
    return this.value.length;
  }

  public compute(func: (data: DataType) => DataType): void {
    this.computedFunc = func;
  }

  public add(primaryKey: PrimaryKey) {}
}

export default Group;

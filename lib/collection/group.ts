import Dep from '../dep';
import Pulse from '../pulse';
import State from '../state';
import Collection from './collection';

export type PrimaryKey = string | number;
export type GroupName = string | number;
export type Index = Array<PrimaryKey>;

export default class Group extends State<Array<PrimaryKey>> {
  masterOutput: Array<any> = [];
  missingPrimaryKeys: Array<PrimaryKey> = [];
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
        return this.collection().data[primaryKey].value;
      })
      .filter(item => item !== undefined);
    this.masterOutput = group;
  }
  public has(primaryKey: PrimaryKey) {
    return this.value.includes(primaryKey) || false;
  }

  public add(primaryKey: PrimaryKey) {}
}

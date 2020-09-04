import { Pulse, State, Collection, DefaultDataItem } from '../internal';
import { defineConfig } from '../utils';

export type PrimaryKey = string | number;
export type GroupName = string | number;
export type Index = Array<PrimaryKey>;
export type InstanceContext = (() => Collection) | (() => Pulse);

export class Group<DataType = DefaultDataItem> extends State<Array<PrimaryKey>> {
  _masterOutput: Array<DataType> = [];
  missingPrimaryKeys: Array<PrimaryKey> = [];
  computedFunc?: (data: DataType) => DataType;
  collection: () => Collection<DataType>;
  public get index(): Array<PrimaryKey> {
    return this.value;
  }
  public get output(): Array<DataType> {
    if (this.instance().runtime.trackState) this.instance().runtime.foundState.add(this);
    return this._masterOutput;
  }

  constructor(context: InstanceContext, initialIndex?: Array<PrimaryKey>, config: { name?: string } = {}) {
    // This invokes the parent class with either the collection or the Pulse instance as context
    // This means groups can be created before (or during) a Collection instantiation
    super((context() instanceof Pulse ? context : (context() as Collection<DataType>).instance) as () => Pulse, initialIndex || []);
    if (context() instanceof Collection) this.collection = context as () => Collection<DataType>;

    if (config.name) this.name = config.name;

    this.type(Array);

    this.sideEffects = () => this.build();

    // initial build
    this.build();
  }
  public build() {
    this.missingPrimaryKeys = [];
    if (!Array.isArray(this._value)) return [];
    let group = this._value
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

    // this.dep.dynamic.forEach(state => state.dep.depend(this));
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

  public add(primaryKey: PrimaryKey, options: GroupAddOptions = {}): this {
    // set defaults
    options = defineConfig(options, { method: 'push', overwrite: true });
    const useIndex = options.atIndex !== undefined;
    const exists = this.nextState.includes(primaryKey);

    if (options.overwrite) this.nextState = this.nextState.filter(i => i !== primaryKey);
    // if we do not want to overwrite and key already exists in group, exit
    else if (exists) return this;

    // if atIndex is set, inject at that index.
    if (useIndex) {
      if (options.atIndex > this.nextState.length) options.atIndex = this.nextState.length - 1;
      this.nextState.splice(options.atIndex, 0, primaryKey);
    }
    // push or unshift into state
    else this.nextState[options.method](primaryKey);

    // send nextState to runtime and return
    this.set();
    return this;
  }

  public remove(primaryKey: PrimaryKey): this {
    this.nextState = this.nextState.filter(i => i !== primaryKey);
    this.set();
    return this;
  }
}

export default Group;

export interface GroupAddOptions {
  atIndex?: number; //
  method?: 'unshift' | 'push'; // method to add to group
  overwrite?: boolean; // set to false to leave primary key in place if already present
}

import { config } from 'process';
import { Pulse } from '../pulse';
import { State, Collection, DefaultDataItem, Data } from '../internal';
import { defineConfig, normalizeArray } from '../utils';

export type PrimaryKey = string | number;
export type GroupName = string | number;
export type Index = Array<PrimaryKey>;
export type InstanceContext = (() => Collection) | (() => Pulse);

enum TrackedChangeMethod {
  ADD,
  REMOVE,
  UPDATE
}

// this is used to "soft" rebuild a group, when only one data item has changed
interface TrackedChange {
  method: TrackedChangeMethod;
  key?: PrimaryKey; // key is not needed to remove
  index: number;
}

interface GroupConfig {
  name?: GroupName;
  provisional?: boolean;
  lazyBuild?: boolean;
}

export class Group<DataType = DefaultDataItem> extends State<Array<PrimaryKey>> {
  private collection: () => Collection<DataType>;

  // group state
  private _output: Array<DataType> = [];
  private _preciseIndex: Array<PrimaryKey> = [];
  private _missingPrimaryKeys: PrimaryKey[] = [];
  private _trackedIndexChanges: TrackedChange[];
  private _outdated: boolean;

  // group configuration
  private computedFunc?: (data: DataType) => DataType;
  public provisional: boolean;

  // getter for precise index
  public get index(): Array<PrimaryKey> {
    return this._preciseIndex;
  }

  public get size(): number {
    return this._preciseIndex.length;
  }

  // getter for group output, contains built collection data
  public get output(): Array<DataType> {
    if (this._outdated) this.build();
    if (this.instance().runtime.trackState) this.instance().runtime.foundState.add(this);
    return this._output;
  }

  constructor(context: InstanceContext, initialIndex?: Array<PrimaryKey>, config: GroupConfig = {}) {
    // This invokes the parent class with either the collection or the Pulse instance as context
    // This means groups can be created before (or during) a Collection instantiation
    super((context() instanceof Pulse ? context : (context() as Collection<DataType>).instance) as () => Pulse, initialIndex || []);
    if (context() instanceof Collection) this.collection = context as () => Collection<DataType>;

    if (config.name) this.key(config.name as string);
    if (config.provisional) this.provisional = config.provisional;

    this.type(Array);

    this.sideEffects = () => {
      if (config.lazyBuild != false) this._outdated = true;
      else this.build();
    };

    // initial build
    if (config.lazyBuild != false) this._output = [];
    else this.build();
  }

  public build() {
    if (!Array.isArray(this._value)) return [];

    // If this group has been modified at specific indexes, avoid rebuilding entire group data
    if (this._trackedIndexChanges) {
      for (const change of this._trackedIndexChanges) {
        // if tracked change is to remove the item at this index
        if (change.method == TrackedChangeMethod.REMOVE) {
          this._preciseIndex.splice(change.index, 1);
          this._output.splice(change.index, 1);
          continue;
        }
        //
        else {
          const data = this.getCollectionData(change.key, change.index);
          if (data && change.method == TrackedChangeMethod.ADD) {
            this._output.splice(change.index, 0, this.renderData(data));
            this._preciseIndex.splice(change.index, 0, change.key);
          }
          //
          else if (data && change.method == TrackedChangeMethod.UPDATE) {
            this._output[change.index] = this.renderData(data);
          }
        }
      }
      // clean up
      delete this._trackedIndexChanges;
    }

    // Build group output from scratch
    else {
      this._missingPrimaryKeys = [];
      this._preciseIndex = [];
      // build the group data from collection data using the index
      this._output = this._value
        .map((primaryKey, index) => {
          const data = this.getCollectionData(primaryKey, index);
          if (data) {
            this._preciseIndex.push(primaryKey);
            return this.renderData(data);
          }
          return undefined;
        })
        .filter(item => item != undefined);
    }

    delete this._outdated;
  }

  private getCollectionData(key: PrimaryKey, index: number): Data<DataType> | undefined {
    let data = this.collection().data[key];

    if (!data) {
      this._missingPrimaryKeys.push(key);
      return undefined;
    }
    return data;
  }

  private renderData(data: Data<DataType>): DataType {
    if (this.computedFunc) {
      let dataComputed = this.computedFunc(data.copy());
      return dataComputed;

      // use collection level computed func if local does not exist
    } else if (this.collection()._computedFunc) {
      let dataComputed = this.collection()._computedFunc(data.copy());

      return dataComputed;
    }
    return data.getPublicValue();
  }

  public has(primaryKey: PrimaryKey) {
    return this.value.includes(primaryKey) || false;
  }

  public compute(func: (data: DataType) => DataType): void {
    this.computedFunc = func;
  }

  public add(primaryKeyOrKeys: PrimaryKey | PrimaryKey[], options: GroupAddOptions = {}): this {
    options = defineConfig(options, { method: 'push', overwrite: true, softRebuild: true });
    // set defaults
    let value = this.copy();
    const useIndex = options.atIndex != undefined;

    for (let [i, primaryKey] of normalizeArray(primaryKeyOrKeys).entries()) {
      const exists = value.includes(primaryKey);

      if (options.overwrite) value = value.filter(i => i !== primaryKey);
      // if we do not want to overwrite and key already exists in group, exit
      else if (exists) return this;

      // if atIndex is set, inject at that index.
      if (useIndex) {
        // if index is greater than length insert at the end of the array
        if (options.atIndex > value.length) options.atIndex = value.length - 1;
        value.splice(options.atIndex + i, 0, primaryKey);
      }
      // push or unshift into state
      else value[options.method](primaryKey);

      if (options.softRebuild) {
        this.trackChange({
          method: exists ? TrackedChangeMethod.UPDATE : TrackedChangeMethod.ADD,
          key: primaryKey,
          index: useIndex ? options.atIndex : options.method == 'push' ? value.length - 1 : 0
        });
      }
    }

    this.set(value, { _caller: this.add });
    return this;
  }

  public remove(primaryKey: PrimaryKey, options: GroupRemoveOptions = {}): this {
    options = defineConfig(options, { softRebuild: true });
    const value = this.copy();
    const index = this._preciseIndex.indexOf(primaryKey);

    if (index == -1) return this;

    if (options.softRebuild) this.trackChange({ index, method: TrackedChangeMethod.REMOVE });

    value.splice(index, 1);

    this.set(value, { _caller: this.remove });
    return this;
  }

  private trackChange(change: TrackedChange) {
    if (!this._trackedIndexChanges) this._trackedIndexChanges = [];
    this._trackedIndexChanges.push(change);
  }

  public rebuildOne(primaryKey: PrimaryKey): this {
    const index = this._preciseIndex.indexOf(primaryKey);
    if (index == -1) return this;

    this.trackChange({ index, key: primaryKey, method: TrackedChangeMethod.UPDATE });

    this.set(undefined, { _caller: this.add });
  }
}

export default Group;

export interface GroupRemoveOptions {
  softRebuild?: boolean;
}

export interface GroupAddOptions {
  atIndex?: number;
  softRebuild?: boolean;
  method?: 'unshift' | 'push'; // method to add to group
  overwrite?: boolean; // set to false to leave primary key in place if already present
}

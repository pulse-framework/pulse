import { Pulse, State, Group, PrimaryKey, GroupName, GroupAddOptions, Selector, Data } from '../internal';
import { defineConfig, shallowmerge } from '../utils';
import { deepmerge } from '../helpers/deepmerge';
import { normalizeArray } from '../utils';

// Shorthand for an expandable object
type Expandable = { [key: string]: any };

interface RemoveOptions {
  fromGroups: (groups: string | number | Array<string>) => any;
  everywhere: () => any;
}
export interface DefaultDataItem extends Expandable {}

// Defaults for collection sub instance objects, used as generics
export type GroupObj = { [key: string]: Group<any> };
export type SelectorObj = { [key: string]: Selector<any> };

// Interface for the collection config object
export interface CollectionConfig<G, S> {
  groups?: G;
  selectors?: S;
  name?: string;
  primaryKey?: string | number;
  defaultGroup?: boolean;
}

// An optional type defining config as either an object, or an object that returns a function
export type Config<DataType = DefaultDataItem, G = GroupObj, S = SelectorObj> =
  | CollectionConfig<G, S>
  | ((collection: Collection<DataType>) => CollectionConfig<G, S>);

// The collection class, should be created by the Pulse class for functioning types
export class Collection<DataType extends DefaultDataItem = DefaultDataItem, G extends GroupObj = GroupObj, S extends SelectorObj = SelectorObj> {
  public config: Required<CollectionConfig<G, S>>;
  // the amount of data items stored inside this collection
  public size: number = 0;

  // collection data is stored here
  public data: { [key: string]: Data<DataType> } = {};

  public groups: G;
  public selectors: S;

  private _groups: Set<Group<DataType>> = new Set();
  private _selectors: Set<Selector<DataType>> = new Set();

  public computedFunc?: (data: DataType) => DataType;

  // collection config can either be an object of type CollectionConfig or a function that returns CollectionConfig
  constructor(public instance: () => Pulse, config: Config<DataType, G, S>) {
    // if collection config is a function, execute and assign to config
    if (typeof config === 'function') config = config(this) as CollectionConfig<G, S>;

    // assign defaults to config object ensuring type safety
    this.config = defineConfig<typeof config>(config, {
      primaryKey: 'id'
    }) as Required<typeof config>;

    // create groups
    if (this.config.groups) this.initSubInstances('groups');
    if (this.config.selectors) this.initSubInstances('selectors');

    if (this.config.defaultGroup || !this.config.groups) {
      if (!this.groups) this.groups = {} as any;
      this.createGroup('default');
    }
  }

  private initSubInstances(subInstanceType: 'groups' | 'selectors') {
    const subInstanceObj: any = {};
    // You'll need the below code when you add support for arrays of group names ;)
    // const subInstanceTypeGeneratorName = subInstanceType.charAt(0).toUpperCase() + subInstanceType.slice(1, -1);
    // const keys: Array<string> = Array.isArray(this.config[subInstanceType])
    //   ? (this.config[subInstanceType] as Array<string>)
    //   : Object.keys(this.config[subInstanceType]);

    const keys = Object.keys(this.config[subInstanceType]);

    for (const subInstanceName of keys) {
      let value = this.config[subInstanceType][subInstanceName];
      // create the sub instance
      subInstanceObj[subInstanceName] = value;
      // assign sub instance to instance and inject key of the sub instance name
      if (!subInstanceObj[subInstanceName].name) subInstanceObj[subInstanceName].key(subInstanceName);
    }
    this[subInstanceType] = subInstanceObj;
  }

  /**
   * Create a group associated with this collection
   * @param initialIndex - An optional array of primary keys to initialize this groups with.
   */
  public Group(initialIndex?: Array<PrimaryKey>): Group<DataType> {
    const group = new Group<DataType>(() => this, initialIndex);
    this._groups.add(group);
    return group;
  }
  // create a selector instance under this collection
  public Selector(initialSelection?: string | number): Selector<DataType> {
    const selector = new Selector<DataType>(() => this, initialSelection);
    this._selectors.add(selector);
    return selector;
  }

  /**
   * Create a group associated with this collection
   * @param initialIndex - An optional array of primary keys to initialize this groups with.
   */
  public createGroup(groupName: GroupName, initialIndex?: Array<PrimaryKey>): Group<DataType> {
    if (this.groups[groupName]) return this.groups[groupName];
    const group = this.Group(initialIndex).key(groupName as string);
    (this.groups as any)[groupName] = group;
    return group;
  }
  // create a selector instance on this collection
  public createSelector(selectorName: string | number, initialSelected?: PrimaryKey): Selector<DataType> {
    if (this.selectors[selectorName]) return this.selectors[selectorName];
    const selector = this.Selector(initialSelected).key(selectorName as string);
    (this.selectors as any)[selectorName] = selector;
    return selector;
  }

  // save data directly into collection storage
  public saveData(data: DataType, patch?: boolean): PrimaryKey | null {
    let key = this.config.primaryKey;
    if (!data || !data.hasOwnProperty(key)) return null;
    // if the data already exists and config is to patch, patch data
    if (this.data[data[key]] && patch) this.data[data[key]].patch(data, { deep: false });
    // if already exists and no config, overwrite data
    else if (this.data[data[key]]) this.data[data[key]].set(data);
    // otherwise create new data instance
    else this.data[data[key]] = new Data<DataType>(() => this, data);
    this.size++;
    return data[key];
  }

  /**
   * Collect iterable data into this collection. Note:
   * - Data items must include a primary key (id)
   * @param data - Array of data, or single data object
   * @param groups - Array of group names or single group name
   */
  public collect(
    items: DataType | Array<DataType>,
    groups?: GroupName | Array<GroupName>,
    config: {
      patch?: boolean;
      method?: 'push' | 'unshift';
      forEachItem?: (item: DataType, key: PrimaryKey, index: number) => DataType;
    } = {}
  ): void {
    const _items = normalizeArray(items);

    if (!groups) groups = 'default';
    groups = normalizeArray(groups);

    // fix for default not always being given collected data
    if (groups.indexOf('default') === -1) groups.push('default');

    // if any of the groups don't already exist, create them
    groups.forEach(groupName => !this.groups[groupName] && this.createGroup(groupName));

    // if method is unshift reverse array order to maintain correct order
    if (config.method === 'unshift') _items.reverse();

    _items.forEach((item, index) => {
      if (config.forEachItem) item = config.forEachItem(item, item[this.config.primaryKey], index);
      let key = this.saveData(item, config.patch);
      if (key === null) return;

      (groups as Array<string>).forEach(groupName => {
        let group = this.groups[groupName];
        if (!group.nextState.includes(key)) group.nextState[config.method || 'push'](key);
      });
    });

    groups.forEach(groupName => this.instance().runtime.ingest(this.groups[groupName], this.groups[groupName].nextState));
  }
  /**
   * Return an item from this collection by primaryKey as Data instance (extends State)
   * @param {(number|string)} primaryKey - The primary key of the data
   */
  public findById(id: PrimaryKey | State): Data<DataType> {
    if (id instanceof State) id = id.value;
    if (!this.data.hasOwnProperty(id as PrimaryKey)) {
      return new Data(() => this, undefined);
    }
    return this.data[id as PrimaryKey];
  }

  public getValueById(id: PrimaryKey | State): DataType {
    let data = this.findById(id).value;
    // @ts-ignore
    if (!data) data = {};
    return this.computedFunc ? this.computedFunc(data) : data;
  }

  /**
   * Return an group from this collection as Group instance (extends State)
   * @param {(number|string)} groupName - The name of your group
   */
  public getGroup(groupName: string | number): Group<DataType> {
    if (this.groups[groupName]) {
      return this.groups[groupName];
    } else {
      return new Group(() => this, [], { name: 'dummy' }); // return empty group
    }
  }

  /**
   * Update data by id in a Pulse Collection
   * @param {(string|number|State)} updateKey - The primary key of the item to update
   * @param {Object} changes - This object will be deep merged with the original
   */

  public update(updateKey: PrimaryKey | State, changes: Expandable = {}, config: { deep?: boolean } = {}): State {
    // if State instance passed as updateKey grab the value
    if (updateKey instanceof State) updateKey = updateKey.value;
    updateKey = updateKey as PrimaryKey;

    // if the primary key is changed, this will be true
    let updateDataKey: boolean = false,
      // define aliases
      data = this.data[updateKey],
      primary = this.config.primaryKey;

    // if the data does not exist
    if (!this.data.hasOwnProperty(updateKey)) return;

    // create a copy of the value for mutation
    const currentData = data.copy();

    // if the new object contains a primary key, it means we need to change the primary key
    // on the collection too, however we should defer this until after the new data is ingested into the runtime queue
    if (changes[primary]) updateDataKey = true;

    // deep merge the new data with the existing data
    const final = config.deep ? deepmerge(currentData, changes) : shallowmerge(currentData, changes);

    // assign the merged data to the next state of the State and ingest
    data.nextState = final;
    this.instance().runtime.ingest(data);

    // if the data key has changed move it internally and ammend groups
    if (updateDataKey) this.updateDataKey(currentData[primary], final[primary]);

    this.rebuildGroupsThatInclude(final[primary]);

    // return the Data instance
    return this.data[final[primary]];
  }

  public compute(func: (data: DataType) => DataType): void {
    this.computedFunc = func;
  }

  public put(primaryKeys: PrimaryKey | Array<PrimaryKey>, groupNames: GroupName | Array<GroupName>, options?: GroupAddOptions) {
    primaryKeys = normalizeArray(primaryKeys);
    groupNames = normalizeArray(groupNames);

    groupNames.forEach(groupName => {
      if (!this.groups.hasOwnProperty(groupName)) return;

      (primaryKeys as Array<PrimaryKey>).forEach(key => {
        this.groups[groupName].add(key, options);
      });
    });
  }

  /**
   * this is an alias function that returns other functions for removing data from a collection
   */
  public remove(primaryKeys: PrimaryKey | Array<PrimaryKey>): RemoveOptions {
    primaryKeys = normalizeArray(primaryKeys);
    return {
      fromGroups: (groups: Array<string>) => this.removeFromGroups(primaryKeys, groups),
      everywhere: () => this.deleteData(primaryKeys, Object.keys(this.groups))
    };
  }

  public removeFromGroups(primaryKeys: PrimaryKey | Array<PrimaryKey>, groups: GroupName | Array<GroupName>): boolean {
    primaryKeys = normalizeArray(primaryKeys);
    groups = normalizeArray(groups);
    groups.forEach(groupName => {
      (primaryKeys as Array<PrimaryKey>).forEach(primaryKey => {
        if (!this.groups[groupName]) return;
        let group = this.getGroup(groupName);
        group.remove(primaryKey);
      });
    });
    return true;
  }

  public deleteData(primaryKeys: PrimaryKey | Array<PrimaryKey>, groups: GroupName | Array<GroupName>): boolean {
    primaryKeys = normalizeArray(primaryKeys);
    groups = normalizeArray(groups);

    primaryKeys.forEach(key => {
      delete this.data[key];
      (groups as Array<GroupName>).forEach(groupName => {
        this.groups[groupName].nextState = this.groups[groupName].nextState.filter(id => id !== key);
      });
    });

    groups.forEach(groupName => this.instance().runtime.ingest(this.groups[groupName], this.groups[groupName].nextState));

    return true;
  }

  private updateDataKey(oldKey: PrimaryKey, newKey: PrimaryKey): void {
    // create copy of data
    const dataCopy = this.data[oldKey];
    // delete old reference
    delete this.data[oldKey];
    // apply the data in storage
    this.data[newKey] = dataCopy;

    // update groups
    for (let groupName in this.groups) {
      const group = this.getGroup(groupName);
      // if group does not contain oldKey, continue.
      if (!group._value.includes(oldKey)) continue;
      // replace the primaryKey at current index
      group.nextState.splice(group.nextState.indexOf(oldKey), 1, newKey);
      // ingest the group
      this.instance().runtime.ingest(group);
    }
  }

  public rebuildGroupsThatInclude(primaryKey: PrimaryKey): void {
    this._groups.forEach(group => group.has(primaryKey) && this.instance().runtime.ingest(group));
  }

  public reset() {
    this.data = {};
    this.size = 0;
    const groups = Object.keys(this.groups);
    groups.forEach(groupName => this.groups[groupName].reset());
  }
}

export default Collection;

import Pulse from '../';
import State from '../state';
import Group, { PrimaryKey, GroupName, GroupAddOptions } from './group';
import { defineConfig, normalizeGroups, shallowmerge } from '../utils';
import { deepmerge } from '../helpers/deepmerge';
import { normalizeArray } from '../helpers/handy';
import Selector from '../collection/selector';
import Data from './data';

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
  indexAll?: boolean;
}

// An optional type defining config as either an object, or an objext that returns a function
export type Config<DataType = DefaultDataItem, G = GroupObj, S = SelectorObj> =
  | CollectionConfig<G, S>
  | ((collection: Collection<DataType>) => CollectionConfig<G, S>);

// The collection class, should be created by the Pulse class for functioning types
export class Collection<DataType = DefaultDataItem, G = GroupObj, S = SelectorObj> {
  public config: Required<CollectionConfig<G, S>>;
  // the amount of data items stored inside this collection
  public size: number = 0;

  // collection data is stored here
  public data: { [key: string]: Data<DataType> } = {};

  //
  public groups: this['config']['groups'];
  public selectors: this['config']['selectors'];

  public computedFunc: (data: DataType) => DataType;

  // collection config can either be an object of type CollectionConfig or a function that returns CollectionConfig
  constructor(public instance: () => Pulse, config: Config<DataType, G, S>) {
    // if collection config is a function, execute and assign to config
    if (typeof config === 'function') config = config(this) as CollectionConfig<G, S>;

    // assign defaults to config object ensuring type saftey
    this.config = defineConfig<Required<typeof config>>(config as Required<typeof config>, {
      primaryKey: 'id',
      groups: []
    });

    // create groups
    if (config.groups) this.initSubInstances('groups');
    if (config.selectors) this.initSubInstances('selectors');
  }

  private initSubInstances(subInstanceType: 'groups' | 'selectors') {
    const subInstanceObj: any = {};
    // transform "groups" into "Group" so we can use Collection.Group, and same with selectors.
    const subInstanceTypeGeneratorName = subInstanceType.charAt(0).toUpperCase() + subInstanceType.slice(1, -1);

    // get keys from object, or array- depending on what the developer supplied
    // const keys: Array<string> = Array.isArray(this.config[subInstanceType])
    //   ? (this.config[subInstanceType] as Array<string>)
    //   : Object.keys(this.config[subInstanceType]);

    const keys = Object.keys(this.config[subInstanceType]);

    for (const subInstanceName in keys) {
      // create the sub instance
      subInstanceObj[subInstanceName] = this[subInstanceTypeGeneratorName]();
      // assign sub instance to instance and inject key of the sub instance name
      subInstanceObj[subInstanceName].key(subInstanceName);
    }
    this[subInstanceType] = subInstanceObj;
  }

  // create a group instance under this collection
  public Group(initialIndex?: Array<PrimaryKey>): Group<DataType> {
    return new Group<DataType>(() => this, initialIndex);
  }
  // create a selector instance under this collection
  public Selector(initialSelection?: string | number): Selector<DataType> {
    return new Selector<DataType>(() => this, initialSelection);
  }

  // create a group instance on this collection
  public createGroup(groupName: GroupName, initialIndex?: Array<PrimaryKey>): Group<DataType> {
    if (this.groups.hasOwnProperty(groupName)) console.error(`Pulse Collection: Group ${groupName} already exists`);

    let group = new Group<DataType>(() => this, initialIndex);
    group.name = groupName as string;
    this.groups[groupName] = group;

    return group;
  }

  // save data directly into collection storage
  public saveData(data: DataType): PrimaryKey | null {
    let key = this.config.primaryKey;
    if (!data || !data.hasOwnProperty(key)) return null;
    // if the data already exists, merge data
    if (this.data[data[key]]) this.data[data[key]].patch(data, { deep: false });
    // otherwise create new data instance
    else this.data[data[key]] = new Data<DataType>(() => this, data);
    this.size++;
    return data[key];
  }

  /**
   * Collect iterable data into this collection. Note:
   * - Data items must include a primary key (id)
   * @param {(Array<object>|object)} data - Array of data, or single data object
   * @param {(Array<string>|string)} groups - Array of group names or single group name
   */
  public collect(
    items: DataType | Array<DataType>,
    groups?: GroupName | Array<GroupName>,
    config: {
      method?: 'push' | 'unshift';
      forEachItem?: (item: DataType, key: PrimaryKey, index: number) => void;
    } = {}
  ): void {
    let _items = normalizeArray(items);
    if (!groups) groups = 'default';
    groups = normalizeArray(groups);

    // if any of the groups don't already exist, create them
    groups.forEach((groupName) => !this.groups[groupName] && this.createGroup(groupName));

    _items.forEach((item, index) => {
      let key = this.saveData(item);
      if (config.forEachItem) config.forEachItem(item, key, index);
      if (key === null) return;
      (groups as Array<string>).forEach((groupName) => {
        let group = this.groups[groupName];
        if (!group.nextState.includes(key)) group.nextState[config.method || 'push'](key);
      });
    });

    groups.forEach((groupName) => this.instance().runtime.ingest(this.groups[groupName], this.groups[groupName].nextState));
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
      // define alisas
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

    this.regenGroupsThatInclude(final[primary]);

    // return the Data instance
    return this.data[final[primary]];
  }

  public compute(func: (data: DataType) => DataType): void {
    this.computedFunc = func;
  }

  public put(primaryKeys: PrimaryKey | Array<PrimaryKey>, groupNames: GroupName | Array<GroupName>, options?: GroupAddOptions) {
    primaryKeys = normalizeArray(primaryKeys);
    groupNames = normalizeArray(groupNames);

    groupNames.forEach((groupName) => {
      if (!this.groups.hasOwnProperty(groupName)) return;

      (primaryKeys as Array<PrimaryKey>).forEach((key) => {
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
    groups.forEach((groupName) => {
      (primaryKeys as Array<PrimaryKey>).forEach((primaryKey) => {
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

    primaryKeys.forEach((key) => {
      delete this.data[key];
      (groups as Array<GroupName>).forEach((groupName) => {
        this.groups[groupName].nextState = this.groups[groupName].nextState.filter((id) => id !== key);
      });
    });

    groups.forEach((groupName) => this.instance().runtime.ingest(this.groups[groupName], this.groups[groupName].nextState));

    return true;
  }

  // public findGroupsToUpdate(primaryKeysChanged: Array<PrimaryKey>) {
  //   let groupsToRegen
  //   for (let groupName in this.groups) {

  //   }
  // }

  private updateDataKey(oldKey: PrimaryKey, newKey: PrimaryKey): void {
    // create copy of data
    const dataCopy = this.data[oldKey];
    // delete old refrence
    delete this.data[oldKey];
    // apply the data in storage
    this.data[newKey] = dataCopy;

    // update groups
    for (let groupName in this.groups) {
      const group = this.getGroup(groupName);
      // if group does not contain oldKey, continue.
      if (!group._masterValue.includes(oldKey)) continue;
      // replace the primaryKey at current index
      group.nextState.splice(group.nextState.indexOf(oldKey), 1, newKey);
      // ingest the group
      this.instance().runtime.ingest(group);
    }
  }

  public regenGroupsThatInclude(primarykey: PrimaryKey): void {
    for (let groupName in this.groups) {
      const group = this.getGroup(groupName);
      if (group.has(primarykey)) this.instance().runtime.ingest(group);
    }
  }

  public reset() {
    this.data = {};
    this.size = 0;
    const groups = Object.keys(this.groups);
    groups.forEach((groupName) => this.groups[groupName].reset());
  }
}

export default Collection;

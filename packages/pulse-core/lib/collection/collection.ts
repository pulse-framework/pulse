import { Pulse } from '../pulse';
import { State, Group, PrimaryKey, GroupName, GroupAddOptions, Selector, Data, SelectorName } from '../internal';
import { defineConfig, shallowmerge } from '../utils';
import { deepmerge } from '../helpers/deepmerge';
import { normalizeArray } from '../utils';

// Shorthand for an expandable object
export type DefaultDataItem = Record<string, any>;

interface RemoveOptions {
  fromGroups: (groups: string | number | Array<string>) => any;
  everywhere: () => any;
}

// Defaults for collection sub instance objects, used as generics
export type GroupObj<DataType> = Record<GroupName, Group<DataType>>;
export type SelectorObj<DataType> = Record<SelectorName, Selector<DataType>>;

// Interface for the collection config object
export interface CollectionConfig {
  name?: string;
  primaryKey?: string | number;
  defaultGroup?: boolean;
}

// An optional type defining config as either an object, or an object that returns a function
export type Config<DataType = DefaultDataItem> = CollectionConfig | ((collection: Collection<DataType>) => CollectionConfig);

// The collection class, should be created by the Pulse class for functioning types
export class Collection<
  DataType extends DefaultDataItem = DefaultDataItem,
  G extends GroupObj<DataType> = GroupObj<DataType>,
  S extends SelectorObj<DataType> = SelectorObj<DataType>
> {
  public config: Required<CollectionConfig>;

  // collection data is stored here
  public data: { [key: string]: Data<DataType> } = {};
  public groups: G = {} as G;
  public selectors: S = {} as S;

  public _provisionalData: { [key: string]: Data<DataType> } = {};
  public _provisionalGroups: { [key: string]: Group<DataType> } = {};
  public _computedFunc?: (data: DataType) => DataType;
  public _collectFunc?: (data: DataType) => DataType;

  // the amount of data items stored inside this collection
  public get size(): number {
    return Object.keys(this.data).length;
  }

  // a getter to return the default group value
  public get items(): DataType[] {
    const defaultGroup = this.groups?.default;
    if (!defaultGroup) return [];
    return defaultGroup.output;
  }

  // collection config can either be an object of type CollectionConfig or a function that returns CollectionConfig
  constructor(public instance: () => Pulse, config: Config<DataType>) {
    // if collection config is a function, execute and assign to config
    if (typeof config === 'function') config = config(this) as CollectionConfig;

    // assign defaults to config object ensuring type safety
    this.config = defineConfig<typeof config>(config, {
      primaryKey: 'id'
    }) as Required<typeof config>;

    if (this.config.defaultGroup) this.createGroup('default');
  }

  /**
   *  Create a group instance under this collection
   * @param initialIndex - An optional array of primary keys to initialize this groups with.
   */
  public createGroup<GN extends GroupName>(groupName: GN, initialIndex?: Array<PrimaryKey>) {
    // if (this.groups[groupName]) return this;
    const group = new Group<DataType>(() => this, initialIndex, { name: groupName });
    this.groups[groupName] = (group as unknown) as G[GN];
    //@ts-ignore - doesn't error in vscode, but errors at build
    return this as this & Collection<DataType, Record<GN, Group<DataType>>, S>;
  }

  public createGroups<GroupNames extends GroupName>(groupNames: [GroupNames, ...GroupNames[]]) {
    for (const name of groupNames) this.createGroup(name);
    //@ts-ignore - doesn't error in vscode, but errors at build
    return this as this & Collection<DataType, { [key in GroupNames]: Group<DataType> }, S>;
  }

  /**
   * Create a selector instance under this collection
   * @param initialSelection - An initial PrimaryKey (string or number) to select.
   * Supports selecting data that does not yet exist, will update if that data item is eventually collected.
   */
  public createSelector<SN extends SelectorName>(selectorName: SN, initialSelection?: string | number) {
    const selector = new Selector<DataType>(() => this, initialSelection);
    this.selectors[selectorName] = (selector as unknown) as S[SN];
    //@ts-ignore - doesn't error in vscode, but errors at build
    return this as this & Collection<DataType, G, { [key in SN]: Selector<DataType> }>;
  }

  public createSelectors<SelectorNames extends SelectorName>(selectorNames: [SelectorNames, ...SelectorNames[]]) {
    for (const name of selectorNames) this.createSelector(name);
    //@ts-ignore - doesn't error in vscode, but errors at build
    return this as this & Collection<DataType, G, { [key in SelectorNames]: Selector<DataType> }>;
  }

  public model(config: (...args: any) => any, options: Record<string, any>) {
    return this;
  }
  public persist(config: Record<string, string>) {
    return this;
  }

  // save data directly into collection storage
  public saveData(data: DataType, patch?: boolean): PrimaryKey | null {
    let key = this.config.primaryKey;
    if (!data || !data.hasOwnProperty(key)) return null;
    if (this._collectFunc) data = this._collectFunc(data);
    const existingData = this.data[data[key]];
    // if the data already exists and config is to patch, patch data
    if (patch && existingData) existingData.patch(data, { deep: false });
    // if already exists and no config, overwrite data
    else if (existingData) existingData.set(data);
    // if provisional data exists for this key, migrate data instance
    else if (this._provisionalData.hasOwnProperty(data[key])) {
      this.data[data[key]] = this._provisionalData[data[key]];
      // update provisional data instance with new data
      if (patch) {
        this.data[data[key]].patch(data, { deep: false });
      } else {
        this.data[data[key]].set(data);
      }
      // cleanup provisional data
      delete this._provisionalData[data[key]];
    }
    // otherwise create new data instance
    else this.data[data[key]] = new Data<DataType>(() => this, data);
    return data[key];
  }

  /**
   * Collect iterable data into this collection. Note:
   * - Data items must include a primary key (id)
   * @param data - Array of data, or single data object
   * @param groups - Array of group names or single group name
   */
  public collect(
    items: DataType | DataType[],
    groups?: GroupName | GroupName[],
    config: {
      patch?: boolean;
      method?: 'push' | 'unshift';
      forEachItem?: (item: DataType, key: PrimaryKey, index: number) => DataType;
    } = {}
  ): void {
    const _items = normalizeArray(items);
    groups = normalizeArray(groups);

    // is default group enabled? if so add default if not already present
    if (this.config.defaultGroup && groups.indexOf('default') === -1) groups.push('default');

    // if any of the groups don't already exist, create them
    for (let groupName of groups) !this.groups.hasOwnProperty(groupName) && this.createGroup(groupName);

    // if method is unshift reverse array order to maintain correct order
    if (config.method === 'unshift') _items.reverse();

    for (let [index, item] of _items.entries()) {
      if (config.forEachItem) item = config.forEachItem(item, item[this.config.primaryKey], index);

      let key = this.saveData(item, config.patch);
      if (key === null) return;

      (groups as Array<string>).forEach(groupName => {
        let group = this.groups[groupName];
        if (!group.nextState.includes(key)) group.nextState[config.method || 'push'](key);
      });
    }

    for (let groupName of groups) this.instance().runtime.ingest(this.groups[groupName], this.groups[groupName].nextState);
  }

  /**
   * Return an item from this collection by primaryKey as Data instance (extends State)
   * @param primaryKey - The primary key of the data
   */
  public getData(id: PrimaryKey | State, options: { createProvisional: boolean } = { createProvisional: true }): Data<DataType> {
    if (id instanceof State) id = id.value;

    if (!this.data.hasOwnProperty(id as PrimaryKey) && options.createProvisional) {
      if (this._provisionalData[id as PrimaryKey]) return this._provisionalData[id as PrimaryKey];

      const data = new Data(() => this, ({ id } as unknown) as DataType);
      this._provisionalData[id as PrimaryKey] = data;

      return data;
    }
    return this.data[id as PrimaryKey];
  }

  public getDataValue(id: PrimaryKey | State): DataType | null {
    let data = this.getData(id, { createProvisional: false })?.value;
    if (!data) return null;
    return this._computedFunc ? this._computedFunc(data) : data;
  }

  /**
   * Return an group from this collection as Group instance (extends State)
   * @param groupName - The name of your group
   */
  public getGroup(groupName: string): Group<DataType>;
  public getGroup(groupName: keyof G): Group<DataType>;
  public getGroup(groupName: keyof G | string): Group<DataType> {
    // if group already exists return that
    if (this.groups[groupName]) return this.groups[groupName];
    // if provisional group exists return that
    else if (this._provisionalGroups[groupName as GroupName]) return this._provisionalGroups[groupName as GroupName];
    // if no group found create a provisional group
    else return this.createProvisionalGroup(groupName as GroupName);
  }

  public getGroupValue(groupName: keyof G | string): DataType[] {
    return this.getGroup(groupName).output;
  }

  /**
   * Return an group from this collection as Group instance (extends State)
   * @param groupName - The name of your group
   */
  public getSelector(selectorName: keyof S): Selector<DataType> {
    return this.selectors[selectorName];
  }

  public getSelectorValue(selectorName: keyof S): DataType {
    return this.getSelector(selectorName).value;
  }

  private createProvisionalGroup(groupName: GroupName) {
    const group = new Group<DataType>(() => this, [], { provisional: true, name: groupName as string });
    this._provisionalGroups[groupName] = group;
    return group;
  }

  public getDataValueByIndex(indexName: string, value: string): DataType {
    return;
  }

  /**
   * Update data by id in a Pulse Collection
   * @param updateKey - The primary key of the item to update
   * @param changes - This object will be deep merged with the original
   */
  public update(updateKey: PrimaryKey | State, changes: Partial<DataType> = {}, config: { deep?: boolean } = {}): State {
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

    // if the data key has changed move it internally and amend groups
    if (updateDataKey) this.updateDataKey(currentData[primary], final[primary]);

    this.rebuildGroupsThatInclude(final[primary]);

    // return the Data instance
    return this.data[final[primary]];
  }

  public compute(func: (data: DataType) => DataType): void {
    this._computedFunc = func;
  }
  public onCollect(func: (data: DataType) => DataType): void {
    this._collectFunc = func;
  }

  /**
   * Update data by id in a Pulse Collection
   * @param primaryKeysOrKeys - The primary key array of keys of the item(s) to update
   * @param groupNameOrNames - Group name or array of names
   */
  public put(primaryKeysOrKeys: PrimaryKey | PrimaryKey[], groupNameOrNames: GroupName | GroupName[], options?: GroupAddOptions) {
    normalizeArray(groupNameOrNames).forEach(groupName => {
      if (!this.groups.hasOwnProperty(groupName)) this.createGroup(groupName);
      this.groups[groupName].add(primaryKeysOrKeys, options);
    });
  }

  /**
   * this is an alias function that returns other functions for removing data from a collection
   */
  public remove(primaryKeysOrKeys: PrimaryKey | PrimaryKey[]): RemoveOptions {
    const primaryKeys = normalizeArray(primaryKeysOrKeys);
    return {
      fromGroups: (groups: Array<string>) => this.removeFromGroups(primaryKeys, groups),
      everywhere: () => this.deleteData(primaryKeys, Object.keys(this.groups))
    };
  }

  public removeFromGroups(primaryKeyOrKeys: PrimaryKey | PrimaryKey[], groupNameOrNames: GroupName | GroupName[]): boolean {
    const primaryKeys = normalizeArray(primaryKeyOrKeys);
    const groupNames = normalizeArray(groupNameOrNames);
    groupNames.forEach(groupName => {
      if (!this.groups[groupName]) return;
      let group = this.getGroup(groupName);
      // this loop is bad, the group should be able to handle a remove action with many keys
      (primaryKeys as Array<PrimaryKey>).forEach(primaryKey => {
        group.remove(primaryKey);
      });
    });
    return true;
  }

  public deleteData(primaryKeyOrKeys: PrimaryKey | PrimaryKey[], groupNameOrNames: GroupName | GroupName[]): boolean {
    const primaryKeys = normalizeArray(primaryKeyOrKeys);
    const groupNames = normalizeArray(groupNameOrNames);

    primaryKeys.forEach(key => {
      delete this.data[key];
      groupNames.forEach(groupName => this.groups[groupName].remove(key));
    });

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

  public has(primaryKey: PrimaryKey): boolean {
    return !!this.data.hasOwnProperty(primaryKey);
  }

  public rebuildGroupsThatInclude(primaryKey: PrimaryKey): void {
    Object.values(this.groups).forEach(group => group.rebuildOne(primaryKey));
    if (Object.keys(this._provisionalGroups).length > 0) Object.values(this._provisionalGroups).forEach(group => group.rebuildOne(primaryKey));
  }
  public getGroupsWith(primaryKey: PrimaryKey, config: { includeDefault?: boolean } = {}): Group[] {
    config = defineConfig(config, {
      includeDefault: true
    });
    const groups: Array<Group> = [];
    for (let key in this.groups) {
      const group = this.getGroup(key);
      if (group.has(primaryKey)) {
        if (!config.includeDefault && group.name === 'default') {
          continue;
        }
        groups.push(group);
      }
    }
    return groups;
  }
  public getGroupNamesWith(primaryKey: PrimaryKey) {
    return this.getGroupsWith(primaryKey).map(group => group.name);
  }

  public reset() {
    // reset data
    this.data = {};
    // reset groups
    const groups = Object.keys(this.groups);
    groups.forEach(groupName => this.groups[groupName].reset());

    //reset selectors
    const selectors = Object.keys(this.selectors);
    selectors.forEach(selectorName => this.selectors[selectorName].reset());
  }

  /**
   * @deprecated Please use Collection.getData
   */
  public findById(id: PrimaryKey | State): Data<DataType> {
    return this.getData(id);
  }

  /**
   * @deprecated Please use Collection.getDataValue
   */
  public getValueById(id: PrimaryKey | State): DataType | null {
    return this.getDataValue(id);
  }
}

export default Collection;

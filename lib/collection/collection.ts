import Pulse from '../';
import State from '../state';
import Group, { PrimaryKey, GroupName } from './group';
import { defineConfig, normalizeGroups } from '../utils';
import { deepmerge } from '../helpers/deepmerge';
import { normalizeArray } from '../helpers/handy';

export interface CollectionConfig {
  groups: Array<string>;
  primaryKey: string | number;
  model?: Object;
}
// Extend State class for custom logic
export class Data extends State {
  constructor(private collection: Collection, data: { [key: string]: any }) {
    super(collection.instance, data);
  }
}

export class Collection {
  public config: CollectionConfig;
  public groups: { [key: string]: Group } = {};
  public data: { [key: string]: State } = {};
  public size: number = 0;
  constructor(public instance: () => Pulse, config?: CollectionConfig) {
    this.config = defineConfig(config, {
      primaryKey: 'id',
      groups: []
    });

    // create groups
    if (this.config.groups) this.config.groups.forEach(groupName => this.createGroup(groupName));
  }

  // create a group instance on this collection
  public createGroup(groupName: GroupName) {
    if (this.groups.hasOwnProperty(groupName))
      console.error(`Pulse Collection: Group ${groupName} already exists`);
    let group = new Group(() => this);
    group.name = groupName as string;
    this.groups[groupName] = group;
  }

  // save data directly into collection storage
  public saveData(data: { [key: string]: any }): PrimaryKey {
    this.data[data[this.config.primaryKey]] = new Data(this, data);
    this.size++;
    return data[this.config.primaryKey];
  }

  /**
   * Collect iterable data into this collection. Note:
   * - Data items must include a primary key (id)
   * @param {(Array<object>|object)} data - Array of data, or single data object
   * @param {(Array<string>|string)} groups - Array of group names or single group name
   */

  public collect(items: any | Array<any>, groups: GroupName | Array<GroupName>): void {
    items = normalizeArray(items);
    groups = normalizeArray(groups);

    // if any of the groups don't already exist, create them
    groups.forEach(groupName => !this.groups[groupName] && this.createGroup(groupName));

    items.forEach(item => {
      let key = this.saveData(item);
      (groups as Array<string>).forEach(groupName => {
        let group = this.groups[groupName];
        if (!group.value.includes(key)) group.nextState.push(key);
      });
    });

    groups.forEach(groupName =>
      this.instance().runtime.ingest(this.groups[groupName], this.groups[groupName].nextState)
    );
  }
  /**
   * Return an item from this collection by primaryKey as Data instance (extends State)
   * @param {(number|string)} primaryKey - The primary key of the data
   */
  public findById(id: PrimaryKey | State): State {
    if (id instanceof State) id = id.value;
    if (!this.data.hasOwnProperty(id as PrimaryKey)) {
      return new State(this.instance, undefined);
    }
    return this.data[id as PrimaryKey];
  }

  /**
   * Return an group from this collection as Group instance (extends State)
   * @param {(number|string)} groupName - The name of your group
   */
  public getGroup(groupName: string | number): Group {
    if (this.groups[groupName]) {
      return this.groups[groupName];
    } else {
      return new Group(() => this); // return empty group
    }
  }

  /**
   * Update data by id in a Pulse Collection
   * @param {(string|number|State)} updateKey - The primary key of the item to update
   * @param {Object} changes - This object will be deep merged with the original
   */

  public update(updateKey: PrimaryKey | State, changes: Expandable = {}): State {
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
    const final = deepmerge(currentData, changes);

    // assign the merged data to the next state of the State and ingest
    data.nextState = final;
    this.instance().runtime.ingest(data);

    // if the data key has changed move it internally and ammend groups
    if (updateDataKey) this.updateDataKey(currentData[primary], final[primary]);

    // return the Data instance
    return this.data[final[primary]];
  }

  public put(
    primaryKeys: PrimaryKey | Array<PrimaryKey>,
    groupNames: GroupName | Array<GroupName>,
    config?: {
      method: 'push' | 'unshift';
    }
  ) {
    config = defineConfig(config, {
      method: 'push'
    });
    primaryKeys = normalizeArray(primaryKeys);
    groupNames = normalizeArray(groupNames);

    groupNames.forEach(groupName => {
      if (!this.groups.hasOwnProperty(groupName)) return;

      (primaryKeys as Array<PrimaryKey>).forEach(key => {
        this.groups[groupName].nextState[config.method](key);
        this.instance().runtime.ingest(this.groups[groupName]);
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
      everywhere: (groups: Array<string>) => this.deleteData(primaryKeys, groups)
    };
  }

  public removeFromGroups(
    primaryKeys: PrimaryKey | Array<PrimaryKey>,
    groups: GroupName | Array<GroupName>
  ): boolean {
    primaryKeys = normalizeArray(primaryKeys);
    groups = normalizeArray(groups);
    let groupsToRegen: Set<Group> = new Set();

    groups.forEach(groupName => {
      (primaryKeys as Array<PrimaryKey>).forEach(primaryKey => {
        if (!this.groups[groupName]) return;

        let group = this.getGroup(groupName);

        if (group.has(primaryKey)) {
          groupsToRegen.add(group);
        }
      });
    });

    groupsToRegen.forEach(group => this.instance().runtime.ingest(group));
    return true;
  }

  public deleteData(
    primaryKeys: PrimaryKey | Array<PrimaryKey>,
    groups: GroupName | Array<GroupName>
  ): boolean {
    primaryKeys = normalizeArray(primaryKeys);
    groups = normalizeArray(groups);

    return true;
  }

  private updateDataKey(oldKey: PrimaryKey, newKey: PrimaryKey): void {
    // create copy of data
    const dataCopy = this.data[oldKey];
    // delete old refrence
    delete this.data[oldKey];
    // apply the data in storage
    this.data[newKey] = dataCopy;

    // update groups
    for (let groupName in this.groups) {
      let group = this.groups[groupName];
      // if group does not contain oldKey, continue.
      if (!group.masterValue.includes(oldKey)) continue;
      // replace the primaryKey at current index
      group.nextState.splice(group.nextState.indexOf(oldKey), 1, newKey);
      // ingest the group
      this.instance().runtime.ingest(group);
    }
  }
}

export default Collection;

type Expandable = { [key: string]: any };
type GroupsParam = string | number | Array<string>;
interface RemoveOptions {
  fromGroups: (groups: string | number | Array<string>) => any;
  everywhere: (groups: string | number | Array<string>) => any;
}

import Pulse, { State } from '../';
import Group, { PrimaryKey } from './group';
import { defineConfig, normalizeGroups } from '../utils';
import { deepmerge } from '../helpers/deepmerge';

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

type Expandable = { [key: string]: any };

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
    this.config.groups.forEach(groupName => {
      let group = new Group(this.instance, this);
      this.groups[groupName] = group;
      if (this[groupName]) console.error('Pulse Collection: Forbidden group name!');

      this[groupName] = group;
    });
  }

  public findById(id: number | string): State {
    return this.data[id];
  }

  public getGroup(id: string): Group {
    return this.groups[id];
  }

  public collect(items: Array<any>, groups: Array<string>): void {
    if (!Array.isArray(items)) items = [items];
    if (!Array.isArray(groups)) groups = [groups];

    // let pendingGroups = normalizeGroups(groups);
    groups.forEach(groupName => {
      if (!this.groups[groupName]) {
        //create group
      }
    });

    items.forEach(item => {
      let key = this.saveData(item);
      groups.forEach(groupName => {
        let group = this.groups[groupName];
        if (!group.value.includes(key)) group.nextState.push(key);
      });
    });

    groups.forEach(groupName =>
      this.instance().runtime.ingest(this.groups[groupName], this.groups[groupName].nextState)
    );
  }

  public saveData(data: { [key: string]: any }): PrimaryKey {
    this.data[data[this.config.primaryKey]] = new Data(this, data);
    this.size++;
    return data[this.config.primaryKey];
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

    // return the Data instance at the final primary key
    return this.data[final[primary]];
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

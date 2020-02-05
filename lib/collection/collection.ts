import Pulse, { State } from '../';
import Group, { PrimaryKey } from './group';
import { defineConfig, normalizeGroups } from '../utils';

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
  constructor(public instance: Pulse, config?: CollectionConfig) {
    this.config = defineConfig(config, {
      primaryKey: 'id',
      groups: []
    });

    // create groups
    this.config.groups.forEach(groupName => {
      let group = new Group(this.instance, this);
      this.groups[groupName] = group;
      if (this[groupName])
        console.error('Pulse Collection: Forbidden group name!');

      this[groupName] = group;
    });
  }

  public findById(id: number | string): State {
    return this.data[id];
  }

  public getGroup(id): Array<any> {
    return [];
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
      this.instance.runtime.ingest(
        this.groups[groupName],
        this.groups[groupName].nextState
      )
    );
  }

  public saveData(data: { [key: string]: any }): PrimaryKey {
    this.data[data[this.config.primaryKey]] = new Data(this, data);
    this.size++;
    return data[this.config.primaryKey];
  }

  public update(
    id: number | string | State,
    newObject: {} = {},
    options?: {}
  ): State {
    if (id instanceof State) id = id.value;
    options = defineConfig(options, {
      important: false
    });
    let updateDataKey: boolean = false;
    id = id as number | string;

    if (!this.data.hasOwnProperty(id)) return;

    const newObjectKeys = Object.keys(newObject);
    const currentData = { ...this.data[id].value };

    return;
  }
}

export default Collection;

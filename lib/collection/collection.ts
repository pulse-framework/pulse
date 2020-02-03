import Pulse from '../root';
import Group, { PrimaryKey } from './group';
import { defineConfig, normalizeGroups } from '../utils';

export interface CollectionConfig {
  groups: Array<string>;
  primaryKey: string | number;
  model?: Object;
}
export default class Collection {
  public config: CollectionConfig;
  public groups: { [key: string]: Group } = {};
  public data: { [key: string]: any } = {};
  public size: number = 0;
  constructor(private instance: Pulse, config?: CollectionConfig) {
    // this.dep = new Dep();

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
  public findById(id) {
    return;
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
    this.data[data[this.config.primaryKey]] = data;
    this.size++;
    return data[this.config.primaryKey];
  }
}

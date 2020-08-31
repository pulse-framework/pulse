import Collection, { DefaultDataItem, GroupObj, SelectorObj } from './collection';
import State from '../state';
import { PrimaryKey } from './group';
import Computed from '../computed';
import Pulse from '../pulse';
import { persistValue } from '../state';
import Data from './data';

export default class Selector<DataType = DefaultDataItem, G = GroupObj, S = SelectorObj> extends Computed<DataType> {
  private collection: () => Collection<DataType, G, S>;
  private _masterSelected: PrimaryKey;
  public set id(val: PrimaryKey) {
    this._masterSelected = val;
    this.recompute();
  }
  public get id() {
    return this._masterSelected;
  }
  constructor(collection: () => Collection<DataType, G, S>, key: PrimaryKey) {
    if (!key) key = 0;
    // initialize computed constructor with initial compute state
    super(collection().instance, () => findData<DataType, G, S>(collection(), key));

    // computed function that returns a given item from collection
    this.func = () => findData<DataType, G, S>(collection(), this._masterSelected);

    // alias collection function
    this.collection = collection;

    this.type(Object);

    this._masterSelected = key;
  }
  public select(key: PrimaryKey) {
    this.id = key;
  }
  public persist(key?: string) {
    if (!this.name && key) this.name = key;
    this.persistState = true;
    persistValue.bind(this)(key);
    return this;
  }
  protected getPersistableValue() {
    return this.id;
  }
}

function findData<DataType, G, S>(collection: Collection<DataType, G, S>, key: PrimaryKey) {
  let data = collection.getValueById(key);
  // if data is not found, create placeholder data, so that when real data is collected it maintains connection
  if (!data) {
    // this could be improved by storing temp refrences outside data object in collection
    collection.data[key] = new Data<DataType>(() => collection, { id: key } as any);
    data = collection.getValueById(key);
  }
  return data;
}

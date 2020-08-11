import Collection, { DefaultDataItem, GroupObj, SelectorObj } from './collection';
import State from '../state';
import { PrimaryKey } from './group';
import Computed from '../computed';
import Pulse from '../pulse';

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
    super(collection().instance, () => collection().findById(key).value);

    // computed function that returns a given item from collection
    this.func = () => collection().findById(this._masterSelected).value;

    // alias collection function
    this.collection = collection;

    this.type(Object);

    this._masterSelected = key;
  }
  public select(key: PrimaryKey) {
    this.id = key;
  }
}

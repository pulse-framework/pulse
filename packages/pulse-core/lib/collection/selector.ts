import { Computed, Collection, DefaultDataItem, Data, GroupObj, SelectorObj, PrimaryKey } from '../internal';

export class Selector<
  DataType extends DefaultDataItem = DefaultDataItem,
  G extends GroupObj = GroupObj,
  S extends SelectorObj = SelectorObj
> extends Computed<DataType> {
  private collection: () => Collection<DataType, G, S>;
  private _masterSelected: PrimaryKey;
  public set id(val: PrimaryKey) {
    this._masterSelected = val;
    this.recompute();
  }
  public get id() {
    if (this.instance().runtime.trackState) this.instance().runtime.foundState.add(this);
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
  // custom override for the State persist function
  public persist(key?: string) {
    this.persistState = true;
    this.instance().storage.handleStatePersist(this, key);
    return this;
  }
  public getPersistableValue() {
    return this.id;
  }
}

export default Selector;

function findData<DataType extends DefaultDataItem = DefaultDataItem, G extends GroupObj = GroupObj, S extends SelectorObj = SelectorObj>(
  collection: Collection<DataType, G, S>,
  key: PrimaryKey
) {
  let data = collection.findById(key).value;
  // if data is not found, create placeholder data, so that when real data is collected it maintains connection
  if (!data) {
    // this could be improved by storing temp references outside data object in collection
    collection.data[key] = new Data<DataType>(() => collection, { id: key } as any);
    data = collection.findById(key).value;
  } else {
    // If we have a computed function, run it before returning the data.
    data = collection.computedFunc ? collection.computedFunc(data) : data;
  }
  return data;
}

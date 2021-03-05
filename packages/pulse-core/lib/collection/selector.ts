import { Computed, Collection, DefaultDataItem, Data, GroupObj, SelectorObj, PrimaryKey } from '../internal';

export class Selector<
  // Generics
  DataType extends DefaultDataItem = DefaultDataItem,
  G extends GroupObj = GroupObj,
  S extends SelectorObj = SelectorObj
  //
> extends Computed<DataType> {
  protected collection: () => Collection<DataType, G, S>;
  // this is the selected primary key
  private _id: PrimaryKey = 0;

  // getter and setter for primary key
  public set id(val: PrimaryKey) {
    this._id = val;
    this.recompute();
  }
  public get id() {
    if (this.instance().runtime.trackState) this.instance().runtime.foundState.add(this);
    return this._id;
  }

  constructor(collection: () => Collection<DataType, G, S>, key: PrimaryKey) {
    // initialize computed constructor with initial compute state
    super(collection().instance, () => Selector.findData<DataType, G, S>(collection(), key));

    // computed function that returns a given item from collection
    this.func = () => Selector.findData<DataType, G, S>(collection(), this._id);

    // alias collection function
    this.collection = collection;

    this.type(Object);

    this._id = key;
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

  static findData<DataType extends DefaultDataItem = DefaultDataItem, G extends GroupObj = GroupObj, S extends SelectorObj = SelectorObj>(
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

   public reset(): this {
    super.reset();
    this._id = 0;
    return this;
  }
}

export default Selector;

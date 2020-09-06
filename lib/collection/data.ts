import { State, Collection, DefaultDataItem } from '../internal';

export class Data<DataType = DefaultDataItem> extends State<DataType> {
  public output: DataType | DefaultDataItem;
  constructor(private collection: () => Collection, data: DataType) {
    super(collection().instance, data);
    this.type(Object);
    // this.name = data && data[collection().config.primaryKey];
  }
}
export default Data;

// collection should detect if computed data dependency is own group, if so handle efficiently

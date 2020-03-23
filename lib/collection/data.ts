import { State } from '../state';
import { Collection, DefaultDataItem } from './collection';

export default class Data<DataType = DefaultDataItem> extends State<DataType> {
  public output: DataType | DefaultDataItem;
  constructor(private collection: Collection, data: DataType) {
    super(collection.instance, data);
    this.type(Object);
    this.mutation = () => this.masterValue;
  }
}

// collection should detect if computed data dependency is own group, if so handle efficiently

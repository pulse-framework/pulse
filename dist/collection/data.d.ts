import { State } from '../state';
import { Collection, DefaultDataItem } from './collection';
export default class Data<DataType = DefaultDataItem> extends State<DataType> {
    private collection;
    output: DataType | DefaultDataItem;
    constructor(collection: () => Collection, data: DataType);
}

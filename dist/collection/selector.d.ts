import Collection, { DefaultDataItem, GroupObj, SelectorObj } from './collection';
import { PrimaryKey } from './group';
import Computed from '../computed';
export default class Selector<DataType = DefaultDataItem, G = GroupObj, S = SelectorObj> extends Computed<DataType> {
    private collection;
    private _masterSelected;
    set id(val: PrimaryKey);
    get id(): PrimaryKey;
    constructor(collection: () => Collection<DataType, G, S>, key: PrimaryKey);
    select(key: PrimaryKey): void;
    persist(key?: string): this;
    protected getPersistableValue(): string | number;
}

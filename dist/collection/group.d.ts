import Pulse from '../pulse';
import State from '../state';
import Collection, { DefaultDataItem } from './collection';
export declare type PrimaryKey = string | number;
export declare type GroupName = string | number;
export declare type Index = Array<PrimaryKey>;
export declare type InstanceContext = (() => Collection) | (() => Pulse);
export declare class Group<DataType = DefaultDataItem> extends State<Array<PrimaryKey>> {
    _masterOutput: Array<DataType>;
    missingPrimaryKeys: Array<PrimaryKey>;
    computedFunc?: (data: DataType) => DataType;
    collection: () => Collection<DataType>;
    get index(): Array<PrimaryKey>;
    get output(): Array<DataType>;
    constructor(context: InstanceContext, initialIndex?: Array<PrimaryKey>, config?: {
        name?: string;
    });
    build(): any[];
    has(primaryKey: PrimaryKey): boolean;
    get size(): number;
    compute(func: (data: DataType) => DataType): void;
    add(primaryKey: PrimaryKey, options?: GroupAddOptions): this;
    remove(primaryKey: PrimaryKey): this;
}
export default Group;
export interface GroupAddOptions {
    atIndex?: number;
    method?: 'unshift' | 'push';
    overwrite?: boolean;
}

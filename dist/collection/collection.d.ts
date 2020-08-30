import Pulse from '../';
import State from '../state';
import Group, { PrimaryKey, GroupName, GroupAddOptions } from './group';
import Selector from '../collection/selector';
import Data from './data';
declare type Expandable = {
    [key: string]: any;
};
interface RemoveOptions {
    fromGroups: (groups: string | number | Array<string>) => any;
    everywhere: () => any;
}
export interface DefaultDataItem extends Expandable {
}
export declare type GroupObj = {
    [key: string]: Group<any>;
};
export declare type SelectorObj = {
    [key: string]: Selector<any>;
};
export interface CollectionConfig<G, S> {
    groups?: G;
    selectors?: S;
    name?: string;
    primaryKey?: string | number;
    indexAll?: boolean;
    persistData?: boolean;
}
export declare type Config<DataType = DefaultDataItem, G = GroupObj, S = SelectorObj> = CollectionConfig<G, S> | ((collection: Collection<DataType>) => CollectionConfig<G, S>);
export declare class Collection<DataType = DefaultDataItem, G = GroupObj, S = SelectorObj> {
    instance: () => Pulse;
    config: Required<CollectionConfig<G, S>>;
    size: number;
    data: {
        [key: string]: Data<DataType>;
    };
    groups: this['config']['groups'];
    selectors: this['config']['selectors'];
    computedFunc: (data: DataType) => DataType;
    constructor(instance: () => Pulse, config: Config<DataType, G, S>);
    private initSubInstances;
    Group(initialIndex?: Array<PrimaryKey>): Group<DataType>;
    Selector(initialSelection?: string | number): Selector<DataType>;
    createGroup(groupName: GroupName, initialIndex?: Array<PrimaryKey>): Group<DataType>;
    saveData(data: DataType, patch?: boolean): PrimaryKey | null;
    /**
     * Collect iterable data into this collection. Note:
     * - Data items must include a primary key (id)
     * @param {(Array<object>|object)} data - Array of data, or single data object
     * @param {(Array<string>|string)} groups - Array of group names or single group name
     */
    collect(items: DataType | Array<DataType>, groups?: GroupName | Array<GroupName>, config?: {
        patch?: boolean;
        method?: 'push' | 'unshift';
        forEachItem?: (item: DataType, key: PrimaryKey, index: number) => void;
    }): void;
    /**
     * Return an item from this collection by primaryKey as Data instance (extends State)
     * @param {(number|string)} primaryKey - The primary key of the data
     */
    findById(id: PrimaryKey | State): Data<DataType>;
    getValueById(id: PrimaryKey | State): DataType;
    /**
     * Return an group from this collection as Group instance (extends State)
     * @param {(number|string)} groupName - The name of your group
     */
    getGroup(groupName: string | number): Group<DataType>;
    /**
     * Update data by id in a Pulse Collection
     * @param {(string|number|State)} updateKey - The primary key of the item to update
     * @param {Object} changes - This object will be deep merged with the original
     */
    update(updateKey: PrimaryKey | State, changes?: Expandable, config?: {
        deep?: boolean;
    }): State;
    compute(func: (data: DataType) => DataType): void;
    put(primaryKeys: PrimaryKey | Array<PrimaryKey>, groupNames: GroupName | Array<GroupName>, options?: GroupAddOptions): void;
    /**
     * this is an alias function that returns other functions for removing data from a collection
     */
    remove(primaryKeys: PrimaryKey | Array<PrimaryKey>): RemoveOptions;
    removeFromGroups(primaryKeys: PrimaryKey | Array<PrimaryKey>, groups: GroupName | Array<GroupName>): boolean;
    deleteData(primaryKeys: PrimaryKey | Array<PrimaryKey>, groups: GroupName | Array<GroupName>): boolean;
    private updateDataKey;
    rebuildGroupsThatInclude(primarykey: PrimaryKey): void;
    reset(): void;
    /**
     * Persist
     * @param name The internal name of your collection - must be unique.
     */
    persist(name: string): void;
}
export default Collection;

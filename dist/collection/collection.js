"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collection = void 0;
const state_1 = require("../state");
const group_1 = require("./group");
const utils_1 = require("../utils");
const deepmerge_1 = require("../helpers/deepmerge");
const handy_1 = require("../helpers/handy");
const selector_1 = require("../collection/selector");
const data_1 = require("./data");
// The collection class, should be created by the Pulse class for functioning types
class Collection {
    // collection config can either be an object of type CollectionConfig or a function that returns CollectionConfig
    constructor(instance, config) {
        this.instance = instance;
        // the amount of data items stored inside this collection
        this.size = 0;
        // collection data is stored here
        this.data = {};
        // if collection config is a function, execute and assign to config
        if (typeof config === 'function')
            config = config(this);
        // assign defaults to config object ensuring type safety
        this.config = utils_1.defineConfig(config, {
            primaryKey: 'id',
            groups: []
        });
        // create groups
        if (config.groups)
            this.initSubInstances('groups');
        if (config.selectors)
            this.initSubInstances('selectors');
    }
    initSubInstances(subInstanceType) {
        const subInstanceObj = {};
        // transform "groups" into "Group" so we can use Collection.Group, and same with selectors.
        // You'll need the below code when you add support for arrays of group names ;)
        // const subInstanceTypeGeneratorName = subInstanceType.charAt(0).toUpperCase() + subInstanceType.slice(1, -1);
        // const keys: Array<string> = Array.isArray(this.config[subInstanceType])
        //   ? (this.config[subInstanceType] as Array<string>)
        //   : Object.keys(this.config[subInstanceType]);
        const keys = Object.keys(this.config[subInstanceType]);
        for (const subInstanceName of keys) {
            let value = this.config[subInstanceType][subInstanceName];
            // create the sub instance
            subInstanceObj[subInstanceName] = value;
            // assign sub instance to instance and inject key of the sub instance name
            if (!subInstanceObj[subInstanceName].name)
                subInstanceObj[subInstanceName].key(subInstanceName);
        }
        this[subInstanceType] = subInstanceObj;
    }
    // create a group instance under this collection
    Group(initialIndex) {
        return new group_1.default(() => this, initialIndex);
    }
    // create a selector instance under this collection
    Selector(initialSelection) {
        return new selector_1.default(() => this, initialSelection);
    }
    // create a group instance on this collection
    createGroup(groupName, initialIndex) {
        if (this.groups.hasOwnProperty(groupName))
            return this.groups[groupName];
        let group = new group_1.default(() => this, initialIndex);
        group.name = groupName;
        this.groups[groupName] = group;
        return group;
    }
    // save data directly into collection storage
    saveData(data, patch) {
        let key = this.config.primaryKey;
        if (!data || !data.hasOwnProperty(key))
            return null;
        // if the data already exists and config is to patch, patch data
        if (this.data[data[key]] && patch)
            this.data[data[key]].patch(data, { deep: false });
        // if already exists and no config, overwite data
        else if (this.data[data[key]])
            this.data[data[key]].set(data);
        // otherwise create new data instance
        else
            this.data[data[key]] = new data_1.default(() => this, data);
        this.size++;
        return data[key];
    }
    /**
     * Collect iterable data into this collection. Note:
     * - Data items must include a primary key (id)
     * @param {(Array<object>|object)} data - Array of data, or single data object
     * @param {(Array<string>|string)} groups - Array of group names or single group name
     */
    collect(items, groups, config = {}) {
        let _items = handy_1.normalizeArray(items);
        if (!groups)
            groups = 'default';
        groups = handy_1.normalizeArray(groups);
        // if any of the groups don't already exist, create them
        groups.forEach(groupName => !this.groups[groupName] && this.createGroup(groupName));
        _items.forEach((item, index) => {
            let key = this.saveData(item, config.patch);
            if (config.forEachItem)
                config.forEachItem(item, key, index);
            if (key === null)
                return;
            groups.forEach(groupName => {
                let group = this.groups[groupName];
                if (!group.nextState.includes(key))
                    group.nextState[config.method || 'push'](key);
            });
        });
        groups.forEach(groupName => this.instance().runtime.ingest(this.groups[groupName], this.groups[groupName].nextState));
    }
    /**
     * Return an item from this collection by primaryKey as Data instance (extends State)
     * @param {(number|string)} primaryKey - The primary key of the data
     */
    findById(id) {
        if (id instanceof state_1.default)
            id = id.value;
        if (!this.data.hasOwnProperty(id)) {
            return new data_1.default(() => this, undefined);
        }
        return this.data[id];
    }
    getValueById(id) {
        let data = this.findById(id).value;
        // @ts-ignore
        if (!data)
            data = {};
        return this.computedFunc ? this.computedFunc(data) : data;
    }
    /**
     * Return an group from this collection as Group instance (extends State)
     * @param {(number|string)} groupName - The name of your group
     */
    getGroup(groupName) {
        if (this.groups[groupName]) {
            return this.groups[groupName];
        }
        else {
            return new group_1.default(() => this, [], { name: 'dummy' }); // return empty group
        }
    }
    /**
     * Update data by id in a Pulse Collection
     * @param {(string|number|State)} updateKey - The primary key of the item to update
     * @param {Object} changes - This object will be deep merged with the original
     */
    update(updateKey, changes = {}, config = {}) {
        // if State instance passed as updateKey grab the value
        if (updateKey instanceof state_1.default)
            updateKey = updateKey.value;
        updateKey = updateKey;
        // if the primary key is changed, this will be true
        let updateDataKey = false, 
        // define alisas
        data = this.data[updateKey], primary = this.config.primaryKey;
        // if the data does not exist
        if (!this.data.hasOwnProperty(updateKey))
            return;
        // create a copy of the value for mutation
        const currentData = data.copy();
        // if the new object contains a primary key, it means we need to change the primary key
        // on the collection too, however we should defer this until after the new data is ingested into the runtime queue
        if (changes[primary])
            updateDataKey = true;
        // deep merge the new data with the existing data
        const final = config.deep ? deepmerge_1.deepmerge(currentData, changes) : utils_1.shallowmerge(currentData, changes);
        // assign the merged data to the next state of the State and ingest
        data.nextState = final;
        this.instance().runtime.ingest(data);
        // if the data key has changed move it internally and ammend groups
        if (updateDataKey)
            this.updateDataKey(currentData[primary], final[primary]);
        this.rebuildGroupsThatInclude(final[primary]);
        // return the Data instance
        return this.data[final[primary]];
    }
    compute(func) {
        this.computedFunc = func;
    }
    put(primaryKeys, groupNames, options) {
        primaryKeys = handy_1.normalizeArray(primaryKeys);
        groupNames = handy_1.normalizeArray(groupNames);
        groupNames.forEach(groupName => {
            if (!this.groups.hasOwnProperty(groupName))
                return;
            primaryKeys.forEach(key => {
                this.groups[groupName].add(key, options);
            });
        });
    }
    /**
     * this is an alias function that returns other functions for removing data from a collection
     */
    remove(primaryKeys) {
        primaryKeys = handy_1.normalizeArray(primaryKeys);
        return {
            fromGroups: (groups) => this.removeFromGroups(primaryKeys, groups),
            everywhere: () => this.deleteData(primaryKeys, Object.keys(this.groups))
        };
    }
    removeFromGroups(primaryKeys, groups) {
        primaryKeys = handy_1.normalizeArray(primaryKeys);
        groups = handy_1.normalizeArray(groups);
        groups.forEach(groupName => {
            primaryKeys.forEach(primaryKey => {
                if (!this.groups[groupName])
                    return;
                let group = this.getGroup(groupName);
                group.remove(primaryKey);
            });
        });
        return true;
    }
    deleteData(primaryKeys, groups) {
        primaryKeys = handy_1.normalizeArray(primaryKeys);
        groups = handy_1.normalizeArray(groups);
        primaryKeys.forEach(key => {
            delete this.data[key];
            groups.forEach(groupName => {
                this.groups[groupName].nextState = this.groups[groupName].nextState.filter(id => id !== key);
            });
        });
        groups.forEach(groupName => this.instance().runtime.ingest(this.groups[groupName], this.groups[groupName].nextState));
        return true;
    }
    // public findGroupsToUpdate(primaryKeysChanged: Array<PrimaryKey>) {
    //   let groupsToRegen
    //   for (let groupName in this.groups) {
    //   }
    // }
    updateDataKey(oldKey, newKey) {
        // create copy of data
        const dataCopy = this.data[oldKey];
        // delete old refrence
        delete this.data[oldKey];
        // apply the data in storage
        this.data[newKey] = dataCopy;
        // update groups
        for (let groupName in this.groups) {
            const group = this.getGroup(groupName);
            // if group does not contain oldKey, continue.
            if (!group._value.includes(oldKey))
                continue;
            // replace the primaryKey at current index
            group.nextState.splice(group.nextState.indexOf(oldKey), 1, newKey);
            // ingest the group
            this.instance().runtime.ingest(group);
        }
    }
    rebuildGroupsThatInclude(primarykey) {
        for (let groupName in this.groups) {
            const group = this.getGroup(groupName);
            if (group.has(primarykey))
                this.instance().runtime.ingest(group);
        }
    }
    reset() {
        this.data = {};
        this.size = 0;
        const groups = Object.keys(this.groups);
        groups.forEach(groupName => this.groups[groupName].reset());
    }
    /**
     * Persist
     * @param name The internal name of your collection - must be unique.
     */
    persist(name) {
        this.config.name = name;
        this.config.persistData = true;
        this.instance().collectionStorage.collections.push(this);
        this.instance().collectionStorage.getAll(this);
    }
}
exports.Collection = Collection;
exports.default = Collection;

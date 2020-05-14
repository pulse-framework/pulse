"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var __1 = __importDefault(require(".."));
var helpers_1 = require("../../helpers");
var Reactive_1 = __importDefault(require("../../Reactive"));
var dep_1 = __importDefault(require("../../dep"));
var runtime_1 = require("../../runtime");
var Collection = /** @class */ (function (_super) {
    __extends(Collection, _super);
    function Collection(name, global, root) {
        var _this = 
        // init module constructor
        _super.call(this, name, global, root) || this;
        _this.primaryKey = false;
        _this.internalData = {};
        _this.internaldataPropertiesUsingPopulate = [];
        _this.internalDataDeps = {}; // contains the deps for internal data
        _this.collectionSize = 0;
        //collection only preperation
        _this.initIndexes(root.groups);
        _this.initModel(root.model);
        return _this;
    }
    Collection.prototype.getDataDep = function (primaryKey) {
        return this.internalDataDeps[primaryKey] || false;
    };
    Collection.prototype.initIndexes = function (groups) {
        // FIXME: if you want indexes to be reactive Jamie, that empty array right there is your answer
        this.indexes = new Reactive_1["default"](this, helpers_1.normalizeGroups(groups), [], 'indexes');
        this.public.privateWrite('indexes', this.indexes.object);
        for (var _i = 0, _a = this.indexes.properties; _i < _a.length; _i++) {
            var indexName = _a[_i];
            // init empty group
            this.public.addProperty(indexName, []);
        }
    };
    Collection.prototype.initModel = function (model) {
        var _this = this;
        if (model === void 0) { model = {}; }
        this.model = model;
        Object.keys(model).forEach(function (property) {
            Object.keys(model[property]).forEach(function (config) {
                switch (config) {
                    case 'primaryKey':
                        _this.primaryKey = property;
                        break;
                    case 'populate':
                        _this.internaldataPropertiesUsingPopulate.push(property);
                        break;
                }
            });
        });
    };
    Collection.prototype.getData = function (id) {
        if (!this.internalData.hasOwnProperty(id))
            return false;
        return __assign({}, this.internalData[id]);
    };
    Collection.prototype.buildGroupFromIndex = function (groupName) {
        var _this = this;
        if (typeof groupName === 'number')
            groupName = groupName.toString();
        var constructedArray = [];
        // get index directly
        var index = this.indexes.privateGet(groupName);
        if (!index)
            return [];
        var getData = function (id) {
            // copy data from internal database
            var data = _this.getData(id);
            // if none found skip
            if (!data)
                return false;
            // inject dynamic data
            return _this.injectDynamicRelatedData(id, data);
        };
        // for every primaryKey in the index
        for (var i = 0; i < index.length; i++) {
            var data = getData(index[i]);
            if (!data)
                continue;
            constructedArray.push(data);
        }
        // inject ghosts
        if (this.indexes.ghosts[groupName]) {
            var ghosts = this.indexes.ghosts[groupName];
            for (var i = 0; i < ghosts.length; i++) {
                var _a = ghosts[i], index_1 = _a.index, primaryKey = _a.primaryKey;
                var data = getData(primaryKey);
                if (!data)
                    continue;
                data.isGhost = true;
                constructedArray.splice(index_1, 0, data);
            }
        }
        return constructedArray;
    };
    // rebuilding an entire group is expensive on resources, but is
    // not nessisary if only one piece of data has changed
    // this function will replace a single piece of data without rebuilding
    // the entire group
    Collection.prototype.softUpdateGroupData = function (primaryKey, groupName) {
        var index = this.indexes.privateGet(groupName);
        // find the data's position within index
        var position = index.indexOf(primaryKey);
        // if group is dynamic, just build the group from index.
        if (!this.public[groupName])
            return this.buildGroupFromIndex(groupName);
        // copy the current group output
        var currentGroup = [this.public[groupName]];
        // get data for primaryKey
        var data = __assign({}, this.internalData[primaryKey]);
        data = this.injectDynamicRelatedData(primaryKey, data);
        // replace at known position with updated data
        currentGroup[position] = data;
        return currentGroup;
    };
    // This should be called on every piece of data retrieved when building a group from an index
    Collection.prototype.injectDynamicRelatedData = function (primaryKey, data) {
        var _this = this;
        // for each populate function extracted from the model for this data
        this.internaldataPropertiesUsingPopulate.forEach(function (property) {
            // conditions to skip populate
            var dep = _this.getDataDep(primaryKey);
            var job = _this.global.runtime.runningJob;
            if (!dep || (job && job.config && job.config.important))
                return;
            // get the current action index in runtime action stack
            // this is used to stop properties from getting tracked as dependencies in nested actions
            dep.currentActionIndex = _this.global.runtime.runningActions.length;
            _this.global.runningPopulate = dep;
            // since we're re-populating this dynamic data, the current dynamicRelation is invalid, so we must ensure it, and all refrences to it are destoryed.
            // fyi: this is also done on Computed run
            if (dep.dynamicRelation)
                _this.global.relations.cleanup(dep.dynamicRelation);
            // run populate function passing in the context and the data
            var populated = _this.model[property].populate(_this.global.contextRef, data);
            dep.currentActionIndex = false;
            _this.global.runningPopulate = false;
            // inject result to data
            data[property] = populated;
        });
        return data;
    };
    Collection.prototype.createGroups = function (group) {
        if (group === undefined)
            group = [];
        else if (!Array.isArray(group))
            group = [group];
        for (var i = 0; i < group.length; i++) {
            var groupName = group[i];
            // if a group already exists
            // if (
            //   this.public.exists(groupName) &&
            //   this.indexes &&
            //   this.indexes.exists(groupName)
            // ) {
            //   console.error(
            //     `Failed to create group. Group name "${groupName}" already exists on collection ${
            //       this.name
            //     }.`
            //   );
            // }
            if (!this.indexes.exists(groupName)) {
                this.indexes.addProperty(groupName, []);
                // this.indexes.privateWrite(groupName, []);
            }
        }
        return group;
    };
    Collection.prototype.getPreviousIndexValues = function (groups) {
        var returnData = {};
        for (var i = 0; i < groups; i++) {
            var groupName = groups[i];
            returnData[groupName] = this.indexes.privateGet(groupName);
        }
        return returnData;
    };
    Collection.prototype.findPrimaryKey = function (dataItem) {
        if (dataItem.hasOwnProperty('id'))
            this.primaryKey = 'id';
        else if (dataItem.hasOwnProperty('_id'))
            this.primaryKey = '_id';
        else if (dataItem.hasOwnProperty('key'))
            this.primaryKey = 'key';
        if (this.primaryKey)
            return true;
        else
            return helpers_1.assert(function (warn) { return warn.NO_PRIMARY_KEY; });
    };
    // if a computed function evaluates and creates a relation to internal data
    // that does not exist yet, we create the dep class and save it in advance
    // so that if the data ever arrives, it will reactively dependent update accordingly
    Collection.prototype.depForInternalData = function (primaryKey) {
        var dep;
        if (!this.internalDataDeps[primaryKey]) {
            dep = new dep_1["default"](this.global, 'internal', this, primaryKey);
            this.internalDataDeps[primaryKey] = dep;
        }
        else {
            dep = this.internalDataDeps[primaryKey];
        }
        return dep;
    };
    Collection.prototype.replaceIndex = function (indexName, newIndex) {
        if (!Array.isArray(newIndex) || typeof indexName !== 'string')
            return helpers_1.assert(function (warn) { return warn.INVALID_PARAMETER; }, 'replaceIndex');
        this.global.ingest({
            type: runtime_1.JobType.INDEX_UPDATE,
            collection: this,
            property: indexName,
            value: newIndex
        });
    };
    Collection.prototype.collectByKeys = function (data, group, config) {
        if (!config)
            config = {};
        config.byKeys = true;
        this.collect(data, group, config);
    };
    // METHODS
    Collection.prototype.collect = function (data, group, config) {
        var _this = this;
        config = helpers_1.defineConfig(config, {
            append: true,
            byKeys: false
        });
        var keys, length;
        this.global.collecting = true;
        if (config.byKeys) {
            keys = Object.keys(data);
            length = keys.length;
        }
        else if (!Array.isArray(data)) {
            data = [data];
            length = 1;
        }
        else {
            length = data.length;
        }
        // if groups don't already exist, create them dynamically
        var groups = this.createGroups(group);
        // groups now contains just the groups directly modified by this collect
        // preserve index previous values
        var previousIndexValues = this.getPreviousIndexValues(groups);
        var indexesToRegenOnceComplete = new Set();
        // process data items
        for (var i = 0; i < length; i++) {
            var primaryKey = void 0;
            if (config.byKeys)
                primaryKey = keys[i];
            var dataItem = config.byKeys ? data[primaryKey] : data[i];
            if (dataItem === null)
                continue;
            // process data item returns "success" as a boolean and affectedIndexes as an array
            var processDataItem = this.processDataItem(dataItem, groups, config, primaryKey);
            if (!processDataItem)
                continue;
            if (processDataItem.success)
                this.collectionSize++;
            // ensure indexes modified by this data item are waiting to be ingested for regen
            processDataItem.affectedIndexes.forEach(function (index) {
                return indexesToRegenOnceComplete.add(index);
            });
        }
        indexesToRegenOnceComplete.forEach(function (indexName) {
            _this.global.ingest({
                type: runtime_1.JobType.INDEX_UPDATE,
                collection: _this,
                property: indexName,
                value: _this.indexes.privateGet(indexName),
                previousValue: previousIndexValues[indexName]
            });
        });
        this.global.collecting = false;
    };
    Collection.prototype.processDataItem = function (dataItem, groups, config, primaryKey) {
        if (groups === void 0) { groups = []; }
        var key;
        dataItem = __assign({}, dataItem);
        if (config.byKeys)
            key = primaryKey;
        else {
            if (!this.primaryKey)
                this.findPrimaryKey(dataItem);
            if (!this.primaryKey)
                return false;
            key = dataItem[this.primaryKey];
        }
        // find affected indexes
        var affectedIndexes = __spreadArrays(groups);
        // searchIndexesForPrimaryKey returns an array of indexes that include that primaryKey
        // for each index found, if it is not already known, add to affected indexes
        this.searchIndexesForPrimaryKey(key).map(function (index) { return !affectedIndexes.includes(index) && affectedIndexes.push(index); });
        // validate against model
        // create the dep class
        if (!this.internalDataDeps[key])
            this.internalDataDeps[key] = new dep_1["default"](this.global, 'internal', this, key);
        // ingest the data
        this.global.ingest({
            type: runtime_1.JobType.INTERNAL_DATA_MUTATION,
            collection: this,
            property: key,
            value: dataItem
        });
        // add the data to group indexes
        for (var i = 0; i < groups.length; i++) {
            var groupName = groups[i];
            var index = this.indexes.privateGet(groupName);
            // remove key if already present in index
            index = index.filter(function (k) { return k !== key; });
            if (config.append)
                index.push(key);
            else
                index.unshift(key);
            // write index
            this.indexes.privateWrite(groupName, index);
        }
        return { success: true, affectedIndexes: affectedIndexes };
    };
    Collection.prototype.searchIndexesForPrimaryKey = function (primaryKey) {
        // get a fresh copy of the keys to include dynamic indexes
        var keys = this.indexes.getKeys();
        var foundIndexes = [];
        // for every index
        for (var i = 0; i < keys.length; i++) {
            var indexName = keys[i];
            // if the index includes the primaryKey
            if (this.indexes.privateGet(indexName).includes(primaryKey))
                foundIndexes.push(indexName);
        }
        return foundIndexes;
    };
    // return a piece of intenral data from the collection
    // can create dynamic relationships when used in certain circumstances
    Collection.prototype.findById = function (id) {
        var internalDep = this.depForInternalData(id);
        // if used in computed function, create a dynamic relation
        if (this.global.runningComputed) {
            var computed = this.global.runningComputed;
            this.global.relations.relate(computed, internalDep);
        }
        // if used in populate() function, create a dynamic relation
        if (this.global.runningPopulate) {
            var populate = this.global.runningPopulate;
            this.global.relations.relate(populate, internalDep);
        }
        var data = this.getData(id);
        if (!data)
            return false;
        data = this.injectDynamicRelatedData(id, data);
        return data;
    };
    // return a group of data from a collection
    // can create dynamic relationships when used in certain circumstances
    Collection.prototype.getGroup = function (property) {
        // get index dep for dynamic groups
        var groupDep = this.getDep(property, this.indexes.object);
        // if group doesn't exist yet, create a temp dep for when it eventually is created
        if (!groupDep)
            groupDep = this.indexes.tempDep(property);
        // if used in computed function, create a dynamic relation
        if (this.global.runningComputed) {
            var computed = this.global.runningComputed;
            this.global.relations.relate(computed, groupDep);
        }
        // if used in populate() function, create a dynamic relation
        if (this.global.runningPopulate) {
            var dataDep = this.global.runningPopulate;
            this.global.relations.relate(dataDep, groupDep);
        }
        // get group is not cached, so generate a fresh group from the index
        return this.buildGroupFromIndex(property) || [];
    };
    // FIXME: action functions
    Collection.prototype.undo = function (action) {
        var _this = this;
        // runtime stores changes in action
        action.changes.forEach(function (job) {
            if (job.hasOwnProperty('previousValue')) {
                var currentValue = job.value;
                job.value = job.previousValue;
                job.previousValue = currentValue;
                _this.global.ingest(job);
            }
        });
    };
    // group functions
    Collection.prototype.move = function (ids, sourceIndexName, destIndexName, config) {
        config = helpers_1.defineConfig(config, {
            method: 'push',
            ghost: false
        });
        // validation
        if (!this.indexes.exists(sourceIndexName))
            return helpers_1.assert(function (warn) { return warn.INDEX_NOT_FOUND; }, 'move');
        if (destIndexName && !this.indexes.exists(destIndexName))
            return helpers_1.assert(function (warn) { return warn.INDEX_NOT_FOUND; }, 'move');
        if (!Array.isArray(ids))
            ids = [ids];
        var sourceIndex = this.indexes.privateGet(sourceIndexName);
        var _loop_1 = function (i) {
            // preserve ghost index
            if (config.ghost)
                this_1.haunt(sourceIndexName, sourceIndex, ids[i]);
            // remove the id from index
            sourceIndex = sourceIndex.filter(function (id) { return id !== ids[i]; });
        };
        var this_1 = this;
        for (var i = 0; i < ids.length; i++) {
            _loop_1(i);
        }
        this.global.ingest({
            type: runtime_1.JobType.INDEX_UPDATE,
            collection: this,
            property: sourceIndexName,
            value: sourceIndex
        });
        if (destIndexName) {
            var destIndex = this.indexes.privateGet(destIndexName);
            for (var i = 0; i < ids.length; i++) {
                // destIndex = destIndex.filter(k => k != ids[i]);
                if (destIndex.includes(ids[i]))
                    continue;
                // push or unshift id into current index
                destIndex[config.method](ids[i]);
            }
            this.global.ingest({
                type: runtime_1.JobType.INDEX_UPDATE,
                collection: this,
                property: destIndexName,
                value: destIndex
            });
        }
    };
    Collection.prototype.put = function (ids, destIndexName, config) {
        config = helpers_1.defineConfig(config, {
            method: 'push'
        });
        // validation
        if (!this.indexes.exists(destIndexName))
            return helpers_1.assert(function (warn) { return warn.INDEX_NOT_FOUND; }, 'put');
        if (!Array.isArray(ids))
            ids = [ids];
        // get current index
        var destIndex = this.indexes.privateGet(destIndexName);
        // loop over every id user is trying to add into current index
        for (var i = 0; i < ids.length; i++) {
            // destIndex = destIndex.filter(k => k != ids[i]);
            if (destIndex.includes(ids[i]))
                continue;
            // push or unshift id into current index
            destIndex[config.method](ids[i]);
        }
        this.global.ingest({
            type: runtime_1.JobType.INDEX_UPDATE,
            collection: this,
            property: destIndexName,
            value: destIndex
        });
    };
    Collection.prototype.newGroup = function (groupName, indexValue) {
        if (this.indexes.object.hasOwnProperty(groupName))
            return helpers_1.assert(function (warn) { return warn.GROUP_ALREADY_EXISTS; }, 'newGroup');
        this.global.ingest({
            type: runtime_1.JobType.INDEX_UPDATE,
            collection: this,
            property: groupName,
            value: indexValue
        });
    };
    Collection.prototype.deleteGroup = function (groupName) {
        this.global.ingest({
            type: runtime_1.JobType.INDEX_UPDATE,
            collection: this,
            property: groupName,
            value: []
        });
    };
    Collection.prototype.removeFromGroup = function (groupName, keysToRemove, config) {
        var _this = this;
        config = helpers_1.defineConfig(config, {
            method: 'push',
            ghost: false
        });
        if (!this.indexes.exists(groupName))
            return helpers_1.assert(function (warn) { return warn.INDEX_NOT_FOUND; }, 'removeFromGroup');
        if (!Array.isArray(keysToRemove))
            keysToRemove = [keysToRemove];
        var index = this.indexes.privateGet(groupName);
        if (config.ghost)
            keysToRemove.forEach(function (key) { return _this.haunt(groupName, index, key); });
        var newIndex = index.filter(function (id) { return !keysToRemove.includes(id); });
        this.global.ingest({
            type: runtime_1.JobType.INDEX_UPDATE,
            collection: this,
            property: groupName,
            value: newIndex
        });
    };
    // internal data functions
    Collection.prototype.update = function (primaryKey, newObject, options) {
        if (newObject === void 0) { newObject = {}; }
        options = helpers_1.defineConfig(options, {
            important: false
        });
        // if the primary key has changed, we should update it internally for this data
        var updateDataKey = false;
        if (!this.internalData.hasOwnProperty(primaryKey))
            return helpers_1.assert(function (warn) { return warn.INTERNAL_DATA_NOT_FOUND; }, 'update');
        var newObjectKeys = Object.keys(newObject);
        var currentData = Object.assign({}, this.internalData[primaryKey]);
        // if newObject contains the primaryKey property, set updateDataKey to true
        for (var i = 0; i < newObjectKeys.length; i++) {
            var key = newObjectKeys[i];
            if (key === this.primaryKey)
                updateDataKey = true;
            currentData[key] = newObject[key];
        }
        var newKey = currentData[this.primaryKey];
        // ingest data mutation and update at new key location
        this.global.ingest({
            type: runtime_1.JobType.INTERNAL_DATA_MUTATION,
            collection: this,
            property: primaryKey,
            value: currentData,
            config: options
        });
        //update key and remove from indexes first
        if (updateDataKey)
            this.updateDataKey(primaryKey, newKey);
    };
    Collection.prototype.updateDataKey = function (oldKey, newKey) {
        var _this = this;
        // create copy of data & data dep
        var dataCopy = __assign({}, this.internalData[oldKey]), depCopy = __assign({}, this.internalDataDeps[oldKey]);
        // delete old refrences
        delete this.internalData[oldKey];
        delete this.internalDataDeps[oldKey];
        // apply the data and dependency in storage
        this.internalData[newKey] = dataCopy;
        this.internalDataDeps[newKey] = depCopy;
        // replace old key with new key as same position for all indexes it exists in
        var keys = this.indexes.getKeys();
        keys.forEach(function (indexName) {
            // get the index
            var index = _this.indexes.privateGet(indexName);
            if (!index)
                return;
            // only if the index includes the oldKey
            if (index.includes(oldKey)) {
                index = __spreadArrays(index); // create a copy
                index.splice(index.indexOf(oldKey), 1, newKey); // replace at index
                _this.global.ingest({
                    type: runtime_1.JobType.INDEX_UPDATE,
                    collection: _this,
                    property: indexName,
                    value: index
                });
            }
        });
    };
    Collection.prototype.increment = function (primaryKey, property, amount, decrement) {
        if (!this.internalData.hasOwnProperty(primaryKey))
            return helpers_1.assert(function (warn) { return warn.INTERNAL_DATA_NOT_FOUND; }, decrement ? 'decrement' : 'increment');
        var currentData = Object.assign({}, this.internalData[primaryKey]);
        if (!helpers_1.validateNumber(amount, currentData[property]))
            return helpers_1.assert(function (warn) { return warn.PROPERTY_NOT_A_NUMBER; }, decrement ? 'decrement' : 'increment');
        if (decrement)
            currentData[property] -= amount;
        else
            currentData[property] += amount;
        this.global.ingest({
            type: runtime_1.JobType.INTERNAL_DATA_MUTATION,
            collection: this,
            property: primaryKey,
            value: currentData
        });
    };
    Collection.prototype.decrement = function (primaryKey, property, amount) {
        this.increment(primaryKey, property, amount, true);
    };
    Collection.prototype["delete"] = function (primaryKeys) {
        if (!Array.isArray(primaryKeys))
            primaryKeys = [primaryKeys];
        for (var i = 0; i < primaryKeys.length; i++) {
            var primaryKey = primaryKeys[i];
            this.global.ingest({
                type: runtime_1.JobType.DELETE_INTERNAL_DATA,
                collection: this,
                property: primaryKey
            });
        }
    };
    // TODO: make cleanup unsubscribe func, possible memory leak, you'll need to track the component
    Collection.prototype.watchData = function (primaryKey, callback) {
        var dep = this.internalDataDeps[primaryKey];
        if (!dep)
            return;
        dep.subscribersToInternalDataAsCallbacks.push(callback);
    };
    // rebuild issues a group regeneration for an index, and destorys all ghosts. It is effectivly the 5th ghost buster.
    Collection.prototype.rebuild = function (indexName) {
        if (!this.indexes.exists(indexName))
            return;
        delete this.indexes.ghosts[indexName];
        this.global.ingest({
            type: runtime_1.JobType.GROUP_UPDATE,
            collection: this,
            property: indexName
        });
    };
    Collection.prototype.haunt = function (sourceIndexName, sourceIndex, id) {
        if (!this.indexes.ghosts[sourceIndexName])
            this.indexes.ghosts[sourceIndexName] = [];
        var removedIndex = sourceIndex.indexOf(id);
        this.indexes.ghosts[sourceIndexName].push({
            index: removedIndex,
            primaryKey: id
        });
    };
    Collection.prototype.cleanse = function () {
        var _this = this;
        // loop over ghosts to get index names
        var groupsToRegen = Object.keys(this.indexes.ghosts);
        this.indexes.ghosts = {};
        groupsToRegen.forEach(function (groupName) {
            _this.global.runtime.ingest({
                type: runtime_1.JobType.GROUP_UPDATE,
                collection: _this,
                property: groupName
            });
        });
    };
    // remove all dynamic indexes, empty all indexes, delete all internal data
    Collection.prototype.purge = function () { };
    // deprecate
    // added removeFromGroup to be more specific, params got switched around, keeping this for backwards compatibility
    Collection.prototype.remove = function (itemsToRemove, groupName) {
        return this.removeFromGroup(groupName, itemsToRemove);
    };
    return Collection;
}(__1["default"]));
exports["default"] = Collection;
//# sourceMappingURL=collection.js.map
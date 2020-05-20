"use strict";
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
var Dep_1 = __importDefault(require("./Dep"));
var computed_1 = __importDefault(require("./computed"));
var relationController_1 = require("./relationController");
var main_1 = __importDefault(require("./main"));
var JobType;
(function (JobType) {
    JobType["PUBLIC_DATA_MUTATION"] = "PUBLIC_DATA_MUTATION";
    JobType["INTERNAL_DATA_MUTATION"] = "INTERNAL_DATA_MUTATION";
    JobType["INDEX_UPDATE"] = "INDEX_UPDATE";
    JobType["COMPUTED_REGEN"] = "COMPUTED_REGEN";
    JobType["GROUP_UPDATE"] = "GROUP_UPDATE";
    JobType["SOFT_GROUP_UPDATE"] = "SOFT_GROUP_UPDATE";
    JobType["DELETE_INTERNAL_DATA"] = "DELETE_INTERNAL_DATA";
})(JobType = exports.JobType || (exports.JobType = {}));
var Runtime = /** @class */ (function () {
    function Runtime(collections, global) {
        this.collections = collections;
        this.global = global;
        this.updatingSubscribers = false;
        this.runningJob = false;
        this.ingestQueue = [];
        this.completedJobs = [];
        this.archivedJobs = [];
        // global action state
        this.runningActions = [];
        this.runningAction = false;
        global.ingest = this.ingest.bind(this);
        global.ingestDependents = this.ingestDependents.bind(this);
        this.config = global.config;
    }
    // The primary entry point for Runtime, all jobs should come through here
    Runtime.prototype.ingest = function (job) {
        // if last job is identical to current job
        // since completed jobs is cleared after a component update is issued this SHOULDN't prevent
        // the same thing happening twice (pls test tho)
        // if (
        //   this.runningJob &&
        //   job.property === (this.runningJob as Job).property &&
        //   job.collection === (this.runningJob as Job).collection
        // ) {
        //   // console.error('Pulse: Infinate job loop prevented', job);
        //   // return;
        // }
        this.ingestQueue.push(job);
        // don't begin the next job until this one is fully complete
        if (!this.runningJob) {
            this.findNextJob();
        }
    };
    Runtime.prototype.queue = function (job) {
        this.ingestQueue.push(job);
    };
    Runtime.prototype.run = function () {
        if (!this.runningJob)
            this.findNextJob();
    };
    Runtime.prototype.findNextJob = function () {
        // shift the next job from the queue
        var next = this.ingestQueue.shift();
        if (!next)
            return;
        var collection = next.collection, prop = next.property;
        // locate dep for job
        switch (next.type) {
            case JobType.INTERNAL_DATA_MUTATION:
                // get from internal dep store
                next.dep = collection.internalDataDeps[prop];
                break;
            case JobType.INDEX_UPDATE:
                // get from by touching reactive property in indexes
                next.dep = collection.getDep(prop, collection.indexes.object);
                break;
            case JobType.GROUP_UPDATE:
                if (collection.public.exists(prop)) {
                    // pre-defined group
                    next.dep = collection.getDep(prop);
                }
                else {
                    // dynamic groups use index's dep
                    next.dep = collection.getDep(prop, collection.indexes.object);
                }
                break;
            case JobType.COMPUTED_REGEN:
                next.dep = next.collection.getDep(next.property.name);
                break;
            default:
                next.dep = next.collection.getDep(prop);
                break;
        }
        this.runningJob = next;
        // execute the next task in the queue
        this.performJob(next);
    };
    Runtime.prototype.loadPreviousValue = function (job) {
        var location;
        if (job.type === JobType.INDEX_UPDATE)
            location = 'indexes';
        else if (job.type === JobType.COMPUTED_REGEN ||
            job.type === JobType.SOFT_GROUP_UPDATE)
            location = 'public';
        return job.collection[location].privateGet(job.property);
    };
    Runtime.prototype.performJob = function (job) {
        var pre = job.hasOwnProperty(job.previousValue);
        this.global.log(job);
        switch (job.type) {
            case JobType.PUBLIC_DATA_MUTATION:
                this.performPublicDataUpdate(job);
                job.collection.runWatchers(job.property);
                break;
            case JobType.INTERNAL_DATA_MUTATION:
                this.performInternalDataUpdate(job);
                break;
            case JobType.INDEX_UPDATE:
                // if (!pre) job.previousValue = this.loadPreviousValue(job);
                this.performIndexUpdate(job);
                break;
            case JobType.COMPUTED_REGEN:
                // if (!pre) job.previousValue = this.loadPreviousValue(job);
                this.performComputedOutput(job);
                job.collection.runWatchers(job.property.name);
                break;
            case JobType.GROUP_UPDATE:
                this.performGroupRebuild(job);
                job.collection.runWatchers(job.property);
                break;
            case JobType.SOFT_GROUP_UPDATE:
                // if (!pre) job.previousValue = this.loadPreviousValue(job);
                this.performGroupRebuild(job);
                job.collection.runWatchers(job.property);
                break;
            case JobType.DELETE_INTERNAL_DATA:
                this.performInternalDataDeletion(job);
                break;
            default:
                break;
        }
        // unpack dependents
        if (job.dep && job.dep.dependents.size > 0) {
            this.ingestDependents(job.dep.dependents);
        }
        this.finished();
    };
    Runtime.prototype.ingestDependents = function (dependents) {
        var _this = this;
        // this is called twice below
        var ingestComputed = function (computed) {
            return _this.ingest({
                type: JobType.COMPUTED_REGEN,
                collection: computed.parentModuleInstance,
                property: computed
            });
        };
        // for each dependent stored in dep class
        dependents.forEach(function (dependent) {
            // there are two types of dependents stored: Computed and DynamicRelation
            if (dependent instanceof computed_1["default"])
                ingestComputed(dependent);
            else if (dependent instanceof relationController_1.DynamicRelation) {
                // one might think using "instanceOf" would work as expected below
                // but it doesn't, alas I hate javascript.
                // temp fix: constructor.name - be my guest try and fix this??
                var type = dependent.updateThis.constructor.name;
                // DynamicRelation can store either Computed or Dep (internal)
                if (type === computed_1["default"].name)
                    ingestComputed(dependent.updateThis);
                else if (type === Dep_1["default"].name) {
                    // ingest internal data mutation without a value will result in a soft group update
                    _this.ingest({
                        type: JobType.INTERNAL_DATA_MUTATION,
                        collection: dependent.updateThis.parentModuleInstance,
                        property: dependent.updateThis.propertyName
                    });
                }
            }
        });
    };
    // ****************** Perform Functions ****************** //
    Runtime.prototype.performPublicDataUpdate = function (job) {
        job.collection.public.privateWrite(job.property, job.value);
        this.completedJob(job);
    };
    Runtime.prototype.performInternalDataUpdate = function (job) {
        var _this = this;
        // if job was not ingested with a value, get the most recent value from collection database
        var collection = job.collection;
        var property = job.property;
        if (!job.value) {
            if (collection.internalData[property])
                job.value = collection.internalData[property];
            // this would usually be redundant, since the data has not changed, but since the relationController has no access to the collections, but does need to trigger data to rebuild, it issues an internal data "update". It's own data has not changed, but the dynamic data related to it via populate() has.
        }
        // overwrite or insert the data into collection database
        this.overwriteInternalData(collection, job.property, job.value);
        // collection function handels ingesting indexes to update itself, since it waits until
        // all internal data has been ingested before handling the affected indexes
        // however for direct data modifications we should update afected indexes
        if (!this.global.collecting) {
            // affected indexes is an array of indexes that have this primary key (job.property) present.
            var affectedIndexes = collection.searchIndexesForPrimaryKey(property);
            affectedIndexes.forEach(function (index) {
                // since this is a singular piece of data that has changed, we do not need to
                // rebuild the entire group, so we can soft rebuild
                if (job.collection.public.exists(property)) {
                    var modifiedGroup = collection.softUpdateGroupData(property, index);
                    _this.ingest({
                        type: JobType.SOFT_GROUP_UPDATE,
                        collection: collection,
                        value: modifiedGroup,
                        property: index
                        // we do not need a previousValue because groups are cached outputs and reversing the internal data update will do the trick
                    });
                }
            });
        }
        this.completedJob(job);
    };
    Runtime.prototype.performInternalDataDeletion = function (job) {
        var c = job.collection;
        var property = job.property;
        // preserve previous value
        // job.previousValue = { ...c.internalData[job.property] };
        // delete data
        delete c.internalData[property];
        // find indexes affected by this data deletion
        var indexesToUpdate = c.searchIndexesForPrimaryKey(property);
        // for each found index, perform index update
        for (var i = 0; i < indexesToUpdate.length; i++) {
            var indexName = indexesToUpdate[i];
            var newIndex = __spreadArrays(c.indexes.object[indexName]).filter(function (id) { return id !== job.property; });
            this.ingest({
                type: JobType.INDEX_UPDATE,
                collection: c,
                property: indexName,
                value: newIndex
            });
        }
        this.completedJob(job);
    };
    Runtime.prototype.performIndexUpdate = function (job) {
        // Update Index
        var c = job.collection;
        c.indexes.privateWrite(job.property, job.value);
        this.completedJob(job);
        // Group must also be updated, but not dynamic groups
        if (job.collection.public.exists(job.property))
            this.ingest({
                type: JobType.GROUP_UPDATE,
                collection: job.collection,
                property: job.property
            });
    };
    Runtime.prototype.performGroupRebuild = function (job) {
        var c = job.collection;
        var property = job.property;
        // soft group rebuilds already have a generated value, otherwise generate the value
        if (!job.value) {
            job.value = c.buildGroupFromIndex(property);
        }
        // TODO: trigger relaction controller to update group relations
        // this.global.relations.groupModified(job.collection, job.property);
        job.collection.public.privateWrite(job.property, job.value);
        this.completedJob(job);
    };
    Runtime.prototype.performComputedOutput = function (job) {
        var computed = typeof job.property === 'string'
            ? job.collection.computed[job.property]
            : job.property;
        job.value = computed.run();
        // Commit Update
        job.collection.public.privateWrite(computed.name, job.value);
        this.completedJob(job);
    };
    // ****************** Handlers ****************** //
    Runtime.prototype.completedJob = function (job) {
        // if action is running, save that action instance inside job payload
        job.fromAction = this.runningAction;
        // during runtime log completed job ready for component updates
        if (this.global.initComplete)
            this.completedJobs.push(job);
        // if data is persistable ensure storage is updated with new data
        this.persistData(job);
        // tell the dep the parent changed
        if (job.dep)
            job.dep.changed(job.value, job.config);
        // if running action save this job inside the action class
        if (this.runningAction)
            this.runningAction.changes.add(job);
    };
    Runtime.prototype.finished = function () {
        var _this = this;
        this.runningJob = false;
        // If there's already more stuff in the queue, loop.
        if (this.ingestQueue.length > 0) {
            this.findNextJob();
            return;
        }
        // Wait until callstack is empty to check if we should finalise this body of work
        setTimeout(function () {
            if (_this.ingestQueue.length === 0) {
                _this.compileComponentUpdates();
            }
            else {
                _this.findNextJob();
            }
        });
    };
    // ****************** End Runtime Events ****************** //
    Runtime.prototype.compileComponentUpdates = function () {
        if (!this.global.initComplete)
            return;
        this.updatingSubscribers = true;
        this.global.log('JOBS COMPLETE', this.completedJobs);
        var componentsToUpdate = {};
        var _loop_1 = function (i) {
            var job = this_1.completedJobs[i];
            // if job has a Dep class present
            // Dep class contains subscribers to that property (as a completed job)
            if (job.dep) {
                var subscribers = job.dep.subscribers;
                // for all the subscribers
                subscribers.forEach(function (cC) {
                    // add to componentsToUpdate (ensuring update & component is unique)
                    var uuid = cC.uuid;
                    // if component container has mappable data
                    if (typeof cC.evaluated === 'object' &&
                        !Array.isArray(cC.evaluated)) {
                        // will cause blind re-render
                        var localKeys = Object.keys(cC.evaluated);
                        localKeys.forEach(function (localKey) {
                            if (cC.mappedDeps[localKey] === job.dep) {
                                if (!componentsToUpdate[uuid]) {
                                    // if this component isn't already registered for this particular update, add it.
                                    componentsToUpdate[uuid] = {};
                                    componentsToUpdate[uuid][localKey] = job.value;
                                    // otherwise add the update to the component
                                }
                                else {
                                    componentsToUpdate[uuid][localKey] = job.value;
                                }
                            }
                        });
                    }
                    else {
                        if (!componentsToUpdate[uuid])
                            componentsToUpdate[uuid] = false;
                    }
                });
            }
        };
        var this_1 = this;
        // for all completed jobs
        for (var i = 0; i < this.completedJobs.length; i++) {
            _loop_1(i);
        }
        this.updateSubscribers(componentsToUpdate);
        this.completedJobs = [];
    };
    Runtime.prototype.updateSubscribers = function (componentsToUpdate) {
        var componentKeys = Object.keys(componentsToUpdate);
        // for each component
        for (var i = 0; i < componentKeys.length; i++) {
            var componentID = componentKeys[i];
            // get component container
            var cC = this.global.subs.componentStore[componentID];
            if (!cC || !cC.instance)
                return;
            var propertiesToUpdate = componentsToUpdate[componentID];
            if (main_1["default"].intergration)
                main_1["default"].intergration.updateMethod(cC.instance, propertiesToUpdate);
        }
    };
    // TODO: add moduleType to module class and store persist keys with that in mind, since persisting data won't work for modules with the same name, although devs should not be creating modules with the same name, i don't even think thats possible
    Runtime.prototype.persistData = function (job) {
        if (job.type === JobType.INTERNAL_DATA_MUTATION)
            return;
        if (job.collection.persist.includes(job.property)) {
            this.global.storage.set(job.collection.name, job.property, job.value);
        }
    };
    // ****************** Misc Handlers ****************** //
    Runtime.prototype.overwriteInternalData = function (collection, primaryKey, newData) {
        var internalData = collection.internalData;
        // create a copy of the original data
        var currentData = internalData[primaryKey]
            ? __assign({}, internalData[primaryKey]) : false;
        if (currentData) {
            // data already exists, merge objects and return previous object
            var keys = Object.keys(newData || {});
            for (var i = 0; i < keys.length; i++) {
                var property = keys[i];
                internalData[primaryKey][property] = newData[property];
            }
            return currentData;
        }
        else {
            // data does not exist, write and return false
            internalData[primaryKey] = newData;
            return false;
        }
    };
    return Runtime;
}());
exports["default"] = Runtime;
//# sourceMappingURL=runtime.js.map
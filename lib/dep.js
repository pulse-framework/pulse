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
exports.__esModule = true;
var runtime_1 = require("./runtime");
var Dep = /** @class */ (function () {
    function Dep(global, 
    // if this dep is for public or internal data within a collection
    type, 
    // the name of the coll
    parentModuleInstance, 
    // either the name of the object if reactive or the primaryKey if internal
    propertyName, 
    // if the dep is part of a deep reactive object, this is the root property name
    rootProperty) {
        if (type === void 0) { type = 'reactive'; }
        if (rootProperty === void 0) { rootProperty = null; }
        this.global = global;
        this.type = type;
        this.parentModuleInstance = parentModuleInstance;
        this.propertyName = propertyName;
        this.rootProperty = rootProperty;
        // these
        this.dependents = new Set();
        this.subscribers = new Set();
        // these are temporary relations created by the relation controller
        this.dynamicRelation = null;
        // used to stop computed methods from tracking properties accessed within nested actions as dependecies
        this.currentActionIndex = false;
        this.subscribersToInternalDataAsCallbacks = [];
    }
    // for when public data is accessed, reactive class will trigger this function
    Dep.prototype.register = function () {
        var subs = this.global.subs;
        var name = this.propertyName;
        if (this.type === 'reactive') {
            if (this.global.runningComputed && !this.global.runningWatcher) {
                // register dependent
                this.dependents.add(this.global.runningComputed);
                // if this property is a computed function that has not ran at least once
                if (this.parentModuleInstance.keys.computed.includes(this
                    .propertyName) &&
                    !this.parentModuleInstance.isComputedReady(this
                        .propertyName)) {
                    // re-queue the computed function that is currently running
                    // (not the one that is being accessed) this will give the unready computed
                    // function a chance to run before this one is ran again, since runningComputed depends on the
                    // output of this computed function
                    // console.log('reingesting');
                    this.global.runtime.ingest({
                        type: runtime_1.JobType.COMPUTED_REGEN,
                        property: this.global.runningComputed,
                        collection: this.parentModuleInstance
                    });
                }
            }
        }
        else if (this.type === 'internal') {
        }
        var dataDep = this.global.runningPopulate;
        // if the data's dep class
        // action index matches the current action, create dynamic relation
        if (dataDep &&
            dataDep.currentActionIndex === this.global.runtime.runningActions.length)
            this.global.relations.relate(dataDep, this);
        if (this.global.subs.trackingComponent)
            this.subscribe(this.global.subs.trackingComponent);
        // idk how i plan to use this...
        if (subs.unsubscribingComponent) {
            // this.subscribers.delete(this.global.subscribingComponent);
        }
    };
    Dep.prototype.changed = function (newValue, config) {
        if (config === void 0) { config = {}; }
        var collection = this.parentModuleInstance;
        if (this.dynamicRelation)
            this.global.relations.cleanup(this.dynamicRelation);
        if (this.type === 'internal') {
            // get dynamic data
            var dataWithDynamicProperties_1 = collection.injectDynamicRelatedData(newValue[collection.primaryKey], newValue);
            // run all callbacks and pass in dynamic data, unless important
            this.subscribersToInternalDataAsCallbacks.forEach(function (callback) {
                return callback(config.important
                    ? __assign(__assign({}, dataWithDynamicProperties_1), newValue) : dataWithDynamicProperties_1);
            });
        }
    };
    Dep.prototype.subscribe = function (componentContainer) {
        componentContainer.deps.add(this);
        this.subscribers.add(componentContainer);
    };
    return Dep;
}());
exports["default"] = Dep;
//# sourceMappingURL=dep.js.map
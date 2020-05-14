"use strict";
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
var helpers_1 = require("./helpers");
var dep_1 = __importDefault(require("./dep"));
var runtime_1 = require("./runtime");
var Reactive = /** @class */ (function () {
    function Reactive(parentModuleInstance, object, mutableProperties, type) {
        if (object === void 0) { object = {}; }
        if (type === void 0) { type = 'public'; }
        this.parentModuleInstance = parentModuleInstance;
        this.mutableProperties = mutableProperties;
        this.type = type;
        this.ghosts = {}; // used by indexes only
        this.allowPrivateWrite = false;
        this.touching = false;
        this.tempDeps = {};
        this.global = parentModuleInstance.global;
        this.properties = __spreadArrays(Object.keys(object), mutableProperties);
        this.object = this.reactiveObject(object);
    }
    Reactive.prototype.reactiveObject = function (object, rootProperty) {
        var objectKeys = rootProperty ? Object.keys(object) : this.properties;
        // Loop over all properties of the to-be reactive object
        for (var i = 0; i < objectKeys.length; i++) {
            var key = objectKeys[i];
            this.defineProperty(object, key, rootProperty);
        }
        return object;
    };
    Reactive.prototype.defineProperty = function (object, key, rootProperty) {
        var self = this;
        var value = object[key];
        if (object.rootProperty)
            rootProperty = object.rootProperty;
        // // If property is an array, make it reactive
        // if (Array.isArray(value)) {
        //   // value = this.reactiveArray(value, key);
        // }
        // rootProperty should be the current key if first deep object
        if (helpers_1.isWatchableObject(value) && !helpers_1.protectedNames.includes(key)) {
            value = this.deepReactiveObject(value, rootProperty || key, key);
        }
        // Create an instance of the dependency tracker
        var dep = this.createDep(key, rootProperty);
        Object.defineProperty(object, key, {
            get: function pulseGetter() {
                if (self.sneaky || self.global.gettingContext)
                    return value;
                // used by getDep on Module instance
                if (self.global.touching) {
                    self.global.touched = dep;
                    return value;
                }
                else if (self.touching) {
                    self.touched = dep;
                    return value;
                }
                // used by subController to get several deps at once
                if (self.global.subs.trackAllDeps) {
                    self.global.subs.trackedDeps.add(dep);
                    return value;
                }
                dep.register();
                return value;
            },
            set: function pulseSetter(newValue) {
                // DEEP REACTIVE handler: "rootProperty" indicates if the object is "deep".
                if (rootProperty && self.mutableProperties.includes(rootProperty)) {
                    // mutate locally
                    value = newValue;
                    // ingest mutation for deep property
                    self.global.runtime.ingest({
                        type: runtime_1.JobType.PUBLIC_DATA_MUTATION,
                        collection: self.parentModuleInstance,
                        property: rootProperty,
                        value: self.object[rootProperty],
                        dep: dep
                    });
                    // Regular mutations
                }
                else {
                    // if a protected name allow direct mutation
                    if (helpers_1.protectedNames.includes(key)) {
                        return (value = newValue);
                    }
                    // if backdoor open allow direct mutation
                    if (self.allowPrivateWrite) {
                        // dynamically convert new values to reactive if objects
                        // This is risky as fuck and kinda doesn't even work
                        if (helpers_1.isWatchableObject(newValue) && self.properties.includes(key)) {
                            newValue = self.deepReactiveObject(newValue, rootProperty || key, key);
                        }
                        return (value = newValue);
                    }
                    // if property is mutable dispatch update
                    if (self.properties.includes(key)) {
                        self.global.runtime.ingest({
                            type: runtime_1.JobType.PUBLIC_DATA_MUTATION,
                            collection: self.parentModuleInstance,
                            property: key,
                            value: newValue,
                            dep: dep
                        });
                        // we did not apply the mutation since runtime will privately
                        // write the result since we dispatched above
                    }
                }
            }
        });
        return object;
    };
    Reactive.prototype.addProperty = function (key, value) {
        this.object[key] = value;
        this.defineProperty(this.object, key);
    };
    Reactive.prototype.tempDep = function (property) {
        var dep = this.createDep(property);
        this.tempDeps[property] = dep;
        return dep;
    };
    Reactive.prototype.cloneDep = function (dep) {
        dep = Object.assign(Object.create(Object.getPrototypeOf(dep)), dep);
        // delete this.tempDeps[dep.propertyName];
        return dep;
    };
    Reactive.prototype.createDep = function (key, rootProperty) {
        var dep;
        if (this.tempDeps.hasOwnProperty(key) && !rootProperty) {
            dep = this.cloneDep(this.tempDeps[key]);
        }
        else {
            dep = new dep_1["default"](this.global, this.type === 'indexes' ? 'index' : 'reactive', this.parentModuleInstance, key, rootProperty);
        }
        return dep;
    };
    Reactive.prototype.deepReactiveObject = function (value, rootProperty, propertyName) {
        var objectWithCustomPrototype = Object.create({
            rootProperty: rootProperty,
            propertyName: propertyName
        });
        // repopulate custom object with incoming values
        var keys = Object.keys(value);
        for (var i = 0; i < keys.length; i++) {
            var property = keys[i];
            objectWithCustomPrototype[property] = value[property];
        }
        this.allowPrivateWrite = true;
        var obj = this.reactiveObject(objectWithCustomPrototype, rootProperty);
        this.allowPrivateWrite = false;
        return obj;
    };
    Reactive.prototype.reactiveArray = function (array, key) {
        var self = this;
        var reactiveArray = array.slice();
        var _loop_1 = function (i) {
            var func = helpers_1.arrayFunctions[i];
            var original = Array.prototype[func];
            Object.defineProperty(reactiveArray, func, {
                value: function () {
                    var result = original.apply(this, arguments);
                    if (self.global.initComplete)
                        // self.dispatch('mutation', {
                        //   collection: self.collection.name,
                        //   key,
                        //   value: result
                        // });
                        return result;
                }
            });
        };
        for (var i = 0; i < helpers_1.arrayFunctions.length; i++) {
            _loop_1(i);
        }
        return reactiveArray;
    };
    Reactive.prototype.privateWrite = function (property, value) {
        this.allowPrivateWrite = true;
        this.object[property] = value;
        this.allowPrivateWrite = false;
    };
    // sneaky blocked the getter, sneaky.
    Reactive.prototype.privateGet = function (property) {
        this.sneaky = true;
        var data = this.object[property];
        this.sneaky = false;
        return data;
    };
    Reactive.prototype.exists = function (property) {
        this.sneaky = true;
        var bool = !!this.object.hasOwnProperty(property);
        this.sneaky = false;
        return bool;
    };
    Reactive.prototype.getKeys = function () {
        this.sneaky = true;
        var keys = Object.keys(this.object);
        this.sneaky = false;
        return keys;
    };
    Reactive.prototype.createReactiveAlias = function (destObj, propertyName) {
        if (destObj.hasOwnProperty(propertyName))
            return destObj;
        var self = this;
        Object.defineProperty(destObj, propertyName, {
            get: function pulseGetterAlias() {
                return self.object[propertyName];
            },
            set: function pulseSetterAlias(newValue) {
                self.object[propertyName] = newValue;
                return;
            }
        });
        return destObj;
    };
    return Reactive;
}());
exports["default"] = Reactive;
//# sourceMappingURL=reactive.js.map
"use strict";
// Global Subscription Controller
// This class handles external components subscribing to Pulse.
exports.__esModule = true;
var helpers_1 = require("./helpers");
var ComponentContainer = /** @class */ (function () {
    function ComponentContainer(instance, config, depsFunc) {
        this.instance = instance;
        this.config = config;
        this.depsFunc = depsFunc;
        this.uuid = helpers_1.genId();
        this.ready = true;
        this.deps = new Set();
        this.mappedDeps = {};
        this.manualDepTracking = false;
        this.manualDepTracking = typeof this.depsFunc !== 'undefined';
        instance.__pulseUniqueIdentifier = this.uuid;
        if (config.waitForMount)
            this.ready = false;
    }
    return ComponentContainer;
}());
exports.ComponentContainer = ComponentContainer;
var SubController = /** @class */ (function () {
    function SubController(global) {
        this.global = global;
        this.subscribingComponentKey = 0;
        this.trackingComponent = false;
        // used by discoverDeps to get several dep classes
        this.trackAllDeps = false;
        this.trackedDeps = new Set();
        this.componentStore = {};
    }
    SubController.prototype.registerComponent = function (instance, config, depsFunc) {
        config = helpers_1.defineConfig(config, {
            waitForMount: this.global.config.waitForMount,
            blindSubscribe: false
        });
        var componentContainer = new ComponentContainer(instance, config, depsFunc);
        this.componentStore[componentContainer.uuid] = componentContainer;
        return componentContainer;
    };
    // returns all deps accessed within a function,
    // does not register any dependencies
    SubController.prototype.analyseDepsFunc = function (func) {
        var deps = new Set();
        var mappedDeps = {};
        this.trackAllDeps = true;
        var evaluated = func(this.global.contextRef);
        var localKeys = Object.keys(evaluated);
        var i = 0;
        this.trackedDeps.forEach(function (dep) {
            // prevent deep reactive deps from being tracked
            if (!dep.rootProperty) {
                // add dep to set
                deps.add(dep);
                mappedDeps[localKeys[i]] = dep;
                i++; // only increment if not deep reactive ;)
            }
        });
        this.trackedDeps = new Set();
        this.trackAllDeps = false;
        var mapToProps = !Array.isArray(evaluated) && typeof evaluated === 'object';
        return { mapToProps: mapToProps, deps: deps, evaluated: evaluated, mappedDeps: mappedDeps };
    };
    SubController.prototype.get = function (id) {
        return this.componentStore[id] || false;
    };
    SubController.prototype.mount = function (instance) {
        console.log(instance.__pulseUniqueIdentifier);
        var component = this.componentStore[instance.__pulseUniqueIdentifier];
        if (component) {
            component.instance = instance;
            component.ready = true;
        }
        else {
            console.error('you did something wrong');
        }
    };
    SubController.prototype.unmount = function (instance) {
        var uuid = instance.__pulseUniqueIdentifier;
        if (!uuid)
            return;
        var component = this.componentStore[instance.__pulseUniqueIdentifier];
        // clean up deps to avoid memory leaks
        component.deps.forEach(function (dep) { return dep.subscribers["delete"](component); });
        // delete reference to this component instance from store
        delete this.componentStore[instance.__pulseUniqueIdentifier];
    };
    SubController.prototype.legacyMapData = function (func) {
        // PUT DEPRICATION WARNING HERE PLS
        var deps = new Set();
        var evaluated = null;
        var mappedDeps = null;
        var norm = helpers_1.normalizeMap(func);
        var _loop_1 = function (i) {
            var _a = norm[i], key = _a.key, val = _a.val;
            var moduleInstanceName = val.split('/')[0];
            var property = val.split('/')[1];
            var moduleInstance = this_1.global.getModuleInstance(moduleInstanceName);
            var analysed = this_1.global.subs.analyseDepsFunc(function () {
                var _a;
                return _a = {}, _a[key] = moduleInstance.public.object[property], _a;
            });
            analysed.deps.forEach(function (dep) { return deps.add(dep); });
            // this if statement is here because of a weird bug that with all my JS knowlege I can't explain, only doesn't work on JavascriptCore engine, iOS
            var bool = typeof analysed.evaluated === 'object';
            if (bool) {
                if (!evaluated)
                    evaluated = {};
                if (!mappedDeps)
                    mappedDeps = {};
                evaluated[key] = analysed.evaluated[key];
                mappedDeps[key] = analysed.mappedDeps[key];
            }
        };
        var this_1 = this;
        for (var i = 0; i < norm.length; i++) {
            _loop_1(i);
        }
        return { deps: deps, evaluated: evaluated, mappedDeps: mappedDeps };
    };
    SubController.prototype.mapData = function (func, componentInstance, returnInfo) {
        // get container instance for component
        var cC = this.get(componentInstance.__pulseUniqueIdentifier), deps = new Set(), mappedDeps, evaluated = {}, mapToProps = false, legacy = false;
        if (typeof func === 'object') {
            legacy = true;
            // force mapToProps as we know this old method requires that
            mapToProps = true;
            // Pulse 1.0 compatiblity, should depricate soon!
            var legacyRes = this.legacyMapData(func);
            deps = legacyRes.deps;
            mappedDeps = legacyRes.mappedDeps;
            evaluated = legacyRes.evaluated;
        }
        else {
            var res = this.global.subs.analyseDepsFunc(func);
            deps = res.deps;
            mappedDeps = res.mappedDeps;
            evaluated = res.evaluated;
            mapToProps = res.mapToProps;
        }
        if (mapToProps) {
            cC.evaluated = evaluated;
            cC.mappedDeps = mappedDeps;
        }
        // create subscription
        deps.forEach(function (dep) { return dep && dep.subscribe(cC); });
        if (returnInfo)
            return { evaluated: evaluated, deps: deps, mapToProps: mapToProps, legacy: legacy, mappedDeps: mappedDeps };
        return evaluated;
    };
    return SubController;
}());
exports["default"] = SubController;
//# sourceMappingURL=subController.js.map
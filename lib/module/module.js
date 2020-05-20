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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var helpers_1 = require("../helpers");
var reactive_1 = __importDefault(require("../reactive"));
var action_1 = __importDefault(require("../action"));
var computed_1 = __importDefault(require("../computed"));
var runtime_1 = require("../runtime");
// modules have a contained reactivity system which is the base
// of collections, services and
var Module = /** @class */ (function () {
    function Module(name, global, root) {
        var _this = this;
        this.name = name;
        this.global = global;
        this.root = root;
        this.keys = {};
        this.methods = {};
        this.local = {};
        this.config = {}; //rename
        this.actions = {};
        this.computed = {};
        this.watchers = {};
        this.externalWatchers = {};
        this.persist = [];
        this.model = {};
        this.throttles = [];
        // define aliases
        this.config = root.config;
        // create this.root
        root = this.prepareRoot(root);
        // Prepare methods
        helpers_1.collectionFunctions.map(function (func) { return _this[func] && (_this.methods[func] = _this[func].bind(_this)); });
        var publicObject = this.preparePublicNamespace(root);
        // create public object
        this.keys.data = Object.keys(root.data || {});
        this.public = new reactive_1["default"](this, publicObject, this.keys.data);
        if (root.staticData) {
            this.keys.staticData = Object.keys(root.staticData);
            for (var property in root.staticData)
                if (root.staticData.hasOwnProperty(property))
                    this.public.privateWrite(property, root.staticData[property]);
        }
        // init module features
        this.initActions(root.actions);
        this.initWatchers(root.watch);
        this.initComputed(root.computed);
        if (this.global.request || root.request)
            this.initRoutes(root.routes);
        // load persisted data from storage
        this.initPersist(root.persist);
        this.prepareLocalContext();
        // init finished
        if (root.onReady)
            this.onReady = root.onReady;
    }
    // this function is where any transforms to the root object
    // should be done, before namspace is initilized
    Module.prototype.prepareRoot = function (root) {
        root.computed = __assign(__assign({}, root.computed), root.filters); // legacy support
        this.root = root;
        return root;
    };
    Module.prototype.preparePublicNamespace = function (root) {
        var publicNamespace = {};
        // insert static properties
        var types = ['routes', 'indexes', 'local'];
        types.forEach(function (type) { return root[type] && (publicNamespace[type] = __assign({}, root[type])); });
        var namespaceWithMethods = Object.assign.apply(Object, __spreadArrays([Object.create(this.methods),
            publicNamespace], root.data, root.computed
        // ...root.actions
        ));
        return namespaceWithMethods;
    };
    Module.prototype.initRoutes = function (routes) {
        var _this = this;
        if (routes === void 0) { routes = {}; }
        this.keys.routes = Object.keys(routes);
        var routeWrapped = function (routeName) {
            var self = _this;
            return function () {
                var requestObject = Object.assign({}, self.global.request);
                requestObject.context = self.global.contextRef;
                return routes[routeName].apply(null, [requestObject].concat(Array.prototype.slice.call(arguments)));
            };
        };
        for (var routeName in routes) {
            this.public.object.routes[routeName] = routeWrapped(routeName);
        }
    };
    Module.prototype.initActions = function (actions) {
        if (actions === void 0) { actions = {}; }
        this.keys.actions = Object.keys(actions);
        for (var actionName in actions) {
            this.actions[actionName] = new action_1["default"](this, this.global, actions[actionName], actionName);
            this.public.privateWrite(actionName, this.actions[actionName].exec);
        }
    };
    Module.prototype.initWatchers = function (watchers) {
        var _this = this;
        if (watchers === void 0) { watchers = {}; }
        this.keys.watchers = Object.keys(watchers);
        var _loop_1 = function (watcherName) {
            var watcher = watchers[watcherName];
            this_1.watchers[watcherName] = function () {
                _this.global.runningWatcher = true;
                var watcherOutput = watcher(_this.global.getContext(_this));
                _this.global.runningWatcher = false;
                return watcherOutput;
            };
        };
        var this_1 = this;
        for (var watcherName in watchers) {
            _loop_1(watcherName);
        }
    };
    Module.prototype.initComputed = function (computed) {
        if (computed === void 0) { computed = {}; }
        this.keys.computed = Object.keys(computed);
        for (var computedName in computed) {
            this.computed[computedName] = new computed_1["default"](this.global, this, computedName, computed[computedName]);
            this.public.privateWrite(computedName, this.global.config.computedDefault);
        }
    };
    Module.prototype.initPersist = function (persist) {
        var _this = this;
        if (persist === void 0) { persist = []; }
        if (!Array.isArray(persist))
            return;
        var _loop_2 = function (i) {
            var dataName = persist[i];
            // register this
            this_2.persist.push(dataName);
            if (this_2.global.storage.isPromise) {
                this_2.global.storage.get(this_2.name, dataName).then(function (data) {
                    if (data === undefined || data === null)
                        return;
                    _this.global.ingest({
                        type: runtime_1.JobType.PUBLIC_DATA_MUTATION,
                        value: data,
                        property: dataName,
                        collection: _this
                    });
                });
            }
            else {
                var data = this_2.global.storage.get(this_2.name, dataName);
                if (data === undefined || data === null)
                    return "continue";
                this_2.public.privateWrite(dataName, data);
            }
        };
        var this_2 = this;
        for (var i = 0; i < persist.length; i++) {
            _loop_2(i);
        }
    };
    Module.prototype.runWatchers = function (property) {
        var watcher = this.watchers[property];
        if (watcher)
            watcher();
        var externalWatchers = this.externalWatchers[property];
        if (externalWatchers)
            externalWatchers.forEach(function (func) {
                return typeof func === 'function' ? func() : false;
            });
    };
    Module.prototype.prepareLocalContext = function () {
        this.localContext = {
            data: {},
            computed: {}
        };
        var l = this.localContext;
        for (var type in l)
            for (var _i = 0, _a = this.keys[type]; _i < _a.length; _i++) {
                var propertyName = _a[_i];
                this.public.createReactiveAlias(l[type], propertyName);
            }
        if (this.keys.staticData)
            for (var _b = 0, _c = this.keys.staticData; _b < _c.length; _b++) {
                var property = _c[_b];
                l.data[property] = this.public.privateGet(property);
            }
        // insert static properties
        l.local = this.root.local;
        l.actions = helpers_1.createObj(this.keys.actions, this.public.object);
        l.routes = this.public.object.routes;
        if (this.keys.indexes) {
            l.indexes = this.indexes.public.object;
        }
        for (var method in this.methods)
            l[method] = this.methods[method];
    };
    Module.prototype.getSelfContext = function () {
        var globalContext = this.global.contextRef;
        var context = __assign(__assign({}, globalContext), this.localContext);
        return context;
    };
    Module.prototype.getDep = function (propertyName, reactiveObject) {
        var dep;
        this.global.touching = true;
        // if the property is on a deep reactive object or an index
        if (reactiveObject)
            reactiveObject[propertyName];
        // by default we assume the module's public object
        else
            this.public.object[propertyName];
        // extract the dep from global
        dep = this.global.touched;
        // reset state
        this.global.touching = false;
        this.global.touched = null;
        return dep;
    };
    Module.prototype.isComputedReady = function (computedName) {
        return this.computed[computedName].hasRun;
    };
    // ****************** EXTERNAL METHODS ****************** //
    Module.prototype.watch = function (property, callback) {
        if (!this.externalWatchers[property])
            this.externalWatchers[property] = [callback];
        else
            this.externalWatchers[property].push(callback);
    };
    Module.prototype.forceUpdate = function (property) {
        // ensure property exists on collection
        if (this.public.exists(property)) {
            // if property is directly mutable
            if (this.public.mutableProperties.includes(property)) {
                this.global.ingest({
                    type: runtime_1.JobType.PUBLIC_DATA_MUTATION,
                    property: property,
                    collection: this,
                    value: this.public.privateGet(property)
                });
                // if property is a computed method
            }
            else if (this.computed[property]) {
                this.global.ingest({
                    type: runtime_1.JobType.COMPUTED_REGEN,
                    property: property,
                    collection: this
                });
            }
            else if (this.indexes && this.indexes.exists(property)) {
                this.global.ingest({
                    type: runtime_1.JobType.GROUP_UPDATE,
                    property: property,
                    collection: this
                });
            }
        }
    };
    Module.prototype.throttle = function (amount) {
        var _this = this;
        if (amount === void 0) { amount = 0; }
        // if action is currently running save in throttles
        if (this.global.runtime.runningAction) {
            this.throttles.push(this.global.runtime.runningAction);
        }
        // after the certain amount has possed remove the throttle via filter
        setTimeout(function () {
            _this.throttles = _this.throttles.filter(function (action) { return action !== _this.global.runtime.runningAction; });
        }, amount);
    };
    Module.prototype.addStaticData = function (key, data) {
        if (this.keys.staticData.includes(key) ||
            this.public.getKeys().includes(key))
            throw 'Pulse: failed to add static data, key already exists';
        this.keys.staticData.push(key);
        this.public.privateWrite(key, data);
        this.prepareLocalContext(); // recompute local context;
    };
    // WIP DO NOT USE
    Module.prototype.debounce = function (func, amount, options) {
        return __awaiter(this, void 0, void 0, function () {
            var action;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        action = this.global.runtime.runningAction;
                        action.softDebounce(func, amount);
                        return [2 /*return*/];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return Module;
}());
exports["default"] = Module;
//# sourceMappingURL=module.js.map
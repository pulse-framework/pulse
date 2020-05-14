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
var runtime_1 = __importDefault(require("./runtime"));
var module_1 = __importDefault(require("./module"));
var collection_1 = __importDefault(require("./module/modules/collection"));
var subController_1 = __importDefault(require("./subController"));
var relationController_1 = __importDefault(require("./relationController"));
var storage_1 = __importDefault(require("./storage"));
var request_1 = __importDefault(require("./collections/request"));
var helpers_1 = require("./helpers");
var runtime_2 = require("./runtime");
var use_1 = __importDefault(require("./intergrations/use"));
var Pulse = /** @class */ (function () {
    function Pulse(root) {
        var _this = this;
        if (root === void 0) { root = {}; }
        this._private = {
            modules: {},
            collections: {},
            helpers: {},
            services: {},
            keys: {
                modules: ['base'],
                collections: [],
                services: []
            },
            events: {},
            global: {
                config: this.initConfig(root.config, root.framework),
                contextRef: {},
                // Instances
                subs: null,
                relations: null,
                storage: null,
                // State
                initComplete: false,
                runningWatcher: false,
                runningComputed: false,
                runningPopulate: false,
                mappingData: false,
                collecting: false,
                touching: false,
                touched: false,
                gettingContext: false,
                // Function aliases
                getInternalData: this.getInternalData.bind(this),
                getContext: this.getContext.bind(this),
                log: this.log.bind(this),
                getModuleInstance: this.getModuleInstance.bind(this),
                uuid: helpers_1.genId
            }
        };
        var self = this._private;
        // Bind static objects directly to instance
        ['utils', 'staticData'].forEach(function (type) {
            if (root[type])
                _this[type] = root[type];
        });
        if (!root.config)
            root.config = {};
        if (root['framework'])
            root.config.framework = root['framework'];
        // Create storage instance
        self.global.storage = new storage_1["default"](root.storage);
        // Create controller instances
        self.global.relations = new relationController_1["default"](self.global);
        self.global.subs = new subController_1["default"](self.global);
        // init Runtime class into the global object
        this.initRuntime();
        this.registerModules(root);
        this.runAllComputed();
        this.runAllOnReady();
        this.initComplete();
    }
    Pulse.prototype.registerModules = function (root) {
        var self = this._private, namespace = {};
        // register base module
        self.modules.base = new module_1["default"]('base', self.global, root);
        this.bindBasePropertiesToContext(this);
        // assign base module methods
        for (var _i = 0, moduleFunctions_1 = helpers_1.moduleFunctions; _i < moduleFunctions_1.length; _i++) {
            var property = moduleFunctions_1[_i];
            Pulse.prototype[property] = self.modules.base.public.object[property];
        }
        // optionally register request module
        if (root.request) {
            self.modules.request = new request_1["default"](self.global, root.request);
            self.keys.modules.unshift('request');
            namespace['request'] = self.modules.request.public.object;
        }
        // for each module type, and if module type exits on root, create module instances
        ['modules', 'collections', 'services'].forEach(function (category) {
            if (!root[category])
                return;
            // declare module names as keys within respective category
            self.keys[category] = __spreadArrays(self.keys[category], Object.keys(root[category]));
            // for each module instance within this category
            self.keys[category].forEach(function (instanceName) {
                if (instanceName === 'base' || instanceName === 'request')
                    return;
                var instanceConfig = root[category][instanceName], moduleStore = self[category], useCat = false;
                // switch differnet categories to init the correct constructor
                switch (category) {
                    case 'modules':
                        moduleStore[instanceName] = new module_1["default"](instanceName, self.global, instanceConfig);
                        break;
                    case 'collections':
                        moduleStore[instanceName] = new collection_1["default"](instanceName, self.global, instanceConfig);
                        break;
                    case 'services':
                        moduleStore[instanceName] = new module_1["default"](instanceName, self.global, instanceConfig);
                        useCat = true;
                        break;
                }
                var publicObject = moduleStore[instanceName].public.object;
                // assign instance to namespace
                if (useCat) {
                    // if the category does not exist on the namespace create it
                    if (!namespace[category])
                        namespace[category] = {};
                    // assign the public object from the module instance to the corresponding namspace with category
                    namespace[category][instanceName] = publicObject;
                    // the same thing as above except without category
                }
                else
                    namespace[instanceName] = publicObject;
            });
        });
        // preserve refrence of clean namespace object
        self.global.contextRef = __assign(__assign({}, namespace), { base: self.modules.base.public.object });
        this.bindBasePropertiesToContext(self.global.contextRef);
        // bind namespace to root of pulse
        for (var key in namespace)
            this[key] = namespace[key];
        if (self.global.config.baseModuleAlias)
            this['base'] = self.modules.base.public.object;
    };
    Pulse.prototype.bindBasePropertiesToContext = function (obj) {
        var self = this._private;
        // alias base module public properties
        for (var _i = 0, _a = self.modules.base.public.properties; _i < _a.length; _i++) {
            var property = _a[_i];
            if (__spreadArrays(self.modules.base.public.mutableProperties, self.modules.base.keys.computed).includes(property))
                self.modules.base.public.createReactiveAlias(obj, property);
            else
                obj[property] = self.modules.base.public.object[property];
        }
        // assign actions to root
        for (var _b = 0, _c = self.modules.base.keys.actions; _b < _c.length; _b++) {
            var property = _c[_b];
            obj[property] = self.modules.base.public.object[property];
        }
    };
    Pulse.prototype.loopModules = function (callback) {
        var _this = this;
        var keys = this._private.keys;
        var _loop_1 = function (moduleType) {
            keys[moduleType].forEach(function (moduleName) {
                return callback(_this._private[moduleType][moduleName]);
            });
        };
        for (var moduleType in keys) {
            _loop_1(moduleType);
        }
    };
    Pulse.prototype.initRuntime = function () {
        this._private.global.runtime = new runtime_1["default"](this._private.collections, this._private.global);
    };
    Pulse.prototype.runAllComputed = function () {
        var _this = this;
        this.loopModules(function (moduleInstance) {
            return moduleInstance.keys.computed &&
                moduleInstance.keys.computed.forEach(function (computedKey) {
                    var computed = moduleInstance.computed[computedKey];
                    // console.log(computed);
                    _this._private.global.runtime.queue({
                        type: runtime_2.JobType.COMPUTED_REGEN,
                        collection: moduleInstance,
                        property: computed
                    });
                    // moduleInstance.runWatchers(computed.name);
                });
        });
        // console.log(this._private.global.runtime);
        this._private.global.runtime.run();
    };
    Pulse.prototype.runAllOnReady = function () {
        var _this = this;
        this.loopModules(function (moduleInstance) {
            if (moduleInstance.onReady)
                moduleInstance.onReady(_this._private.global.getContext(moduleInstance));
        });
    };
    Pulse.prototype.initComplete = function () {
        this._private.global.log('**Init Complete**');
        this._private.global.initComplete = true;
        helpers_1.log('INIT COMPLETE', Object.assign({}, this));
        try {
            globalThis.__pulse = this;
        }
        catch (_a) { }
        if (!this._private.global.config.bindInstanceTo) {
            try {
                window[this._private.global.config.bindInstanceTo] = this;
            }
            catch (e) { }
        }
        if (Pulse.intergration)
            Pulse.intergration.onReady(Pulse);
    };
    Pulse.prototype.wrapped = function (ReactComponent, mapData) {
        return Pulse.React(ReactComponent, mapData);
    };
    Pulse.prototype.mapData = function (func, instance) {
        // if component is not already registered
        if (!instance.__pulseUniqueIdentifier)
            this._private.global.subs.registerComponent(instance, {}, func);
        // return mapData func
        return this._private.global.subs.mapData(func, instance);
    };
    Pulse.prototype.initConfig = function (config, framework) {
        // if constructor already init
        if (!this._private) {
            // define config
            config = helpers_1.defineConfig(config, {
                framework: null,
                frameworkConstructor: null,
                waitForMount: false,
                autoUnmount: true,
                computedDefault: null,
                logJobs: false,
                baseModuleAlias: false,
                mapDataUnderPropName: false,
                bindInstanceTo: false
            });
        }
        else {
            // merge config
            config = __assign(__assign({}, this._private.global.config), config);
        }
        if (!framework)
            framework = config.framework;
        // detect if framework passed in is a React constructor
        if (!Pulse.intergration && framework) {
            Pulse.use(framework, Pulse);
        }
        if (!Pulse.intergration) {
            console.warn('Pulse Warning - No intergrated framework');
        }
        else {
            config.framework = Pulse.intergration.name;
            config.frameworkConstructor = Pulse.intergration.frameworkConstructor;
        }
        if (framework === 'react') {
            if (config.waitForMount != false)
                config.waitForMount = true;
            if (config.autoUnmount != false)
                config.autoUnmount = true;
        }
        if (this._private)
            this._private.global.config = config;
        return config;
    };
    // THIS WONT WORK
    Pulse.prototype.getInternalData = function (collection, primaryKey) {
        return this._private.collections[collection].findById(primaryKey);
    };
    Pulse.prototype.getContext = function (moduleInstance) {
        var context = {};
        this._private.global.gettingContext = true; // prevent reactive getters from tracking dependencies while building context
        if (!moduleInstance) {
            context = this._private.global.contextRef;
        }
        else
            context = moduleInstance.getSelfContext();
        if (this['utils'])
            context['utils'] = this['utils'];
        // spread base context
        context = __assign(__assign({ base: this._private.modules.base.public.object }, this._private.modules.base.public.object), context);
        this._private.global.gettingContext = false;
        return context;
    };
    Pulse.prototype.getContextRef = function () {
        return this._private.global.contextRef;
    };
    Pulse.prototype.subscribe = function (instance, properties) { };
    Pulse.prototype.emit = function (name, payload) {
        if (this._private.events[name])
            for (var i = 0; i < this._private.events[name].length; i++) {
                var callback = this._private.events[name][i];
                callback(payload);
            }
    };
    Pulse.prototype.on = function (name, callback) {
        if (!Array.isArray(this._private.events[name]))
            this._private.events[name] = [callback];
        else
            this._private.events[name].push(callback);
    };
    // re-init storage object with new config
    Pulse.prototype.updateStorage = function (storageConfig) {
        var _this = this;
        this._private.global.storage = new storage_1["default"](storageConfig);
        // re-init all collections persist to ensure correct values
        this._private.keys.collections.forEach(function (collectionName) {
            var collection = _this._private.collections[collectionName];
            collection.initPersist(collection.root.persist);
        });
    };
    Pulse.prototype.getModuleInstance = function (name) {
        var self = this._private;
        var moduleInstance;
        if (self.modules.hasOwnProperty(name))
            moduleInstance = self.modules[name];
        if (self.collections.hasOwnProperty(name))
            moduleInstance = self.collections[name];
        return moduleInstance;
    };
    Pulse.prototype.log = function (thing) {
        if (!this._private.global.config.logJobs)
            return;
        console.log('RUNTIME JOB', thing);
    };
    Pulse.prototype.logJobs = function () {
        this._private.global.config.logJobs = true;
    };
    Pulse.instance = null;
    Pulse.use = function (plugin) { return use_1["default"](plugin, Pulse); };
    return Pulse;
}());
exports["default"] = Pulse;
globalThis.Pulse = Pulse; // ReMOVE THIS
//# sourceMappingURL=main.js.map
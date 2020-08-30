"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persist = exports.defaultConfig = void 0;
const state_1 = require("./state");
const computed_1 = require("./computed");
const collection_1 = require("./collection/collection");
const sub_1 = require("./sub");
const runtime_1 = require("./runtime");
const storage_1 = require("./storage");
const api_1 = require("./api/api");
const use_1 = require("./integrations/use");
const controller_1 = require("./controller");
const status_1 = require("./status");
const storage_2 = require("./collection/storage");
exports.defaultConfig = {
    noCore: false
};
class Pulse {
    constructor(config = exports.defaultConfig) {
        this.config = config;
        this.ready = false;
        this.controllers = {};
        this.errorHandlers = new Set();
        this.integration = null;
        // Context reference
        this.computed = new Set();
        this.core = {};
        this.Controller = (config, spreadToRoot) => {
            return new controller_1.Controller(config, spreadToRoot);
        };
        this.Core = (core) => {
            if (!this.ready && core)
                this.onInstanceReady(core);
            return this.core;
        };
        /**
         * Create Pulse API
         * @param config Object
         * @param config.options Object - Typescript default: RequestInit (headers, credentials, mode, etc...)
         * @param config.baseURL String - Url to prepend to endpoints (without trailing slash)
         * @param config.timeout Number - Time to wait for request before throwing error
         */
        this.API = (config) => new api_1.default(config);
        /**
         * Create Pulse state
         * @param initialState Any - the value to initialze a State instance with
         */
        this.State = (initial) => new state_1.default(() => this, initial);
        /**
         * Create many Pulse states at the same time
         * @param stateGroup Object with keys as state name and values as initial state
         */
        this.StateGroup = (stateGroup) => state_1.StateGroup(() => this, stateGroup);
        /**
         * Create a Pulse computed function
         * @param deps Array - An array of state items to depend on
         * @param func Function - A function where the return value is the state, ran every time a dep changes
         */
        this.Computed = (func, deps) => {
            const computed = new computed_1.default(() => this, func, deps);
            this.computed.add(computed);
            return computed;
        };
        /**
         * Create a Pulse collection with automatic type inferring
         * @param config object | function returning object
         * @param config.primaryKey string - The primary key for the collection.
         * @param config.groups object - Define groups for this collection.
         */
        this.Collection = () => {
            return (config) => {
                return new collection_1.default(() => this, config);
            };
        };
        this.subController = new sub_1.default(this);
        this.status = new status_1.default(() => this);
        this.runtime = new runtime_1.default(this);
        this.storage = new storage_1.default(() => this, config.storage || {});
        this.collectionStorage = new storage_2.default(config.collectionStorage);
        if (config.framework)
            this.initFrameworkIntegration(config.framework);
        this.globalBind();
        if (this.config.noCore === true)
            this.onInstanceReady();
    }
    initFrameworkIntegration(frameworkConstructor) {
        use_1.default(frameworkConstructor, this);
    }
    onInstanceReady(core) {
        this.ready = true;
        if (core)
            // Copy core object structure without destorying this.core object reference
            for (let p in core)
                this.core[p] = core[p];
        this.computed.forEach(instance => instance.recompute());
    }
    onError(handler) { }
    Error(error, code) { }
    Action(func) {
        return () => {
            const returnValue = func();
            return returnValue;
        };
    }
    /**
     * Reset to initial state.
     * - Supports: State, Collections and Groups
     * - Removes persisted state from storage.
     * @param Items Array of items to reset
     */
    reset(items) { }
    nextPulse(callback) {
        this.runtime.nextPulse(callback);
    }
    setStorage(storageConfig) {
        const persistedState = this.storage.persistedState;
        this.storage = new storage_1.default(() => this, storageConfig);
        this.storage.persistedState = persistedState;
        this.storage.persistedState.forEach(state => state.persist(state.name));
    }
    Storage(storageConfig) {
        return this.setStorage(storageConfig);
    }
    /**
     * Global refrence to the first pulse instance created this runtime
     */
    globalBind() {
        try {
            if (!globalThis.__pulse)
                globalThis.__pulse = this;
        }
        catch (error) {
            // fail silently
        }
    }
}
exports.default = Pulse;
// Handy utils
function persist(items) {
    items.forEach(item => item.persist(item.name));
}
exports.persist = persist;

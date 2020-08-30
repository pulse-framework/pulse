"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Group = void 0;
const pulse_1 = require("../pulse");
const state_1 = require("../state");
const collection_1 = require("./collection");
const utils_1 = require("../utils");
class Group extends state_1.default {
    constructor(context, initialIndex, config = {}) {
        // This invokes the parent class with either the collection or the Pulse instance as context
        // This means groups can be created before (or during) a Collection instantization
        super((context() instanceof pulse_1.default ? context : context().instance), initialIndex || []);
        this._masterOutput = [];
        this.missingPrimaryKeys = [];
        if (context() instanceof collection_1.default)
            this.collection = context;
        if (config.name)
            this.name = config.name;
        this.type(Array);
        this.sideEffects = () => this.build();
        // initial build
        this.build();
    }
    get index() {
        return this.value;
    }
    get output() {
        if (this.instance().runtime.trackState)
            this.instance().runtime.foundState.add(this);
        return this._masterOutput;
    }
    build() {
        this.missingPrimaryKeys = [];
        if (!Array.isArray(this._value))
            return [];
        let group = this._value
            .map(primaryKey => {
            let data = this.collection().data[primaryKey];
            if (!data) {
                this.missingPrimaryKeys.push(primaryKey);
                return undefined;
            }
            // on each data item in this group, run compute
            if (this.computedFunc) {
                let dataComputed = this.computedFunc(data.copy());
                return dataComputed;
                // use collection level computed func if local does not exist
            }
            else if (this.collection().computedFunc) {
                let dataComputed = this.collection().computedFunc(data.copy());
                return dataComputed;
            }
            return data.getPublicValue();
        })
            .filter(item => item !== undefined);
        // this.dep.dynamic.forEach(state => state.dep.depend(this));
        //@ts-ignore
        this._masterOutput = group;
    }
    has(primaryKey) {
        return this.value.includes(primaryKey) || false;
    }
    get size() {
        return this.value.length;
    }
    compute(func) {
        this.computedFunc = func;
    }
    add(primaryKey, options = {}) {
        // set defaults
        options = utils_1.defineConfig(options, { method: 'push', overwrite: true });
        const useIndex = options.atIndex !== undefined;
        const exists = this.nextState.includes(primaryKey);
        if (options.overwrite)
            this.nextState = this.nextState.filter(i => i !== primaryKey);
        // if we do not want to overwrite and key already exists in group, exit
        else if (exists)
            return this;
        // if atIndex is set, inject at that index.
        if (useIndex) {
            if (options.atIndex > this.nextState.length)
                options.atIndex = this.nextState.length - 1;
            this.nextState.splice(options.atIndex, 0, primaryKey);
        }
        // push or unshift into state
        else
            this.nextState[options.method](primaryKey);
        // send nextState to runtime and return
        this.set();
        return this;
    }
    remove(primaryKey) {
        this.nextState = this.nextState.filter(i => i !== primaryKey);
        this.set();
        return this;
    }
}
exports.Group = Group;
exports.default = Group;

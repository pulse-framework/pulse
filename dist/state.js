"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistValue = exports.reset = exports.StateGroup = exports.State = void 0;
const dep_1 = require("./dep");
const utils_1 = require("./utils");
const deepmerge_1 = require("./helpers/deepmerge");
class State {
    constructor(instance, initalState, deps = []) {
        this.instance = instance;
        this.initalState = initalState;
        this._value = null;
        this.dep = null;
        this.previousState = null;
        this.nextState = null;
        this.isSet = false; // has been changed from inital value
        this.dep = new dep_1.default(deps);
        this.privateWrite(initalState);
    }
    set value(val) {
        this._value = val;
    }
    get value() {
        if (this.instance().runtime.trackState)
            this.instance().runtime.foundState.add(this);
        return this._value;
    }
    set bind(value) {
        this.set(value);
    }
    get bind() {
        return this._value;
    }
    get exists() {
        return !!this.value; // is value truthey or falsey
    }
    /**
     * Directly set state to a new value, if nothing is passed in State.nextState will be used as the next value
     * @param newState - The new value for this state
     */
    set(newState, options = {}) {
        // if newState not provided, just ingest update with existing value
        if (newState === undefined) {
            this.instance().runtime.ingest(this, undefined);
            return this;
        }
        // if newState is a function, run that function and supply existing value as first param
        if (typeof newState === 'function')
            newState = newState(this._value);
        // check type if set and correct otherwise exit
        if (this.typeOfVal && !this.isCorrectType(newState)) {
            console.warn(`Pulse: Error setting state: Incorrect type (${typeof newState}) was provided. Type fixed to ${this.typeOfVal}`);
            return this;
        }
        // ingest update using most basic mutation method
        if (options.background) {
            this.privateWrite(newState);
            if (this.sideEffects)
                this.sideEffects();
        }
        else {
            this.instance().runtime.ingest(this, newState);
        }
        this.isSet = true;
        return this;
    }
    getPublicValue() {
        if (this.output !== undefined)
            return this.output;
        return this._value;
    }
    patch(targetWithChange, config = {}) {
        if (!(typeof this._value === 'object'))
            return this;
        this.nextState = config.deep === false ? utils_1.shallowmerge(this.nextState, targetWithChange) : deepmerge_1.deepmerge(this.nextState, targetWithChange);
        this.set();
        return this;
    }
    interval(setFunc, ms) {
        setInterval(() => {
            this.set(setFunc(this.value));
        }, ms || 1000);
        return this;
    }
    persist(key) {
        this.persistState = true;
        persistValue.bind(this)(key);
        return this;
    }
    // this creates a watcher that will fire a callback then destroy itself after invoking
    onNext(callback) {
        if (!this.watchers)
            this.watchers = {};
        this.watchers['_on_next_'] = () => {
            callback(this.getPublicValue());
            delete this.watchers['_on_next_'];
        };
    }
    key(key) {
        this.name = key;
        return this;
    }
    type(type) {
        const supportedConstructors = ['String', 'Boolean', 'Array', 'Object', 'Number'];
        if (typeof type === 'function' && supportedConstructors.includes(type.name)) {
            this.typeOfVal = type.name.toLowerCase();
        }
        return this;
    }
    watch(key, callback) {
        if (!this.watchers)
            this.watchers = {};
        if (typeof key !== 'string' || typeof key !== 'number' || typeof callback !== 'function') {
            // console.error('Pulse watch, missing key or function');
        }
        this.watchers[key] = callback;
        return this;
    }
    undo() {
        this.set(this.previousState);
    }
    removeWatcher(key) {
        delete this.watchers[key];
        return this;
    }
    toggle() {
        if (typeof this._value === 'boolean') {
            // @ts-ignore
            this.set(!this._value);
        }
        return this;
    }
    reset() {
        reset(this);
        return this;
    }
    // returns a fresh copy of the current value
    copy() {
        return utils_1.copy(this.value);
    }
    is(x) {
        return this.value === x;
    }
    isNot(x) {
        return this.value !== x;
    }
    // public relate(state: State | Array<State>) {
    //   if (!Array.isArray(state)) state = [state];
    //   // add this to foriegn dep
    //   state.forEach(state => state && state.dep.depend(this));
    //   // refrence foriegn dep locally for cleanup
    //   this.dep.dynamic.add(this);
    // }
    // INTERNAL
    privateWrite(value) {
        this._value = utils_1.copy(value);
        this.nextState = utils_1.copy(value);
        if (this.persistState)
            this.instance().storage.set(this.name, this.getPersistableValue());
    }
    isCorrectType(value) {
        let type = typeof value;
        if (type === 'object' && Array.isArray(value))
            type = 'array';
        return type === this.typeOfVal;
    }
    destroy() {
        this.dep.deps.clear();
        this.dep.subs.clear();
    }
    getPersistableValue() {
        return this.value;
    }
}
exports.State = State;
exports.StateGroup = (instance, stateGroup) => {
    let group = {};
    for (let name in stateGroup) {
        group[name] = new State(instance, stateGroup[name]);
        group[name].name = name;
    }
    return group;
};
exports.default = State;
function reset(instance) {
    instance.isSet = false;
    instance.previousState = null;
    instance.privateWrite(instance.initalState);
    if (instance.persistState)
        instance.instance().storage.remove(instance.name);
}
exports.reset = reset;
// this function exists outside the state class so it can be imported into other classes such as selector for custom persist logic
function persistValue(key) {
    // validation
    if (!key && this.name) {
        key = this.name;
    }
    else if (!key) {
        console.warn('Pulse Persist Error: No key provided');
    }
    else {
        this.name = key;
    }
    const storage = this.instance().storage;
    // add ref to this instance inside storage
    storage.persistedState.add(this);
    // handle the value
    const handle = (storageVal) => {
        if (storageVal === null)
            storage.set(this.name, this.getPersistableValue());
        else if (typeof this.select === 'function')
            this.select(storageVal);
        else
            this.instance().runtime.ingest(this, storageVal);
    };
    // Check if promise, then handle value
    if (storage.isPromise)
        storage.get(this.name).then(handle);
    else
        handle(storage.get(this.name));
}
exports.persistValue = persistValue;

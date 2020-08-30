"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Computed = void 0;
const state_1 = require("./state");
class Computed extends state_1.default {
    constructor(instance, func, deps) {
        super(instance, instance().config.computedDefault || null);
        this.instance = instance;
        this.func = func;
        this.deps = deps;
        if (deps)
            deps.forEach(state => state.dep.depend(this));
        // if Core will not be used, compute immediately
        if (instance().config.noCore === true)
            this.recompute();
    }
    // private cleanup: Set<State> = new Set();
    set value(val) {
        console.error('Error: Can not mutate Computed value, please use recompute()');
    }
    get value() {
        return super.value;
    }
    set bind(val) {
        console.error('Error: Can not bind Computed value');
    }
    computeValue() {
        if (this.deps)
            return this.func();
        this.instance().runtime.trackState = true;
        const computed = this.func();
        let dependents = this.instance().runtime.getFoundState();
        dependents.forEach(state => state.dep.depend(this));
        return computed;
    }
    recompute() {
        this.set(this.computeValue());
    }
    reset() {
        state_1.reset(this);
        this.recompute();
        return this;
    }
    patch() {
        throw 'Error, can not use patch method on Computed since the value is dynamic.';
        return this;
    }
    persist(key) {
        console.error('Computed state can not be persisted, remove call to .persist()', key);
        return this;
    }
}
exports.Computed = Computed;
exports.default = Computed;

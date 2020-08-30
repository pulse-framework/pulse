"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNumber = exports.cleanse = exports.normalizeMap = exports.isWatchableObject = exports.isAsync = exports.isFunction = exports.genId = exports.defineConfig = exports.shallowmerge = exports.normalizeGroups = exports.copy = exports.normalizeDeps = exports.getPulseInstance = exports.extractAll = exports.resetState = exports.cleanState = void 0;
const _1 = require(".");
const state_1 = require("./state");
function cleanState(state) {
    return {
        value: state.value,
        previousState: state.previousState,
        isSet: state.isSet,
        dependents: state.dep.deps.size,
        subscribers: state.dep.subs.size,
        name: state.name
    };
}
exports.cleanState = cleanState;
function resetState(items) {
    for (const item of items) {
        if (item instanceof _1.Collection)
            item.reset();
        if (item instanceof state_1.default)
            return item.reset();
        const stateSet = extractAll(state_1.default, item);
        stateSet.forEach(state => state.reset());
    }
}
exports.resetState = resetState;
/**
 * A helper function to extract all instances of a target instance from an object
 * If this function fails, it will do so silently, so it can be safely used without much knowledge of `inObj`.
 * @param findClass Class to extract instances of
 * @param inObj Object to find all instances of `findType` within
 */
function extractAll(findClass, inObj) {
    // safety net: object passed is not an obj, but rather an instance of the testClass in question, return that
    if (inObj instanceof findClass)
        return new Set([findClass]);
    // safety net: if type passed is not iterable, return empty set
    if (typeof inObj !== 'object')
        return new Set();
    // define return Set with typeof testClass
    const found = new Set();
    // storage for the look function's state
    let next = [inObj];
    function look() {
        let _next = [...next]; // copy last state
        next = []; // reset the original state
        _next.forEach(o => {
            const typelessObject = o;
            // look at every property in object
            for (let property in o) {
                // check if instance type of class
                if (o[property] instanceof findClass)
                    found.add(typelessObject[property]);
                // otherwise if object, store child object for next loop
                else if (isWatchableObject(o[property]) && !(typelessObject[property] instanceof _1.default))
                    next.push(typelessObject[property]);
            }
        });
        // if next state has items, loop function
        if (next.length > 0)
            look();
    }
    look();
    return found;
}
exports.extractAll = extractAll;
function getPulseInstance(state) {
    try {
        if (state.instance)
            return state.instance();
        else
            return globalThis.__pulse;
    }
    catch (e) { }
}
exports.getPulseInstance = getPulseInstance;
function normalizeDeps(deps) {
    return Array.isArray(deps) ? deps : [deps];
}
exports.normalizeDeps = normalizeDeps;
exports.copy = val => {
    if (isWatchableObject(val))
        val = Object.assign({}, val);
    else if (Array.isArray(val))
        val = [...val];
    return val;
};
// groups are defined by the user as an array of strings, this converts them into object/keys
function normalizeGroups(groupsAsArray = []) {
    const groups = {};
    for (let i = 0; i < groupsAsArray.length; i++) {
        const groupName = groupsAsArray[i];
        groups[groupName] = [];
    }
    return groups;
}
exports.normalizeGroups = normalizeGroups;
function shallowmerge(source, changes) {
    let keys = Object.keys(changes);
    keys.forEach(property => {
        source[property] = changes[property];
    });
    return source;
}
exports.shallowmerge = shallowmerge;
function defineConfig(config, defaults) {
    return Object.assign(Object.assign({}, defaults), config);
}
exports.defineConfig = defineConfig;
function genId() {
    return Math.random().toString().split('.')[1] + Date.now();
}
exports.genId = genId;
function isFunction(func) {
    return typeof func === 'function';
}
exports.isFunction = isFunction;
function isAsync(func) {
    return func.constructor.name === 'AsyncFunction';
}
exports.isAsync = isAsync;
function isWatchableObject(value) {
    function isHTMLElement(obj) {
        try {
            return obj instanceof HTMLElement;
        }
        catch (e) {
            return typeof obj === 'object' && obj.nodeType === 1 && typeof obj.style === 'object' && typeof obj.ownerDocument === 'object';
        }
    }
    let type = typeof value;
    return value != null && type == 'object' && !isHTMLElement(value) && !Array.isArray(value);
}
exports.isWatchableObject = isWatchableObject;
function normalizeMap(map) {
    return Array.isArray(map) ? map.map(key => ({ key, val: key })) : Object.keys(map).map(key => ({ key, val: map[key] }));
}
exports.normalizeMap = normalizeMap;
function cleanse(object) {
    if (!isWatchableObject(object))
        return object;
    const clean = Object.assign({}, object);
    const properties = Object.keys(clean);
    for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        if (isWatchableObject(clean[property])) {
            clean[property] = cleanse(clean[property]);
        }
    }
    return clean;
}
exports.cleanse = cleanse;
function validateNumber(mutable, amount) {
    if (typeof amount !== 'number' || typeof mutable !== 'number') {
        return false;
    }
    return true;
}
exports.validateNumber = validateNumber;

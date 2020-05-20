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
exports.__esModule = true;
exports.protectedNames = [
    'data',
    'indexes',
    'groups',
    'computed',
    'actions',
    'routes'
];
exports.moduleFunctions = [
    'watch',
    'throttle',
    'addStaticData',
    'debounce',
    'forceUpdate'
];
exports.collectionFunctions = __spreadArrays(exports.moduleFunctions, [
    'collect',
    'collectByKeys',
    'replaceIndex',
    'getGroup',
    'newGroup',
    'deleteGroup',
    'removeFromGroup',
    'update',
    'increment',
    'decrement',
    'delete',
    'purge',
    'findById',
    'put',
    'move',
    'watchData',
    'cleanse',
    // 'unsubscribe',
    // deprecated
    'remove'
]);
function defineConfig(config, defaults) {
    return __assign(__assign({}, defaults), config);
}
exports.defineConfig = defineConfig;
function parse(key) {
    var primaryKey = key.split('/')[1];
    var canBeNumber = Number(primaryKey);
    if (canBeNumber !== NaN)
        primaryKey = canBeNumber;
    return {
        collection: key.split('/')[0],
        primaryKey: primaryKey
    };
}
exports.parse = parse;
function genId() {
    return (Math.random()
        .toString()
        .split('.')[1] + Date.now());
}
exports.genId = genId;
function objectLoop(object, callback, keys) {
    var objectKeys = keys ? keys : Object.keys(object);
    for (var i = 0; i < objectKeys.length; i++) {
        var key_1 = objectKeys[i];
        var value = object[key_1];
        callback(key_1, value, objectKeys);
    }
}
exports.objectLoop = objectLoop;
function isWatchableObject(value) {
    function isHTMLElement(obj) {
        try {
            return obj instanceof HTMLElement;
        }
        catch (e) {
            return (typeof obj === 'object' &&
                obj.nodeType === 1 &&
                typeof obj.style === 'object' &&
                typeof obj.ownerDocument === 'object');
        }
    }
    var type = typeof value;
    return (value != null &&
        type == 'object' &&
        !isHTMLElement(value) &&
        !Array.isArray(value));
}
exports.isWatchableObject = isWatchableObject;
// const thing = {}
// objectLoop(thing, (thingKey, thingItem) => {
// })
function log(value, payload) {
    // console.log(`Pulse / ${value}`, payload ? payload : ' ');
}
exports.log = log;
function key(collection, property) {
    return collection + "/" + property;
}
exports.key = key;
function normalizeMap(map) {
    return Array.isArray(map)
        ? map.map(function (key) { return ({ key: key, val: key }); })
        : Object.keys(map).map(function (key) { return ({ key: key, val: map[key] }); });
}
exports.normalizeMap = normalizeMap;
exports.arrayFunctions = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
];
function cleanse(object) {
    if (!isWatchableObject(object))
        return object;
    var clean = Object.assign({}, object);
    var properties = Object.keys(clean);
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i];
        if (isWatchableObject(clean[property])) {
            clean[property] = cleanse(clean[property]);
        }
    }
    return clean;
}
exports.cleanse = cleanse;
function assert(func, funcName) {
    function warn(message) {
        // if (funcName) console.log(`PULSE // "${funcName}()" :: ${message}`);
        // else console.warn(`PULSE :: ${message}`);
        return false;
    }
    var warnings = {
        NO_PRIMARY_KEY: function () { return warn('No primary $1 key found! $2'); },
        INVALID_PARAMETER: function () { return warn('Invalid parameter supplied to function.'); },
        INDEX_NOT_FOUND: function () { return warn('Index was not found on collection.'); },
        INTERNAL_DATA_NOT_FOUND: function () { return warn('Data was not found on collection.'); },
        PROPERTY_NOT_A_NUMBER: function () { return warn('Property is not a number!'); }
    };
    return func(warnings)();
}
exports.assert = assert;
function validateNumber(mutable, amount) {
    if (typeof amount !== 'number' || typeof mutable !== 'number') {
        return false;
    }
    return true;
}
exports.validateNumber = validateNumber;
function createObj(array, sourceObject) {
    if (array === void 0) { array = []; }
    if (sourceObject === void 0) { sourceObject = {}; }
    var newObj = {};
    for (var i = 0; i < array.length; i++) {
        var property = array[i];
        if (sourceObject[property])
            newObj[property] = sourceObject[property];
    }
    return newObj;
}
exports.createObj = createObj;
// groups are defined by the user as an array of strings, this converts them into object/keys
function normalizeGroups(groupsAsArray) {
    if (groupsAsArray === void 0) { groupsAsArray = []; }
    var groups = {};
    for (var i = 0; i < groupsAsArray.length; i++) {
        var groupName = groupsAsArray[i];
        groups[groupName] = [];
    }
    return groups;
}
exports.normalizeGroups = normalizeGroups;
//# sourceMappingURL=helpers.js.map
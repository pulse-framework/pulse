"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isServer = exports.loadServerState = exports.preserveServerState = void 0;
const utils_1 = require("../utils");
const __1 = require("..");
const computed_1 = require("../computed");
function preserveServerState(nextProps, core) {
    const collections = utils_1.extractAll(__1.Collection, core);
    const state = utils_1.extractAll(__1.State, core);
    const PULSE_DATA = {
        collections: [],
        state: {}
    };
    state.forEach(stateItem => {
        if (stateItem.name && stateItem.isSet && !(stateItem instanceof computed_1.default))
            PULSE_DATA.state[stateItem.name] = stateItem._value;
    });
    collections.forEach(collection => {
        const collectionData = { data: {}, groups: {} };
        for (let key in collection.data)
            if (collection.data[key].isSet)
                collectionData.data[key] = collection.data[key]._value;
        for (let key in collection.groups)
            if (collection.groups[key].isSet)
                collectionData.groups[key] = collection.groups[key]._value;
        PULSE_DATA.collections.push(collectionData);
    });
    nextProps.props.PULSE_DATA = PULSE_DATA;
    return nextProps;
}
exports.preserveServerState = preserveServerState;
function loadServerState(core) {
    var _a, _b, _c;
    if (isServer())
        return;
    if ((_c = (_b = (_a = globalThis === null || globalThis === void 0 ? void 0 : globalThis.__NEXT_DATA__) === null || _a === void 0 ? void 0 : _a.props) === null || _b === void 0 ? void 0 : _b.pageProps) === null || _c === void 0 ? void 0 : _c.PULSE_DATA) {
        const pulseData = globalThis.__NEXT_DATA__.props.pageProps.PULSE_DATA;
        const state = utils_1.extractAll(__1.State, core);
        const collections = utils_1.extractAll(__1.Collection, core);
        state.forEach(item => {
            if (item.name && pulseData.state[item.name] && !(item instanceof computed_1.default))
                item.set(pulseData.state[item.name]);
        });
    }
}
exports.loadServerState = loadServerState;
function isServer() {
    var _a;
    return typeof process !== 'undefined' && ((_a = process === null || process === void 0 ? void 0 : process.release) === null || _a === void 0 ? void 0 : _a.name) === 'node';
}
exports.isServer = isServer;

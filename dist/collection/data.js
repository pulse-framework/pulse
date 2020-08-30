"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_1 = require("../state");
class Data extends state_1.State {
    constructor(collection, data) {
        super(collection().instance, data);
        this.collection = collection;
        this.type(Object);
        // this.name = data && data[collection().config.primaryKey];
    }
}
exports.default = Data;
// collection should detect if computed data dependency is own group, if so handle efficiently

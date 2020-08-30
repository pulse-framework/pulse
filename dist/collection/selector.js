"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const computed_1 = require("../computed");
const state_1 = require("../state");
const data_1 = require("./data");
class Selector extends computed_1.default {
    constructor(collection, key) {
        if (!key)
            key = 0;
        // initialize computed constructor with initial compute state
        super(collection().instance, () => findData(collection(), key));
        // computed function that returns a given item from collection
        this.func = () => findData(collection(), this._masterSelected);
        // alias collection function
        this.collection = collection;
        this.type(Object);
        this._masterSelected = key;
    }
    set id(val) {
        this._masterSelected = val;
        this.recompute();
    }
    get id() {
        return this._masterSelected;
    }
    select(key) {
        this.id = key;
    }
    persist(key) {
        if (!this.name && key)
            this.name = key;
        this.persistState = true;
        state_1.persistValue.bind(this)(key);
        return this;
    }
    getPersistableValue() {
        return this.id;
    }
}
exports.default = Selector;
function findData(collection, key) {
    let data = collection.findById(key).value;
    // if data is not found, create placeholder data, so that when real data is collected it maintains connection
    if (!data) {
        // this could be improved by storing temp refrences outside data object in collection
        collection.data[key] = new data_1.default(() => collection, { id: key });
        data = collection.findById(key).value;
    }
    return data;
}

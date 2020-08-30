"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusObject = void 0;
const utils_1 = require("./utils");
const initialData = {
    message: null,
    status: null
};
class StatusTracker {
    constructor(instance) {
        this.instance = instance;
        this.state = this.instance().State({});
    }
    get all() {
        return this.state.value;
    }
    get(key) {
        var _a;
        return (_a = this === null || this === void 0 ? void 0 : this.state) === null || _a === void 0 ? void 0 : _a.value[key];
    }
    set(key) {
        if (!this.state.value[key]) {
            this.state.set(Object.assign(utils_1.copy(this.state.value), { [key]: initialData }));
        }
        return new StatusObject(this.state, key);
    }
    remove(key) {
        if (!this.state.value[key])
            return;
        const copiedState = utils_1.copy(this.state.value);
        copiedState[key] = undefined;
        delete copiedState[key];
        this.state.set(copiedState);
    }
    clear(key) {
        // clearing a specific value
        if (key) {
            if (!this.state.value[key])
                return;
            const copiedState = utils_1.copy(this.state.value);
            copiedState[key] = initialData;
            this.state.set(copiedState);
            return;
        }
        this.state.reset();
    }
}
exports.default = StatusTracker;
class StatusObject {
    constructor(state, key) {
        this.state = state;
        this.key = key;
    }
    status(newStatus) {
        this.state.set(Object.assign(utils_1.copy(this.state.value), { [this.key]: { status: newStatus === 'none' ? null : newStatus } }));
        return this;
    }
    message(messageText) {
        this.state.set(Object.assign(utils_1.copy(this.state.value), { [this.key]: { message: messageText } }));
        return this;
    }
}
exports.StatusObject = StatusObject;

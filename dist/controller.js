"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Controller = void 0;
const state_1 = require("./state");
class Controller {
    constructor(config, spreadToRoot) {
        this.config = config;
        for (const propertyName in spreadToRoot)
            this[propertyName] = spreadToRoot[propertyName];
        for (const sectionName in this.config) {
            this[sectionName] = this.config[sectionName];
        }
        this.applyKeys();
    }
    applyKeys() {
        for (const name in this.state)
            if (name && this.state[name] instanceof state_1.State) {
                const state = this.state[name];
                if (!state.name)
                    state.key(name);
            }
    }
}
exports.Controller = Controller;

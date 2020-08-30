"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Dep {
    // public dynamic: Set<State> = new Set(); // cleanout foriegn deps on update
    constructor(initialDeps) {
        // static
        this.deps = new Set();
        this.subs = new Set();
        if (initialDeps)
            initialDeps.forEach(dep => this.deps.add(dep));
    }
    depend(instance) {
        if (instance.dep === this)
            return;
        this.deps.add(instance);
    }
}
exports.default = Dep;

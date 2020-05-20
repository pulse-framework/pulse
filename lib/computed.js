"use strict";
exports.__esModule = true;
var Computed = /** @class */ (function () {
    function Computed(global, parentModuleInstance, name, computedFunction) {
        this.global = global;
        this.parentModuleInstance = parentModuleInstance;
        this.name = name;
        this.computedFunction = computedFunction;
        this.relatedToGroup = [];
        this.dynamicRelation = null;
        this.hasRun = false;
    }
    Computed.prototype.run = function () {
        this.hasRun = true;
        // this.global.relations.cleanup(this.dynamicRelation);
        this.global.runningComputed = this;
        var context = this.global.getContext(this.parentModuleInstance);
        var output;
        try {
            output = this.computedFunction(context);
        }
        catch (error) {
            // during init computed functions that depend on the output of other computed function will throw an error since that computed function has not generated yet
            // fail silently and flush runtime
            this.global.runtime.finished();
            // if init complete, fail loudly
            if (this.global.initComplete)
                console.error(error);
        }
        // override output with default if undefined or null
        if ((output === undefined || output === null) &&
            this.global.config.computedDefault)
            output = this.global.config.computedDefault;
        this.global.runningComputed = false;
        return output;
    };
    return Computed;
}());
exports["default"] = Computed;
//# sourceMappingURL=computed.js.map
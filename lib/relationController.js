"use strict";
exports.__esModule = true;
var DynamicRelation = /** @class */ (function () {
    function DynamicRelation(updateThis) {
        this.updateThis = updateThis;
        this.depsToClean = new Set();
    }
    // perform cleanup of all references to this instance
    DynamicRelation.prototype.destroy = function () {
        var _this = this;
        this.depsToClean.forEach(function (dep) { return dep.dependents["delete"](_this); });
        delete this.updateThis.dynamicRelation;
    };
    return DynamicRelation;
}());
exports.DynamicRelation = DynamicRelation;
var RelationController = /** @class */ (function () {
    function RelationController(global) {
        this.global = global;
        this.relationBank = new Set();
    }
    // function called during runningComputed and runningPopulate
    RelationController.prototype.relate = function (updateThis, whenDepChanges) {
        if (!whenDepChanges)
            return; // if a dep is not found, abort
        var dep = whenDepChanges;
        if (!updateThis.dynamicRelation) {
            updateThis.dynamicRelation = new DynamicRelation(updateThis);
            this.relationBank.add(updateThis.dynamicRelation);
        }
        // save Dep inside relation so relation knows where to remove dependent from on cleanup
        updateThis.dynamicRelation.depsToClean.add(dep);
        // add dynamic relation as a dependent inside Dep
        dep.dependents.add(updateThis.dynamicRelation);
    };
    // when a job is complete with a dep that includes a dynamic
    RelationController.prototype.cleanup = function (dynamicRelation) {
        // perform cleanup, destroy dynamic relation
        if (!dynamicRelation)
            return;
        dynamicRelation.destroy(); // destroy all references
        this.relationBank["delete"](dynamicRelation); // remove last reference from bank
    };
    return RelationController;
}());
exports["default"] = RelationController;
var RelationTypes;
(function (RelationTypes) {
    RelationTypes["COMPUTED_DEPENDS_ON_DATA"] = "COMPUTED_DEPENDS_ON_DATA";
    RelationTypes["COMPUTED_DEPENDS_ON_GROUP"] = "COMPUTED_DEPENDS_ON_GROUP";
    RelationTypes["DATA_DEPENDS_ON_DEP"] = "DATA_DEPENDS_ON_DEP";
    RelationTypes["DATA_DEPENDS_ON_GROUP"] = "DATA_DEPENDS_ON_GROUP";
    RelationTypes["DATA_DEPENDS_ON_DATA"] = "DATA_DEPENDS_ON_DATA"; // used by findById() when run in populate()
})(RelationTypes = exports.RelationTypes || (exports.RelationTypes = {}));
//# sourceMappingURL=relationController.js.map
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var Action = /** @class */ (function () {
    function Action(parentModuleInstance, global, action, actionName) {
        this.parentModuleInstance = parentModuleInstance;
        this.global = global;
        this.action = action;
        this.actionName = actionName;
        this.executing = false;
        this.changes = new Set();
        this.prepare(action, global);
    }
    Action.prototype.prepare = function (action, global) {
        var _this = this;
        this.exec = function () {
            var _this_1 = this;
            var context = global.getContext(_this.parentModuleInstance);
            // wrap undo function with action context
            context.undo = function (error) { return _this_1.global.contextRef.undo(_this_1, error); };
            _this.declareActionRunning();
            var result;
            result = action.apply(null, [context].concat(Array.prototype.slice.call(arguments)));
            // run action with context
            _this.declareActionFinishedRunning();
            return result;
        };
    };
    //
    Action.prototype.declareActionRunning = function () {
        // empty actions previous cached changes
        this.changes.clear();
        this.executing = true;
        // allow runtime to track nested action
        this.global.runtime.runningActions.push(this);
        this.global.runtime.runningAction = this;
    };
    Action.prototype.declareActionFinishedRunning = function () {
        var runtime = this.global.runtime;
        this.executing = false;
        this.changes.clear();
        runtime.runningActions.pop();
        // restore previous running action
        var previousAction = runtime.runningActions[runtime.runningActions.length - 1];
        if (previousAction)
            runtime.runningAction = previousAction;
    };
    Action.prototype.debounce = function (stealthMom, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var _this_1 = this;
            return __generator(this, function (_a) {
                // already interval running, cancel
                if (this.debouncing)
                    clearInterval(this.debouncing);
                // set countdown to original amount
                this.ms = amount;
                return [2 /*return*/, new Promise(function (resolve) {
                        // set debouncing to current interval
                        _this_1.debouncing = setInterval(function () {
                            // if this interval makes it to zero
                            if (_this_1.ms == 0) {
                                clearInterval(_this_1.debouncing);
                                _this_1.debouncing = false;
                                return resolve(stealthMom());
                            }
                            --_this_1.ms;
                            // ensure this interval runs every millisecond
                        }, 1);
                    })];
            });
        });
    };
    Action.prototype.softDebounce = function (callback, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var _this_1 = this;
            return __generator(this, function (_a) {
                this.ms = amount;
                this.debounceCallback = callback;
                if (this.debouncing)
                    return [2 /*return*/];
                this.debouncing = setInterval(function () {
                    if (_this_1.ms == 0) {
                        clearInterval(_this_1.debouncing);
                        _this_1.debouncing = false;
                        _this_1.debounceCallback();
                    }
                    --_this_1.ms;
                }, 1);
                return [2 /*return*/];
            });
        });
    };
    return Action;
}());
exports["default"] = Action;
//# sourceMappingURL=action.js.map
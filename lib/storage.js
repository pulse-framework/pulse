"use strict";
exports.__esModule = true;
var Storage = /** @class */ (function () {
    function Storage(storageMethods) {
        if (storageMethods === void 0) { storageMethods = {}; }
        this.storageMethods = storageMethods;
        this.isPromise = false;
        this.storageReady = false;
        this.storageType = 'localStorage';
        if (storageMethods.async)
            this.isPromise = true;
        // assume if user provided get, set or remove methods that the storage type is custom
        if (storageMethods.get || storageMethods.set || storageMethods.remove) {
            this.storageType = 'custom';
        }
        if (this.localStorageAvailable() && this.storageType === 'localStorage') {
            this.storageReady = true;
            storageMethods.get = localStorage.getItem.bind(localStorage);
            storageMethods.set = localStorage.setItem.bind(localStorage);
            storageMethods.remove = localStorage.removeItem.bind(localStorage);
        }
        else {
            this.storageType = 'custom';
            if (this.check(storageMethods.get) &&
                this.check(storageMethods.set) &&
                this.check(storageMethods.remove)) {
                this.storageReady = true;
            }
            else {
                this.storageReady = false;
                // bad
            }
        }
    }
    Storage.prototype.get = function (moduleName, key) {
        var _this = this;
        if (!this.storageReady)
            return;
        if (this.isPromise) {
            return new Promise(function (resolve, reject) {
                _this.storageMethods
                    .get(_this.getKey(moduleName, key))
                    .then(function (res) {
                    // if result is not JSON for some reason, return it.
                    if (typeof res !== 'string')
                        return resolve(res);
                    resolve(JSON.parse(res));
                })["catch"](reject);
            });
        }
        else {
            return JSON.parse(this.storageMethods.get(this.getKey(moduleName, key)));
        }
    };
    Storage.prototype.set = function (moduleName, key, value) {
        if (!this.storageReady)
            return;
        this.storageMethods.set(this.getKey(moduleName, key), JSON.stringify(value));
    };
    Storage.prototype.remove = function (moduleName, key) {
        if (!this.storageReady)
            return;
        this.storageMethods.remove(this.getKey(moduleName, key));
    };
    Storage.prototype.getKey = function (moduleName, key) {
        return "_" + moduleName + "_" + key;
    };
    Storage.prototype.check = function (func) {
        return typeof func === 'function';
    };
    Storage.prototype.localStorageAvailable = function () {
        try {
            localStorage.setItem('_', '_');
            localStorage.removeItem('_');
            return true;
        }
        catch (e) {
            return false;
        }
    };
    return Storage;
}());
exports["default"] = Storage;
//# sourceMappingURL=storage.js.map
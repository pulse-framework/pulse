"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var module_1 = __importDefault(require("../module"));
var Request = /** @class */ (function (_super) {
    __extends(Request, _super);
    function Request(global, requestConfig) {
        var _this = this;
        // Before we invoke the parent class, we define some defaults
        var groups = [];
        var data = {
            baseURL: requestConfig.baseURL || '',
            mode: 'cors',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json'
            }
        };
        if (requestConfig.headers)
            Object.keys(requestConfig.headers).forEach(function (header) {
                data.headers[header] = requestConfig.headers[header];
            });
        if (requestConfig.credentials)
            data.credentials = requestConfig.credentials;
        if (requestConfig.mode)
            data.mode = requestConfig.mode;
        _this = _super.call(this, 'request', global, { groups: groups, data: data }) || this;
        _this.requestIntercept = requestConfig.requestIntercept;
        _this.responseIntercept = requestConfig.responseIntercept;
        _this.timeout = requestConfig.timeout;
        _this.saveHistory =
            typeof requestConfig.saveHistory === 'undefined' ? true : false;
        _this.global.request = {
            get: _this.get.bind(_this),
            post: _this.post.bind(_this),
            put: _this._put.bind(_this),
            patch: _this.patch.bind(_this),
            "delete": _this["delete"].bind(_this),
            queryify: _this.queryify.bind(_this)
        };
        return _this;
    }
    Request.prototype.get = function (url, headers) {
        return this.send(url, 'get', {}, headers);
    };
    Request.prototype.post = function (url, body, headers) {
        return this.send(url, 'post', body, headers);
    };
    Request.prototype._put = function (url, body, headers) {
        return this.send(url, 'put', body, headers);
    };
    Request.prototype.patch = function (url, body, headers) {
        return this.send(url, 'patch', body, headers);
    };
    Request.prototype["delete"] = function (url, body, headers) {
        return this.send(url, 'delete', body, headers);
    };
    Request.prototype.send = function (url, method, body, headers) {
        if (body === void 0) { body = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var requestHeaders, fullURL, options, response, contentType, final, keys, i, property;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestHeaders = Object.assign({}, this.public.object.headers);
                        if (headers)
                            Object.keys(headers).forEach(function (header) {
                                requestHeaders[header] = headers[header];
                            });
                        // If method is not get set application type
                        if (method !== 'get' && requestHeaders['Content-Type'] === undefined)
                            requestHeaders['Content-Type'] = 'application/json';
                        if (url.startsWith('http'))
                            fullURL = url;
                        else
                            fullURL = this.public.object.baseURL + "/" + url;
                        // Stringify body
                        body = JSON.stringify(body);
                        // Build options
                        this.options = {};
                        this.options.credentials = this.public.object.credentials;
                        this.options.mode = this.public.object.mode;
                        options = Object.assign({
                            headers: requestHeaders,
                            method: method.toUpperCase(),
                            body: method === 'get' ? null : body
                        }, this.options);
                        if (this.requestIntercept)
                            this.requestIntercept(this.global.getContext(this), options);
                        if (!this.timeout) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.race([
                                fetch(fullURL, options),
                                new Promise(function (resolve, reject) {
                                    return setTimeout(function () { return reject('timeout'); }, _this.timeout);
                                })
                            ])];
                    case 1:
                        response = _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, fetch(fullURL, options)];
                    case 3:
                        response = _a.sent();
                        _a.label = 4;
                    case 4:
                        contentType = response.headers.get('content-type');
                        if (!(contentType && contentType.indexOf('application/json') !== -1)) return [3 /*break*/, 6];
                        return [4 /*yield*/, response.json()];
                    case 5:
                        body = _a.sent();
                        return [3 /*break*/, 8];
                    case 6: return [4 /*yield*/, response.text()];
                    case 7:
                        body = _a.sent();
                        _a.label = 8;
                    case 8:
                        // history
                        if (!this.saveHistory)
                            this.collect({
                                id: Date.now(),
                                status: response.status,
                                timestamp: new Date(),
                                response: body
                            });
                        // If reponse body is an object, create a custom object with response function in prototype, so headers and the full response data can be accessed outside of this class
                        if (!Array.isArray(body) && typeof body === 'object') {
                            final = Object.create({
                                response: function () {
                                    return response;
                                }
                            });
                            keys = Object.keys(body);
                            for (i = 0; i < keys.length; i++) {
                                property = keys[i];
                                final[property] = body[property];
                            }
                            // if the body is not an object, we can not inject a prototype, so just return the rew body
                        }
                        else {
                            final = body;
                        }
                        // intercept response
                        if (this.responseIntercept) {
                            response.data = body;
                            this.responseIntercept(this.global.getContext(this), response);
                        }
                        // reject if bad response status
                        if (response.ok || response.redirected)
                            return [2 /*return*/, final];
                        // resolve response
                        throw final;
                }
            });
        });
    };
    // Adapted from: https://github.com/Gozala/querystring/blob/master/encode.js
    Request.prototype.queryify = function (obj) {
        var stringifyPrimitive = function (value) {
            switch (typeof value) {
                case 'string':
                    return value;
                case 'boolean':
                    return value ? 'true' : 'false';
                case 'number':
                    return isFinite(value) ? value : '';
                default:
                    return '';
            }
        };
        // validate input
        if (typeof obj != 'object')
            return;
        return Object.keys(obj)
            .map(function (key) {
            var encodedKey = encodeURIComponent(stringifyPrimitive(key)) + '=';
            // if value is an array, encode with same key as parent
            if (Array.isArray(obj[key]))
                return obj[key]
                    .map(function (value) {
                    return encodedKey + encodeURIComponent(stringifyPrimitive(value));
                })
                    .join('&');
            // join encoded key with value
            return encodedKey + encodeURIComponent(stringifyPrimitive(obj[key]));
        })
            .join('&');
    };
    return Request;
}(module_1["default"]));
exports["default"] = Request;
//# sourceMappingURL=request.js.map
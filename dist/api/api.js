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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChannel = void 0;
const ensureProperHeaders = headers => {
    let obj = {};
    Object.keys(headers).forEach(t => {
        obj[t.toLowerCase()] = headers[t];
    });
    return obj;
};
class API {
    constructor(config = { options: {} }) {
        this.config = config;
        if (config.options && config.options.headers) {
            config.options.headers = ensureProperHeaders(config.options.headers);
        }
        if (!config.options)
            config.options = {};
    }
    /**
     * Override API config and request options. Returns a modified instance this API with overrides applied.
     * @param config - O
     */
    with(config) {
        let _this = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        if (config.options && config.options.headers) {
            config.options.headers = ensureProperHeaders(Object.assign(Object.assign({}, _this.config.options.headers), config.options.headers));
        }
        _this.config = Object.assign(Object.assign({}, _this.config), config);
        return _this;
    }
    get(endpoint) {
        return this.send('GET', endpoint);
    }
    post(endpoint, payload) {
        return this.send('POST', endpoint, payload);
    }
    put(endpoint, payload) {
        return this.send('PUT', endpoint, payload);
    }
    patch(endpoint, payload) {
        return this.send('PATCH', endpoint, payload);
    }
    delete(endpoint, payload) {
        return this.send('DELETE', endpoint, payload);
    }
    send(method, endpoint, payload) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            // initial definitions
            let fullUrl, data, response, config = Object.assign({}, this.config);
            // inject method into request options
            config.options.method = method;
            if (!config.options.headers)
                config.options.headers = {};
            let originalType = config.options.headers['content-type'] || config.options.headers['Content-Type'];
            if (payload && payload._parts && payload.getParts) {
                // inject body if not get method
                config.options.body = payload;
                config.options.headers['content-type'] = 'multipart/form-data';
            }
            else if (typeof payload === 'object') {
                // inject body if not get method
                config.options.body = JSON.stringify(payload);
                config.options.headers['content-type'] = 'application/json';
            }
            else
                config.options.body = payload;
            // construct endpoint
            let path = this.config.path ? '/' + this.config.path : '';
            if (endpoint.startsWith('http'))
                fullUrl = endpoint;
            else
                fullUrl = `${this.config.baseURL ? this.config.baseURL : ''}${path}/${endpoint}`;
            if (config.requestIntercept)
                config.requestIntercept(Object.assign(Object.assign({}, config.options), { endpoint: fullUrl }));
            let timedout = false;
            if (this.config.timeout) {
                let t;
                const timeout = new Promise(resolve => {
                    t = setTimeout(() => {
                        timedout = true;
                        resolve();
                    }, this.config.timeout);
                });
                const request = new Promise((resolve, reject) => {
                    fetch(fullUrl, this.config.options)
                        .then(data => {
                        clearTimeout(t);
                        resolve(data);
                    })
                        .catch(reject);
                });
                response = yield Promise.race([timeout, request]);
            }
            else {
                response = yield fetch(fullUrl, this.config.options);
            }
            // Return the old content type header
            if (originalType)
                config.options.headers['content-type'] = originalType;
            // if we got here, PulseResponse is the actual response object
            let res = {
                status: timedout ? 408 : (_a = response) === null || _a === void 0 ? void 0 : _a.status,
                raw: response,
                data: {},
                type: ((_c = (_b = response) === null || _b === void 0 ? void 0 : _b.headers) === null || _c === void 0 ? void 0 : _c.get('content-type')) || 'text/plain',
                timedout
            };
            // extract response data
            if ((_d = res.type) === null || _d === void 0 ? void 0 : _d.includes('application/json')) {
                res.data = yield res.raw.json();
            }
            else if (typeof ((_e = res === null || res === void 0 ? void 0 : res.raw) === null || _e === void 0 ? void 0 : _e.text) === 'function') {
                res.data = yield res.raw.text();
            }
            if (config.responseIntercept)
                config.responseIntercept(res);
            return res;
        });
    }
}
exports.default = API;
const NotifyAPI = new API({
    timeout: 500,
    options: {}
});
exports.getChannel = channelId => NotifyAPI.with({
    options: { headers: { ['Content-Type']: 'multipart/form-data' } }
}).get(`channels/${channelId}`);

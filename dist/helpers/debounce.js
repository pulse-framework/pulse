"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = void 0;
exports.debounce = (func, wait, immediate) => {
    let timeout = 0;
    const debounced = function () {
        const context = this;
        const args = arguments;
        const later = function () {
            timeout = 0;
            if (!immediate)
                func.call(context, ...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = window.setTimeout(later, wait);
        if (callNow)
            func.call(context, ...args);
    };
    debounced.cancel = function () {
        clearTimeout(timeout);
        timeout = 0;
    };
    return debounced;
};

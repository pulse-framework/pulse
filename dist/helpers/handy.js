"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeArray = void 0;
function normalizeArray(items) {
    return Array.isArray(items) ? items : [items];
}
exports.normalizeArray = normalizeArray;

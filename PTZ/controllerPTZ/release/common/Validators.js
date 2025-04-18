"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isString = exports.isNumber = void 0;
const isString = value => typeof value === 'string' || value instanceof String;
exports.isString = isString;
const isNumber = value => typeof value === 'number';
exports.isNumber = isNumber;
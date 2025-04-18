"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lerp = exports.inverseLerp = void 0;
const lerp = (a, b, alpha) => a + alpha * (b - a);
exports.lerp = lerp;
const inverseLerp = (a, b, alpha) => (alpha - a) / (b - a);
exports.inverseLerp = inverseLerp;
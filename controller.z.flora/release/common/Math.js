"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lerp = exports.invlerp = exports.clamp = void 0;
const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
exports.clamp = clamp;
const lerp = (a, b, alpha) => a + alpha * (b - a);
exports.lerp = lerp;
const invlerp = (x, y, a) => clamp((a - x) / (y - x));
exports.invlerp = invlerp;
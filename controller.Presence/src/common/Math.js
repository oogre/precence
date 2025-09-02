

export const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
export const lerp = ( a, b, alpha ) => a + alpha * ( b - a );
export const invlerp = (x, y, a) => clamp((a - x) / (y - x));
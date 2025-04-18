

export const lerp = ( a, b, alpha ) => a + alpha * ( b - a );
export const inverseLerp = ( a, b, alpha ) => (alpha-a) / (b - a);
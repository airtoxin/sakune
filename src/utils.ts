export const unreachableCode = (x: never): never => {
  throw new Error(`Unreachable code: ${x}`);
};

export const seq = (num: number, base = 0): number[] =>
  Array.from(Array(num)).map((_, i) => base + i);

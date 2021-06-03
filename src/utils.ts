export const unreachableCode = (x: never): never => {
  throw new Error(`Unreachable code: ${x}`);
};

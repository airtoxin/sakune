import { Vector } from "./Vector";

export const unreachableCode = (x: never): never => {
  throw new Error(`Unreachable code: ${x}`);
};

export const seq = (num: number, base = 0): number[] =>
  Array.from(Array(num)).map((_, i) => base + i);

export const checkBoxHit = (
  mousePosition: Vector,
  boxOrigin: Vector,
  boxSize: Vector
): boolean => {
  return (
    boxOrigin.x < mousePosition.x &&
    mousePosition.x < boxOrigin.x + boxSize.x &&
    boxOrigin.y < mousePosition.y &&
    mousePosition.y < boxOrigin.y + boxSize.y
  );
};

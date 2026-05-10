import { expect, test } from "vite-plus/test";
import { squareGrid } from "../src/boards.ts";

test("cells enumerates rows × cols in row-major order", () => {
  const grid = squareGrid({ x: 0, y: 0, rows: 2, cols: 3, cellSize: 10 });
  expect(grid.cells()).toEqual([
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: 2 },
  ]);
});

test("cellToWorld returns the top-left corner offset by the grid origin", () => {
  const grid = squareGrid({ x: 40, y: 50, rows: 4, cols: 4, cellSize: 32 });
  expect(grid.cellToWorld({ row: 0, col: 0 })).toEqual({ x: 40, y: 50 });
  expect(grid.cellToWorld({ row: 1, col: 2 })).toEqual({ x: 104, y: 82 });
});

test("cellCenter returns the cell midpoint", () => {
  const grid = squareGrid({ x: 0, y: 0, rows: 2, cols: 2, cellSize: 64 });
  expect(grid.cellCenter({ row: 0, col: 0 })).toEqual({ x: 32, y: 32 });
  expect(grid.cellCenter({ row: 1, col: 1 })).toEqual({ x: 96, y: 96 });
});

test("worldToCell maps a point to the cell that contains it", () => {
  const grid = squareGrid({ x: 10, y: 20, rows: 4, cols: 4, cellSize: 50 });
  expect(grid.worldToCell({ x: 10, y: 20 })).toEqual({ row: 0, col: 0 });
  expect(grid.worldToCell({ x: 59, y: 69 })).toEqual({ row: 0, col: 0 });
  expect(grid.worldToCell({ x: 60, y: 70 })).toEqual({ row: 1, col: 1 });
  expect(grid.worldToCell({ x: 159, y: 169 })).toEqual({ row: 2, col: 2 });
});

test("worldToCell returns null when the point is outside the grid", () => {
  const grid = squareGrid({ x: 0, y: 0, rows: 2, cols: 2, cellSize: 50 });
  expect(grid.worldToCell({ x: -1, y: 10 })).toBeNull();
  expect(grid.worldToCell({ x: 10, y: -1 })).toBeNull();
  expect(grid.worldToCell({ x: 100, y: 10 })).toBeNull();
  expect(grid.worldToCell({ x: 10, y: 100 })).toBeNull();
});

test("worldToCell roundtrips with cellToWorld and cellCenter", () => {
  const grid = squareGrid({ x: 25, y: 25, rows: 3, cols: 3, cellSize: 40 });
  for (const cell of grid.cells()) {
    expect(grid.worldToCell(grid.cellCenter(cell))).toEqual(cell);
    expect(grid.worldToCell(grid.cellToWorld(cell))).toEqual(cell);
  }
});

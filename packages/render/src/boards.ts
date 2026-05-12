import type { Point } from "./types.ts";

export type SquareGridCell = {
  row: number;
  col: number;
};

export type SquareGridOptions = {
  x: number;
  y: number;
  rows: number;
  cols: number;
  cellSize: number;
};

export type BoardHelper<TCell> = {
  cells(): TCell[];
  cellToWorld(cell: TCell): Point;
  cellCenter(cell: TCell): Point;
  worldToCell(point: Point): TCell | null;
};

export function squareGrid(options: SquareGridOptions): BoardHelper<SquareGridCell> {
  const { x, y, rows, cols, cellSize } = options;

  const cells = (): SquareGridCell[] => {
    const result: SquareGridCell[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        result.push({ row, col });
      }
    }
    return result;
  };

  const cellToWorld = (cell: SquareGridCell): Point => ({
    x: x + cell.col * cellSize,
    y: y + cell.row * cellSize,
  });

  const cellCenter = (cell: SquareGridCell): Point => ({
    x: x + cell.col * cellSize + cellSize / 2,
    y: y + cell.row * cellSize + cellSize / 2,
  });

  const worldToCell = (point: Point): SquareGridCell | null => {
    const col = Math.floor((point.x - x) / cellSize);
    const row = Math.floor((point.y - y) / cellSize);
    if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
    return { row, col };
  };

  return { cells, cellToWorld, cellCenter, worldToCell };
}

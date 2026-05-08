import type { Point, SceneItem, Visual } from "./types.ts";

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

export type BoardRenderOptions<TCell, TMeta = unknown> = {
  visual?: (cell: TCell) => Visual;
  meta?: (cell: TCell) => TMeta;
  idPrefix?: string;
};

export type BoardHelper<TCell> = {
  cells(): TCell[];
  cellToWorld(cell: TCell): Point;
  cellCenter(cell: TCell): Point;
  worldToCell(point: Point): TCell | null;
  render<TMeta = unknown>(options?: BoardRenderOptions<TCell, TMeta>): SceneItem<TMeta>[];
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

  const render = <TMeta = unknown>(
    opts?: BoardRenderOptions<SquareGridCell, TMeta>,
  ): SceneItem<TMeta>[] => {
    const items: SceneItem<TMeta>[] = [];
    const prefix = opts?.idPrefix ?? "cell";
    for (const cell of cells()) {
      const world = cellToWorld(cell);
      items.push({
        type: "entity",
        id: `${prefix}-${cell.row}-${cell.col}`,
        x: world.x,
        y: world.y,
        size: { width: cellSize, height: cellSize },
        visual: opts?.visual?.(cell) ?? { type: "rect", stroke: "#ccc" },
        meta: opts?.meta?.(cell),
      });
    }
    return items;
  };

  return { cells, cellToWorld, cellCenter, worldToCell, render };
}

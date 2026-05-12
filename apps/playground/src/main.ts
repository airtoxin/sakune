import "./style.css";
import { createSakune, type HitResult, type SakuneScene, type SceneItem } from "sakune";
import { squareGrid } from "sakune/boards";

type Meta =
  | { type: "card"; cardId: string }
  | { type: "piece"; pieceId: string }
  | { type: "stack"; stackId: string };

type Position = { x: number; y: number };

type Card = {
  id: string;
  x: number;
  y: number;
};

type Deck = {
  id: "deck";
  x: number;
  y: number;
  cards: { id: string }[];
};

type StackPiece = { id: string; color: string };

type Pile = {
  id: string;
  x: number;
  y: number;
  pieces: StackPiece[];
};

const PIECE_WIDTH = 56;
const PIECE_HEIGHT = 40;
// Sakune's cylinder uses ry = min(width * 0.18, height * 0.45).
// Stacking by (H - 2*ry) makes each piece's bottom rim land exactly on
// the next piece's cap, leaving no visible gap.
const PIECE_CAP_RY = Math.min(PIECE_WIDTH * 0.18, PIECE_HEIGHT * 0.45);
const PIECE_STACK_OFFSET_Y = Math.round(-(PIECE_HEIGHT - 2 * PIECE_CAP_RY));

const deck: Deck = {
  id: "deck",
  x: 80,
  y: 100,
  cards: [{ id: "deck-1" }, { id: "deck-2" }, { id: "deck-3" }, { id: "deck-4" }],
};

const cards: Card[] = [
  { id: "card-A", x: 360, y: 80 },
  { id: "card-B", x: 460, y: 80 },
  { id: "card-C", x: 560, y: 80 },
];

const piles: Pile[] = [
  {
    id: "pile-tower",
    x: 200,
    y: 320,
    pieces: [
      { id: "stk-p1", color: "#1f1f1f" },
      { id: "stk-p2", color: "#fafafa" },
      { id: "stk-p3", color: "#1f1f1f" },
      { id: "stk-p4", color: "#fafafa" },
    ],
  },
  { id: "pile-A", x: 380, y: 380, pieces: [{ id: "p-A", color: "#1f1f1f" }] },
  { id: "pile-B", x: 460, y: 380, pieces: [{ id: "p-B", color: "#fafafa" }] },
  { id: "pile-C", x: 540, y: 380, pieces: [{ id: "p-C", color: "#1f1f1f" }] },
  { id: "pile-D", x: 620, y: 380, pieces: [{ id: "p-D", color: "#fafafa" }] },
];

let newPileCounter = 0;
function newPileId(): string {
  newPileCounter += 1;
  return `pile-${newPileCounter}`;
}

function findCard(id: string): Card | undefined {
  return cards.find((card) => card.id === id);
}

function moveCardToTop(id: string): void {
  const index = cards.findIndex((card) => card.id === id);
  if (index < 0) return;
  const [card] = cards.splice(index, 1);
  if (card) cards.push(card);
}

function findPile(id: string): Pile | undefined {
  return piles.find((pile) => pile.id === id);
}

function bringPileToTop(pile: Pile): void {
  const index = piles.indexOf(pile);
  if (index < 0 || index === piles.length - 1) return;
  piles.splice(index, 1);
  piles.push(pile);
}

function removeEmptyPiles(): void {
  for (let i = piles.length - 1; i >= 0; i--) {
    const pile = piles[i];
    if (pile && pile.pieces.length === 0) piles.splice(i, 1);
  }
}

function dropTargetPileId(target: HitResult<Meta> | null): string | null {
  if (!target) return null;
  if (target.type === "stack") return target.id;
  if (target.type === "stackItem") return target.stackId;
  return null;
}

function getEntityPosition(target: HitResult<Meta>): Position | null {
  if (target.type === "entity") return findCard(target.id) ?? null;
  if (target.type === "stack" && target.id === deck.id) return deck;
  return null;
}

function describeTarget(target: HitResult<Meta> | null): string {
  if (target === null) return "—";
  switch (target.type) {
    case "entity":
    case "stack":
    case "stackItem":
      return `${target.type}:${target.id}`;
    case "stackSlice":
      return `stackSlice:${target.stackId}#${target.fromIndex}`;
  }
}

let dragOffset: { dx: number; dy: number } | null = null;

const canvas = document.querySelector<HTMLCanvasElement>("#board");
const log = document.querySelector<HTMLPreElement>("#log");
if (!canvas || !log) {
  throw new Error("Required DOM elements not found.");
}

const GRID_CELL_SIZE = 56;
const grid = squareGrid({ x: 320, y: 210, rows: 2, cols: 8, cellSize: GRID_CELL_SIZE });

function pileOnCell(cell: { row: number; col: number }, excludePileId?: string): Pile | null {
  for (const pile of piles) {
    if (pile.id === excludePileId) continue;
    if (pile.pieces.length === 0) continue;
    const c = grid.worldToCell({
      x: pile.x + PIECE_WIDTH / 2,
      y: pile.y + PIECE_HEIGHT / 2,
    });
    if (c && c.row === cell.row && c.col === cell.col) return pile;
  }
  return null;
}

const sakune = createSakune<Meta>({
  canvas,
  snap: {
    drag: ({ target, world, startWorld }) => {
      if (target.type !== "stackSlice") return null;
      const cell = grid.worldToCell(world);
      if (!cell) return null;
      const sourcePile = findPile(target.stackId);
      if (!sourcePile) return null;
      const sliceX = sourcePile.x;
      const sliceY = sourcePile.y + PIECE_STACK_OFFSET_Y * target.fromIndex;

      const stackTarget = pileOnCell(cell, sourcePile.id);
      let targetSliceX: number;
      let targetSliceY: number;
      if (stackTarget) {
        // Land the slice anchor right above the existing pile's top piece
        // so the drag preview shows where pieces will end up after stacking.
        targetSliceX = stackTarget.x;
        targetSliceY = stackTarget.y + PIECE_STACK_OFFSET_Y * stackTarget.pieces.length;
      } else {
        const cellTopLeft = grid.cellToWorld(cell);
        targetSliceX = cellTopLeft.x + (GRID_CELL_SIZE - PIECE_WIDTH) / 2;
        targetSliceY = cellTopLeft.y + (GRID_CELL_SIZE - PIECE_HEIGHT) / 2;
      }
      return {
        x: startWorld.x + (targetSliceX - sliceX),
        y: startWorld.y + (targetSliceY - sliceY),
      };
    },
  },
});
sakune.resize(800, 480);

function pieceStrokes(color: string): { stroke: string; capStroke: string } {
  return {
    stroke: "#1f1f1f",
    capStroke: color === "#1f1f1f" ? "#8a8a8a" : "#1f1f1f",
  };
}

function pieceStackItem(piece: StackPiece): {
  id: string;
  size: { width: number; height: number };
  visual: {
    type: "cylinder";
    fill: string;
    stroke: string;
    capStroke: string;
  };
  hitArea: { type: "rect" };
  meta: Meta;
} {
  return {
    id: piece.id,
    size: { width: PIECE_WIDTH, height: PIECE_HEIGHT },
    visual: {
      type: "cylinder",
      fill: piece.color,
      ...pieceStrokes(piece.color),
    },
    hitArea: { type: "rect" },
    meta: { type: "piece", pieceId: piece.id },
  };
}

function buildScene(): SakuneScene<Meta> {
  const gridItems: SceneItem<Meta>[] = grid.cells().map((cell) => {
    const pos = grid.cellToWorld(cell);
    return {
      type: "entity",
      id: `grid-${cell.row}-${cell.col}`,
      x: pos.x,
      y: pos.y,
      size: { width: GRID_CELL_SIZE, height: GRID_CELL_SIZE },
      visual: {
        type: "rect",
        fill: (cell.row + cell.col) % 2 === 0 ? "#ede4ce" : "#dccfa9",
        stroke: "#bda878",
      },
    };
  });

  const items: SceneItem<Meta>[] = [
    ...gridItems,
    {
      type: "stack",
      id: deck.id,
      x: deck.x,
      y: deck.y,
      layout: { type: "pile", offset: { x: 0, y: -4 } },
      dragMode: "stack",
      meta: { type: "stack", stackId: deck.id },
      items: deck.cards.map((card) => ({
        id: card.id,
        size: { width: 96, height: 132 },
        visual: { type: "rect", fill: "#fff", stroke: "#333", radius: 10 },
        meta: { type: "card", cardId: card.id },
      })),
    },
    ...cards.map((card) => ({
      type: "entity" as const,
      id: card.id,
      x: card.x,
      y: card.y,
      size: { width: 80, height: 112 },
      visual: {
        type: "rect" as const,
        fill: "#fdf6e3",
        stroke: "#586e75",
        radius: 8,
      },
      draggable: true,
      meta: { type: "card" as const, cardId: card.id },
    })),
  ];

  for (const pile of piles) {
    if (pile.pieces.length === 0) continue;
    items.push({
      type: "stack",
      id: pile.id,
      x: pile.x,
      y: pile.y,
      layout: {
        type: "pile",
        offset: { x: -PIECE_STACK_OFFSET_Y, y: PIECE_STACK_OFFSET_Y },
      },
      dragMode: "slice-from-item",
      meta: { type: "stack", stackId: pile.id },
      items: pile.pieces.map(pieceStackItem),
    });
  }

  return { items };
}

sakune.on("dragStart", (event) => {
  log.textContent = `dragStart  ${describeTarget(event.target)}`;
  dragOffset = null;

  if (event.target.type === "stackSlice") {
    const sourcePile = findPile(event.target.stackId);
    if (!sourcePile) return;
    const sliceX = sourcePile.x;
    const sliceY = sourcePile.y + PIECE_STACK_OFFSET_Y * event.target.fromIndex;
    dragOffset = {
      dx: event.world.x - sliceX,
      dy: event.world.y - sliceY,
    };
    return;
  }

  const position = getEntityPosition(event.target);
  if (!position) return;
  dragOffset = {
    dx: event.world.x - position.x,
    dy: event.world.y - position.y,
  };
});

sakune.on("dragEnd", (event) => {
  const offset = dragOffset;
  dragOffset = null;
  log.textContent = `dragEnd    ${describeTarget(event.target)} → ${describeTarget(event.dropTarget)}`;

  if (event.target.type === "stackSlice") {
    const sourcePile = findPile(event.target.stackId);
    if (!sourcePile || !offset) return;
    const slicePieces = sourcePile.pieces.slice(event.target.fromIndex);
    sourcePile.pieces = sourcePile.pieces.slice(0, event.target.fromIndex);

    // When the drop lands on a grid cell that already holds a pile, stack
    // onto it even if the snapped preview hovered above the dropTarget hit.
    const cellAtDrop = grid.worldToCell(event.world);
    let targetPile: Pile | null = cellAtDrop ? pileOnCell(cellAtDrop, sourcePile.id) : null;
    if (!targetPile) {
      const targetPileId = dropTargetPileId(event.dropTarget);
      targetPile = targetPileId ? (findPile(targetPileId) ?? null) : null;
    }

    if (targetPile) {
      targetPile.pieces.push(...slicePieces);
      bringPileToTop(targetPile);
    } else {
      piles.push({
        id: newPileId(),
        x: event.previewWorld.x - offset.dx,
        y: event.previewWorld.y - offset.dy,
        pieces: slicePieces,
      });
    }

    removeEmptyPiles();
    sakune.setScene(buildScene());
    return;
  }

  if (offset) {
    const position = getEntityPosition(event.target);
    if (position) {
      position.x = event.previewWorld.x - offset.dx;
      position.y = event.previewWorld.y - offset.dy;
    }
  }

  if (event.target.type === "entity") {
    moveCardToTop(event.target.id);
  }

  sakune.setScene(buildScene());
});

sakune.on("click", (event) => {
  log.textContent = `click      ${describeTarget(event.target)}`;
});

sakune.setScene(buildScene());

import "./style.css";
import { createSakune, type HitResult, type SakuneScene, type SceneItem } from "sakune";

type Meta =
  | { type: "card"; cardId: string }
  | { type: "piece"; pieceId: string }
  | { type: "stack"; stackId: string };

type Position = { x: number; y: number };

type EntityKind = "card" | "piece";

type Entity = {
  id: string;
  kind: EntityKind;
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

type PieceStack = {
  id: "pieces";
  x: number;
  y: number;
  pieces: StackPiece[];
};

const PIECE_WIDTH = 56;
const PIECE_HEIGHT = 56;
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

const pieceStack: PieceStack = {
  id: "pieces",
  x: 200,
  y: 320,
  pieces: [
    { id: "stk-p1", color: "#1f1f1f" },
    { id: "stk-p2", color: "#fafafa" },
    { id: "stk-p3", color: "#1f1f1f" },
    { id: "stk-p4", color: "#fafafa" },
  ],
};

const entities: Entity[] = [
  { id: "card-A", kind: "card", x: 360, y: 80 },
  { id: "card-B", kind: "card", x: 460, y: 80 },
  { id: "card-C", kind: "card", x: 560, y: 80 },
  { id: "piece-black", kind: "piece", x: 380, y: 360 },
  { id: "piece-white", kind: "piece", x: 470, y: 360 },
];

function findEntity(id: string): Entity | undefined {
  return entities.find((entity) => entity.id === id);
}

function getPosition(id: string): Position | null {
  if (id === deck.id) return deck;
  return findEntity(id) ?? null;
}

function moveEntityToTop(id: string): void {
  const index = entities.findIndex((entity) => entity.id === id);
  if (index < 0) return;
  const [entity] = entities.splice(index, 1);
  if (entity) entities.push(entity);
}

function dragEntityId(target: HitResult<Meta>): string | null {
  switch (target.type) {
    case "entity":
    case "stack":
    case "stackItem":
      return target.id;
    case "stackSlice":
      return null;
  }
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

let activeSlice: {
  fromIndex: number;
  x: number;
  y: number;
} | null = null;

let dragOffset: { dx: number; dy: number } | null = null;

const canvas = document.querySelector<HTMLCanvasElement>("#board");
const log = document.querySelector<HTMLPreElement>("#log");
if (!canvas || !log) {
  throw new Error("Required DOM elements not found.");
}

const sakune = createSakune<Meta>({ canvas });
sakune.resize(800, 480);

function strokeFor(color: string): string {
  return color === "#1f1f1f" ? "#8a8a8a" : "#1f1f1f";
}

function pieceStackItem(piece: StackPiece): {
  id: string;
  size: { width: number; height: number };
  visual: { type: "cylinder"; fill: string; stroke: string };
  hitArea: { type: "rect" };
  meta: Meta;
} {
  return {
    id: piece.id,
    size: { width: PIECE_WIDTH, height: PIECE_HEIGHT },
    visual: {
      type: "cylinder",
      fill: piece.color,
      stroke: strokeFor(piece.color),
    },
    hitArea: { type: "rect" },
    meta: { type: "piece", pieceId: piece.id },
  };
}

function buildScene(): SakuneScene<Meta> {
  const sliceFrom = activeSlice?.fromIndex ?? pieceStack.pieces.length;
  const baseItems = pieceStack.pieces.slice(0, sliceFrom);
  const sliceItems = activeSlice ? pieceStack.pieces.slice(activeSlice.fromIndex) : [];

  const items: SceneItem<Meta>[] = [
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
    ...entities.map((entity) => {
      if (entity.kind === "card") {
        return {
          type: "entity" as const,
          id: entity.id,
          x: entity.x,
          y: entity.y,
          size: { width: 80, height: 112 },
          visual: {
            type: "rect" as const,
            fill: "#fdf6e3",
            stroke: "#586e75",
            radius: 8,
          },
          draggable: true,
          meta: { type: "card" as const, cardId: entity.id },
        };
      }
      const fill = entity.id === "piece-black" ? "#1f1f1f" : "#fafafa";
      return {
        type: "entity" as const,
        id: entity.id,
        x: entity.x,
        y: entity.y,
        size: { width: PIECE_WIDTH, height: PIECE_HEIGHT },
        visual: {
          type: "cylinder" as const,
          fill,
          stroke: strokeFor(fill),
        },
        hitArea: { type: "rect" as const },
        draggable: true,
        meta: { type: "piece" as const, pieceId: entity.id },
      };
    }),
  ];

  if (baseItems.length > 0) {
    items.push({
      type: "stack",
      id: pieceStack.id,
      x: pieceStack.x,
      y: pieceStack.y,
      layout: { type: "pile", offset: { x: 0, y: PIECE_STACK_OFFSET_Y } },
      dragMode: "slice-from-item",
      meta: { type: "stack", stackId: pieceStack.id },
      items: baseItems.map(pieceStackItem),
    });
  }

  if (activeSlice && sliceItems.length > 0) {
    items.push({
      type: "stack",
      id: `${pieceStack.id}-slice`,
      x: activeSlice.x,
      y: activeSlice.y,
      layout: { type: "pile", offset: { x: 0, y: PIECE_STACK_OFFSET_Y } },
      items: sliceItems.map(pieceStackItem),
    });
  }

  return { items };
}

sakune.on("dragStart", (event) => {
  log.textContent = `dragStart  ${describeTarget(event.target)}`;

  if (event.target.type === "stackSlice" && event.target.stackId === pieceStack.id) {
    const fromIndex = event.target.fromIndex;
    const sliceX = pieceStack.x;
    const sliceY = pieceStack.y + PIECE_STACK_OFFSET_Y * fromIndex;
    activeSlice = { fromIndex, x: sliceX, y: sliceY };
    dragOffset = {
      dx: event.world.x - sliceX,
      dy: event.world.y - sliceY,
    };
    sakune.setScene(buildScene());
    return;
  }

  const id = dragEntityId(event.target);
  if (id === null) return;
  const position = getPosition(id);
  if (!position) return;
  dragOffset = {
    dx: event.world.x - position.x,
    dy: event.world.y - position.y,
  };
});

sakune.on("dragMove", (event) => {
  if (!dragOffset) return;

  if (event.target.type === "stackSlice" && activeSlice) {
    activeSlice.x = event.world.x - dragOffset.dx;
    activeSlice.y = event.world.y - dragOffset.dy;
    sakune.setScene(buildScene());
    return;
  }

  const id = dragEntityId(event.target);
  if (id === null) return;
  const position = getPosition(id);
  if (!position) return;
  position.x = event.world.x - dragOffset.dx;
  position.y = event.world.y - dragOffset.dy;
  sakune.setScene(buildScene());
});

sakune.on("dragEnd", (event) => {
  dragOffset = null;
  log.textContent = `dragEnd    ${describeTarget(event.target)} → ${describeTarget(event.dropTarget)}`;

  if (event.target.type === "stackSlice") {
    activeSlice = null;
    sakune.setScene(buildScene());
    return;
  }

  const id = dragEntityId(event.target);
  if (id !== null && id !== deck.id) moveEntityToTop(id);
  sakune.setScene(buildScene());
});

sakune.on("click", (event) => {
  log.textContent = `click      ${describeTarget(event.target)}`;
});

sakune.setScene(buildScene());

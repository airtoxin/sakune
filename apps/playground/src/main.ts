import "./style.css";
import { createSakune, type HitResult, type SakuneScene } from "sakune";

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

const deck: Deck = {
  id: "deck",
  x: 80,
  y: 100,
  cards: [{ id: "deck-1" }, { id: "deck-2" }, { id: "deck-3" }, { id: "deck-4" }],
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

const canvas = document.querySelector<HTMLCanvasElement>("#board");
const log = document.querySelector<HTMLPreElement>("#log");
if (!canvas || !log) {
  throw new Error("Required DOM elements not found.");
}

const sakune = createSakune<Meta>({ canvas });
sakune.resize(800, 480);

function buildScene(): SakuneScene<Meta> {
  return {
    items: [
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
        return {
          type: "entity" as const,
          id: entity.id,
          x: entity.x,
          y: entity.y,
          size: { width: 56, height: 56 },
          visual: {
            type: "circle" as const,
            fill: entity.id === "piece-black" ? "#1f1f1f" : "#fafafa",
            stroke: "#1f1f1f",
          },
          hitArea: { type: "circle" as const },
          draggable: true,
          meta: { type: "piece" as const, pieceId: entity.id },
        };
      }),
    ],
  };
}

let dragOffset: { dx: number; dy: number } | null = null;

sakune.on("dragStart", (event) => {
  const id = dragEntityId(event.target);
  if (id === null) return;
  const position = getPosition(id);
  if (!position) return;
  dragOffset = {
    dx: event.world.x - position.x,
    dy: event.world.y - position.y,
  };
  log.textContent = `dragStart  ${describeTarget(event.target)}`;
});

sakune.on("dragMove", (event) => {
  if (!dragOffset) return;
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
  const id = dragEntityId(event.target);
  if (id !== null && id !== deck.id) moveEntityToTop(id);
  sakune.setScene(buildScene());
  log.textContent = `dragEnd    ${describeTarget(event.target)} → ${describeTarget(event.dropTarget)}`;
});

sakune.on("click", (event) => {
  log.textContent = `click      ${describeTarget(event.target)}`;
});

sakune.setScene(buildScene());

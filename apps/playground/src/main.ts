import "./style.css";
import { createSakune, type SakuneScene } from "sakune";

type Meta = { type: "card"; cardId: string } | { type: "piece"; pieceId: string };

type Movable = {
  id: string;
  x: number;
  y: number;
};

const cards: Movable[] = [
  { id: "card-A", x: 360, y: 80 },
  { id: "card-B", x: 460, y: 80 },
  { id: "card-C", x: 560, y: 80 },
];

const pieces: Movable[] = [
  { id: "piece-black", x: 380, y: 360 },
  { id: "piece-white", x: 470, y: 360 },
];

const movables = new Map<string, Movable>();
for (const item of [...cards, ...pieces]) movables.set(item.id, item);

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
        id: "deck",
        x: 80,
        y: 80,
        layout: { type: "pile", offset: { x: 0, y: -4 } },
        items: [
          {
            id: "deck-1",
            size: { width: 96, height: 132 },
            visual: { type: "rect", fill: "#fff", stroke: "#333", radius: 10 },
            meta: { type: "card", cardId: "deck-1" },
          },
          {
            id: "deck-2",
            size: { width: 96, height: 132 },
            visual: { type: "rect", fill: "#fff", stroke: "#333", radius: 10 },
            meta: { type: "card", cardId: "deck-2" },
          },
          {
            id: "deck-3",
            size: { width: 96, height: 132 },
            visual: { type: "rect", fill: "#fff", stroke: "#333", radius: 10 },
            meta: { type: "card", cardId: "deck-3" },
          },
          {
            id: "deck-4",
            size: { width: 96, height: 132 },
            visual: { type: "rect", fill: "#fff", stroke: "#333", radius: 10 },
            meta: { type: "card", cardId: "deck-4" },
          },
        ],
      },
      ...cards.map((c) => ({
        type: "entity" as const,
        id: c.id,
        x: c.x,
        y: c.y,
        size: { width: 80, height: 112 },
        visual: {
          type: "rect" as const,
          fill: "#fdf6e3",
          stroke: "#586e75",
          radius: 8,
        },
        draggable: true,
        meta: { type: "card" as const, cardId: c.id },
      })),
      ...pieces.map((p) => ({
        type: "entity" as const,
        id: p.id,
        x: p.x,
        y: p.y,
        size: { width: 56, height: 56 },
        visual: {
          type: "circle" as const,
          fill: p.id === "piece-black" ? "#1f1f1f" : "#fafafa",
          stroke: "#1f1f1f",
        },
        hitArea: { type: "circle" as const },
        draggable: true,
        meta: { type: "piece" as const, pieceId: p.id },
      })),
    ],
  };
}

let dragOffset: { dx: number; dy: number } | null = null;

sakune.on("dragStart", (event) => {
  const item = movables.get(event.entityId);
  if (!item) return;
  dragOffset = {
    dx: event.world.x - item.x,
    dy: event.world.y - item.y,
  };
  log.textContent = `dragStart  ${event.entityId}`;
});

sakune.on("dragMove", (event) => {
  if (!dragOffset) return;
  const item = movables.get(event.entityId);
  if (!item) return;
  item.x = event.world.x - dragOffset.dx;
  item.y = event.world.y - dragOffset.dy;
  sakune.setScene(buildScene());
});

sakune.on("dragEnd", (event) => {
  dragOffset = null;
  log.textContent = `dragEnd    ${event.entityId} → ${event.target?.id ?? "—"}`;
});

sakune.on("click", (event) => {
  log.textContent = `click      ${event.target?.id ?? "(empty)"}`;
});

sakune.setScene(buildScene());

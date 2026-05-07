import "./style.css";
import { createSakune, type SakuneScene } from "sakune";

type Meta = { type: "card"; cardId: string } | { type: "piece"; pieceId: string };

type EntityKind = "card" | "piece";

type Entity = {
  id: string;
  kind: EntityKind;
  x: number;
  y: number;
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

function moveEntityToTop(id: string): void {
  const index = entities.findIndex((entity) => entity.id === id);
  if (index < 0) return;
  const [entity] = entities.splice(index, 1);
  if (entity) entities.push(entity);
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
  const entity = findEntity(event.entityId);
  if (!entity) return;
  dragOffset = {
    dx: event.world.x - entity.x,
    dy: event.world.y - entity.y,
  };
  log.textContent = `dragStart  ${event.entityId}`;
});

sakune.on("dragMove", (event) => {
  if (!dragOffset) return;
  const entity = findEntity(event.entityId);
  if (!entity) return;
  entity.x = event.world.x - dragOffset.dx;
  entity.y = event.world.y - dragOffset.dy;
  sakune.setScene(buildScene());
});

sakune.on("dragEnd", (event) => {
  dragOffset = null;
  moveEntityToTop(event.entityId);
  sakune.setScene(buildScene());
  log.textContent = `dragEnd    ${event.entityId} → ${event.target?.id ?? "—"}`;
});

sakune.on("click", (event) => {
  log.textContent = `click      ${event.target?.id ?? "(empty)"}`;
});

sakune.setScene(buildScene());

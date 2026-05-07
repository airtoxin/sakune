import { expect, test } from "vite-plus/test";
import { flattenScene } from "../src/flatten.ts";

test("flattenScene preserves entity order", () => {
  const drawables = flattenScene({
    items: [
      {
        type: "entity",
        id: "a",
        x: 10,
        y: 20,
        size: { width: 50, height: 50 },
        visual: { type: "rect" },
      },
      {
        type: "entity",
        id: "b",
        x: 30,
        y: 40,
        size: { width: 50, height: 50 },
        visual: { type: "rect" },
      },
    ],
  });

  expect(drawables.map((d) => d.id)).toEqual(["a", "b"]);
  expect(drawables.map((d) => d.order)).toEqual([0, 1]);
});

test("flattenScene applies stack offset per index", () => {
  const drawables = flattenScene({
    items: [
      {
        type: "stack",
        id: "deck",
        x: 100,
        y: 200,
        layout: { type: "pile", offset: { x: 0, y: -4 } },
        items: [
          {
            id: "card-1",
            size: { width: 80, height: 112 },
            visual: { type: "rect" },
          },
          {
            id: "card-2",
            size: { width: 80, height: 112 },
            visual: { type: "rect" },
          },
          {
            id: "card-3",
            size: { width: 80, height: 112 },
            visual: { type: "rect" },
          },
        ],
      },
    ],
  });

  expect(drawables).toHaveLength(3);
  expect(drawables[0]).toMatchObject({ id: "card-1", x: 100, y: 200 });
  expect(drawables[1]).toMatchObject({ id: "card-2", x: 100, y: 196 });
  expect(drawables[2]).toMatchObject({ id: "card-3", x: 100, y: 192 });
});

test("flattenScene defaults stack offset to (0, -4)", () => {
  const drawables = flattenScene({
    items: [
      {
        type: "stack",
        id: "stk",
        x: 0,
        y: 0,
        items: [
          { id: "a", size: { width: 10, height: 10 }, visual: { type: "rect" } },
          { id: "b", size: { width: 10, height: 10 }, visual: { type: "rect" } },
        ],
      },
    ],
  });

  expect(drawables[1]).toMatchObject({ x: 0, y: -4 });
});

test("flattenScene assigns global order across mixed items", () => {
  const drawables = flattenScene({
    items: [
      {
        type: "entity",
        id: "e1",
        x: 0,
        y: 0,
        size: { width: 10, height: 10 },
        visual: { type: "rect" },
      },
      {
        type: "stack",
        id: "s",
        x: 0,
        y: 0,
        items: [
          { id: "s1", size: { width: 10, height: 10 }, visual: { type: "rect" } },
          { id: "s2", size: { width: 10, height: 10 }, visual: { type: "rect" } },
        ],
      },
      {
        type: "entity",
        id: "e2",
        x: 0,
        y: 0,
        size: { width: 10, height: 10 },
        visual: { type: "rect" },
      },
    ],
  });

  expect(drawables.map((d) => `${d.id}:${d.order}`)).toEqual(["e1:0", "s1:1", "s2:2", "e2:3"]);
});

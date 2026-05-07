import { expect, test } from "vite-plus/test";
import {
  hitTestDrawables,
  isInDragGroup,
  pointInDrawable,
  toDragTarget,
  toHitResult,
} from "../src/hitTest.ts";
import type { Drawable } from "../src/types.ts";

const makeDrawable = (overrides: Partial<Drawable> = {}): Drawable => ({
  id: "d",
  x: 0,
  y: 0,
  size: { width: 100, height: 100 },
  visual: { type: "rect" },
  order: 0,
  ...overrides,
});

test("rect hit area covers item bounding box (inclusive)", () => {
  const d = makeDrawable({ x: 10, y: 20, size: { width: 30, height: 40 } });
  expect(pointInDrawable(d, { x: 10, y: 20 })).toBe(true);
  expect(pointInDrawable(d, { x: 40, y: 60 })).toBe(true);
  expect(pointInDrawable(d, { x: 41, y: 60 })).toBe(false);
  expect(pointInDrawable(d, { x: 9, y: 30 })).toBe(false);
});

test("circle hit area uses min(width, height) / 2 around center", () => {
  const d = makeDrawable({
    x: 0,
    y: 0,
    size: { width: 100, height: 60 },
    hitArea: { type: "circle" },
  });
  expect(pointInDrawable(d, { x: 50, y: 30 })).toBe(true);
  expect(pointInDrawable(d, { x: 50, y: 0 })).toBe(true);
  expect(pointInDrawable(d, { x: 80, y: 30 })).toBe(true);
  expect(pointInDrawable(d, { x: 81, y: 30 })).toBe(false);
});

test("hitArea defaults to rect when unspecified", () => {
  const d = makeDrawable({ x: 0, y: 0, size: { width: 10, height: 10 } });
  expect(pointInDrawable(d, { x: 5, y: 5 })).toBe(true);
  expect(pointInDrawable(d, { x: 11, y: 5 })).toBe(false);
});

test("hitTestDrawables skips items matched by the exclude predicate", () => {
  const drawables: Drawable[] = [
    makeDrawable({
      id: "back",
      x: 0,
      y: 0,
      size: { width: 100, height: 100 },
      order: 0,
    }),
    makeDrawable({
      id: "front",
      x: 0,
      y: 0,
      size: { width: 100, height: 100 },
      order: 1,
    }),
  ];
  expect(hitTestDrawables(drawables, { x: 50, y: 50 })?.id).toBe("front");
  expect(hitTestDrawables(drawables, { x: 50, y: 50 }, (d) => d.id === "front")?.id).toBe("back");
  expect(hitTestDrawables(drawables, { x: 50, y: 50 }, (d) => d.id === "back")?.id).toBe("front");
});

test("toHitResult reports entity / stack / stackItem variants", () => {
  expect(
    toHitResult(makeDrawable({ id: "e", meta: { kind: "entity" } as unknown as never })),
  ).toEqual({ type: "entity", id: "e", meta: { kind: "entity" } });

  expect(
    toHitResult(
      makeDrawable({
        id: "c1",
        stackId: "deck",
        stackIndex: 1,
        stackDragMode: "stack",
        stackMeta: { kind: "deck" } as unknown as never,
        meta: { kind: "card" } as unknown as never,
      }),
    ),
  ).toEqual({ type: "stack", id: "deck", meta: { kind: "deck" } });

  expect(
    toHitResult(
      makeDrawable({
        id: "c1",
        stackId: "hand",
        stackIndex: 2,
        stackDragMode: "item",
        stackMeta: { kind: "hand" } as unknown as never,
        meta: { kind: "card" } as unknown as never,
      }),
    ),
  ).toEqual({
    type: "stackItem",
    id: "c1",
    meta: { kind: "card" },
    stackId: "hand",
    stackMeta: { kind: "hand" },
    index: 2,
  });
});

test("toDragTarget expands slice-from-item into a stackSlice", () => {
  const drawables: Drawable[] = [0, 1, 2, 3].map((i) =>
    makeDrawable({
      id: `c${i}`,
      stackId: "tab",
      stackIndex: i,
      stackDragMode: "slice-from-item",
      stackMeta: { kind: "tableau" } as unknown as never,
      meta: { kind: "card", id: `c${i}` } as unknown as never,
    }),
  );

  const target = toDragTarget(drawables[1] as Drawable, drawables);

  expect(target).toEqual({
    type: "stackSlice",
    stackId: "tab",
    stackMeta: { kind: "tableau" },
    fromIndex: 1,
    items: [
      { id: "c1", meta: { kind: "card", id: "c1" }, index: 1 },
      { id: "c2", meta: { kind: "card", id: "c2" }, index: 2 },
      { id: "c3", meta: { kind: "card", id: "c3" }, index: 3 },
    ],
  });
});

test("isInDragGroup matches drawables for each target variant", () => {
  const entityTarget = {
    type: "entity" as const,
    id: "e",
  };
  expect(isInDragGroup(makeDrawable({ id: "e" }), entityTarget)).toBe(true);
  expect(isInDragGroup(makeDrawable({ id: "x" }), entityTarget)).toBe(false);

  const stackTarget = { type: "stack" as const, id: "deck" };
  expect(
    isInDragGroup(makeDrawable({ id: "c1", stackId: "deck", stackIndex: 0 }), stackTarget),
  ).toBe(true);
  expect(isInDragGroup(makeDrawable({ id: "c1", stackId: "hand" }), stackTarget)).toBe(false);

  const sliceTarget = {
    type: "stackSlice" as const,
    stackId: "tab",
    fromIndex: 2,
    items: [],
  };
  expect(
    isInDragGroup(makeDrawable({ id: "c1", stackId: "tab", stackIndex: 1 }), sliceTarget),
  ).toBe(false);
  expect(
    isInDragGroup(makeDrawable({ id: "c2", stackId: "tab", stackIndex: 2 }), sliceTarget),
  ).toBe(true);
  expect(
    isInDragGroup(makeDrawable({ id: "c3", stackId: "tab", stackIndex: 3 }), sliceTarget),
  ).toBe(true);
});

test("hitTestDrawables returns the topmost (last-drawn) item", () => {
  const drawables: Drawable[] = [
    makeDrawable({
      id: "back",
      x: 0,
      y: 0,
      size: { width: 100, height: 100 },
      order: 0,
    }),
    makeDrawable({
      id: "front",
      x: 20,
      y: 20,
      size: { width: 50, height: 50 },
      order: 1,
    }),
  ];
  expect(hitTestDrawables(drawables, { x: 30, y: 30 })?.id).toBe("front");
  expect(hitTestDrawables(drawables, { x: 5, y: 5 })?.id).toBe("back");
  expect(hitTestDrawables(drawables, { x: 200, y: 200 })).toBeNull();
});

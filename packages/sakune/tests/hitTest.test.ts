import { expect, test } from "vite-plus/test";
import { hitTestDrawables, pointInDrawable } from "../src/hitTest.ts";
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

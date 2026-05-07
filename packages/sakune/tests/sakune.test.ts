import { afterEach, beforeEach, expect, test } from "vite-plus/test";
import { createSakune } from "../src/sakune.ts";
import type { HitResult } from "../src/types.ts";

type MockCtxCall = { method: string; args: unknown[] };

type MockContext = {
  calls: MockCtxCall[];
  save: (...args: unknown[]) => void;
  restore: (...args: unknown[]) => void;
  setTransform: (...args: unknown[]) => void;
  clearRect: (...args: unknown[]) => void;
  scale: (...args: unknown[]) => void;
  beginPath: (...args: unknown[]) => void;
  rect: (...args: unknown[]) => void;
  roundRect: (...args: unknown[]) => void;
  arc: (...args: unknown[]) => void;
  fill: (...args: unknown[]) => void;
  stroke: (...args: unknown[]) => void;
  fillText: (...args: unknown[]) => void;
  fillStyle: string;
  strokeStyle: string;
  font: string;
  textBaseline: CanvasTextBaseline;
};

function createMockContext(): MockContext {
  const calls: MockCtxCall[] = [];
  const record =
    (method: string) =>
    (...args: unknown[]): void => {
      calls.push({ method, args });
    };
  return {
    calls,
    save: record("save"),
    restore: record("restore"),
    setTransform: record("setTransform"),
    clearRect: record("clearRect"),
    scale: record("scale"),
    beginPath: record("beginPath"),
    rect: record("rect"),
    roundRect: record("roundRect"),
    arc: record("arc"),
    fill: record("fill"),
    stroke: record("stroke"),
    fillText: record("fillText"),
    fillStyle: "",
    strokeStyle: "",
    font: "",
    textBaseline: "alphabetic",
  };
}

type CanvasHandlers = Map<string, Set<(event: PointerEvent) => void>>;

type MockCanvasHarness = {
  canvas: HTMLCanvasElement;
  ctx: MockContext;
  fire: (type: string, event: Partial<PointerEvent>) => void;
  pointerCaptured: number[];
  pointerReleased: number[];
};

function createMockCanvas(): MockCanvasHarness {
  const ctx = createMockContext();
  const handlers: CanvasHandlers = new Map();
  const pointerCaptured: number[] = [];
  const pointerReleased: number[] = [];

  const obj = {
    width: 800,
    height: 600,
    style: { width: "", height: "" } as Record<string, string>,
    getContext(type: string): MockContext | null {
      return type === "2d" ? ctx : null;
    },
    addEventListener(type: string, handler: (event: PointerEvent) => void): void {
      let set = handlers.get(type);
      if (!set) {
        set = new Set();
        handlers.set(type, set);
      }
      set.add(handler);
    },
    removeEventListener(type: string, handler: (event: PointerEvent) => void): void {
      handlers.get(type)?.delete(handler);
    },
    getBoundingClientRect(): DOMRect {
      return {
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: obj.width,
        bottom: obj.height,
        width: obj.width,
        height: obj.height,
        toJSON: () => ({}),
      } as DOMRect;
    },
    setPointerCapture(id: number): void {
      pointerCaptured.push(id);
    },
    releasePointerCapture(id: number): void {
      pointerReleased.push(id);
    },
  };

  const fire = (type: string, event: Partial<PointerEvent>): void => {
    const set = handlers.get(type);
    if (!set) return;
    for (const handler of set) handler(event as PointerEvent);
  };

  return {
    canvas: obj as unknown as HTMLCanvasElement,
    ctx,
    fire,
    pointerCaptured,
    pointerReleased,
  };
}

let rafQueue: ((time: number) => void)[] = [];
let originalRaf: typeof globalThis.requestAnimationFrame | undefined;

beforeEach(() => {
  rafQueue = [];
  originalRaf = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = ((cb: (time: number) => void) => {
    rafQueue.push(cb);
    return rafQueue.length;
  }) as typeof requestAnimationFrame;
});

afterEach(() => {
  if (originalRaf !== undefined) {
    globalThis.requestAnimationFrame = originalRaf;
  }
});

function flushRaf(): void {
  const queue = rafQueue;
  rafQueue = [];
  for (const cb of queue) cb(0);
}

test("setScene defers rendering until next animation frame", () => {
  const { canvas, ctx } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  sakune.setScene({
    items: [
      {
        type: "entity",
        id: "a",
        x: 0,
        y: 0,
        size: { width: 50, height: 50 },
        visual: { type: "rect", fill: "#fff" },
      },
    ],
  });

  expect(ctx.calls.find((c) => c.method === "rect")).toBeUndefined();
  flushRaf();
  expect(ctx.calls.find((c) => c.method === "rect")).toBeDefined();
});

test("multiple setScene calls coalesce into a single rAF", () => {
  const { canvas } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  sakune.setScene({ items: [] });
  sakune.setScene({ items: [] });
  sakune.setScene({ items: [] });
  expect(rafQueue).toHaveLength(1);
  flushRaf();

  sakune.setScene({ items: [] });
  expect(rafQueue).toHaveLength(1);
});

test("render scales context by pixelRatio", () => {
  const { canvas, ctx } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 2 });

  sakune.setScene({ items: [] });
  flushRaf();

  const scaleCall = ctx.calls.find((c) => c.method === "scale");
  expect(scaleCall?.args).toEqual([2, 2]);
});

test("resize updates buffer size, CSS size, and triggers redraw", () => {
  const { canvas } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 2 });

  sakune.resize(400, 300);
  expect(canvas.width).toBe(800);
  expect(canvas.height).toBe(600);
  expect(canvas.style.width).toBe("400px");
  expect(canvas.style.height).toBe("300px");
  expect(rafQueue).toHaveLength(1);
});

test("hitTest returns the topmost drawable as an entity result", () => {
  const { canvas } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  sakune.setScene({
    items: [
      {
        type: "entity",
        id: "back",
        x: 0,
        y: 0,
        size: { width: 100, height: 100 },
        visual: { type: "rect" },
      },
      {
        type: "entity",
        id: "front",
        x: 20,
        y: 20,
        size: { width: 30, height: 30 },
        visual: { type: "rect" },
      },
    ],
  });

  expect(sakune.hitTest({ x: 25, y: 25 })).toEqual({
    type: "entity",
    id: "front",
    meta: undefined,
  });
  expect(sakune.hitTest({ x: 5, y: 5 })).toEqual({
    type: "entity",
    id: "back",
    meta: undefined,
  });
  expect(sakune.hitTest({ x: 200, y: 200 })).toBeNull();
});

test("on returns a cleanup that detaches the handler", () => {
  const { canvas, fire } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  let calls = 0;
  const off = sakune.on("click", () => {
    calls++;
  });

  fire("pointerdown", { pointerId: 1, clientX: 10, clientY: 10 });
  fire("pointerup", { pointerId: 1, clientX: 10, clientY: 10 });
  expect(calls).toBe(1);

  off();
  fire("pointerdown", { pointerId: 1, clientX: 10, clientY: 10 });
  fire("pointerup", { pointerId: 1, clientX: 10, clientY: 10 });
  expect(calls).toBe(1);
});

test("click event reports the entity hit at pointerup", () => {
  type Meta = { kind: "card"; id: string };
  const { canvas, fire } = createMockCanvas();
  const sakune = createSakune<Meta>({ canvas, pixelRatio: 1 });

  sakune.setScene({
    items: [
      {
        type: "entity",
        id: "card-1",
        x: 0,
        y: 0,
        size: { width: 80, height: 100 },
        visual: { type: "rect" },
        meta: { kind: "card", id: "card-1" },
      },
    ],
  });

  const received: (HitResult<Meta> | null)[] = [];
  sakune.on("click", (event) => {
    received.push(event.target);
  });

  fire("pointerdown", { pointerId: 1, clientX: 10, clientY: 10 });
  fire("pointerup", { pointerId: 1, clientX: 10, clientY: 10 });

  expect(received).toEqual([
    {
      type: "entity",
      id: "card-1",
      meta: { kind: "card", id: "card-1" },
    },
  ]);
});

test("click event reports null target when pressed in empty space", () => {
  const { canvas, fire } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  const received: (HitResult | null)[] = [];
  sakune.on("click", (event) => {
    received.push(event.target);
  });

  fire("pointerdown", { pointerId: 1, clientX: 5, clientY: 5 });
  fire("pointerup", { pointerId: 1, clientX: 5, clientY: 5 });

  expect(received).toEqual([null]);
});

test("draggable item: dragStart fires once, then dragMove per move, then dragEnd", () => {
  const { canvas, fire } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  sakune.setScene({
    items: [
      {
        type: "entity",
        id: "drag",
        x: 0,
        y: 0,
        size: { width: 100, height: 100 },
        visual: { type: "rect" },
        draggable: true,
      },
    ],
  });

  const events: string[] = [];
  sakune.on("dragStart", () => events.push("dragStart"));
  sakune.on("dragMove", () => events.push("dragMove"));
  sakune.on("dragEnd", () => events.push("dragEnd"));
  sakune.on("click", () => events.push("click"));

  fire("pointerdown", { pointerId: 1, clientX: 10, clientY: 10 });
  fire("pointermove", { pointerId: 1, clientX: 20, clientY: 15 });
  fire("pointermove", { pointerId: 1, clientX: 30, clientY: 25 });
  fire("pointerup", { pointerId: 1, clientX: 30, clientY: 25 });

  expect(events).toEqual(["dragStart", "dragMove", "dragMove", "dragEnd"]);
});

test("dragStart / dragMove / dragEnd report the dragged entity as target", () => {
  type Meta = { kind: "card"; id: string };
  const { canvas, fire } = createMockCanvas();
  const sakune = createSakune<Meta>({ canvas, pixelRatio: 1 });

  sakune.setScene({
    items: [
      {
        type: "entity",
        id: "drag",
        x: 0,
        y: 0,
        size: { width: 100, height: 100 },
        visual: { type: "rect" },
        draggable: true,
        meta: { kind: "card", id: "drag" },
      },
    ],
  });

  const targets: HitResult<Meta>[] = [];
  sakune.on("dragStart", (event) => targets.push(event.target));
  sakune.on("dragMove", (event) => targets.push(event.target));
  sakune.on("dragEnd", (event) => targets.push(event.target));

  fire("pointerdown", { pointerId: 1, clientX: 10, clientY: 10 });
  fire("pointermove", { pointerId: 1, clientX: 20, clientY: 20 });
  fire("pointerup", { pointerId: 1, clientX: 20, clientY: 20 });

  for (const target of targets) {
    expect(target).toEqual({
      type: "entity",
      id: "drag",
      meta: { kind: "card", id: "drag" },
    });
  }
  expect(targets).toHaveLength(3);
});

test("dragMove delta is per-step difference from previous world position", () => {
  const { canvas, fire } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  sakune.setScene({
    items: [
      {
        type: "entity",
        id: "drag",
        x: 0,
        y: 0,
        size: { width: 100, height: 100 },
        visual: { type: "rect" },
        draggable: true,
      },
    ],
  });

  const deltas: { x: number; y: number }[] = [];
  sakune.on("dragMove", (event) => {
    deltas.push(event.delta);
  });

  fire("pointerdown", { pointerId: 1, clientX: 10, clientY: 10 });
  fire("pointermove", { pointerId: 1, clientX: 15, clientY: 12 });
  fire("pointermove", { pointerId: 1, clientX: 25, clientY: 22 });
  fire("pointerup", { pointerId: 1, clientX: 25, clientY: 22 });

  expect(deltas).toEqual([
    { x: 5, y: 2 },
    { x: 10, y: 10 },
  ]);
});

test("dragEnd dropTarget reflects the drawable hit at pointerup", () => {
  const { canvas, fire } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  sakune.setScene({
    items: [
      {
        type: "entity",
        id: "src",
        x: 0,
        y: 0,
        size: { width: 50, height: 50 },
        visual: { type: "rect" },
        draggable: true,
      },
      {
        type: "entity",
        id: "dst",
        x: 100,
        y: 100,
        size: { width: 50, height: 50 },
        visual: { type: "rect" },
      },
    ],
  });

  const dropTargets: (HitResult | null)[] = [];
  sakune.on("dragEnd", (event) => {
    dropTargets.push(event.dropTarget);
  });

  fire("pointerdown", { pointerId: 1, clientX: 10, clientY: 10 });
  fire("pointermove", { pointerId: 1, clientX: 120, clientY: 120 });
  fire("pointerup", { pointerId: 1, clientX: 120, clientY: 120 });

  expect(dropTargets).toEqual([{ type: "entity", id: "dst", meta: undefined }]);
});

test("non-draggable hit emits click only, never drag events", () => {
  const { canvas, fire } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  sakune.setScene({
    items: [
      {
        type: "entity",
        id: "static",
        x: 0,
        y: 0,
        size: { width: 100, height: 100 },
        visual: { type: "rect" },
      },
    ],
  });

  const events: string[] = [];
  sakune.on("dragStart", () => events.push("dragStart"));
  sakune.on("dragMove", () => events.push("dragMove"));
  sakune.on("dragEnd", () => events.push("dragEnd"));
  sakune.on("click", () => events.push("click"));

  fire("pointerdown", { pointerId: 1, clientX: 10, clientY: 10 });
  fire("pointermove", { pointerId: 1, clientX: 20, clientY: 20 });
  fire("pointerup", { pointerId: 1, clientX: 20, clientY: 20 });

  expect(events).toEqual(["click"]);
});

test("pointer capture is requested on pointerdown and released on pointerup", () => {
  const { canvas, fire, pointerCaptured, pointerReleased } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  sakune.setScene({ items: [] });
  fire("pointerdown", { pointerId: 7, clientX: 0, clientY: 0 });
  fire("pointerup", { pointerId: 7, clientX: 0, clientY: 0 });

  expect(pointerCaptured).toContain(7);
  expect(pointerReleased).toContain(7);
});

test("destroy detaches listeners and cancels future renders", () => {
  const { canvas, ctx, fire } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  let clicks = 0;
  sakune.on("click", () => {
    clicks++;
  });

  sakune.setScene({ items: [] });
  sakune.destroy();

  flushRaf();
  expect(ctx.calls.find((c) => c.method === "scale")).toBeUndefined();

  fire("pointerdown", { pointerId: 1, clientX: 0, clientY: 0 });
  fire("pointerup", { pointerId: 1, clientX: 0, clientY: 0 });
  expect(clicks).toBe(0);
});

const hoistScene = {
  items: [
    {
      type: "entity" as const,
      id: "dragged",
      x: 10,
      y: 10,
      size: { width: 50, height: 50 },
      visual: { type: "rect" as const },
      draggable: true,
    },
    {
      type: "entity" as const,
      id: "other",
      x: 200,
      y: 10,
      size: { width: 50, height: 50 },
      visual: { type: "rect" as const },
    },
  ],
};

test("dragging item is rendered last (on top) during drag", () => {
  const { canvas, ctx, fire } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  sakune.setScene(hoistScene);
  flushRaf();
  expect(ctx.calls.filter((c) => c.method === "rect").map((c) => c.args[0])).toEqual([10, 200]);

  ctx.calls.length = 0;
  fire("pointerdown", { pointerId: 1, clientX: 25, clientY: 25 });
  fire("pointermove", { pointerId: 1, clientX: 30, clientY: 30 });
  flushRaf();

  expect(ctx.calls.filter((c) => c.method === "rect").map((c) => c.args[0])).toEqual([200, 10]);
});

test("dragEnd restores normal render order", () => {
  const { canvas, ctx, fire } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  sakune.setScene(hoistScene);
  flushRaf();

  fire("pointerdown", { pointerId: 1, clientX: 25, clientY: 25 });
  fire("pointermove", { pointerId: 1, clientX: 30, clientY: 30 });
  flushRaf();
  fire("pointerup", { pointerId: 1, clientX: 30, clientY: 30 });

  ctx.calls.length = 0;
  flushRaf();

  expect(ctx.calls.filter((c) => c.method === "rect").map((c) => c.args[0])).toEqual([10, 200]);
});

test("pointercancel restores normal render order", () => {
  const { canvas, ctx, fire } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  sakune.setScene(hoistScene);
  flushRaf();

  fire("pointerdown", { pointerId: 1, clientX: 25, clientY: 25 });
  fire("pointermove", { pointerId: 1, clientX: 30, clientY: 30 });
  flushRaf();
  fire("pointercancel", { pointerId: 1, clientX: 30, clientY: 30 });

  ctx.calls.length = 0;
  flushRaf();

  expect(ctx.calls.filter((c) => c.method === "rect").map((c) => c.args[0])).toEqual([10, 200]);
});

test("click without drag does not change render order", () => {
  const { canvas, ctx, fire } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  sakune.setScene(hoistScene);
  flushRaf();

  ctx.calls.length = 0;
  fire("pointerdown", { pointerId: 1, clientX: 25, clientY: 25 });
  fire("pointerup", { pointerId: 1, clientX: 25, clientY: 25 });
  flushRaf();

  expect(ctx.calls.filter((c) => c.method === "rect").map((c) => c.args[0])).toEqual([]);
});

test("hitTest accepts an excludeId option", () => {
  const { canvas } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  sakune.setScene({
    items: [
      {
        type: "entity",
        id: "back",
        x: 0,
        y: 0,
        size: { width: 100, height: 100 },
        visual: { type: "rect" },
      },
      {
        type: "entity",
        id: "front",
        x: 0,
        y: 0,
        size: { width: 100, height: 100 },
        visual: { type: "rect" },
      },
    ],
  });

  expect(sakune.hitTest({ x: 50, y: 50 })).toEqual({
    type: "entity",
    id: "front",
    meta: undefined,
  });
  expect(sakune.hitTest({ x: 50, y: 50 }, { excludeId: "front" })).toEqual({
    type: "entity",
    id: "back",
    meta: undefined,
  });
});

test("dragMode 'stack': events report the stack as target", () => {
  type Meta = { kind: "card"; cardId: string } | { kind: "deck"; deckId: string };
  const { canvas, fire } = createMockCanvas();
  const sakune = createSakune<Meta>({ canvas, pixelRatio: 1 });

  sakune.setScene({
    items: [
      {
        type: "stack",
        id: "deck",
        x: 0,
        y: 0,
        dragMode: "stack",
        meta: { kind: "deck", deckId: "main" },
        items: [
          {
            id: "c1",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
            meta: { kind: "card", cardId: "c1" },
          },
          {
            id: "c2",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
            meta: { kind: "card", cardId: "c2" },
          },
        ],
      },
    ],
  });

  const targets: HitResult<Meta>[] = [];
  sakune.on("dragStart", (event) => targets.push(event.target));
  sakune.on("dragEnd", (event) => targets.push(event.target));

  fire("pointerdown", { pointerId: 1, clientX: 10, clientY: 10 });
  fire("pointermove", { pointerId: 1, clientX: 20, clientY: 20 });
  fire("pointerup", { pointerId: 1, clientX: 20, clientY: 20 });

  expect(targets).toEqual([
    { type: "stack", id: "deck", meta: { kind: "deck", deckId: "main" } },
    { type: "stack", id: "deck", meta: { kind: "deck", deckId: "main" } },
  ]);
});

test("dragMode 'stack': hoists every drawable in the dragged stack", () => {
  const { canvas, ctx, fire } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  sakune.setScene({
    items: [
      {
        type: "stack",
        id: "deck",
        x: 0,
        y: 0,
        dragMode: "stack",
        layout: { type: "pile", offset: { x: 0, y: -4 } },
        items: [
          {
            id: "c1",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
          },
          {
            id: "c2",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
          },
        ],
      },
      {
        type: "entity",
        id: "other",
        x: 200,
        y: 0,
        size: { width: 50, height: 50 },
        visual: { type: "rect" },
      },
    ],
  });
  flushRaf();

  ctx.calls.length = 0;
  fire("pointerdown", { pointerId: 1, clientX: 10, clientY: 10 });
  fire("pointermove", { pointerId: 1, clientX: 20, clientY: 20 });
  flushRaf();

  const ys = ctx.calls.filter((c) => c.method === "rect").map((c) => c.args[1]);
  expect(ys).toEqual([0, 0, -4]);
});

test("dragMode 'stack': dropTarget excludes every member of the dragged stack", () => {
  const { canvas, fire } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  sakune.setScene({
    items: [
      {
        type: "entity",
        id: "zone",
        x: 0,
        y: 0,
        size: { width: 200, height: 200 },
        visual: { type: "rect" },
      },
      {
        type: "stack",
        id: "deck",
        x: 50,
        y: 50,
        dragMode: "stack",
        items: [
          {
            id: "c1",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
          },
          {
            id: "c2",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
          },
        ],
      },
    ],
  });

  const dropTargets: (HitResult | null)[] = [];
  sakune.on("dragEnd", (event) => {
    dropTargets.push(event.dropTarget);
  });

  fire("pointerdown", { pointerId: 1, clientX: 70, clientY: 70 });
  fire("pointermove", { pointerId: 1, clientX: 80, clientY: 80 });
  fire("pointerup", { pointerId: 1, clientX: 80, clientY: 80 });

  expect(dropTargets[0]).toEqual({
    type: "entity",
    id: "zone",
    meta: undefined,
  });
});

test("dragMode 'item': events report a single stackItem target", () => {
  type Meta = { kind: "card"; cardId: string };
  const { canvas, fire } = createMockCanvas();
  const sakune = createSakune<Meta>({ canvas, pixelRatio: 1 });

  sakune.setScene({
    items: [
      {
        type: "stack",
        id: "hand",
        x: 0,
        y: 0,
        dragMode: "item",
        layout: { type: "pile", offset: { x: 0, y: -120 } },
        items: [
          {
            id: "c0",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
            meta: { kind: "card", cardId: "c0" },
          },
          {
            id: "c1",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
            meta: { kind: "card", cardId: "c1" },
          },
          {
            id: "c2",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
            meta: { kind: "card", cardId: "c2" },
          },
        ],
      },
    ],
  });

  const targets: HitResult<Meta>[] = [];
  sakune.on("dragStart", (event) => targets.push(event.target));

  fire("pointerdown", { pointerId: 1, clientX: 40, clientY: -60 });
  fire("pointermove", { pointerId: 1, clientX: 50, clientY: -60 });

  expect(targets).toEqual([
    {
      type: "stackItem",
      id: "c1",
      meta: { kind: "card", cardId: "c1" },
      stackId: "hand",
      stackMeta: undefined,
      index: 1,
    },
  ]);
});

test("dragMode 'item': hoists only the hit item", () => {
  const { canvas, ctx, fire } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  sakune.setScene({
    items: [
      {
        type: "stack",
        id: "hand",
        x: 0,
        y: 0,
        dragMode: "item",
        layout: { type: "pile", offset: { x: 0, y: -120 } },
        items: [
          {
            id: "c0",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
          },
          {
            id: "c1",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
          },
          {
            id: "c2",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
          },
        ],
      },
    ],
  });
  flushRaf();

  ctx.calls.length = 0;
  fire("pointerdown", { pointerId: 1, clientX: 40, clientY: -60 });
  fire("pointermove", { pointerId: 1, clientX: 50, clientY: -60 });
  flushRaf();

  const ys = ctx.calls.filter((c) => c.method === "rect").map((c) => c.args[1]);
  expect(ys).toEqual([0, -240, -120]);
});

test("dragMode 'slice-from-item': target is a stackSlice from the hit index", () => {
  type Meta = { kind: "card"; cardId: string };
  const { canvas, fire } = createMockCanvas();
  const sakune = createSakune<Meta>({ canvas, pixelRatio: 1 });

  sakune.setScene({
    items: [
      {
        type: "stack",
        id: "tab",
        x: 0,
        y: 0,
        dragMode: "slice-from-item",
        layout: { type: "pile", offset: { x: 0, y: -120 } },
        items: [
          {
            id: "c0",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
            meta: { kind: "card", cardId: "c0" },
          },
          {
            id: "c1",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
            meta: { kind: "card", cardId: "c1" },
          },
          {
            id: "c2",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
            meta: { kind: "card", cardId: "c2" },
          },
        ],
      },
    ],
  });

  const targets: HitResult<Meta>[] = [];
  sakune.on("dragStart", (event) => targets.push(event.target));

  fire("pointerdown", { pointerId: 1, clientX: 40, clientY: -60 });
  fire("pointermove", { pointerId: 1, clientX: 50, clientY: -60 });

  expect(targets).toEqual([
    {
      type: "stackSlice",
      stackId: "tab",
      stackMeta: undefined,
      fromIndex: 1,
      items: [
        { id: "c1", meta: { kind: "card", cardId: "c1" }, index: 1 },
        { id: "c2", meta: { kind: "card", cardId: "c2" }, index: 2 },
      ],
    },
  ]);
});

test("dragMode 'slice-from-item': hoists hit item and items above to the top", () => {
  const { canvas, ctx, fire } = createMockCanvas();
  const sakune = createSakune({ canvas, pixelRatio: 1 });

  sakune.setScene({
    items: [
      {
        type: "stack",
        id: "tab",
        x: 0,
        y: 0,
        dragMode: "slice-from-item",
        layout: { type: "pile", offset: { x: 0, y: -120 } },
        items: [
          {
            id: "c0",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
          },
          {
            id: "c1",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
          },
          {
            id: "c2",
            size: { width: 80, height: 100 },
            visual: { type: "rect" },
          },
        ],
      },
      {
        type: "entity",
        id: "other",
        x: 300,
        y: 0,
        size: { width: 50, height: 50 },
        visual: { type: "rect" },
      },
    ],
  });
  flushRaf();

  ctx.calls.length = 0;
  fire("pointerdown", { pointerId: 1, clientX: 40, clientY: -60 });
  fire("pointermove", { pointerId: 1, clientX: 50, clientY: -60 });
  flushRaf();

  const ys = ctx.calls.filter((c) => c.method === "rect").map((c) => c.args[1]);
  expect(ys).toEqual([0, 0, -120, -240]);
});

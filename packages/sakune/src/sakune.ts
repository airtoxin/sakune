import { drawDrawable } from "./draw.ts";
import { flattenScene } from "./flatten.ts";
import { hitTestDrawables, isInDragGroup, toDragTarget, toHitResult } from "./hitTest.ts";
import type {
  Drawable,
  HitResult,
  HitTestOptions,
  Point,
  Sakune,
  SakuneEvent,
  SakuneOptions,
  SakuneScene,
} from "./types.ts";

type EventListeners<TMeta> = {
  [K in SakuneEvent<TMeta>["type"]]: Set<(event: Extract<SakuneEvent<TMeta>, { type: K }>) => void>;
};

type PointerSession<TMeta> = {
  pointerId: number;
  dragTarget: HitResult<TMeta> | null;
  startScreen: Point;
  startWorld: Point;
  lastWorld: Point;
  dragStarted: boolean;
};

type ActiveDrag<TMeta> = {
  target: HitResult<TMeta>;
  startWorld: Point;
  currentWorld: Point;
};

function defaultPixelRatio(): number {
  const value = (globalThis as { devicePixelRatio?: number }).devicePixelRatio;
  return typeof value === "number" && value > 0 ? value : 1;
}

export function createSakune<TMeta = unknown>(options: SakuneOptions): Sakune<TMeta> {
  const canvas = options.canvas;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("[sakune] Failed to acquire 2D rendering context.");
  }

  const pixelRatio = options.pixelRatio ?? defaultPixelRatio();

  let drawables: Drawable<TMeta>[] = [];
  let renderScheduled = false;
  let destroyed = false;
  let pointerSession: PointerSession<TMeta> | null = null;
  let activeDrag: ActiveDrag<TMeta> | null = null;

  const listeners: EventListeners<TMeta> = {
    click: new Set(),
    dragStart: new Set(),
    dragMove: new Set(),
    dragEnd: new Set(),
  };

  const render = (): void => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(pixelRatio, pixelRatio);

    if (activeDrag === null) {
      for (const drawable of drawables) {
        drawDrawable(ctx, drawable);
      }
    } else {
      const dx = activeDrag.currentWorld.x - activeDrag.startWorld.x;
      const dy = activeDrag.currentWorld.y - activeDrag.startWorld.y;
      const dragging: Drawable<TMeta>[] = [];
      for (const drawable of drawables) {
        if (isInDragGroup(drawable, activeDrag.target)) {
          dragging.push(drawable);
          continue;
        }
        drawDrawable(ctx, drawable);
      }
      for (const drawable of dragging) {
        drawDrawable(ctx, {
          ...drawable,
          x: drawable.x + dx,
          y: drawable.y + dy,
        });
      }
    }

    ctx.restore();
  };

  const invalidate = (): void => {
    if (renderScheduled || destroyed) return;
    renderScheduled = true;
    requestAnimationFrame(() => {
      renderScheduled = false;
      if (destroyed) return;
      render();
    });
  };

  function emit<K extends SakuneEvent<TMeta>["type"]>(
    event: Extract<SakuneEvent<TMeta>, { type: K }>,
  ): void {
    const set = listeners[event.type] as Set<(e: Extract<SakuneEvent<TMeta>, { type: K }>) => void>;
    for (const handler of set) handler(event);
  }

  const screenFromEvent = (event: PointerEvent): Point => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const onPointerDown = (event: PointerEvent): void => {
    const screen = screenFromEvent(event);
    const world = screen;
    const hit = hitTestDrawables(drawables, world);
    const dragTarget = hit && hit.draggable === true ? toDragTarget(hit, drawables) : null;
    pointerSession = {
      pointerId: event.pointerId,
      dragTarget,
      startScreen: screen,
      startWorld: world,
      lastWorld: world,
      dragStarted: false,
    };
    if (typeof canvas.setPointerCapture === "function") {
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // ignore — environments without pointer capture support
      }
    }
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!pointerSession || pointerSession.pointerId !== event.pointerId) return;
    const target = pointerSession.dragTarget;
    if (target === null) return;

    const screen = screenFromEvent(event);
    const world = screen;
    const delta = {
      x: world.x - pointerSession.lastWorld.x,
      y: world.y - pointerSession.lastWorld.y,
    };

    if (!pointerSession.dragStarted) {
      pointerSession.dragStarted = true;
      activeDrag = {
        target,
        startWorld: pointerSession.startWorld,
        currentWorld: world,
      };
      emit({
        type: "dragStart",
        screen: pointerSession.startScreen,
        world: pointerSession.startWorld,
        target,
      });
    } else if (activeDrag !== null) {
      activeDrag.currentWorld = world;
    }

    pointerSession.lastWorld = world;
    invalidate();
    emit({
      type: "dragMove",
      screen,
      world,
      delta,
      target,
    });
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (!pointerSession || pointerSession.pointerId !== event.pointerId) return;

    const screen = screenFromEvent(event);
    const world = screen;
    const target = pointerSession.dragTarget;
    const wasDragging = pointerSession.dragStarted === true && target !== null;

    if (wasDragging && target !== null) {
      const dropTarget = toHitResult(
        hitTestDrawables(drawables, world, (d) => isInDragGroup(d, target)),
      );
      emit({
        type: "dragEnd",
        screen,
        world,
        target,
        dropTarget,
      });
    } else {
      const clickTarget = toHitResult(hitTestDrawables(drawables, world));
      emit({
        type: "click",
        screen,
        world,
        target: clickTarget,
      });
    }

    if (typeof canvas.releasePointerCapture === "function") {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // ignore — capture may already be released
      }
    }
    pointerSession = null;
    activeDrag = null;
    if (wasDragging) invalidate();
  };

  const onPointerCancel = (event: PointerEvent): void => {
    if (!pointerSession || pointerSession.pointerId !== event.pointerId) return;
    const target = pointerSession.dragTarget;
    const wasDragging = pointerSession.dragStarted === true && target !== null;
    if (wasDragging && target !== null) {
      const screen = screenFromEvent(event);
      const world = screen;
      emit({
        type: "dragEnd",
        screen,
        world,
        target,
        dropTarget: null,
      });
    }
    pointerSession = null;
    activeDrag = null;
    if (wasDragging) invalidate();
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerCancel);

  return {
    setScene(scene: SakuneScene<TMeta>): void {
      drawables = flattenScene(scene);
      invalidate();
    },

    resize(width: number, height: number): void {
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      invalidate();
    },

    destroy(): void {
      destroyed = true;
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      drawables = [];
      pointerSession = null;
      activeDrag = null;
      for (const set of Object.values(listeners)) {
        (set as Set<unknown>).clear();
      }
    },

    on<TType extends SakuneEvent<TMeta>["type"]>(
      type: TType,
      handler: (event: Extract<SakuneEvent<TMeta>, { type: TType }>) => void,
    ): () => void {
      const set = listeners[type] as Set<
        (event: Extract<SakuneEvent<TMeta>, { type: TType }>) => void
      >;
      set.add(handler);
      return () => {
        set.delete(handler);
      };
    },

    hitTest(point: Point, options?: HitTestOptions): HitResult<TMeta> | null {
      const exclude =
        options?.excludeId !== undefined
          ? (d: Drawable<TMeta>) => d.id === options.excludeId
          : undefined;
      return toHitResult(hitTestDrawables(drawables, point, exclude));
    },
  };
}

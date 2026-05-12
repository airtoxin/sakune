import { drawDrawable } from "./draw.ts";
import { flattenScene } from "./flatten.ts";
import { hitTestDrawables, isInDragGroup, toDragTarget, toHitResult } from "./hitTest.ts";
import type {
  Drawable,
  DragSnapContext,
  DragSnapModifiers,
  DragSnapResolver,
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
  lastPreviewWorld: Point;
  dragStarted: boolean;
  targetAnchor: Point | null;
};

function computeTargetAnchor<TMeta>(
  target: HitResult<TMeta>,
  drawables: Drawable<TMeta>[],
): Point | null {
  switch (target.type) {
    case "entity": {
      const d = drawables.find((x) => x.id === target.id && x.stackId === undefined);
      return d ? { x: d.x, y: d.y } : null;
    }
    case "stack": {
      const d = drawables.find((x) => x.stackId === target.id && (x.stackIndex ?? 0) === 0);
      return d ? { x: d.x, y: d.y } : null;
    }
    case "stackItem": {
      const d = drawables.find((x) => x.id === target.id);
      return d ? { x: d.x, y: d.y } : null;
    }
    case "stackSlice": {
      const d = drawables.find(
        (x) => x.stackId === target.stackId && (x.stackIndex ?? -1) === target.fromIndex,
      );
      return d ? { x: d.x, y: d.y } : null;
    }
  }
}

function topOfStack<TMeta>(stackId: string, drawables: Drawable<TMeta>[]): Drawable<TMeta> | null {
  let top: Drawable<TMeta> | null = null;
  for (const d of drawables) {
    if (d.stackId !== stackId) continue;
    if (top === null || (d.stackIndex ?? -1) > (top.stackIndex ?? -1)) top = d;
  }
  return top;
}

type ActiveDrag<TMeta> = {
  target: HitResult<TMeta>;
  startWorld: Point;
  previewWorld: Point;
};

function defaultPixelRatio(): number {
  const value = (globalThis as { devicePixelRatio?: number }).devicePixelRatio;
  return typeof value === "number" && value > 0 ? value : 1;
}

export function createSakune<TMeta = unknown>(options: SakuneOptions<TMeta>): Sakune<TMeta> {
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
  const dragSnapResolver: DragSnapResolver<TMeta> | null = options.snap?.drag ?? null;

  const anchorToWorld = (anchor: Point, startWorld: Point, targetAnchor: Point): Point => ({
    x: anchor.x + (startWorld.x - targetAnchor.x),
    y: anchor.y + (startWorld.y - targetAnchor.y),
  });

  // Built-in snap: a stack slice dragged over another stack lands on top of
  // it; dragging the slice back over its own source stack snaps to the slice's
  // original spot so the user can put it back without leaving the cell.
  const defaultStackSnap = (
    target: HitResult<TMeta>,
    world: Point,
    startWorld: Point,
    targetAnchor: Point,
  ): Point | null => {
    if (target.type !== "stackSlice") return null;
    const hit = hitTestDrawables(drawables, world, (d) => isInDragGroup(d, target));
    if (!hit || hit.stackId === undefined) return null;
    let nextAnchor: Point;
    if (hit.stackId === target.stackId) {
      nextAnchor = targetAnchor;
    } else {
      const top = topOfStack(hit.stackId, drawables);
      if (!top || !top.stackOffset) return null;
      nextAnchor = {
        x: top.x + top.stackOffset.x,
        y: top.y + top.stackOffset.y,
      };
    }
    return anchorToWorld(nextAnchor, startWorld, targetAnchor);
  };

  const resolvePreview = (
    target: HitResult<TMeta>,
    world: Point,
    delta: Point,
    startWorld: Point,
    previousPreviewWorld: Point,
    targetAnchor: Point,
    modifiers: DragSnapModifiers,
  ): Point => {
    if (dragSnapResolver !== null) {
      const context: DragSnapContext<TMeta> = {
        target,
        world,
        delta,
        startWorld,
        previousPreviewWorld,
        anchor: targetAnchor,
        modifiers,
      };
      const result = dragSnapResolver(context);
      if (result) {
        if ("anchor" in result) return anchorToWorld(result.anchor, startWorld, targetAnchor);
        return result;
      }
    }
    const defaultSnap = defaultStackSnap(target, world, startWorld, targetAnchor);
    if (defaultSnap !== null) return defaultSnap;
    return world;
  };

  const modifiersFromEvent = (event: PointerEvent): DragSnapModifiers => ({
    shift: event.shiftKey === true,
    alt: event.altKey === true,
    ctrl: event.ctrlKey === true,
    meta: event.metaKey === true,
  });

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
      const dx = activeDrag.previewWorld.x - activeDrag.startWorld.x;
      const dy = activeDrag.previewWorld.y - activeDrag.startWorld.y;
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
    const targetAnchor = dragTarget ? computeTargetAnchor(dragTarget, drawables) : null;
    pointerSession = {
      pointerId: event.pointerId,
      dragTarget,
      startScreen: screen,
      startWorld: world,
      lastWorld: world,
      lastPreviewWorld: world,
      dragStarted: false,
      targetAnchor,
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
    const anchor = pointerSession.targetAnchor ?? pointerSession.startWorld;

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
        previewWorld: pointerSession.startWorld,
      };
      emit({
        type: "dragStart",
        screen: pointerSession.startScreen,
        world: pointerSession.startWorld,
        previewWorld: pointerSession.startWorld,
        anchor,
        previewAnchor: anchor,
        target,
      });
    }

    const previewWorld = resolvePreview(
      target,
      world,
      delta,
      pointerSession.startWorld,
      pointerSession.lastPreviewWorld,
      anchor,
      modifiersFromEvent(event),
    );

    if (activeDrag !== null) {
      activeDrag.previewWorld = previewWorld;
    }

    pointerSession.lastWorld = world;
    pointerSession.lastPreviewWorld = previewWorld;
    invalidate();
    const previewAnchor = {
      x: anchor.x + (previewWorld.x - pointerSession.startWorld.x),
      y: anchor.y + (previewWorld.y - pointerSession.startWorld.y),
    };
    emit({
      type: "dragMove",
      screen,
      world,
      previewWorld,
      anchor,
      previewAnchor,
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
      const anchor = pointerSession.targetAnchor ?? pointerSession.startWorld;
      const delta = {
        x: world.x - pointerSession.lastWorld.x,
        y: world.y - pointerSession.lastWorld.y,
      };
      const previewWorld = resolvePreview(
        target,
        world,
        delta,
        pointerSession.startWorld,
        pointerSession.lastPreviewWorld,
        anchor,
        modifiersFromEvent(event),
      );
      const previewAnchor = {
        x: anchor.x + (previewWorld.x - pointerSession.startWorld.x),
        y: anchor.y + (previewWorld.y - pointerSession.startWorld.y),
      };
      const dropTarget = toHitResult(
        hitTestDrawables(drawables, previewWorld, (d) => isInDragGroup(d, target)),
      );
      emit({
        type: "dragEnd",
        screen,
        world,
        previewWorld,
        anchor,
        previewAnchor,
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
      const anchor = pointerSession.targetAnchor ?? pointerSession.startWorld;
      const previewAnchor = {
        x: anchor.x + (pointerSession.lastPreviewWorld.x - pointerSession.startWorld.x),
        y: anchor.y + (pointerSession.lastPreviewWorld.y - pointerSession.startWorld.y),
      };
      emit({
        type: "dragEnd",
        screen,
        world,
        previewWorld: pointerSession.lastPreviewWorld,
        anchor,
        previewAnchor,
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

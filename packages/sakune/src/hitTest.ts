import type { Drawable, HitResult, Point } from "./types.ts";

export function effectiveDragId<TMeta>(drawable: Drawable<TMeta>): string {
  return drawable.groupId ?? drawable.id;
}

export function effectiveDragMeta<TMeta>(drawable: Drawable<TMeta>): TMeta | undefined {
  return drawable.groupId !== undefined ? drawable.groupMeta : drawable.meta;
}

export function pointInDrawable<TMeta>(drawable: Drawable<TMeta>, point: Point): boolean {
  const { x, y, size } = drawable;
  const hitType = drawable.hitArea?.type ?? "rect";

  if (hitType === "circle") {
    const cx = x + size.width / 2;
    const cy = y + size.height / 2;
    const r = Math.min(size.width, size.height) / 2;
    const dx = point.x - cx;
    const dy = point.y - cy;
    return dx * dx + dy * dy <= r * r;
  }

  return point.x >= x && point.x <= x + size.width && point.y >= y && point.y <= y + size.height;
}

export function hitTestDrawables<TMeta>(
  drawables: Drawable<TMeta>[],
  point: Point,
  excludeId?: string,
): Drawable<TMeta> | null {
  for (let i = drawables.length - 1; i >= 0; i--) {
    const drawable = drawables[i] as Drawable<TMeta>;
    if (excludeId !== undefined && effectiveDragId(drawable) === excludeId) continue;
    if (pointInDrawable(drawable, point)) return drawable;
  }
  return null;
}

export function toHitResult<TMeta>(drawable: Drawable<TMeta> | null): HitResult<TMeta> | null {
  if (!drawable) return null;
  return {
    id: effectiveDragId(drawable),
    meta: effectiveDragMeta(drawable),
  };
}

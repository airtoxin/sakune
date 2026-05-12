import type { Drawable, SakuneScene } from "./types.ts";

const DEFAULT_PILE_STEP = 4;
const DEFAULT_PILE_ANGLE_RAD = (80 * Math.PI) / 180;
const DEFAULT_PILE_OFFSET = {
  x: DEFAULT_PILE_STEP * Math.cos(DEFAULT_PILE_ANGLE_RAD),
  y: -DEFAULT_PILE_STEP * Math.sin(DEFAULT_PILE_ANGLE_RAD),
};

export function flattenScene<TMeta>(scene: SakuneScene<TMeta>): Drawable<TMeta>[] {
  const drawables: Drawable<TMeta>[] = [];
  let order = 0;

  for (const item of scene.items) {
    if (item.type === "entity") {
      drawables.push({
        id: item.id,
        x: item.x,
        y: item.y,
        size: item.size,
        visual: item.visual,
        hitArea: item.hitArea,
        draggable: item.draggable,
        meta: item.meta,
        order: order++,
      });
      continue;
    }

    const offset = item.layout?.offset ?? DEFAULT_PILE_OFFSET;
    const dragMode = item.dragMode ?? "none";
    const stackDraggable = dragMode !== "none";
    item.items.forEach((stackItem, index) => {
      drawables.push({
        id: stackItem.id,
        stackId: item.id,
        stackIndex: index,
        stackDragMode: dragMode,
        stackMeta: item.meta,
        x: item.x + offset.x * index,
        y: item.y + offset.y * index,
        size: stackItem.size,
        visual: stackItem.visual,
        hitArea: stackItem.hitArea,
        draggable: stackDraggable ? true : undefined,
        meta: stackItem.meta,
        order: order++,
      });
    });
  }

  return drawables;
}

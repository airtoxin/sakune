import type { Drawable, SakuneScene } from "./types.ts";

const DEFAULT_PILE_OFFSET = { x: 0, y: -4 };

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
    item.items.forEach((stackItem, index) => {
      drawables.push({
        id: stackItem.id,
        x: item.x + offset.x * index,
        y: item.y + offset.y * index,
        size: stackItem.size,
        visual: stackItem.visual,
        hitArea: stackItem.hitArea,
        draggable: stackItem.draggable,
        meta: stackItem.meta,
        order: order++,
      });
    });
  }

  return drawables;
}

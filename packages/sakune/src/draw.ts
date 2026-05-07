import type { Drawable, Visual } from "./types.ts";

export function drawDrawable<TMeta>(
  ctx: CanvasRenderingContext2D,
  drawable: Drawable<TMeta>,
): void {
  const { x, y, size, visual } = drawable;

  if (visual.type === "rect") {
    drawRect(ctx, x, y, size.width, size.height, visual);
    return;
  }

  if (visual.type === "circle") {
    drawCircle(ctx, x, y, size.width, size.height, visual);
    return;
  }

  drawText(ctx, x, y, visual);
}

function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  visual: Extract<Visual, { type: "rect" }>,
): void {
  const radius = visual.radius ?? 0;
  ctx.beginPath();
  if (radius > 0 && typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.rect(x, y, width, height);
  }
  if (visual.fill !== undefined) {
    ctx.fillStyle = visual.fill;
    ctx.fill();
  }
  if (visual.stroke !== undefined) {
    ctx.strokeStyle = visual.stroke;
    ctx.stroke();
  }
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  visual: Extract<Visual, { type: "circle" }>,
): void {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const radius = Math.min(width, height) / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  if (visual.fill !== undefined) {
    ctx.fillStyle = visual.fill;
    ctx.fill();
  }
  if (visual.stroke !== undefined) {
    ctx.strokeStyle = visual.stroke;
    ctx.stroke();
  }
}

function drawText(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  visual: Extract<Visual, { type: "text" }>,
): void {
  ctx.font = visual.font ?? "16px sans-serif";
  ctx.fillStyle = visual.fill ?? "#000";
  ctx.textBaseline = "top";
  ctx.fillText(visual.text, x, y);
}

export const createCanvas = (
  mountingElement: Element
): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  mountingElement.appendChild(canvas);

  return [canvas, ctx];
};

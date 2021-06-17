import { Vector } from "./Vector";
import { AqknImage } from "./AqknImage";

const BACKGROUND_IMAGE =
  "https://cf.geekdo-images.com/EFJ0PGh7xq_UHb1RkfITgA__imagepagezoom/img/wFxN73HF1W8_0L8yvQik6wEiTW4=/fit-in/1200x900/filters:no_upscale():strip_icc()/pic369329.jpg";

export const createCanvas = (
  mountingElement: Element
): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  mountingElement.appendChild(canvas);

  // const background = new AqknImage(canvas, ctx, {
  //   src: BACKGROUND_IMAGE,
  //   origin: new Vector(10, 10),
  //   size: new Vector(300, 100),
  //   addBoundingBox: true,
  // });
  //
  // setInterval(() => {
  //   ctx.clearRect(0, 0, canvas.width, canvas.height);
  //   background.render();
  // }, 16);

  return [canvas, ctx];
};

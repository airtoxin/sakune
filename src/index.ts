import ECS from "ecs-lib";
import { Vector } from "./Vector";
import { createCanvas } from "./canvas";
import { MouseState } from "./states/MouseState";
import { SimpleBoxEntity } from "./entities/SimpleBoxEntity";
import { ImageEntity } from "./entities/ImageEntity";
import { RenderingSystem } from "./systems/RenderingSystem";
import { DragSystem } from "./systems/DragSystem";
import { DragState } from "./states/DragState";
import { ResizeSystem } from "./systems/ResizeSystem";

// const pieces = createPieces(
//   new Map([
//     [
//       "BigSquare-Black",
//       {
//         num: 8,
//         color: "black",
//         shape: {
//           type: "rect",
//           size: new Vector(80, 80),
//           height: 10,
//         },
//       },
//     ],
//     // [
//     //   "BigSquare-White",
//     //   {
//     //     num: 8,
//     //     color: "white",
//     //     shape: {
//     //       type: "rect",
//     //       size: new Vector(80, 80),
//     //       height: 10,
//     //     },
//     //   },
//     // ],
//     // [
//     //   "Rect-Black",
//     //   {
//     //     num: 8,
//     //     color: "black",
//     //     shape: {
//     //       type: "rect",
//     //       size: new Vector(80, 40),
//     //       height: 10,
//     //     },
//     //   },
//     // ],
//     // [
//     //   "Rect-White",
//     //   {
//     //     num: 8,
//     //     color: "white",
//     //     shape: {
//     //       type: "rect",
//     //       size: new Vector(80, 40),
//     //       height: 10,
//     //     },
//     //   },
//     // ],
//     // [
//     //   "SmallSquare-Black",
//     //   {
//     //     num: 3,
//     //     color: "black",
//     //     shape: {
//     //       type: "rect",
//     //       size: new Vector(40, 40),
//     //       height: 10,
//     //     },
//     //   },
//     // ],
//     // [
//     //   "SmallSquare-White",
//     //   {
//     //     num: 3,
//     //     color: "white",
//     //     shape: {
//     //       type: "rect",
//     //       size: new Vector(40, 40),
//     //       height: 10,
//     //     },
//     //   },
//     // ],
//   ])
// );

const world = new ECS();
const [canvas, ctx] = createCanvas(document.getElementById("root")!);

const dragState = new DragState();
const mouseState = new MouseState(canvas);

const renderingSystem = new RenderingSystem(canvas, ctx);
world.addSystem(renderingSystem);
const dragSystem = new DragSystem(renderingSystem, dragState, mouseState);
world.addSystem(dragSystem);
const resizeSystem = new ResizeSystem(dragState);
world.addSystem(resizeSystem);

world.addEntity(
  new ImageEntity({
    src: "https://cf.geekdo-images.com/EFJ0PGh7xq_UHb1RkfITgA__imagepagezoom/img/wFxN73HF1W8_0L8yvQik6wEiTW4=/fit-in/1200x900/filters:no_upscale():strip_icc()/pic369329.jpg",
    position: new Vector(10, 10),
    size: new Vector(300, 300),
    draggable: true,
    resizable: true,
  })
);
world.addEntity(
  new SimpleBoxEntity({
    position: new Vector(50, 50),
    size: new Vector(100, 100),
    stroke: "red",
    fill: "blue",
    draggable: true,
  })
);

// TODO: requestAnimationFrame
setInterval(() => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  world.update();
}, 16);

// render(
//   <Aqkn
//     option={{
//       size: new Vector(1000, 1000),
//       pieces,
//     }}
//   />,
//   document.getElementById("root")
// );

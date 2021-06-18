import { Vector } from "./Vector";
import { createCanvas } from "./canvas";
import { MouseState } from "./states/MouseState";
import { SimpleBoxEntity } from "./entities/SimpleBoxEntity";
import { ImageEntity } from "./entities/ImageEntity";
import { RenderingSystem } from "./systems/RenderingSystem";
import { DragSystem } from "./systems/DragSystem";
import { DragState } from "./states/DragState";
import { ECS } from "./ecs";
import { BoundingBoxEntity } from "./entities/BoundingBoxEntity";

const world = new ECS();
const [canvas, ctx] = createCanvas(document.getElementById("root")!);

const dragState = new DragState();
const mouseState = new MouseState(canvas);

const renderingSystem = new RenderingSystem(canvas, ctx);
world.addSystem(renderingSystem);
const dragSystem = new DragSystem(renderingSystem, dragState, mouseState);
world.addSystem(dragSystem);

const imageEntity = new ImageEntity({
  src: "https://cf.geekdo-images.com/EFJ0PGh7xq_UHb1RkfITgA__imagepagezoom/img/wFxN73HF1W8_0L8yvQik6wEiTW4=/fit-in/1200x900/filters:no_upscale():strip_icc()/pic369329.jpg",
  position: new Vector(10, 10),
  size: new Vector(300, 300),
  draggable: true,
});
world.addEntity(imageEntity);
const boundingBoxEntity = new BoundingBoxEntity(imageEntity.option);
world.addEntity(boundingBoxEntity);
world.addEntity(
  new SimpleBoxEntity({
    position: new Vector(230, 230),
    size: new Vector(100, 100),
    stroke: "orange",
    fill: "teal",
    draggable: true,
  })
);
world.addEntity(
  new SimpleBoxEntity({
    position: new Vector(250, 250),
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

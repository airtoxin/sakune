import { Entity } from "ecs-lib";
import {
  Box,
  BoxComponent,
  Color,
  ColorComponent,
  Draggable,
  DraggableComponent,
  Img,
  ImgComponent,
} from "./Components";
import { Vector } from "./Vector";

export class SimpleBoxEntity extends Entity {
  constructor(option: Box & Color & Draggable) {
    super();
    this.add(new BoxComponent(option));
    this.add(new ColorComponent(option));
    this.add(new DraggableComponent(option));
  }
}

export class ImageEntity extends Entity {
  constructor(option: Img & Box & Draggable) {
    super();

    option.img = option.img || new Image();
    option.img.src = option.src;

    if (option.img.src == null) {
      option.img.addEventListener("load", (event) => {
        if (event.target instanceof HTMLImageElement) {
          boxComponent.data.size = new Vector(
            event.target.width,
            event.target.height
          );
        }
      });
    }

    const boxComponent = new BoxComponent(option);

    this.add(new ImgComponent(option));
    this.add(boxComponent);
    this.add(new DraggableComponent(option));
  }
}

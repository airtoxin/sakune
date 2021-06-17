import { Entity } from "ecs-lib";
import { ImageComponent, ImageData } from "../components/ImageComponent";
import { BoxComponent, BoxData } from "../components/BoxComponent";
import {
  DraggableComponent,
  DraggableData,
} from "../components/DraggableComponent";
import { Vector } from "../Vector";

export class ImageEntity extends Entity {
  constructor(option: ImageData & BoxData & DraggableData) {
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

    this.add(new ImageComponent(option));
    this.add(boxComponent);
    this.add(new DraggableComponent(option));
  }
}

import { Entity } from "ecs-lib";
import { ImageComponent, ImageData } from "../components/ImageComponent";
import { BoxComponent, BoxData } from "../components/BoxComponent";
import {
  DraggableComponent,
  DraggableData,
} from "../components/DraggableComponent";
import { Vector } from "../Vector";
import {
  BoundingBoxComponent,
  BoundingBoxData,
} from "../components/BoundingBoxComponent";
import { BoxHitData, BoxHitComponent } from "../components/BoxHitComponent";

export class ImageEntity extends Entity {
  constructor(
    option: ImageData & BoxHitData & DraggableData & BoundingBoxData
  ) {
    super();

    option.img = option.img || new Image();
    option.img.src = option.src;

    if (option.img.src == null) {
      option.img.addEventListener("load", (event) => {
        if (event.target instanceof HTMLImageElement) {
          boxHitComponent.data.size = new Vector(
            event.target.width,
            event.target.height
          );
        }
      });
    }

    const boxHitComponent = new BoxHitComponent(option);

    this.add(new ImageComponent(option));
    this.add(boxHitComponent);
    this.add(new DraggableComponent(option));
    this.add(new BoundingBoxComponent(option));
  }
}

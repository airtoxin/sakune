import { ImageComponent, ImageData } from "../components/ImageComponent";
import {
  DraggableComponent,
  DraggableData,
} from "../components/DraggableComponent";
import { Vector } from "../Vector";
import { HitBoxComponent, HitBoxData } from "../components/HitBoxComponent";
import { Entity } from "../ecs";
import {
  ResizableComponent,
  ResizableData,
} from "../components/ResizableComponent";

export class ImageEntity extends Entity {
  constructor(
    public readonly option: ImageData &
      HitBoxData &
      DraggableData &
      ResizableData
  ) {
    super();

    option.img = option.img || new Image();
    option.img.src = option.src;

    const hitBoxComponent = new HitBoxComponent(option);
    const resizableComponent = new ResizableComponent(option);

    if (option.img.src == null) {
      option.img.addEventListener("load", (event) => {
        if (event.target instanceof HTMLImageElement) {
          hitBoxComponent.data.size = new Vector(
            event.target.width,
            event.target.height
          );
        }
      });
    }

    this.add(new ImageComponent(option));
    this.add(hitBoxComponent);
    this.add(new DraggableComponent(option));
    this.add(resizableComponent);
  }
}

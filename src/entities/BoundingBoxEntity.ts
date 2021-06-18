import { Entity } from "../ecs";
import { HitBoxComponent, HitBoxData } from "../components/HitBoxComponent";
import { DraggableData } from "../components/DraggableComponent";
import { Vector } from "../Vector";
import { ColorComponent } from "../components/ColorComponent";
import { BoxComponent } from "../components/BoxComponent";

const CONTROL_SIZE = new Vector(10, 10);
const HALF_CONTROL_SIZE = CONTROL_SIZE.div(2);

type BOUNDING_BOX_CONTROL_POSITION =
  typeof BOUNDING_BOX_CONTROL_POSITION[number];
const BOUNDING_BOX_CONTROL_POSITION = [
  "top",
  "left",
  "right",
  "bottom",
  "left-top",
  "right-top",
  "left-bottom",
  "right-bottom",
] as const;

export class BoundingBoxEntity extends Entity {
  constructor(public readonly option: HitBoxData & DraggableData) {
    super();

    this.add(
      new ColorComponent({
        fill: "white",
        stroke: "gray",
      })
    );
    for (const [name, position] of this.getBoundingBoxControlPositions()) {
      this.add(
        new BoxComponent({
          position,
          size: CONTROL_SIZE,
        })
      );
      this.add(
        new HitBoxComponent({
          position,
          size: CONTROL_SIZE,
        })
      );
    }
  }

  private getBoundingBoxControlPositions() {
    const x = Vector.createX(this.option.size.x);
    const y = Vector.createY(this.option.size.y);
    const halfX = x.div(2);
    const halfY = y.div(2);
    const origin = this.option.position.sub(HALF_CONTROL_SIZE);
    const rightTop = origin.add(x);
    const leftBottom = origin.add(y);

    return new Map<BOUNDING_BOX_CONTROL_POSITION, Vector>([
      ["left-top", origin],
      ["top", origin.add(halfX)],
      ["right-top", rightTop],
      ["right", rightTop.add(halfY)],
      ["left", origin.add(halfY)],
      ["left-bottom", leftBottom],
      ["bottom", leftBottom.add(halfX)],
      ["right-bottom", origin.add(this.option.size)],
    ]);
  }
}

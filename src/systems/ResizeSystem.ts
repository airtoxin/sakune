import { DragState } from "../states/DragState";
import { System } from "ecs-lib";
import { BoundingBoxComponent } from "../components/BoundingBoxComponent";

export class ResizeSystem extends System {
  constructor(private dragState: DragState) {
    super([BoundingBoxComponent.type]);
  }
}

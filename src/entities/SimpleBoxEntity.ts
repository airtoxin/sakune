import { Entity } from "ecs-lib";
import { BoxComponent, BoxData } from "../components/BoxComponent";
import { ColorComponent, ColorData } from "../components/ColorComponent";
import {
  DraggableComponent,
  DraggableData,
} from "../components/DraggableComponent";
import { BoxHitComponent, BoxHitData } from "../components/BoxHitComponent";

export class SimpleBoxEntity extends Entity {
  constructor(option: BoxData & BoxHitData & ColorData & DraggableData) {
    super();
    this.add(new BoxComponent(option));
    this.add(new BoxHitComponent(option));
    this.add(new ColorComponent(option));
    this.add(new DraggableComponent(option));
  }
}

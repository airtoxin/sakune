import { Entity } from "ecs-lib";
import { BoxComponent, BoxData } from "../components/BoxComponent";
import { ColorComponent, ColorData } from "../components/ColorComponent";
import {
  DraggableComponent,
  DraggableData,
} from "../components/DraggableComponent";

export class SimpleBoxEntity extends Entity {
  constructor(option: BoxData & ColorData & DraggableData) {
    super();
    this.add(new BoxComponent(option));
    this.add(new ColorComponent(option));
    this.add(new DraggableComponent(option));
  }
}

import { BoxComponent, BoxData } from "../components/BoxComponent";
import { ColorComponent, ColorData } from "../components/ColorComponent";
import {
  DraggableComponent,
  DraggableData,
} from "../components/DraggableComponent";
import { HitBoxComponent, HitBoxData } from "../components/HitBoxComponent";
import { Entity } from "../ecs";

export class SimpleBoxEntity extends Entity {
  constructor(
    public readonly option: BoxData & HitBoxData & ColorData & DraggableData
  ) {
    super();
    this.add(new BoxComponent(option));
    this.add(new HitBoxComponent(option));
    this.add(new ColorComponent(option));
    this.add(new DraggableComponent(option));
  }
}

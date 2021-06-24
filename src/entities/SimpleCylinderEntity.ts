import { Entity } from "../ecs";
import { CircleComponent, CircleData } from "../components/CircleComponent";
import { ColorComponent, ColorData } from "../components/ColorComponent";

export class SimpleCylinderEntity extends Entity {
  constructor(public readonly option: CircleData & ColorData) {
    super();
    this.add(new CircleComponent(option));
    this.add(new ColorComponent(option));
  }
}

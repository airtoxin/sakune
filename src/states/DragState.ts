import { Component, Entity } from "../ecs";
import { HitBoxData } from "../components/HitBoxComponent";
import { ControlBoxData } from "../components/ControlBoxComponent";

export class DragState {
  public dragTarget:
    | {
        entity: Entity;
        type: "HitBoxComponent";
        component: Component<HitBoxData>;
      }
    | {
        entity: Entity;
        type: "ControlBoxComponent";
        component: Component<ControlBoxData>;
        components: Component<ControlBoxData>[];
      }
    | null = null;
}

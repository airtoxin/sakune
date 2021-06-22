import { Component } from "../ecs";
import { HitBoxData } from "./HitBoxComponent";
import { BOUNDING_BOX_CONTROL_POSITION } from "./ResizableComponent";

export type ControlBoxData = HitBoxData & {
  type: BOUNDING_BOX_CONTROL_POSITION;
};
export const ControlBoxComponent = Component.register<ControlBoxData>();

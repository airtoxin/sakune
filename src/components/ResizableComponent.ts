import { Component } from "../ecs";
import { Vector } from "../Vector";

export const CONTROL_SIZE = new Vector(10, 10);
export const HALF_CONTROL_SIZE = CONTROL_SIZE.div(2);

export type BOUNDING_BOX_CONTROL_POSITION =
  typeof BOUNDING_BOX_CONTROL_POSITION[number];
export const BOUNDING_BOX_CONTROL_POSITION = [
  "top",
  "left",
  "right",
  "bottom",
  "left-top",
  "right-top",
  "left-bottom",
  "right-bottom",
] as const;

export type ResizableData = {
  resizable: boolean;
};
export const ResizableComponent = Component.register<ResizableData>();

import { Component } from "../ecs";
import { Vector } from "../Vector";
import { HitBoxData } from "./HitBoxComponent";

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

export const getControlPositions = (
  box: HitBoxData
): Map<BOUNDING_BOX_CONTROL_POSITION, Vector> => {
  const x = Vector.createX(box.size.x);
  const y = Vector.createY(box.size.y);
  const halfX = x.div(2);
  const halfY = y.div(2);
  const origin = box.position.sub(HALF_CONTROL_SIZE);
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
    ["right-bottom", origin.add(box.size)],
  ]);
};

export type ResizableData = {
  resizable: boolean;
};
export const ResizableComponent = Component.register<ResizableData>();

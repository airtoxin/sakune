import { Vector } from "../Vector";
import { Component } from "ecs-lib";

export type BoxHitData = {
  position: Vector;
  size: Vector;
};
export const BoxHitComponent = Component.register<BoxHitData>();

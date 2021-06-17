import { Vector } from "../Vector";
import { Component } from "ecs-lib";

export type HitBoxData = {
  position: Vector;
  size: Vector;
};
export const HitBoxComponent = Component.register<HitBoxData>();

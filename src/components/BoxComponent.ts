import { Vector } from "../Vector";
import { Component } from "../ecs";

export type BoxData = {
  position: Vector;
  size: Vector;
};
export const BoxComponent = Component.register<BoxData>();

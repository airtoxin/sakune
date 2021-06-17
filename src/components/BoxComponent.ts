import { Component } from "ecs-lib";
import { Vector } from "../Vector";

export type BoxData = {
  position: Vector;
  size: Vector;
};
export const BoxComponent = Component.register<BoxData>();

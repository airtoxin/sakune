import { Vector } from "../Vector";
import { Component } from "../ecs";

export class HitCircleData {
  constructor(public center: Vector, radius: Vector) {}
}

export const HitCircleComponent = Component.register<HitCircleData>();

import { Vector } from "../Vector";
import { Component } from "../ecs";

export class CircleData {
  constructor(public center: Vector, public radius: number) {}
}

export const CircleComponent = Component.register<CircleData>();

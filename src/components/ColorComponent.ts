import { Component } from "../ecs";

export type ColorData = {
  fill?: string;
  stroke?: string;
};
export const ColorComponent = Component.register<ColorData>();

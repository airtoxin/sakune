import { Component } from "ecs-lib";

export type ColorData = {
  fill?: string;
  stroke?: string;
};
export const ColorComponent = Component.register<ColorData>();

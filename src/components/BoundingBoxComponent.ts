import { Component } from "ecs-lib";

export type BoundingBoxData = {
  resizable: boolean;
  keepAspectRatio?: boolean;
};
export const BoundingBoxComponent = Component.register<BoundingBoxData>();

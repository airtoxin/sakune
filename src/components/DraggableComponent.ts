import { Component } from "ecs-lib";

export type DraggableData = {
  draggable: boolean;
};
export const DraggableComponent = Component.register<DraggableData>();

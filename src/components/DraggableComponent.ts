import { Component } from "../ecs";

export type DraggableData = {
  draggable: boolean;
};
export const DraggableComponent = Component.register<DraggableData>();

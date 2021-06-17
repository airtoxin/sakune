import { Component } from "ecs-lib";
import { Vector } from "./Vector";

export type Img = {
  src: string;
  img?: HTMLImageElement;
};
export const ImgComponent = Component.register<Img>();

export type Box = {
  position: Vector;
  size: Vector;
};
export const BoxComponent = Component.register<Box>();

export type Color = {
  fill?: string;
  stroke?: string;
};
export const ColorComponent = Component.register<Color>();

export type Draggable = {
  draggable: boolean;
};
export const DraggableComponent = Component.register<Draggable>();

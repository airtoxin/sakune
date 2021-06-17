import { Component } from "../ecs";

export type ImageData = {
  src: string;
  img?: HTMLImageElement;
};
export const ImageComponent = Component.register<ImageData>();

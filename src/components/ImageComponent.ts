import { Component } from "ecs-lib";

export type ImageData = {
  src: string;
  img?: HTMLImageElement;
};
export const ImageComponent = Component.register<ImageData>();

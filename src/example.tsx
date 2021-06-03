import React from "react";
import { aqkn } from "./aqkn";
import { Vector } from "./Vector";

aqkn(document.getElementById("root")!, {
  size: new Vector(500, 500),
  pieces: new Map([
    [
      "BigSquare-Black",
      {
        num: 8,
        color: "black",
        shape: {
          type: "rect",
          size: new Vector(40, 40),
        },
      },
    ],
    [
      "BigSquare-White",
      {
        num: 8,
        color: "white",
        shape: {
          type: "rect",
          size: new Vector(40, 40),
        },
      },
    ],
    [
      "Rect-Black",
      {
        num: 8,
        color: "black",
        shape: {
          type: "rect",
          size: new Vector(40, 20),
        },
      },
    ],
    [
      "Rect-White",
      {
        num: 8,
        color: "white",
        shape: {
          type: "rect",
          size: new Vector(40, 20),
        },
      },
    ],
    [
      "SmallSquare-Black",
      {
        num: 3,
        color: "black",
        shape: {
          type: "rect",
          size: new Vector(20, 20),
        },
      },
    ],
    [
      "SmallSquare-White",
      {
        num: 3,
        color: "white",
        shape: {
          type: "rect",
          size: new Vector(20, 20),
        },
      },
    ],
  ]),
});

import React from "react";
import { Aqkn } from "./main";
import { Vector } from "./Vector";
import { render } from "react-dom";
import { createPieces } from "./core";

const pieces = createPieces(
  new Map([
    [
      "BigSquare-Black",
      {
        num: 2,
        color: "black",
        shape: {
          type: "rect",
          size: new Vector(80, 80),
          height: 10,
        },
      },
    ],
    // [
    //   "BigSquare-White",
    //   {
    //     num: 8,
    //     color: "white",
    //     shape: {
    //       type: "rect",
    //       size: new Vector(80, 80),
    //     },
    //   },
    // ],
    // [
    //   "Rect-Black",
    //   {
    //     num: 8,
    //     color: "black",
    //     shape: {
    //       type: "rect",
    //       size: new Vector(80, 40),
    //     },
    //   },
    // ],
    // [
    //   "Rect-White",
    //   {
    //     num: 8,
    //     color: "white",
    //     shape: {
    //       type: "rect",
    //       size: new Vector(80, 40),
    //     },
    //   },
    // ],
    // [
    //   "SmallSquare-Black",
    //   {
    //     num: 3,
    //     color: "black",
    //     shape: {
    //       type: "rect",
    //       size: new Vector(40, 40),
    //     },
    //   },
    // ],
    // [
    //   "SmallSquare-White",
    //   {
    //     num: 3,
    //     color: "white",
    //     shape: {
    //       type: "rect",
    //       size: new Vector(40, 40),
    //     },
    //   },
    // ],
  ])
);

render(
  <Aqkn
    option={{
      size: new Vector(500, 500),
      pieces,
    }}
  />,
  document.getElementById("root")
);

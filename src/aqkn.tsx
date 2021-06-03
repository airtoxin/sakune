import { Vector } from "./Vector";
import { unreachableCode } from "./utils";
import { render } from "react-dom";
import React from "react";

export interface AqknOption<PieceName extends string> {
  size: Vector;
  pieces: Map<PieceName, Piece>;
}

export interface Piece {
  name?: string;
  num: number;
  color: string;
  shape: PieceShape;
  image?: string;
}

export interface PieceShape {
  type: PieceShapeType;
  size: Vector;
  angle?: number;
}

type PieceShapeType = "circle" | "rect";

export const aqkn = <TPieceName extends string>(
  mountElement: HTMLElement,
  option: AqknOption<TPieceName>
): void => {
  render(<Aqkn option={option} />, mountElement);
};

type Props<TPieceName extends string> = {
  option: AqknOption<TPieceName>;
};
type AqknComponent = <TPieceName extends string>(
  props: Props<TPieceName>
) => React.ReactElement<Props<TPieceName>>;

const Aqkn: AqknComponent = ({ option }) => {
  const pieceChildren = Array.from(option.pieces.entries()).map(
    ([name, piece], i) => {
      switch (piece.shape.type) {
        case "circle": {
          return (
            <ellipse
              cx={i * 20}
              cy={i * 20}
              rx={piece.shape.size.x}
              ry={piece.shape.size.y}
              fill={piece.color}
            />
          );
        }
        case "rect": {
          return (
            <rect
              x={i * 20}
              y={i * 20}
              width={piece.shape.size.x}
              height={piece.shape.size.y}
              fill={piece.color}
            />
          );
        }
        default: {
          return unreachableCode(piece.shape.type);
        }
      }
    }
  );

  return (
    <svg
      style={{
        width: `${option.size.x}px`,
        height: `${option.size.y}px`,
      }}
      viewBox={`0, 0, ${option.size.x}, ${option.size.y}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {pieceChildren}
    </svg>
  );
};

import { unreachableCode } from "./utils";
import React, { useCallback, useReducer, useState } from "react";
import { AqknOption, AqknPiece } from "./core";
import { RectPiece } from "./RectPiece";
import { Vector } from "./Vector";

type Props<TPieceName extends string> = {
  option: AqknOption<TPieceName>;
};
type AqknComponent = <TPieceName extends string>(
  props: Props<TPieceName>
) => React.ReactElement<Props<TPieceName>>;

type PiecePositions = {
  [id: string]: Vector;
};
type PiecePositionAction =
  | { type: "SET_POSITION"; id: string; position: Vector }
  | { type: "SNAP"; snappingPieceId: string; snapToPieceId: string };

export const Aqkn: AqknComponent = ({ option }) => {
  const [pieces, setPieces] = useState(option.pieces);
  const updateOrder = useCallback(
    (piece: AqknPiece<any>) => {
      setPieces((pieces) =>
        pieces.filter((p) => p.id !== piece.id).concat(piece)
      );
    },
    [pieces]
  );
  const [positions, dispatch] = useReducer(
    (state: PiecePositions, action: PiecePositionAction): PiecePositions => {
      if (action.type === "SET_POSITION") {
        return { ...state, [action.id]: action.position };
      } else if (action.type === "SNAP") {
        return {
          ...state,
          [action.snappingPieceId]: state[action.snapToPieceId]!,
        };
      } else {
        return unreachableCode(action);
      }
    },
    pieces.reduce(
      (acc, piece, i) => ({
        ...acc,
        [piece.id]: new Vector(
          100 + piece.shape.height * (pieces.length - i),
          100 + piece.shape.height * (pieces.length - i)
        ),
      }),
      {}
    )
  );

  const pieceChildren = pieces.map((piece, i) => {
    switch (piece.shape.type) {
      case "circle": {
        return (
          <ellipse
            key={piece.id}
            strokeWidth={1}
            stroke="gray"
            cx={i * 100}
            cy={i * 100}
            rx={piece.shape.size.x}
            ry={piece.shape.size.y}
            fill={piece.color}
            style={{
              filter: `drop-shadow(10px 10px 5px #888)`,
            }}
          />
        );
      }
      case "rect": {
        return (
          <RectPiece
            key={piece.id}
            piece={piece}
            position={positions[piece.id]!}
            onInteractStart={() => updateOrder(piece)}
            onMove={(position) => {
              const snapTarget = Object.keys(positions)
                .filter((id) => id !== piece.id)
                .find((id) => {
                  return positions[id]!.distance(position) < piece.shape.height;
                });
              if (snapTarget != null) {
                dispatch({
                  type: "SNAP",
                  snappingPieceId: piece.id,
                  snapToPieceId: snapTarget,
                });
              } else {
                dispatch({ type: "SET_POSITION", id: piece.id, position });
              }
            }}
          />
        );
      }
      default: {
        return unreachableCode(piece.shape.type);
      }
    }
  });

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

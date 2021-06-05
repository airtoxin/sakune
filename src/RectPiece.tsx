import React, { MouseEvent, useCallback, useState } from "react";
import { AqknPiece } from "./core";
import { Vector } from "./Vector";

type Props<TPieceName extends string> = {
  piece: AqknPiece<TPieceName>;
  onInteract: () => void;
};
type RectPieceComponent = <TPieceName extends string>(
  props: Props<TPieceName>
) => React.ReactElement<Props<TPieceName>>;

export const RectPiece: RectPieceComponent = ({ piece, onInteract }) => {
  const [draggingPositionDiff, setDraggingPositionDiff] =
    useState<Vector | null>(null);
  const handleDrag = useCallback(
    (event: MouseEvent) => {
      if (draggingPositionDiff) {
        setPosition(
          new Vector(
            event.clientX - draggingPositionDiff.x,
            event.clientY - draggingPositionDiff.y
          )
        );
      }
    },
    [draggingPositionDiff]
  );
  const [position, setPosition] = useState(new Vector(100, 100));

  return (
    <g
      key={piece.id}
      strokeWidth="1"
      stroke="gray"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        filter: `drop-shadow(rgba(136, 136, 136, 0.3) ${piece.shape.height}px ${
          piece.shape.height
        }px ${piece.shape.height / 2}px)`,
      }}
      onMouseDown={(event) => {
        onInteract();
        setDraggingPositionDiff(
          new Vector(event.clientX - position.x, event.clientY - position.y)
        );
      }}
      onMouseUp={() => setDraggingPositionDiff(null)}
      onMouseMove={handleDrag}
    >
      <rect
        width={piece.shape.size.x}
        height={piece.shape.size.y}
        fill={piece.color}
        style={{}}
      />
      <rect
        strokeWidth="1"
        stroke="gray"
        width={piece.shape.size.x}
        height={piece.shape.height}
        fill={piece.color}
        style={{
          transform: `translate(0px, ${piece.shape.size.y}px)  skewX(45deg)`,
        }}
      />
      <rect
        strokeWidth="1"
        stroke="gray"
        width={piece.shape.height}
        height={piece.shape.size.y}
        fill={piece.color}
        style={{
          transform: `translate(${piece.shape.size.x}px, 0px)  skewY(45deg)`,
        }}
      />
    </g>
  );
};

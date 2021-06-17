import { Vector } from "../Vector";
import { generate } from "short-uuid";
import { seq } from "../utils";

export interface AqknOption<TPieceName extends string> {
  size: Vector;
  pieces: AqknPiece<TPieceName>[];
}

export interface PieceTemplate {
  num: number;
  color: string;
  shape: PieceShape;
  image?: string;
}

export interface PieceShape {
  type: PieceShapeType;
  size: Vector;
  height: number;
  angle?: number;
}

type PieceShapeType = "circle" | "rect";
export type AqknPiece<TPieceName extends string> = {
  id: string;
  name: TPieceName;
  color: string;
  shape: PieceShape;
  image?: string;
};

export const createPieces = <TPieceName extends string>(
  templates: Map<TPieceName, PieceTemplate>
): AqknPiece<TPieceName>[] => {
  return Array.from(templates.entries()).flatMap(([name, template]) =>
    seq(template.num).map(() => ({
      ...template,
      id: generate(),
      name,
    }))
  );
};

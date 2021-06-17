import { Vector } from "../Vector";
import { checkBoxHit } from "../utils";

const CONTROL_SIZE = new Vector(10, 10);
const HALF_CONTROL_SIZE = CONTROL_SIZE.div(2);

type BOUNDING_BOX_CONTROL_POSITION =
  typeof BOUNDING_BOX_CONTROL_POSITION[number];
const BOUNDING_BOX_CONTROL_POSITION = [
  "top",
  "left",
  "right",
  "bottom",
  "left-top",
  "right-top",
  "left-bottom",
  "right-bottom",
] as const;

const BOUNDING_BOX_CONTROL_CURSOR = new Map<
  BOUNDING_BOX_CONTROL_POSITION,
  string
>([
  ["top", "n-resize"],
  ["left", "w-resize"],
  ["right", "e-resize"],
  ["bottom", "s-resize"],
  ["left-top", "nw-resize"],
  ["right-top", "ne-resize"],
  ["left-bottom", "sw-resize"],
  ["right-bottom", "se-resize"],
]);

type AqknImageConstructorOption = {
  readonly src: string;
  readonly origin?: Vector;
  readonly size?: Vector;
  readonly addBoundingBox?: boolean;
};

export class AqknImage {
  private readonly img = new Image();
  private imageOrigin: Vector;
  private imageSize: Vector;
  private draggingOrigin: Vector | null = null;
  // 今カーソルがぶつかっているもの
  private hitType: "image" | BOUNDING_BOX_CONTROL_POSITION | null = null;
  // ドラッグ処理の対象
  private draggingType: "image" | BOUNDING_BOX_CONTROL_POSITION | null = null;

  public constructor(
    readonly canvas: HTMLCanvasElement,
    readonly ctx: CanvasRenderingContext2D,
    readonly option: AqknImageConstructorOption
  ) {
    this.img.src = option.src;
    this.imageOrigin = option.origin ?? new Vector(0, 0);
    this.imageSize = option.size ?? new Vector(100, 100);
    if (!option.size) {
      this.img.addEventListener("load", (event) => {
        if (event.target instanceof HTMLImageElement) {
          this.imageSize = new Vector(event.target.width, event.target.height);
        }
      });
    }

    canvas.addEventListener("mousedown", (event) => {
      this.handleMouseDown(new Vector(event.offsetX, event.offsetY));
    });
    canvas.addEventListener("mousemove", (event) => {
      this.handleMouseMove(new Vector(event.offsetX, event.offsetY));
    });
    canvas.addEventListener("mouseup", (event) => {
      this.handleMouseUp(new Vector(event.offsetX, event.offsetY));
    });
  }

  public render() {
    this.ctx.drawImage(
      this.img,
      ...this.imageOrigin.destruct(),
      ...this.imageSize.destruct()
    );
    if (this.option.addBoundingBox) {
      this.renderBoundingBox();
    }
  }

  private handleMouseDown(mousePosition: Vector) {
    this.draggingOrigin = mousePosition;
    this.draggingType = this.hitType;
  }

  private handleDrag(mousePosition: Vector) {
    if (this.draggingOrigin == null || this.draggingType == null) return;

    if (this.draggingType === "image") {
      this.imageOrigin = this.imageOrigin.add(
        mousePosition.sub(this.draggingOrigin)
      );
    } else {
      const diffX = Vector.createX(mousePosition.sub(this.draggingOrigin).x);
      const diffY = Vector.createY(mousePosition.sub(this.draggingOrigin).y);
      this.draggingOrigin = mousePosition;
      if (["left-top", "top", "right-top"].includes(this.draggingType)) {
        this.imageOrigin = this.imageOrigin.add(diffY);
        this.imageSize = this.imageSize.sub(diffY);
      }
      if (
        ["left-bottom", "bottom", "right-bottom"].includes(this.draggingType)
      ) {
        this.imageSize = this.imageSize.add(diffY);
      }
      if (["left-top", "left", "left-bottom"].includes(this.draggingType)) {
        this.imageOrigin = this.imageOrigin.add(diffX);
        this.imageSize = this.imageSize.sub(diffX);
      }
      if (["right-top", "right", "right-bottom"].includes(this.draggingType)) {
        this.imageSize = this.imageSize.add(diffX);
      }
    }
  }

  private handleMouseMove(mousePosition: Vector) {
    this.setHitTypeAndCursor(mousePosition);
    this.handleDrag(mousePosition);
    this.draggingOrigin = mousePosition;
  }

  private setHitTypeAndCursor(mousePosition: Vector) {
    // 型指定を省略するために宣言後にnull代入している
    let hitType = this.hitType;
    hitType = null;
    if (checkBoxHit(mousePosition, this.imageOrigin, this.imageSize)) {
      hitType = "image";
      this.canvas.style.cursor = "pointer";
    }
    for (const [
      controlType,
      position,
    ] of this.getBoundingBoxControlPositions().entries()) {
      if (checkBoxHit(mousePosition, position, CONTROL_SIZE)) {
        hitType = controlType;
        this.canvas.style.cursor =
          BOUNDING_BOX_CONTROL_CURSOR.get(controlType) ?? "pointer";
      }
    }
    this.hitType = hitType;
    if (hitType == null) {
      this.canvas.style.cursor = "auto";
    }
  }

  private handleMouseUp(mousePosition: Vector) {
    this.draggingOrigin = null;
    this.draggingType = null;
  }

  private renderBoundingBox() {
    this.ctx.save();

    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = "white";
    this.ctx.strokeStyle = "#222";

    this.ctx.strokeRect(
      ...this.imageOrigin.destruct(),
      ...this.imageSize.destruct()
    );

    for (const position of this.getBoundingBoxControlPositions().values()) {
      this.ctx.fillRect(...position.destruct(), ...CONTROL_SIZE.destruct());
      this.ctx.strokeRect(...position.destruct(), ...CONTROL_SIZE.destruct());
    }

    this.ctx.restore();
  }

  private getBoundingBoxControlPositions() {
    const x = Vector.createX(this.imageSize.x);
    const y = Vector.createY(this.imageSize.y);
    const halfX = x.div(2);
    const halfY = y.div(2);
    const origin = this.imageOrigin.sub(HALF_CONTROL_SIZE);
    const rightTop = origin.add(x);
    const leftBottom = origin.add(y);

    return new Map<BOUNDING_BOX_CONTROL_POSITION, Vector>([
      ["left-top", origin],
      ["top", origin.add(halfX)],
      ["right-top", rightTop],
      ["right", rightTop.add(halfY)],
      ["left", origin.add(halfY)],
      ["left-bottom", leftBottom],
      ["bottom", leftBottom.add(halfX)],
      ["right-bottom", origin.add(this.imageSize)],
    ]);
  }
}

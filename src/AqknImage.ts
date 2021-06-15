import { Vector } from "./Vector";
import { checkBoxHit, unreachableCode } from "./utils";

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
  private dragType: "image" | BOUNDING_BOX_CONTROL_POSITION | null = null;

  constructor(
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
      this.handleEvent("down", new Vector(event.offsetX, event.offsetY));
    });
    canvas.addEventListener("mousemove", (event) => {
      this.handleEvent("move", new Vector(event.offsetX, event.offsetY));
    });
    canvas.addEventListener("mouseup", (event) => {
      this.handleEvent("up", new Vector(event.offsetX, event.offsetY));
    });
  }

  render() {
    this.ctx.drawImage(
      this.img,
      ...this.imageOrigin.destruct(),
      ...this.imageSize.destruct()
    );
    if (this.option.addBoundingBox) {
      this.renderBoundingBox();
    }
  }

  private handleEvent(
    eventType: "down" | "move" | "up",
    mousePosition: Vector
  ) {
    if (eventType === "down") {
      this.draggingOrigin = mousePosition;
      // 制御ポイントの衝突判定のが優先なので後にチェックする
      if (checkBoxHit(mousePosition, this.imageOrigin, this.imageSize)) {
        this.dragType = "image";
      }
      for (const [
        controlType,
        position,
      ] of this.getBoundingBoxControlPositions().entries()) {
        if (checkBoxHit(mousePosition, position, CONTROL_SIZE)) {
          this.dragType = controlType;
          break;
        }
      }
    } else if (eventType === "move") {
      if (this.draggingOrigin == null) return;
      if (this.dragType == null) return;
      const diffX = Vector.createX(mousePosition.sub(this.draggingOrigin).x);
      const diffY = Vector.createY(mousePosition.sub(this.draggingOrigin).y);
      if (["left-top", "top", "right-top"].includes(this.dragType)) {
        this.imageOrigin = this.imageOrigin.add(diffY);
        this.imageSize = this.imageSize.sub(diffY);
      }
      if (["left-bottom", "bottom", "right-bottom"].includes(this.dragType)) {
        this.imageSize = this.imageSize.add(diffY);
      }
      if (["left-top", "left", "left-bottom"].includes(this.dragType)) {
        this.imageOrigin = this.imageOrigin.add(diffX);
        this.imageSize = this.imageSize.sub(diffX);
      }
      if (["right-top", "right", "right-bottom"].includes(this.dragType)) {
        this.imageSize = this.imageSize.add(diffX);
      }
      this.draggingOrigin = mousePosition;

      // // バウンディングボックスの制御ポイントの衝突判定
      // for (const [
      //   controlType,
      //   position,
      // ] of this.getBoundingBoxControlPositions().entries()) {
      //   if (checkBoxHit(mousePosition, position, CONTROL_SIZE)) {
      //     this.canvas.style.cursor =
      //       BOUNDING_BOX_CONTROL_CURSOR.get(controlType)!;
      //
      //     // ドラッグ処理
      //     if (this.draggingOrigin == null) return;
      //     // ドラッグ開始位置が衝突判定外だったら移動しない
      //     if (!checkBoxHit(this.draggingOrigin, position, CONTROL_SIZE)) return;
      //     const diffX = Vector.createX(
      //       mousePosition.sub(this.draggingOrigin).x
      //     );
      //     const diffY = Vector.createY(
      //       mousePosition.sub(this.draggingOrigin).y
      //     );
      //     this.draggingOrigin = mousePosition;
      //     if (["left-top", "top", "right-top"].includes(controlType)) {
      //       this.imageOrigin = this.imageOrigin.add(diffY);
      //       this.imageSize = this.imageSize.sub(diffY);
      //     }
      //     if (["left-bottom", "bottom", "right-bottom"].includes(controlType)) {
      //       this.imageSize = this.imageSize.add(diffY);
      //     }
      //     if (["left-top", "left", "left-bottom"].includes(controlType)) {
      //       this.imageOrigin = this.imageOrigin.add(diffX);
      //       this.imageSize = this.imageSize.sub(diffX);
      //     }
      //     if (["right-top", "right", "right-bottom"].includes(controlType)) {
      //       this.imageSize = this.imageSize.add(diffX);
      //     }
      //
      //     return;
      //   }
      // }

      // 画像の衝突判定
      if (checkBoxHit(mousePosition, this.imageOrigin, this.imageSize)) {
        this.canvas.style.cursor = "pointer";
        if (this.draggingOrigin == null) return;

        // ドラッグ開始位置が衝突判定外だったら移動しない
        if (!checkBoxHit(this.draggingOrigin, this.imageOrigin, this.imageSize))
          return;

        // ドラッグ処理
        this.imageOrigin = this.imageOrigin.add(
          mousePosition.sub(this.draggingOrigin)
        );
        this.draggingOrigin = mousePosition;
      } else {
        this.canvas.style.cursor = "auto";
      }
    } else if (eventType === "up") {
      this.draggingOrigin = null;
    } else {
      unreachableCode(eventType);
    }
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

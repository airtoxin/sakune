import { Vector } from "../Vector";

export class MouseState {
  public draggingOrigin: Vector | null = null;
  public position: Vector | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    canvas.addEventListener("mousedown", (event) => {
      this.draggingOrigin = new Vector(event.offsetX, event.offsetY);
    });
    canvas.addEventListener("mousemove", (event) => {
      this.position = new Vector(event.offsetX, event.offsetY);
    });
    canvas.addEventListener("mouseup", () => {
      this.draggingOrigin = null;
    });
    canvas.addEventListener("mouseleave", () => {
      this.position = null;
    });
  }
}

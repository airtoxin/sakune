import { unreachableCode } from "../utils";
import { Vector } from "../Vector";

export const createCanvas = (mountingElement: Element): void => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  mountingElement.appendChild(canvas);

  canvas.addEventListener("mousedown", (ev) =>
    handleEvent("down", new Vector(ev.x, ev.y))
  );
  window.addEventListener("mousemove", (ev) =>
    handleEvent("move", new Vector(ev.x, ev.y))
  );
  window.addEventListener("mouseup", (ev) =>
    handleEvent("up", new Vector(ev.x, ev.y))
  );

  let imageOrigin = new Vector(100, 100);
  let imageSize = new Vector(200, 200);

  let draggingOrigin: Vector | null = null;

  const handleEvent = (type: "down" | "move" | "up", mousePosition: Vector) => {
    if (type === "down") {
      draggingOrigin = mousePosition;
    } else if (type === "move") {
      if (draggingOrigin == null) return;
      if (checkBoxHit(mousePosition, imageOrigin, imageSize)) {
        imageOrigin = imageOrigin.add(mousePosition.sub(draggingOrigin));
        draggingOrigin = mousePosition;
      }
    } else if (type === "up") {
      draggingOrigin = null;
    } else {
      unreachableCode(type);
    }
  };

  const checkBoxHit = (
    mousePosition: Vector,
    boxOrigin: Vector,
    boxSize: Vector
  ): boolean => {
    return (
      boxOrigin.x < mousePosition.x &&
      mousePosition.x < boxOrigin.x + boxSize.x &&
      boxOrigin.y < mousePosition.y &&
      mousePosition.y < boxOrigin.y + boxSize.y
    );
  };

  setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, imageOrigin.x, imageOrigin.y, imageSize.x, imageSize.y);
  }, 16);
};

const BACKGROUND_IMAGE =
  "https://cf.geekdo-images.com/EFJ0PGh7xq_UHb1RkfITgA__imagepagezoom/img/wFxN73HF1W8_0L8yvQik6wEiTW4=/fit-in/1200x900/filters:no_upscale():strip_icc()/pic369329.jpg";
const img = new Image();
img.src = BACKGROUND_IMAGE;

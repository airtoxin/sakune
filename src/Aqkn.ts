import { Vector } from "./Vector";
import { styleMap } from "lit-html/directives/style-map";
import { html, render } from "lit-html";

export class Aqkn {
  constructor(public readonly size: Vector) {}

  render(mountElement: Element): void {
    const svgStyle = styleMap({
      width: `${this.size.x}px`,
      height: `${this.size.y}px`
    });

    render(html`<svg style=${svgStyle}></svg>`, mountElement);
  }
}

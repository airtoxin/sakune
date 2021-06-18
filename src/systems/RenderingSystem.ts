import { SimpleBoxEntity } from "../entities/SimpleBoxEntity";
import { ImageEntity } from "../entities/ImageEntity";
import { HitBoxComponent } from "../components/HitBoxComponent";
import { ColorComponent } from "../components/ColorComponent";
import { ImageComponent } from "../components/ImageComponent";
import { Entity, System } from "../ecs";
import { BoxComponent } from "../components/BoxComponent";
import {
  BOUNDING_BOX_CONTROL_POSITION,
  CONTROL_SIZE,
  HALF_CONTROL_SIZE,
  ResizableComponent,
} from "../components/ResizableComponent";
import { Vector } from "../Vector";

export class RenderingSystem extends System {
  // 先の要素から先にレンダリングされる = 背面にある
  public orderedEntities: Entity[] = [];

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly ctx: CanvasRenderingContext2D
  ) {
    super([
      [BoxComponent.type, ColorComponent.type],
      [HitBoxComponent.type, ImageComponent.type],
      [HitBoxComponent.type, ResizableComponent.type],
    ]);
    this.canvas.style.border = "solid";
  }

  enter(entity: Entity) {
    this.orderedEntities.push(entity);
  }

  exit(entity: Entity) {
    this.orderedEntities = [entity].concat(
      this.orderedEntities.filter((e) => e.id === entity.id)
    );
  }

  beforeUpdateAll() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  update(_entity: Entity): void {}

  afterUpdateAll(_entities: Entity[]) {
    // 自前で順番を管理するために entities は使わない
    for (const entity of this.orderedEntities) {
      this.renderBox(entity);
      this.renderImage(entity);
      this.renderBoundingBox(entity);
    }
  }

  private renderBox(entity: Entity) {
    this.ctx.save();

    this.ctx.lineWidth = 1;

    const boxComponents = BoxComponent.get(entity);
    const [colorComponent] = ColorComponent.get(entity);

    for (const boxComponent of boxComponents) {
      this.ctx.beginPath();
      this.ctx.rect(
        ...boxComponent.data.position.destruct(),
        ...boxComponent.data.size.destruct()
      );

      if (colorComponent != null) {
        if (colorComponent.data.fill) {
          this.ctx.fillStyle = colorComponent.data.fill;
          this.ctx.fill();
        }
        if (colorComponent.data.stroke) {
          this.ctx.strokeStyle = colorComponent.data.stroke;
          this.ctx.stroke();
        }
      }
      this.ctx.closePath();
    }

    this.ctx.restore();
  }

  private renderBoundingBox(entity: Entity) {
    for (const [name, position] of this.getBoundingBoxControlPositions(
      entity
    ).entries()) {
      this.ctx.save();
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(...position.destruct(), ...CONTROL_SIZE.destruct());
      this.ctx.restore();
    }
  }

  private getBoundingBoxControlPositions(entity: Entity) {
    const [hitBoxComponent] = HitBoxComponent.get(entity);
    const [resizableComponent] = ResizableComponent.get(entity);

    const empty = new Map<BOUNDING_BOX_CONTROL_POSITION, Vector>();
    if (hitBoxComponent == null || resizableComponent == null) return empty;
    if (!resizableComponent.data.resizable) return empty;

    const x = Vector.createX(hitBoxComponent.data.size.x);
    const y = Vector.createY(hitBoxComponent.data.size.y);
    const halfX = x.div(2);
    const halfY = y.div(2);
    const origin = hitBoxComponent.data.position.sub(HALF_CONTROL_SIZE);
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
      ["right-bottom", origin.add(hitBoxComponent.data.size)],
    ]);
  }

  private renderImage(entity: Entity) {
    this.ctx.save();

    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = "white";
    this.ctx.strokeStyle = "#222";

    const [boxHitComponent] = HitBoxComponent.get(entity);
    const [imgComponent] = ImageComponent.get(entity);

    if (boxHitComponent == null || imgComponent == null) return;

    if (imgComponent.data.img != null) {
      this.ctx.drawImage(
        imgComponent.data.img,
        ...boxHitComponent.data.position.destruct(),
        ...boxHitComponent.data.size.destruct()
      );
    }

    this.ctx.restore();
  }
}

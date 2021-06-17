import { SimpleBoxEntity } from "../entities/SimpleBoxEntity";
import { ImageEntity } from "../entities/ImageEntity";
import { HitBoxComponent } from "../components/HitBoxComponent";
import { ColorComponent } from "../components/ColorComponent";
import { ImageComponent } from "../components/ImageComponent";
import { Entity, System } from "../ecs";
import { BoxComponent } from "../components/BoxComponent";

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
      if (entity instanceof SimpleBoxEntity) {
        this.renderBox(entity);
      } else if (entity instanceof ImageEntity) {
        this.renderImage(entity);
      }
    }
  }

  private renderBox(entity: Entity) {
    this.ctx.save();

    this.ctx.lineWidth = 1;

    const [boxComponent] = BoxComponent.get(entity);
    const [colorComponent] = ColorComponent.get(entity);

    if (boxComponent == null) return;

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

    this.ctx.restore();
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

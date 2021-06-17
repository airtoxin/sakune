import { Entity, System } from "ecs-lib";
import { SimpleBoxEntity } from "../entities/SimpleBoxEntity";
import { ImageEntity } from "../entities/ImageEntity";
import { BoxComponent } from "../components/BoxComponent";
import { ColorComponent } from "../components/ColorComponent";
import { ImageComponent } from "../components/ImageComponent";

export class RenderingSystem extends System {
  // 先の要素から先にレンダリングされる = 背面にある
  public orderedEntities: Entity[] = [];

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly ctx: CanvasRenderingContext2D
  ) {
    super([-1]);
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

  beforeUpdateAll(_time: number) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  update(_time: number, _delta: number, _entity: Entity): void {}

  afterUpdateAll(_time: number, _entities: Entity[]) {
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

    const boxComponent = BoxComponent.oneFrom(entity);
    const colorComponent = ColorComponent.oneFrom(entity);

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

    const boxComponent = BoxComponent.oneFrom(entity);
    const imgComponent = ImageComponent.oneFrom(entity);

    if (boxComponent == null || imgComponent == null) return;

    if (imgComponent.data.img != null) {
      this.ctx.drawImage(
        imgComponent.data.img,
        ...boxComponent.data.position.destruct(),
        ...boxComponent.data.size.destruct()
      );
    }

    this.ctx.restore();
  }
}

import { Entity, System } from "ecs-lib";
import {
  BoxComponent,
  ColorComponent,
  DraggableComponent,
  ImgComponent,
} from "./Components";
import { ImageEntity, SimpleBoxEntity } from "./Entities";
import { MouseState } from "./MouseState";
import { checkBoxHit } from "./utils";

export class RenderingSystem extends System {
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly ctx: CanvasRenderingContext2D
  ) {
    super([-1]);
    this.canvas.style.border = "solid";
  }

  beforeUpdateAll(time: number) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  update(time: number, delta: number, entity: Entity): void {
    if (entity instanceof SimpleBoxEntity) {
      this.renderBox(entity);
    } else if (entity instanceof ImageEntity) {
      this.renderImage(entity);
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
    const imgComponent = ImgComponent.oneFrom(entity);

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

export class DragSystem extends System {
  private allEntities: Entity[] = [];
  constructor(private mouseState: MouseState) {
    super([BoxComponent.type, DraggableComponent.type]);
  }

  enter(entity: Entity) {
    this.allEntities.unshift(entity);
  }

  exit(entity: Entity) {
    this.allEntities = [entity].concat(
      this.allEntities.filter((e) => e.id === entity.id)
    );
  }

  update(_time: number, _delta: number, _entity: Entity) {}

  afterUpdateAll(_time: number, _entities: Entity[]) {
    if (
      this.mouseState.draggingOrigin != null &&
      this.mouseState.position != null
    ) {
      // 自前で順番を管理するために entities は使わない
      const entity = this.allEntities.find((entity) => {
        const draggableComponent = DraggableComponent.oneFrom(entity);
        if (!draggableComponent.data.draggable) return false;

        const boxComponent = BoxComponent.oneFrom(entity);

        return checkBoxHit(
          this.mouseState.position!,
          boxComponent.data.position,
          boxComponent.data.size
        );
      });

      if (entity) {
        const boxComponent = BoxComponent.oneFrom(entity);
        boxComponent.data.position = boxComponent.data.position.add(
          this.mouseState.position.sub(this.mouseState.draggingOrigin)
        );
        this.mouseState.draggingOrigin = this.mouseState.position;
      }
    }
  }
}

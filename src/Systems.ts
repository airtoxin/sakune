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
  private lastDraggingEntity: Entity | null = null;
  constructor(
    private renderingSystem: RenderingSystem,
    private mouseState: MouseState
  ) {
    super([BoxComponent.type, DraggableComponent.type]);
  }

  update(_time: number, _delta: number, _entity: Entity) {}

  afterUpdateAll(_time: number, _entities: Entity[]) {
    if (this.mouseState.draggingOrigin == null) {
      this.lastDraggingEntity = null;
    }
    if (
      this.mouseState.draggingOrigin != null &&
      this.mouseState.position != null
    ) {
      let dragTarget: Entity | null = null;
      if (this.lastDraggingEntity) {
        dragTarget = this.lastDraggingEntity;
      } else {
        // 自前で順番を管理するために entities は使わない
        // 前面のものを優先するため一旦反転する
        this.renderingSystem.orderedEntities.reverse();
        dragTarget =
          this.renderingSystem.orderedEntities.find((entity) => {
            const draggableComponent = DraggableComponent.oneFrom(entity);
            if (!draggableComponent.data.draggable) return false;

            const boxComponent = BoxComponent.oneFrom(entity);

            return checkBoxHit(
              this.mouseState.position!,
              boxComponent.data.position,
              boxComponent.data.size
            );
          }) || null;
        // 反転を戻す
        this.renderingSystem.orderedEntities.reverse();
      }

      if (dragTarget) {
        const boxComponent = BoxComponent.oneFrom(dragTarget);
        boxComponent.data.position = boxComponent.data.position.add(
          this.mouseState.position.sub(this.mouseState.draggingOrigin)
        );
        this.mouseState.draggingOrigin = this.mouseState.position;

        // 触ったものを前面に移動する
        this.renderingSystem.orderedEntities =
          this.renderingSystem.orderedEntities
            .filter((e) => e.id !== dragTarget!.id)
            .concat([dragTarget]);

        // ドラッグ状態を継続するために最後にドラッグ移動したものを記録しておく
        this.lastDraggingEntity = dragTarget;
      }
    }
  }
}

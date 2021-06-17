import { Entity, System } from "ecs-lib";
import { RenderingSystem } from "./RenderingSystem";
import { MouseState } from "../states/MouseState";
import { DraggableComponent } from "../components/DraggableComponent";
import { checkBoxHit } from "../utils";
import { DragState } from "../states/DragState";
import { BoxHitComponent } from "../components/BoxHitComponent";

export class DragSystem extends System {
  constructor(
    private renderingSystem: RenderingSystem,
    private dragState: DragState,
    private mouseState: MouseState
  ) {
    super([BoxHitComponent.type, DraggableComponent.type]);
  }

  update(_time: number, _delta: number, _entity: Entity) {}

  afterUpdateAll(_time: number, _entities: Entity[]) {
    if (this.mouseState.draggingOrigin == null) {
      this.dragState.dragTarget = null;
    }
    if (
      this.mouseState.draggingOrigin != null &&
      this.mouseState.position != null
    ) {
      let dragTarget: Entity | null = null;
      if (this.dragState.dragTarget) {
        dragTarget = this.dragState.dragTarget;
      } else {
        // 自前で順番を管理するために entities は使わない
        // 前面のものを優先するため一旦反転する
        this.renderingSystem.orderedEntities.reverse();
        dragTarget =
          this.renderingSystem.orderedEntities.find((entity) => {
            const draggableComponent = DraggableComponent.oneFrom(entity);
            if (!draggableComponent.data.draggable) return false;

            const boxHitComponent = BoxHitComponent.oneFrom(entity);

            return checkBoxHit(
              this.mouseState.position!,
              boxHitComponent.data.position,
              boxHitComponent.data.size
            );
          }) || null;
        // 反転を戻す
        this.renderingSystem.orderedEntities.reverse();
      }

      if (dragTarget) {
        const boxHitComponent = BoxHitComponent.oneFrom(dragTarget);
        boxHitComponent.data.position = boxHitComponent.data.position.add(
          this.mouseState.position.sub(this.mouseState.draggingOrigin)
        );
        this.mouseState.draggingOrigin = this.mouseState.position;

        // 触ったものを前面に移動する
        this.renderingSystem.orderedEntities =
          this.renderingSystem.orderedEntities
            .filter((e) => e.id !== dragTarget!.id)
            .concat([dragTarget]);

        // ドラッグ状態を継続するために最後にドラッグ移動したものを記録しておく
        this.dragState.dragTarget = dragTarget;
      }
    }
  }
}

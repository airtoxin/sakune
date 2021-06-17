import { RenderingSystem } from "./RenderingSystem";
import { MouseState } from "../states/MouseState";
import { DraggableComponent } from "../components/DraggableComponent";
import { checkBoxHit } from "../utils";
import { DragState } from "../states/DragState";
import { HitBoxComponent } from "../components/HitBoxComponent";
import { Entity, System } from "../ecs";

export class DragSystem extends System {
  constructor(
    private renderingSystem: RenderingSystem,
    private dragState: DragState,
    private mouseState: MouseState
  ) {
    super([[HitBoxComponent.type, DraggableComponent.type]]);
  }

  update(entity: Entity) {}

  afterUpdateAll(_entities: Entity[]) {
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
            const [draggableComponent] = DraggableComponent.get(entity);
            if (
              draggableComponent == null ||
              !draggableComponent.data.draggable
            )
              return false;

            const [boxHitComponent] = HitBoxComponent.get(entity);
            if (boxHitComponent == null) return;

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
        const [boxHitComponent] = HitBoxComponent.get(dragTarget);
        if (boxHitComponent == null) return;

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

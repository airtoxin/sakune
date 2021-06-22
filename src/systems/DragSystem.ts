import { RenderingSystem } from "./RenderingSystem";
import { MouseState } from "../states/MouseState";
import { DraggableComponent } from "../components/DraggableComponent";
import { checkBoxHit } from "../utils";
import { DragState } from "../states/DragState";
import { HitBoxComponent, HitBoxData } from "../components/HitBoxComponent";
import { Component, Entity, System } from "../ecs";
import {
  ControlBoxComponent,
  ControlBoxData,
} from "../components/ControlBoxComponent";
import { Vector } from "../Vector";

export class DragSystem extends System {
  constructor(
    private renderingSystem: RenderingSystem,
    private dragState: DragState,
    private mouseState: MouseState
  ) {
    super([
      [HitBoxComponent.type, DraggableComponent.type],
      [ControlBoxComponent.type],
    ]);
  }

  update(entity: Entity) {}

  // 自前で順番を管理するために entities は使わない
  afterUpdateAll(_entities: Entity[]) {
    if (this.mouseState.draggingOrigin == null) {
      this.dragState.dragTarget = null;
    }
    if (
      this.mouseState.draggingOrigin != null &&
      this.mouseState.position != null
    ) {
      let dragTarget: InstanceType<typeof DragState>["dragTarget"] = null;
      if (this.dragState.dragTarget) {
        dragTarget = this.dragState.dragTarget;
      } else {
        // 前面のものの衝突判定を先に行うために一旦反転する
        this.renderingSystem.orderedEntities.reverse();
        for (const entity of this.renderingSystem.orderedEntities) {
          const [draggableComponent] = DraggableComponent.get(entity);
          if (draggableComponent == null || !draggableComponent.data.draggable)
            continue;

          const [hitBoxComponent] = HitBoxComponent.get(entity);
          if (
            hitBoxComponent &&
            checkBoxHit(
              this.mouseState.position!,
              hitBoxComponent.data.position,
              hitBoxComponent.data.size
            )
          ) {
            dragTarget = {
              entity,
              type: "HitBoxComponent",
              component: hitBoxComponent,
            };
            // TODO: break
          }

          const controlBoxComponents = ControlBoxComponent.get(entity);
          for (const controlBoxComponent of controlBoxComponents) {
            if (
              checkBoxHit(
                this.mouseState.position!,
                controlBoxComponent.data.position,
                controlBoxComponent.data.size
              )
            ) {
              dragTarget = {
                entity,
                type: "ControlBoxComponent",
                component: controlBoxComponent,
                components: controlBoxComponents,
              };
              // TODO: break
            }
          }
        }
        // 反転を戻す
        this.renderingSystem.orderedEntities.reverse();
      }

      if (dragTarget) {
        if (dragTarget.type === "HitBoxComponent") {
          this.handleHitBoxDrag(dragTarget.entity, dragTarget.component);
        } else if (dragTarget.type === "ControlBoxComponent") {
          this.handleControlBoxDrag(
            dragTarget.entity,
            dragTarget.component,
            dragTarget.components
          );
        }

        // ドラッグ状態を継続するために最後にドラッグ移動したものを記録しておく
        this.dragState.dragTarget = dragTarget;
      }
    }
  }

  private handleHitBoxDrag(
    entity: Entity,
    hitBoxComponent: Component<HitBoxData>
  ) {
    if (
      this.mouseState.position == null ||
      this.mouseState.draggingOrigin == null
    )
      return;

    hitBoxComponent.data.position = hitBoxComponent.data.position.add(
      this.mouseState.position.sub(this.mouseState.draggingOrigin)
    );
    this.mouseState.draggingOrigin = this.mouseState.position;

    // 触ったものを前面に移動する
    this.renderingSystem.orderedEntities = this.renderingSystem.orderedEntities
      .filter((e) => e.id !== entity.id)
      .concat([entity]);
  }

  private handleControlBoxDrag(
    entity: Entity,
    target: Component<ControlBoxData>,
    components: Component<ControlBoxData>[]
  ) {
    if (
      this.mouseState.position == null ||
      this.mouseState.draggingOrigin == null
    )
      return;

    const [hitBoxComponent] = HitBoxComponent.get(entity);
    if (hitBoxComponent == null) return;

    const diffX = Vector.createX(
      this.mouseState.position.sub(this.mouseState.draggingOrigin).x
    );
    const diffY = Vector.createY(
      this.mouseState.position.sub(this.mouseState.draggingOrigin).y
    );
    this.mouseState.draggingOrigin = this.mouseState.position;

    if (["left-top", "top", "right-top"].includes(target.data.type)) {
      hitBoxComponent.data.position = hitBoxComponent.data.position.add(diffY);
      target.data.position = target.data.position.add(diffY);
      // TODO: おかしい
      for (const cmp of components) {
        if (["left-top", "top", "right-top"].includes(cmp.data.type)) {
          cmp.data.position = cmp.data.position.add(diffY);
        }
      }
    }
    if (["left-bottom", "bottom", "right-bottom"].includes(target.data.type)) {
      hitBoxComponent.data.size = hitBoxComponent.data.size.add(diffY);
      target.data.position = target.data.position.add(diffY);
      for (const cmp of components) {
        if (["left-bottom", "bottom", "right-bottom"].includes(cmp.data.type)) {
          cmp.data.position = cmp.data.position.add(diffY);
        }
      }
    }
    if (["left-top", "left", "left-bottom"].includes(target.data.type)) {
      hitBoxComponent.data.position = hitBoxComponent.data.position.add(diffX);
      target.data.position = target.data.position.add(diffX);
      for (const cmp of components) {
        if (["left-bottom", "bottom", "right-bottom"].includes(cmp.data.type)) {
          cmp.data.position = cmp.data.position.add(diffX);
        }
      }
    }
    if (["right-top", "right", "right-bottom"].includes(target.data.type)) {
      hitBoxComponent.data.size = hitBoxComponent.data.size.add(diffX);
      for (const cmp of components) {
        if (["left-bottom", "bottom", "right-bottom"].includes(cmp.data.type)) {
          cmp.data.position = cmp.data.position.add(diffX);
        }
      }
    }
  }
}

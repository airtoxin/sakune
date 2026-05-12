export type Point = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type Visual =
  | {
      type: "rect";
      fill?: string;
      stroke?: string;
      radius?: number;
    }
  | {
      type: "circle";
      fill?: string;
      stroke?: string;
    }
  | {
      type: "cylinder";
      fill?: string;
      stroke?: string;
      capStroke?: string;
    }
  | {
      type: "text";
      text: string;
      font?: string;
      fill?: string;
    };

export type HitArea = { type: "rect" } | { type: "circle" };

export type StackLayout = {
  type: "pile";
  offset?: Point;
};

export type StackDragMode = "none" | "stack" | "item" | "slice-from-item";

export type RenderEntity<TMeta = unknown> = {
  type: "entity";
  id: string;
  x: number;
  y: number;
  size: Size;
  visual: Visual;
  hitArea?: HitArea;
  draggable?: boolean;
  meta?: TMeta;
};

export type StackItem<TMeta = unknown> = {
  id: string;
  size: Size;
  visual: Visual;
  hitArea?: HitArea;
  meta?: TMeta;
};

export type RenderStack<TMeta = unknown> = {
  type: "stack";
  id: string;
  x: number;
  y: number;
  items: StackItem<TMeta>[];
  layout?: StackLayout;
  dragMode?: StackDragMode;
  meta?: TMeta;
};

export type SceneItem<TMeta = unknown> = RenderEntity<TMeta> | RenderStack<TMeta>;

export type Scene<TMeta = unknown> = {
  items: SceneItem<TMeta>[];
};

export type HitResult<TMeta = unknown> =
  | {
      type: "entity";
      id: string;
      meta?: TMeta;
    }
  | {
      type: "stack";
      id: string;
      meta?: TMeta;
    }
  | {
      type: "stackItem";
      id: string;
      meta?: TMeta;
      stackId: string;
      stackMeta?: TMeta;
      index: number;
    }
  | {
      type: "stackSlice";
      stackId: string;
      stackMeta?: TMeta;
      fromIndex: number;
      items: {
        id: string;
        meta?: TMeta;
        index: number;
      }[];
    };

export type DragSnapModifiers = {
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
};

export type DragSnapContext<TMeta = unknown> = {
  target: HitResult<TMeta>;
  world: Point;
  delta: Point;
  startWorld: Point;
  previousPreviewWorld: Point;
  anchor: Point;
  modifiers: DragSnapModifiers;
};

export type DragSnapResult = Point | { anchor: Point } | null | undefined;

export type DragSnapResolver<TMeta = unknown> = (context: DragSnapContext<TMeta>) => DragSnapResult;

export type SnapOptions<TMeta = unknown> = {
  drag?: DragSnapResolver<TMeta>;
};

export type RendererEvent<TMeta = unknown> =
  | {
      type: "click";
      screen: Point;
      world: Point;
      target: HitResult<TMeta> | null;
    }
  | {
      type: "dragStart";
      screen: Point;
      world: Point;
      previewWorld: Point;
      anchor: Point;
      previewAnchor: Point;
      target: HitResult<TMeta>;
    }
  | {
      type: "dragMove";
      screen: Point;
      world: Point;
      previewWorld: Point;
      anchor: Point;
      previewAnchor: Point;
      delta: Point;
      target: HitResult<TMeta>;
    }
  | {
      type: "dragEnd";
      screen: Point;
      world: Point;
      previewWorld: Point;
      anchor: Point;
      previewAnchor: Point;
      target: HitResult<TMeta>;
      dropTarget: HitResult<TMeta> | null;
    };

export type RendererOptions<TMeta = unknown> = {
  canvas: HTMLCanvasElement;
  pixelRatio?: number;
  snap?: SnapOptions<TMeta>;
};

export type HitTestOptions = {
  excludeId?: string;
};

export type Renderer<TMeta = unknown> = {
  setScene(scene: Scene<TMeta>): void;
  resize(width: number, height: number): void;
  destroy(): void;
  on<TType extends RendererEvent<TMeta>["type"]>(
    type: TType,
    handler: (event: Extract<RendererEvent<TMeta>, { type: TType }>) => void,
  ): () => void;
  hitTest(point: Point, options?: HitTestOptions): HitResult<TMeta> | null;
  // World position where a new piece appended to this stack would land. Apps
  // use this from a snap.drag resolver to express "snap the slice to the top
  // of this stack" without re-deriving the per-piece offset.
  stackNextAnchor(stackId: string): Point | null;
};

export type Drawable<TMeta = unknown> = {
  id: string;
  stackId?: string;
  stackIndex?: number;
  stackDragMode?: StackDragMode;
  stackMeta?: TMeta;
  stackOffset?: Point;
  x: number;
  y: number;
  size: Size;
  visual: Visual;
  hitArea?: HitArea;
  draggable?: boolean;
  meta?: TMeta;
  order: number;
};

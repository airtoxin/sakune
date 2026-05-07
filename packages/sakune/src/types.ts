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
  draggable?: boolean;
  meta?: TMeta;
};

export type RenderStack<TMeta = unknown> = {
  type: "stack";
  id: string;
  x: number;
  y: number;
  items: StackItem<TMeta>[];
  layout?: StackLayout;
  meta?: TMeta;
};

export type SceneItem<TMeta = unknown> = RenderEntity<TMeta> | RenderStack<TMeta>;

export type SakuneScene<TMeta = unknown> = {
  items: SceneItem<TMeta>[];
};

export type HitResult<TMeta = unknown> = {
  id: string;
  meta?: TMeta;
};

export type SakuneEvent<TMeta = unknown> =
  | {
      type: "click";
      screen: Point;
      world: Point;
      target: HitResult<TMeta> | null;
    }
  | {
      type: "dragStart";
      entityId: string;
      screen: Point;
      world: Point;
      meta?: TMeta;
    }
  | {
      type: "dragMove";
      entityId: string;
      screen: Point;
      world: Point;
      delta: Point;
      meta?: TMeta;
    }
  | {
      type: "dragEnd";
      entityId: string;
      screen: Point;
      world: Point;
      target: HitResult<TMeta> | null;
      meta?: TMeta;
    };

export type SakuneOptions = {
  canvas: HTMLCanvasElement;
  pixelRatio?: number;
};

export type Sakune<TMeta = unknown> = {
  setScene(scene: SakuneScene<TMeta>): void;
  resize(width: number, height: number): void;
  destroy(): void;
  on<TType extends SakuneEvent<TMeta>["type"]>(
    type: TType,
    handler: (event: Extract<SakuneEvent<TMeta>, { type: TType }>) => void,
  ): () => void;
  hitTest(point: Point): HitResult<TMeta> | null;
};

export type Drawable<TMeta = unknown> = {
  id: string;
  x: number;
  y: number;
  size: Size;
  visual: Visual;
  hitArea?: HitArea;
  draggable?: boolean;
  meta?: TMeta;
  order: number;
};

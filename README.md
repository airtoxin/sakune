# Sakune

軽量な 2.5D 卓上レンダリングエンジン。

Sakune は、カードゲーム・ボードゲーム・アブストラクトゲーム・パズルなどのための、
「重なり」と「積み」を気持ちよく扱うための Canvas ベースレンダラーです。

フル3Dエンジンではなく、

- 平面上への配置
- 積み重なり
- 少し浮いた見た目
- 自然な hitTest
- ドラッグ操作

といった、卓上ゲームに必要な表現に特化しています。

---

# 特徴

- 軽量な Canvas 2D ベース
- 宣言的 Scene API
- Stack による積み重ね表現
- 最前面アイテムへの自然な hitTest
- ドラッグイベント対応
- ゲームロジック非依存
- TypeScript ファースト
- シリアライズ可能な Scene 構造
- 型安全な `meta`

---

# インストール

```bash
npm install sakune
```

---

# クイックスタート

```ts
import { createSakune } from "sakune";

type GameMeta =
  | {
      type: "card";
      cardId: string;
    }
  | {
      type: "piece";
      pieceId: string;
    };

const sakune = createSakune<GameMeta>({
  canvas: document.querySelector("canvas")!,
});

sakune.setScene({
  items: [
    {
      type: "entity",

      id: "piece-black",

      x: 120,
      y: 120,

      size: {
        width: 48,
        height: 48,
      },

      visual: {
        type: "circle",
        fill: "#111",
      },

      draggable: true,

      meta: {
        type: "piece",
        pieceId: "black-1",
      },
    },
  ],
});
```

---

# Stack

Sakune の中心機能です。

複数アイテムを積み重ねて表示できます。

```ts
sakune.setScene({
  items: [
    {
      type: "stack",

      id: "deck",

      x: 320,
      y: 160,

      layout: {
        type: "pile",

        offset: {
          x: 0,
          y: -4,
        },
      },

      items: [
        {
          id: "card-1",

          size: {
            width: 80,
            height: 112,
          },

          visual: {
            type: "rect",
            fill: "#fff",
            stroke: "#333",
            radius: 8,
          },

          meta: {
            type: "card",
            cardId: "card-1",
          },
        },

        {
          id: "card-2",

          size: {
            width: 80,
            height: 112,
          },

          visual: {
            type: "rect",
            fill: "#fff",
            stroke: "#333",
            radius: 8,
          },

          meta: {
            type: "card",
            cardId: "card-2",
          },
        },

        {
          id: "card-3",

          size: {
            width: 80,
            height: 112,
          },

          visual: {
            type: "rect",
            fill: "#fff",
            stroke: "#333",
            radius: 8,
          },

          meta: {
            type: "card",
            cardId: "card-3",
          },
        },
      ],
    },
  ],
});
```

後ろのアイテムほど下に、前のアイテムほど上に描画されます。

---

# Events

```ts
sakune.on("click", (event) => {
  const target = event.target;

  if (!target) return;

  if (target.meta?.type === "card") {
    console.log(target.meta.cardId);
  }
});
```

## Drag

```ts
sakune.on("dragStart", (event) => {
  console.log(event.entityId);
});

sakune.on("dragMove", (event) => {
  console.log(event.delta);
});

sakune.on("dragEnd", (event) => {
  console.log(event.world);
});
```

---

# Scene

```ts
type SakuneScene<TMeta = unknown> = {
  items: SceneItem<TMeta>[];
};
```

---

# Entity

単体アイテム。

```ts
type RenderEntity<TMeta = unknown> = {
  type: "entity";

  id: string;

  x: number;
  y: number;

  size: {
    width: number;
    height: number;
  };

  visual: Visual;

  hitArea?: HitArea;

  draggable?: boolean;

  meta?: TMeta;
};
```

---

# Stack

積み重ねアイテム。

```ts
type RenderStack<TMeta = unknown> = {
  type: "stack";

  id: string;

  x: number;
  y: number;

  items: StackItem<TMeta>[];

  layout?: StackLayout;

  meta?: TMeta;
};
```

---

# Visual

## Rectangle

```ts
{
  type: "rect",
  fill: "#fff",
  stroke: "#333",
  radius: 8,
}
```

## Circle

```ts
{
  type: "circle",
  fill: "#111",
}
```

## Text

```ts
{
  type: "text",
  text: "Hello",
  font: "16px sans-serif",
  fill: "#000",
}
```

---

# Rendering Model

Sakune はフル3Dエンジンではありません。

描画順は、

- `scene.items`
- `stack.items`

の順序によって決定されます。

```txt
scene.items
  ↓
stack.items
  ↓
draw order
```

これにより、卓上ゲームに必要な「積み重なり」をシンプルに表現できます。

---

# State Management

Sakune はゲーム状態を保持しません。

以下は利用者側で実装します。

- ターン管理
- 合法手判定
- 勝敗
- AI
- ネットワーク同期
- Undo / Redo

Sakune は「どう見えるか」と「どれを触ったか」を担当します。

---

# 推奨構成

```txt
GameState
  ↓ present()
SakuneScene
  ↓
Sakune
  ↓
Canvas
```

ゲーム状態から `SakuneScene` を生成する Presenter パターンを推奨しています。

---

# Example

```ts
type Card = {
  id: string;
  name: string;
};

type GameState = {
  deck: Card[];
};

function present(state: GameState): SakuneScene<GameMeta> {
  return {
    items: [
      {
        type: "stack",

        id: "deck",

        x: 300,
        y: 120,

        layout: {
          type: "pile",

          offset: {
            x: 0,
            y: -2,
          },
        },

        items: state.deck.map((card) => ({
          id: card.id,

          size: {
            width: 80,
            height: 112,
          },

          visual: {
            type: "rect",
            fill: "#fff",
            stroke: "#333",
            radius: 8,
          },

          meta: {
            type: "card",
            cardId: card.id,
          },
        })),
      },
    ],
  };
}

sakune.setScene(present(gameState));
```

---

# Philosophy

Sakune は、物理的に正しい3Dではなく、

- 卓上らしい重なり
- 手触りのある配置
- 軽量で扱いやすい構造

を重視しています。

---

# 名前について

Sakune の名前は、日本語の「柵（さく）」に由来しています。

薄く切り分けられ、整列し、積み重ねられる塊。

Sakune は、そんな卓上オブジェクトの重なりを扱うためのレンダラーです。

let SEQ_SYSTEM = 1;
let SEQ_ENTITY = 1;
let SEQ_COMPONENT = 1;

export abstract class Entity {
  public readonly id = SEQ_ENTITY++;
  // 同じコンポーネントが複数回登録されることがあるので value は Set で持つ
  private components = new Map<number, Set<Component<any>>>();

  // Add a component to this entity
  public add(component: Component<any>) {
    const componentType = component.type;
    if (!this.components.has(componentType)) {
      this.components.set(componentType, new Set());
    }

    this.components.get(componentType)!.add(component);
  }
}

export type ComponentClassType<T> = (new (data: T) => Component<T>) & {
  type: number;
  get(entity: Entity): Component<T>[];
};

export abstract class Component<T> {
  static ALL_COMPONENT_TYPES = [-1];
  constructor(public readonly type: number, public readonly data: T) {}

  public static register<T>(): ComponentClassType<T> {
    const componentType = SEQ_COMPONENT++;

    class ComponentImpl extends Component<T> {
      static type = componentType;

      static get(entity: Entity): ComponentImpl[] {
        return Array.from(
          entity["components"].get(componentType)?.values() ?? []
        );
      }

      constructor(public readonly data: T) {
        super(componentType, data);
      }
    }

    return ComponentImpl as ComponentClassType<T>;
  }
}

export abstract class System {
  public readonly id = SEQ_SYSTEM++;
  constructor(private readonly componentTypes: number[][]) {}

  public enter?(entity: Entity): void;
  public exit?(entity: Entity): void;

  public beforeUpdateAll?(): void;
  public update?(entity: Entity): void;
  public afterUpdateAll?(entities: Entity[]): void;
}

export class ECS {
  private readonly systems = new Set<System>();
  private readonly entities = new Set<Entity>();
  private readonly entitySystems = new Map<Entity, Set<System>>();

  public addSystem(system: System) {
    if (this.systems.has(system)) return;

    this.systems.add(system);
    for (const entity of this.entities) {
      this.indexEntitySystems(entity, system);
    }
  }

  public addEntity(entity: Entity) {
    if (this.entities.has(entity)) return;

    this.entities.add(entity);
    for (const system of this.systems) {
      this.indexEntitySystems(entity, system);
    }
  }

  public update() {
    const updateCalled = new Map<System, Set<Entity>>();

    for (const entity of this.entities) {
      for (const system of this.entitySystems.get(entity) || []) {
        if (!updateCalled.has(system)) {
          updateCalled.set(system, new Set());
          system.beforeUpdateAll?.();
        }
        system.update?.(entity);
        updateCalled.get(system)!.add(entity);
      }
    }

    for (const [system, entities] of updateCalled.entries()) {
      system.afterUpdateAll?.(Array.from(entities.values()));
    }
  }

  private indexEntitySystems(entity: Entity, system: System) {
    if (!this.entitySystems.has(entity)) {
      this.entitySystems.set(entity, new Set());
    }

    const entityComponentTypes = Array.from(entity["components"].keys());

    // まだリレーション登録されていないならリレーション登録のチェックを行う
    if (!this.entitySystems.get(entity)!.has(system)) {
      for (const systemComponentTypes of system["componentTypes"]) {
        console.log("@systemComponentTypes", systemComponentTypes);
        // 全てのエンティティを精査するシステムの場合
        if (systemComponentTypes === Component.ALL_COMPONENT_TYPES) {
          this.entitySystems.get(entity)!.add(system);
          system.enter?.(entity);
          // 特定のエンティティのみを精査するシステムの場合はシステムが要求する
          // コンポーネントタイプを全て満たしているエンティティのときのみ登録
        } else if (
          systemComponentTypes.every(
            (ct) => entityComponentTypes.indexOf(ct) >= 0
          )
        ) {
          this.entitySystems.get(entity)!.add(system);
          system.enter?.(entity);
        }
      }
    }
  }
}

export class Vector {
  constructor(public readonly x: number, public readonly y: number) {}

  static createX(x: number): Vector {
    return new Vector(x, 0);
  }

  static createY(y: number): Vector {
    return new Vector(0, y);
  }

  add(v: Vector): Vector {
    return new Vector(this.x + v.x, this.y + v.y);
  }

  sub(v: Vector): Vector {
    return new Vector(this.x - v.x, this.y - v.y);
  }

  multiply(amount: number): Vector {
    return new Vector(this.x * amount, this.y * amount);
  }

  div(amount: number): Vector {
    return new Vector(this.x / amount, this.y / amount);
  }

  dot(v: Vector): number {
    return this.x * v.x + this.y * v.y;
  }

  distance(v: Vector): number {
    return Math.sqrt(Math.exp(this.x - v.x) + Math.exp(this.y - v.y));
  }

  destruct(): readonly [number, number] {
    return [this.x, this.y];
  }
}

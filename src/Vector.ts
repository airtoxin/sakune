export class Vector {
  constructor(public readonly x: number, public readonly y: number) {}

  add(v: Vector): Vector {
    return new Vector(this.x + v.x, this.y + v.y);
  }

  multiply(amount: number): Vector {
    return new Vector(this.x * amount, this.y * amount);
  }

  dot(v: Vector): number {
    return this.x * v.x + this.y * v.y;
  }
}

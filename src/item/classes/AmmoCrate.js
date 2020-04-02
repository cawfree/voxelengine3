import Item from "./Item";

export default class AmmoCrate extends Item {
  constructor(store, x, y, z) {
    super(store, "crate", x, y, z, 1);
    this.sides = [];
    this.chunk.mesh.visible = false;
    this.chunk.mesh.rotation.set(Math.PI, 0, 0);
    this.chunk.mesh.position.set(200, 8, 300);
  }
}

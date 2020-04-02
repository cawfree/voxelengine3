import Item from "./Item";

export default class Tree extends Item {
  constructor(store, x, y, z) {
    super(store, "tree", x, y, z, 0.5);
    this.alive = true;
    this.light = 0;
    this.chunk.owner = this;
    this.chunk.mesh.visible = true;
    this.chunk.mesh.position.set(x, store.maps.ground+(this.chunk.chunk_size_y*this.chunk.blockSize) * 0.5, z);
  }
}

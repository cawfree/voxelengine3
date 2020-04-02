import Item from "./Item";

export default class PaperAgent extends Item {
  constructor(store, x, y, z) {
    super(store, "paperagent", x, y, z, 0.2);
    this.base_type = "object";

    this.alive = true;
    this.chunk.owner = this;
    this.chunk.mesh.visible = true;
    this.chunk.mesh.position.set(x, store.maps.ground+(this.chunk.chunk_size_y*this.chunk.blockSize) * 0.5, z);
  }
}

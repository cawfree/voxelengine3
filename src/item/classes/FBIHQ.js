import Item from "./Item";

export default class FBIHQ extends Item {
  constructor(store, x, y, z) {
    super(store, "fbihq", x, y, z, 1);
    this.base_type = "object";
    this.alive = true;
    this.chunk.mesh.position.set(x, store.maps.ground+this.chunk.chunk_size_y*this.chunk.blockSize * 0.5, z);
  }
}

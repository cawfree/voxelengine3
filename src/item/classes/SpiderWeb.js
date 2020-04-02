import Item from "./Item";

export default class SpiderWeb extends Item {
  constructor(store, x, y, z) {
    super(store, "spiderweb", x, y, z, 0.2);
    this.base_type = "object";
    this.alive = true;
    this.light = 0;
    this.chunk.owner = this;
    this.chunk.mesh.visible = true;
    this.chunk.mesh.position.set(x, store.maps.ground+1, z);
  }
  // XXX: Destroys on hit.
  hit(store, dmg, dir, type) {
    this.chunk.explode(store, dir, dmg);
    this.alive = false;
  }
}

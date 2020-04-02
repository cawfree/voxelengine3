import Item from "./Item";

export default class PainKillers extends Item {
  constructor(store, x, y, z) {
    super(store, "painkillers", x, y, z, 0.2);
    this.base_type = "object";
    this.alive = true;
    this.light = 0;
    this.taken = false;

    this.chunk.owner = this;
    this.chunk.mesh.owner = this;
    this.chunk.mesh.visible = true;
    this.chunk.mesh.position.set(x, store.maps.ground+1, z);
    store.addToCD(this.chunk.mesh);
  }
  hit(store, dmg, dir, type, pos) { /* do not destroy  */ }
  // TODO: Grabbable.
  grab(store, mesh_id) {
    if(!this.taken) {
      store.sounds.PlaySound(store, "painkillers", this.chunk.mesh.position, 250);
      store.removeFromCD(this.chunk.mesh);
      store.player.bleed_timer += 60; // add 60 sec.
      this.taken = true;
    }
  }
  update(store, time, delta) {
    super.update(store, time, delta);
    if(!this.taken) {
      this.chunk.mesh.rotation.y += Math.sin(delta);
      this.chunk.mesh.position.y = store.maps.ground+6 + Math.sin(time * 2.5);
    } else {
      this.chunk.mesh.position.y += 0.5;
      if(this.chunk.mesh.position.y > store.maps.ground + 30) {
        this.chunk.virtual_explode(store, this.chunk.mesh.position);
        this.chunk.destroy(store);
        this.alive = false;
      }
    }
  }
}

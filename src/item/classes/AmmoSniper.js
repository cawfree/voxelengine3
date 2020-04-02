import Item from "./Item";

export default class AmmoSniper extends Item {
  constructor(store, x, y, z) {
    super(store, "ammo", x, y, z, 0.02);
    for(let i = 0; i < this.max; i++) {
      let c = this.chunk.mesh.clone();
      c.visible = false;
      store.scene.add(c);
      this.active.push(c);
    }
  }
  add(store, x,y,z) {
    if(this.ptr++ >= this.max - 1) {
      this.ptr = 0;
    }
    store.particles.empty_shell(x,y,z, this.active[this.ptr]);
  }
}

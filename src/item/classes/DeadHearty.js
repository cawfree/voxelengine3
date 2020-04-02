import Item from "./Item";

export default class DeadHearty extends Item {
  constructor(store, x, y, z) {
    super(store, "dead_hearty", x, y, z, 1);
    this.base_type = "object";
    this.alive = true;
    this.light = 0;
    this.radioactive = true;
    this.radioactive_leak = true;

    this.chunk.owner = this;
    this.chunk.mesh.visible = true;
    this.chunk.mesh.rotation.y = Math.random()*Math.PI*2;
    this.chunk.mesh.position.set(x, store.maps.ground+1, z);
    this.light = this.green_light.clone();
    this.light.position.set(0, 3, 0);
    this.chunk.mesh.add(this.light);
  }
  hit(store, dmg, dir, type, pos) {
    this.chunk.hit(store, dir, dmg, pos);
    this.alive = false;
  }
  update(store, time, delta) {
    let pos = this.chunk.mesh.position;
    store.particles.radiation(pos.x+(2-Math.random()*4), pos.y, pos.z+(2-Math.random()*4));
    if(Math.random() > 0.9) {
      this.light.intensity = (2-Math.random());
    }
  }
}

import Item from "./Item";

export default class Barrel extends Item {
  constructor(store, x, y, z) {
    super(store, "barrel", x, y, z, 0.5);
    this.base_type = "object";
    this.alive = true;
    this.light = 0;
    this.radioactive = true;
    this.radioactive_leak = true;

    this.chunk.mesh.position.set(x, store.maps.ground+this.chunk.to_y*(1/this.chunk.blockSize), z);
    this.light = this.green_light.clone();
    this.light.position.set(0, 10, 0);
    this.chunk.mesh.add(this.light);
  }
  hit(store, dmg, dir, type, pos) {
    if(this.chunk.hit(store, dir, dmg, pos)) {
      if(type != "missile" && type != "grenade") {
        store.sounds.PlaySound(store, "bullet_metal", pos, 300);
      }
      this.alive = false;
      return true;
    } 
    return false;
  }
  update(store, time, delta) {
    let pos = this.chunk.mesh.position;
    store.particles.radiation(pos.x+(1-Math.random()*2), store.maps.ground+4+this.chunk.to_y*2, pos.z+(1-Math.random()*2));
    if(Math.random() > 0.9) {
      this.light.intensity = 2-Math.random()*0.1;
      this.light.distance = (20+Math.random()*5);
    }
  }
}

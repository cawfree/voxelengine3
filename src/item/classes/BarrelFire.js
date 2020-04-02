import Item from "./Item";

export default class BarrelFire extends Item {
  constructor(store, x, y, z) {
    super(store, "barrel_fire", x, y, z, 0.5);
    this.base_type = "object";
    this.alive = true;
    this.light = 0;

    this.chunk.mesh.position.set(x, store.maps.ground+this.chunk.to_y*(1/this.chunk.blockSize), z);
    this.light = this.yellow_light.clone();
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
    store.particles.fire(store, pos.x+(4-Math.random()*8), store.maps.ground+6+this.chunk.to_y*2, pos.z+(4-Math.random()*8));
    if(Math.random() > 0.9) {
      this.light.intensity = 2-Math.random()*0.1;
      this.light.distance = (20+Math.random()*5);
    }
  }
}

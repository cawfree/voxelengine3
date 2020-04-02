import Item from "./Item";

export default class Lamp1 extends Item {
  constructor(store, x, y, z) {
    super(store, "lamp1", x, y, z, 1);
    this.base_type = "object";
    this.alive = true;
    this.light = 0;
    
    this.chunk.type = "object";
    this.chunk.owner = this;
    this.chunk.mesh.visible = true;
    this.chunk.mesh.position.set(x, store.maps.ground+7, z);
    this.light = this.yellow_light.clone();
    this.light.position.set(0, 12, 0);
    this.chunk.mesh.add(this.light);
  }
  hit(store, dmg, dir, type, pos) {
    this.chunk.hit(store, dir, dmg, pos)
    if(this.light.intensity > 0) {
      this.light.intensity -= 0.5*dmg;
      if(this.light.intensity < 0) {
        this.light.intensity = 0;
      }
    }
    if (this.chunk.health < 60) {
      this.alive = false;
    }
  }
  update(store, time, delta) {
    if (Math.random() < this.light.intensity) {
      store.particles_box.fire(
        store,
        this.chunk.mesh.position.x,
        this.chunk.mesh.position.y + 8,
        this.chunk.mesh.position.z
      );
    }
  }
}

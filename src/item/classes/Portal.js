import Item from "./Item";

export default class Portal extends Item {
  constructor(store, x, y, z) {
    super(store, "portal", x, y, z, 1);
    this.base_type = "portal";
    this.alive = true;
    this.x = x;
    this.y = y;
    this.z = z;
  }
  update(store, time, delta) {
    let x = 0; 
    let r = 10;
    for(let a = 0; a < Math.PI*2; a+=Math.PI/4) {
      x = this.x + r * Math.cos(a)
      z = this.z + r * Math.sin(a)
      store.particles.portalMagic(x, store.maps.ground, z);
    }
  }
}

import * as THREE from "three";

import Weapon from "./Weapon";

export default class P90 extends Weapon {
  constructor(store) {
    super(store, "p90", 0.1);
    this.fire_rate = 0.07;
    this.recoil = 0.2;
    this.damage = 1;
  }
  fire(store, q, id, shooter, speed) {
    store.sounds.PlaySound(store, "p90", store.player.chunk.mesh.position, 350);
    let point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
    let dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);

    for(let i = 0; i < 2; i++) {
      store.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
      store.particles.smoke(point.x, point.y, point.z, 0.4);
    }
    store.particles.ammoP90(point.x, point.y, point.z, dir.x, dir.y, dir.z, id, speed, this.damage);
    store.objects["ammo_p90"].add(store, point.x, point.y, point.z);
  }
}

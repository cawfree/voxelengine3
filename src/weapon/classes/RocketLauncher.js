import * as THREE from "three";

import Weapon from "./Weapon";

export default class RocketLauncher extends Weapon {
  constructor(store) {
    super(store, "rocketlauncher", 0.1);
    this.fire_rate = 1;
    this.recoil = 4;
    this.damage = 6;
  }
  fire(store, q, id, shooter, speed) {
    store.sounds.PlaySound(store, "rocket", store.player.chunk.mesh.position, 350);
    let point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
    let dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);
    store.particles.ammoMissile(point.x, point.y, point.z, dir.x, dir.y, dir.z, this, null, speed, this.damage);

    for(let i = 0; i < 50; i++) {
      store.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
      store.particles.smoke(point.x+(1-Math.random()*2), point.y + (1-Math.random()*2), point.z+(1-Math.random()*2), 0.5);
    }
  }
}

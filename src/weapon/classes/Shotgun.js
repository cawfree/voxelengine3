import * as THREE from "three";

import Weapon from "./Weapon";

export default class Shotgun extends Weapon {
  constructor(store) {
    super(store, "shotgun", 0.1);
    this.fire_rate = 0.5;
    this.recoil = 1;
    this.damage = 1;
  }
  fire(store, q, id, shooter, speed) {
    store.sounds.PlaySound(store, "shotgun", store.player.chunk.mesh.position, 250);
    let point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
    let dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);

    for (let i = 0; i < 10; i++) {
      store.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
      store.particles.smoke(point.x + (1 - Math.random() * 2), point.y + (1 - Math.random() * 2), point.z + (1 - Math.random() * 2), 0.5);
    }
    // shooter.translateZ(-this.recoil);
    store.particles.ammoShell(point.x, point.y, point.z, dir.x, dir.y, dir.z, id, speed, this.damage);
    store.objects["shell"].add(store, point.x, point.y, point.z);
    store.sounds.PlaySound(store, "shotgun_reload", store.player.chunk.mesh.position, 300);
  }
}

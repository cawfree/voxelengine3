import Enemy from "./Enemy";

import { Shotgun } from "../../weapon";

export default class Dudo extends Enemy {
  constructor(store, x, y, z) {
    super(store, "dudo", x, y + store.maps.ground + 5, z, 1);
    this.run_speed = 30;
    this.walk_speed = 15;

    this.chunk.mesh.rotation.order = 'YXZ';
    if (Math.random() > 0.4) {
      this.addWeapon(store, new Shotgun(store));
      this.weapon.attach(store, this.chunk.mesh);
    }
  }
  loadWeapon() {
    super.loadWeapon();
    if (this.weapon) {
      this.weapon.setPosition(-3, -1.5, 0.5);
      this.weapon.setRotation(Math.PI, Math.PI * 0.5, 0);
    }
  }
  unloadWeapon() {
    super.unloadWeapon();
    if (this.weapon) {
      this.weapon.setPosition(0, 2, -1.5);
      this.weapon.setRotation(0, 0, Math.PI / 3);
    }
  }
}

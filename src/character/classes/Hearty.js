import Enemy from "./Enemy";

import { Sniper, RocketLauncher } from "../../weapon";

export default class Hearty extends Enemy {
  constructor(store, x, y, z) {
    super(store, "hearty", x, y + store.maps.ground + 6, z, 1);
    this.run_speed = 50;
    this.walk_speed = 15;

    this.chunk.mesh.rotation.order = 'YXZ';
    if (Math.random() > 0.4) {
      this.addWeapon(store, new Sniper(store));
    } else {
      this.addWeapon(store, new RocketLauncher(store));
    }
    this.weapon.attach(store, this.chunk.mesh);
  }
  loadWeapon() {
    super.loadWeapon();
    if (this.weapon) {
      this.weapon.setPosition(-2.5, -2.5, 0.5);
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

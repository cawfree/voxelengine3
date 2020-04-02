import Enemy from "./Enemy";
import { Pistol, Minigun, Shotgun } from "../../weapon";

export default class Agent extends Enemy {
  constructor(store, x, y, z) {
    super(store, "agent", x, y + store.maps.ground + 7, z, 0.5);
    this.run_speed = 40;
    this.walk_speed = 15;
    this.shoot_ability = 0.5;
    this.chunk.mesh.rotation.order = 'YXZ';
    if (Math.random() > 0.8) {
      this.addWeapon(store, new Pistol(store));
    } else if(Math.random() > 0.5) {
      this.addWeapon(store, new Minigun(store));
    } else {
      this.addWeapon(store, new Shotgun(store));
    }
    this.weapon.attach(store, this.chunk.mesh);
  }
  die(store) {
    this.chunk.mesh.position.y = store.maps.ground + 1;
  }
  loadWeapon() {
    super.loadWeapon();
    if (this.weapon) {
      this.weapon.setPosition(-3, 0, 0.5);
      this.weapon.setRotation(Math.PI, Math.PI * 0.5, 0);
    }
  }
  unloadWeapon() {
    super.unloadWeapon();
    if (this.weapon) {
      this.weapon.setPosition(0, 4, -1.5);
      this.weapon.setRotation(0, 0, Math.PI / 3);
    }
  }
}

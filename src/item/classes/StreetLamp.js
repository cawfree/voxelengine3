import * as THREE from "three";

import Item from "./Item";

export default class StreetLamp extends Item {
  constructor(store, x, y, z) {
    super(store, "street_lamp", x, y, z, 0.4);
    this.alive = true;
    this.light = 0;

    this.chunk = getModel(store, "streetlamp", 0.4, this);
    this.chunk.owner = this;
    this.chunk.mesh.visible = true;

    // Check rotation depending on wall
    this.chunk.mesh.position.set(x, store.maps.ground+10, z);

    let res = store.world.checkExists(store, new THREE.Vector3(x-1,store.maps.ground+10,z));
    if(res.length > 0) {
      //     this.chunk.mesh.rotation.y = -Math.PI*2;
      this.chunk.mesh.position.x += 10;
      //    this.light.position.set(7, 18, 0);
    }
    res = store.world.checkExists(store, new THREE.Vector3(x,store.maps.ground+10,z-1));

    for(let i = 0; i < 10; i++) {
      res = store.world.checkExists(store, new THREE.Vector3(x+i,store.maps.ground+10,z));
      if(res.length > 0) {
        this.chunk.mesh.position.x -= 10;
        break;
      }
    }
  }
  hit(store, dmg, dir, type, pos) {
    if(this.chunk.hit(store, dir, dmg, pos)) {
      if(type != "missile" && type != "grenade") {
        store.sounds.PlaySound(store, "bullet_metal", pos, 300);
      }
      if (this.chunk.health < 60) {
        this.alive = false;
      }
      return true;
    }
    return false;
  }
}


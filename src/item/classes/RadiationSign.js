import * as THREE from "three";

import Item from "./Item";

export default class RadiationSign extends Item {
  constructor(store, x, y, z) {
    super(store, "radiation_sign", x, y, z, 0.2);
    this.base_type = "object";
    this.alive = true;
    this.light = 0;

    this.chunk.owner = this;
    this.chunk.mesh.visible = true;
    this.chunk.mesh.rotation.y = Math.PI * 0.5;
    this.chunk.mesh.rotation.x = -Math.PI;
    // Check rotation depending on wall
    let res = store.world.checkExists(store, new THREE.Vector3(x-1,store.maps.ground+10,z));
    if(res.length > 0) {
      this.chunk.mesh.rotation.y = -Math.PI * 0.5;
    }
    res = store.world.checkExists(store, new THREE.Vector3(x,store.maps.ground+10,z-1));
    if(res.length > 0) {
      this.chunk.mesh.rotation.y = 2*Math.PI;
    }
    res = store.world.checkExists(store, new THREE.Vector3(x,store.maps.ground+10,z+2));
    if(res.length > 0) {
      this.chunk.mesh.rotation.y = Math.PI;
    }
    this.chunk.mesh.position.set(x, store.maps.ground+10, z);

  }
}

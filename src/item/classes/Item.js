import * as THREE from "three";

import { getModel } from "../../model";

export default class Item {
  constructor(store, model, x, y, z, size = 1) {
    this.chunk = 0;
    this.active = [];
    this.ptr = 0;
    this.base_type = "object";
    this.obj_type = model;
    this.red_light = new THREE.PointLight(0xFF00AA, 2, 10);
    this.yellow_light = new THREE.PointLight(0xFFAA00, 2, 80);
    this.green_light = new THREE.PointLight(0x00FF00, 2, 10);
    this.streetlight = new THREE.SpotLight(0xFFAA00);
    this.max = 20;
    // TODO: Looks like model should also be type
    this.chunk = getModel(store, model, size, this);
    this.chunk.owner = this;
    this.chunk.mesh.visible = true;
  }
  hit(store, dmg, dir, type, pos) {
    return this.chunk.hit(store, dir, dmg, pos);
  }
  update(store, time, delta) {}
  destroy(store) {
    // TODO: Definitely try this out!
    //  this.chunk.explode();
  }
}

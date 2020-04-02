import * as THREE from "three";

import { getMesh } from "../../model";

export default class Weapon {
  constructor(store, model, size) {
    this.ammo = 0;
    this.base_type = "weapon";
    this.obj_type = model;
    this.chunk = 0;
    this.name = "";
    this.fire_rate = 0; // in ms between each
    this.reloading = 0;
    this.attached = false;
    this.attached_id = 0;
    this.alive = true;
    this.timeout = 0;
    this.relative_speed = 0;
    this.shoot_light = new THREE.PointLight( 0xFFAA00, 3, 10 );
    this.damage = 1;
    store.scene.add(this.shoot_light);
    this.chunk = getMesh(store, model, size, this);
    store.removeFromCD(this.chunk.mesh);
    store.addObject(this);
  }
  destroy(store) {
    store.scene.remove(this.chunk.mesh);
    store.removeFromCD(this.chunk.mesh);
    this.alive = false;
  }
  setPosition(x, y, z) {
    this.chunk.mesh.position.set(x, y, z);
  }
  setRotation(x, y, z) {
    this.chunk.mesh.rotation.set(x, y, z);
  }
  detach(store, mesh, pos) {
    if (this.attached && mesh.id == this.attached_id) {
      this.chunk.mesh.visible = true;
      mesh.remove(this.chunk.mesh);
      store.scene.add(this.chunk.mesh);
      store.addToCD(this.chunk.mesh);
      this.setRotation(Math.PI, Math.PI, 0);
      this.setPosition(pos.x+(6-Math.random()*12), 6, pos.z+(6-Math.random()*12));
      this.attached = false;
      this.attached_id = 0;
    }
  }
  attach(store, mesh) {
    if(!this.attached) {
      store.sounds.PlaySound(store, "reload", this.chunk.mesh.position, 800);
      this.timeout = 0;
      mesh.add(this.chunk.mesh);
      store.removeFromCD(this.chunk.mesh);
      this.attached = true;
      this.attached_id = mesh.id;
      return true;
    }
    return false;
  }
  shoot(store, dir, id, mesh, speed) {
    if(this.reloading <= 0) {
      this.fire(store, dir, id, mesh, speed);
      this.reloading = this.fire_rate;
    }
  }
  update(store, time, delta) {
    if(!this.attached) {
      if(this.timeout > 60) { // Remove after 1min.
        this.destroy(store);
      }
      this.timeout += delta;
    }
    // Update reload time
    if(this.reloading >= 0) {
      this.reloading -= delta;
    }
    // Animate dropped weapon
    if(!this.attached) {
      this.chunk.mesh.position.y = store.maps.ground+6+Math.sin(time*2.5);
      this.chunk.mesh.rotation.y += Math.sin(delta);
    }
    if (this.shoot_light.visible) {
      this.shoot_light.visible = false;
    }
  }
}

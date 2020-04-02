import * as THREE from "three";

import Character from "./Character";
import { RocketLauncher, Shotgun } from "../../weapon";

export default class Player extends Character {
  constructor(store, x, y, z) {
    super(store, "player", x, y + store.maps.ground + 6, z, 1);
    this.base_type = "player";
    this.run_speed = 50;
    this.keyboard = 0;
    this.weapons = [];
    this.can_switch = true;
    this.falling = false;
    this.flashlight = new THREE.SpotLight(0xFFFFFF);
    this.footsteps = false;

    this.keyboard = new THREEx.KeyboardState();
    this.chunk.mesh.rotation.order = 'YXZ';
    store.player = this;
    let targetObject = new THREE.Object3D();
    targetObject.position.set(1, 1, 10);
    store.scene.add(targetObject);
    this.flashlight.target = targetObject;
    this.flashlight.decay = 1;
    this.flashlight.intensity = 2;
    this.flashlight.distance = 100;
    this.flashlight.angle = Math.PI/5;
    this.chunk.mesh.add(targetObject);
    this.chunk.mesh.add(this.flashlight);
    this.flashlight.position.set(0, 3, 0);
    this.addWeapon(store, new RocketLauncher(store));
    this.addWeapon(store, new Shotgun(store));
    this.addBindings(store);
    this.chunk.mesh.add(store.camera);
    let pos = this.chunk.mesh.position.clone();
    let point = this.chunk.mesh.localToWorld(new THREE.Vector3(0, 0, 0));
    store.camera.rotation.z = Math.PI;
    store.camera.rotation.x =-Math.PI/1.4;
    store.camera.position.y = 150;
    store.camera.position.z = -120;

  }
  onHit(store) {
    super.onHit(store);
    this.chunk.mesh.remove(store.camera);
    let pos = this.chunk.mesh.position.clone();
    pos.y = store.maps.ground;
    store.scene.add(store.camera);
    store.camera.position.z = pos.z;
    store.camera.position.x = pos.x;
    store.camera.position.y = 150;
    store.camera.rotation.x = Math.PI * -0.5;
    setTimeout(() => store.reset(), 3000);
  }
  reset(store) {
    this.removeBindings(store);
    this.weapons = [];
    store.scene.remove(this.flashlight);
    this.keyboard = null;
  }
  shiftWeapon() {
    if (this.weapons.length == 0) {
      return;
    }
    if(!this.can_switch) {
      return;
    }
    this.can_switch = false;
    setTimeout(() => this.can_switch = true, 200);

    // Check if a weapon is loaded, then unload it.
    let id = this.getWeaponId();
    if(id != -1) {
      this.unloadWeapon(id);
    } else {
      this.loadWeapon(0);
      return;
    }
    // Load next weapon, if any.
    if (this.weapons.length > 1) {
      if (id == this.weapons.length-1) {
        id = 0;
      } else {
        id++;
      }
      this.loadWeapon(id);
    }
  }
  getWeaponId() {
    if (this.weapon == 0) {
      return -1;
    } 
    for (let i = 0; i < this.weapons.length; i++) {
      if (this.weapon.chunk.mesh.id == this.weapons[i].chunk.mesh.id) {
        return i;
      }
    }
    return -1;
  }
  loadWeapon(id) {
    for (let i = 0; i < this.weapons.length; i++) {
      if (id != i) {
        this.unloadWeapon(i);
      }
    }
    this.weapon = this.weapons[id];
    this.weapon.setPosition(2.5, -0.5, 2.5);
    this.weapon.setRotation(Math.PI, Math.PI * 0.5, 0);
    this.can_shoot = true;
    this.loaded = true;
  }
  unloadWeapon(id) {
    if (this.weapon != 0) {
      this.weapon.setPosition(0, 2, -1.5);
      this.weapon.setRotation(0, 0, Math.PI / 3);
      this.weapon = 0;
      this.can_shoot = false;
      this.loaded = false;
    }
  }
  addWeapon(store, weapon) {
    if (this.weapons.length < 2) {
      if (weapon.attach(store, this.chunk.mesh)) {
        this.weapons.push(weapon);
        this.loadWeapon(this.weapons.length-1);
      }
    }
  }
  dropWeapon(store) {
    if (this.weapon != 0) {
      let wid = this.getWeaponId();
      this.unloadWeapon(wid);
      this.weapons[wid].detach(store, this.chunk.mesh, this.chunk.mesh.position);
      this.weapons.splice(wid, 1);
    }
  }
  addBindings(store) {
    $(document).mouseup(e => this.mouseUp(e, store));
    $(document).mousemove(e => this.mouseMove(e, store));
    $(document).mousedown(e => this.mouseDown(e, store));
  }
  removeBindings(store) {
    $(document).unbind('mouseup');
    $(document).unbind('mousemove');
    $(document).unbind('mousedown');
  }
  mouseDown(jevent, store) {
    this.shooting = true;
  }
  mouseMove(jevent, store) {
    if (this.alive) {
      let event = jevent.originalEvent; // jquery convert
      let movementX = event.movementX || event.mozMovementX || event.webkitMovementX ||0;
      let x = movementX*0.001;
      let axis = new THREE.Vector3(0,1,0);
      let radians = (Math.PI * -0.5) * x;
      let rotObjectMatrix = new THREE.Matrix4();
      rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
      this.chunk.mesh.matrix.multiply(rotObjectMatrix);
      this.chunk.mesh.rotation.setFromRotationMatrix(this.chunk.mesh.matrix);
    }
  }
  mouseUp(jevent, store) {
    if (!this.alive) {
      return;
    }
    this.shooting = false;
    if (this.weapon.obj_type == "sniper") {
      this.shoot(store);
      setTimeout(
        () => {
          store.camera.position.y = 150;
          store.camera.position.z = -120;
          store.camera.rotation.x = -Math.PI / 1.4;
        },
        1000,
      );
    } else {
      store.camera.position.y = 150;
      store.camera.position.z = -120;
      store.camera.rotation.x = -Math.PI / 1.4;
    }
  }
  update(store, time, delta) {
    if (!this.alive) {
      store.sounds.StopSound("footsteps");
      store.sounds.StopSound("heartbeat");
      return;
    }
    this.speed = this.run_speed;
    super.update(store, time, delta);
    if (this.shooting && this.weapon.obj_type != "sniper") {
      this.shoot(store);
    } else if (this.shooting && this.weapon.obj_type == "sniper") {
      if (store.camera.position.y > 10) {
        store.camera.position.y -= 10;
        store.camera.position.z += 10;
        store.camera.rotation.x += -0.01;
      } else {
        store.camera.rotation.x = -Math.PI;
        store.camera.position.z = -5;
        store.camera.position.x = 5;
        store.camera.position.y = 3;
      }
    }
    if (this.falling) {
      if (store.camera.position.y < store.maps.ground-5) {
        this.chunk.mesh.position.y -= 1;
        this.chunk.mesh.rotation.z -= Math.sin(time)/20;
        this.chunk.mesh.rotation.x -= Math.sin(time)/20;
        store.maps.ambient_light.color.r += 0.1;
        store.maps.ambient_light.color.g -= 0.01;
        store.maps.ambient_light.color.b -= 0.01;
      } else {
        if (store.maps.ambient_light.intensity < 0.8) {
          store.maps.ambient_light.intensity += 0.1;
        }
        store.maps.ambient_light.color.r += 0.01;
        store.maps.ambient_light.color.g += 0.01;
        store.maps.ambient_light.color.b += 0.01;
        this.chunk.mesh.position.y -= 1;
        this.chunk.mesh.rotation.z -= Math.sin(time)/10;
        this.chunk.mesh.rotation.x -= Math.sin(time)/10;
        store.camera.position.y -= 1;
      }
      if (this.chunk.mesh.position.y < -250) {
        // TODO: Respawn?
        store.reset();
      }
      return;
    }
    // TODO: ?
    this.KeyDown(store, time, delta);
    if (this.moving) {
      if(!store.sounds.isPlaying("footsteps")) {
        store.sounds.PlaySound(store, "footsteps", this.chunk.mesh.position, 800);
      }
      //this.chunk.mesh.rotation.z = 0.2*Math.sin(time*speed);
      if (this.cd_check > 0.05) {
        this.cd_check = 0;
        let pos = this.chunk.mesh.position.clone();
        pos.y = store.maps.ground;
        const res = store.world.checkExists(store, pos);

        this.shouldBleedOrGlow(store, res);

        if (res.length == 0) {
          this.falling = true;
          // Only fall if hole is big enough to fit in :)
          for (let ofx = -1; ofx <= 1 && this.falling; ofx++) {
            for (let ofz = -1; ofz <= 1 && this.falling; ofz++) { 
              for (let ofy = store.maps.ground; ofy >= 0 && this.falling; ofy--) {
                let post = this.chunk.mesh.position.clone();
                post.x += ofx;
                post.y = ofy;
                post.z += ofz;
                let r = store.world.checkExists(store, post);
                this.falling = !(r.length !== 0);
              }
            }
          }
          if (this.falling) {
            store.sounds.StopSound("footsteps");
            store.sounds.PlaySound(
              store,
              Math.random() > 0.5 ? "fall" : "fall2",
              this.chunk.mesh.position,
              400,
            );
            // XXX: Color the level.
            store.maps.ambient_light.color.r = 0.1;
            store.maps.ambient_light.color.g = 0;
            store.maps.ambient_light.color.b = 0;
            // XXX: Fall down!
            this.chunk.mesh.remove(store.camera);
            store.scene.add(store.camera);
            store.camera.position.z = pos.z;
            store.camera.position.x = pos.x;
            store.camera.position.y = 150;
            store.camera.rotation.x = -Math.PI * 0.5;
          }
        }
        for (let idx = 0; idx < store.cdList.length; idx++) {
          const item = store.cdList[idx];
          if (this.chunk.checkCD(item.position, 5)) {
            // TODO: Need to determine if object is grabbable via class
            if (item.owner.obj_type == "heart" || item.owner.obj_type == "painkillers") {
              item.owner.grab(store, item.id);
            } else if (item.owner.base_type == "weapon") {
              if (this.weapons.length <= 2) {
                this.addWeapon(store, item.owner);
              }
            }
          }
        }
      }
      this.cd_check += delta;
      if (Math.random() < 0.4) {
        store.particles.walkSmoke(this.chunk.mesh.position.x, this.chunk.mesh.position.y, this.chunk.mesh.position.z);
      }
    }
  } 
  KeyDown(store, time, delta) {
    this.moving = false;
    if (this.keyboard.pressed("space")) {
      this.shoot(store);
    }
    if (this.keyboard.pressed("w")) {
      this.chunk.mesh.translateZ(this.speed * delta);
      if (this.cd(store)) {
        this.moving = true;
      } else {
        this.chunk.mesh.translateZ(-this.speed * delta);
      }
    }
    if (this.keyboard.pressed("S")) {
      this.chunk.mesh.translateZ(-this.speed * delta);
      if (this.cd(store)) {
        this.moving = true;
      } else{
        this.chunk.mesh.translateZ(+this.speed * delta);
      }
    }
    if (this.keyboard.pressed("A")) {
      this.chunk.mesh.translateX(this.speed * delta);
      if (this.cd(store)) {
        this.moving = true;
      } else {
        this.chunk.mesh.translateX(-this.speed * delta);
      }
    }
    if (this.keyboard.pressed("D")) {
      this.chunk.mesh.translateX(-this.speed * delta);
      if (this.cd(store)) {
        this.moving = true;
      } else {
        this.chunk.mesh.translateX(this.speed * delta);
      }
    }
    if (this.keyboard.pressed("R")) {
      this.flashlight.visible = false;
      for (let i = 0; i < store.maps.loaded.length; i++) {
        if(store.maps.loaded[i].base_type == "enemy") {
          store.maps.loaded[i].current_view_range = store.maps.loaded[i].view_range;
        }
      }
    }
    if (this.keyboard.pressed("T")) {
      this.flashlight.visible = true;
      for (let i = 0; i < store.maps.loaded.length; i++) {
        if (store.maps.loaded[i].base_type == "enemy") {
          store.maps.loaded[i].current_view_range = store.maps.loaded[i].view_range * 2;
        }
      }
    }
    if (this.keyboard.pressed("E")) {
      this.dropWeapon(store);
    }
    if (this.keyboard.pressed("F")) {
      this.shiftWeapon(store);
    }
  }
}

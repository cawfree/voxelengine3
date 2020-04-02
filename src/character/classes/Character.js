import * as THREE from 'three';

import { getModel } from "../../model";

export default class Character {
  // XXX: callers define the model
  constructor(store, model, x, y, z, size = 1) {
    this.hp = 0;
    this.chunk = 0;
    this.init_pos = new THREE.Vector3(0, 0, 0);
    this.weapon = 0;
    this.obj_type = model;
    this.loaded = false;
    this.alive = true;
    this.y_offset = 0;
    this.cd_check = 0;
    this.moving = false;
    this.flee = false;
    this.add_blood = 0;
    this.add_radioactive = 0;
    this.speed = 0;
    this.bleed_timer = 0;
    this.can_shoot = false;
    this.cd_list = [];
    this.dying = false;
    this.radiation_poisoned = 0;
    this.dying_counter = 0;
    this.green_light = new THREE.PointLight(0x00FF00, 2, 10);
    this.radiation_light = 0;

    this.chunk = getModel(store, model, size, this);
    this.init_pos.x = x;
    this.init_pos.y = y;
    this.init_pos.z = z;
    this.chunk.mesh.position.set(x, y, z);
  }
  shouldBleedOrGlow(store, res) {
    for (let i = 0; i < res.length; i++) {
      if (((res[i] >> 24) & 0xFF) > 100 && ((res[i] >> 16) & 0xFF) < 25 && ((res[i] >> 8) & 0xFF) < 25) {
        if (this.add_blood == 0 && Math.random() > 0.5) {
          this.add_blood = 60; // Walking on blood
        }
      } else if (((res[i] >> 24) & 0xFF) <= 50  && ((res[i] >> 16) & 0xFF) >= 200 && ((res[i] >> 8) & 0xFF) < 105 && ((res[i] >> 8) & 0xFF) >= 50) {
        if (this.add_radioactive == 0 && Math.random() > 0.5) {
          this.add_radioactive = 30; // walking on radioactive
          if (this.radiation_poisoned == 0) {
            this.radiation_light = this.green_light.clone();
            this.radiation_light.intensity = 0.1;
            this.radiation_light.position.y = 1;
            this.chunk.mesh.add(this.radiation_light);
          }
          this.radiation_poisoned++;
          this.radiation_light.intensity += 0.5;
          this.radiation_light.distance += 2;

          // Add random radiation 
          this.chunk.addBlock(
            store,
            Math.random()*this.chunk.chunk_size_x|0,
            Math.random()*this.chunk.chunk_size_y|0,
            Math.random()*this.chunk.chunk_size_z|0,
            (res[i][1] >> 24) & 0xFF, 
            (res[i][1] >> 16) & 0xFF,
            (res[i][1] >> 8) & 0xFF
          );
        }
      }
    }
  }
  sound_hit(store) {
    let r = Math.random();
    if (r < 0.4) {
      r = "blood1";
    } else if (r > 0.4 && r < 0.7) {
      r = "blood2";
    } else {
      r = "blood3";
    }
    store.sounds.PlaySound(store, r, this.chunk.mesh.position, 300);
    if (this.alive && Math.random() > 0.8) {
      // TODO: Something really interesting going here. Forces integer, maybe?
      store.sounds.PlaySound(store, "hit" + (1 + Math.random() * 2 | 0), this.chunk.mesh.position, 500);
    }
  }
  addWeapon(store, weapon) {
    if (this.weapon == 0 && !this.flee) {
      if (weapon.attach(store, this.chunk.mesh)) {
        this.weapon = weapon;
        this.loadWeapon();
      }
    }
  }
  dropWeapon(store) {
    if (this.weapon != 0) {
      this.unloadWeapon();
      this.weapon.detach(store, this.chunk.mesh, this.chunk.mesh.position);
      this.weapon = 0;
    }
  }
  unloadWeapon() {
    this.can_shoot = false;
    setTimeout(() => this.loaded = false, 200);
  }
  loadWeapon() {
    this.can_shoot = true;
    setTimeout(() => this.loaded = true, 200);
  }
  shoot(store) {
    if (this.weapon != 0 && this.loaded && this.can_shoot) {
      //let light1 = new THREE.PointLight( 0xFFAA00, 3, 10 );
      this.weapon.shoot(store, this.chunk.mesh.quaternion, this.chunk.mesh.id, this.chunk.mesh, this.speed / 30);
    }
  }
  update(store, time, delta) {
    // open wound.
    if (this.dying != 0) {
      this.dying_counter++;
      let max = 5;
      let step = 0.05;
      if(this.dying == 1) {
        if(this.chunk.mesh.rotation.z < Math.PI * 0.5) {
          this.chunk.mesh.rotation.z += step;
        } else if(this.chunk.mesh.rotation.z > Math.PI * 0.5) {
          this.chunk.mesh.rotation.z -= step;
        }
        if(this.dying_counter == max) {
          this.alive = false;
          this.chunk.mesh.rotation.z = Math.PI * 0.5;
          this.chunk.mesh.position.y = store.maps.ground;
        }
      } else if(this.dying == 2) {
        if(this.chunk.mesh.rotation.z < -Math.PI * 0.5) {
          this.chunk.mesh.rotation.z += step;
        } else if(this.chunk.mesh.rotation.z > -Math.PI * 0.5) {
          this.chunk.mesh.rotation.z -= step;
        }
        if(this.dying_counter == max) {
          this.alive = false;
          this.chunk.mesh.rotation.z = -Math.PI * 0.5;
          this.chunk.mesh.position.y = store.maps.ground;
        }
      } else if(this.dying == 3) {
        if(this.chunk.mesh.rotation.x < -Math.PI * 0.5) {
          this.chunk.mesh.rotation.x += step;
        } else if(this.chunk.mesh.rotation.x > -Math.PI * 0.5) {
          this.chunk.mesh.rotation.x -= step;
        }
        if(this.dying_counter == max) {
          this.alive = false;
          this.chunk.mesh.rotation.x = -Math.PI * 0.5;
          this.chunk.mesh.position.y = store.maps.ground;
        }
      } else if(this.dying == 4) {
        if(this.chunk.mesh.rotation.x < Math.PI * 0.5) {
          this.chunk.mesh.rotation.x += step;
        } else if(this.chunk.mesh.rotation.x > Math.PI * 0.5) {
          this.chunk.mesh.rotation.x -= step;
        }
        if(this.dying_counter == max) {
          this.alive = false;
          this.chunk.mesh.rotation.x = Math.PI * 0.5;
          this.chunk.mesh.position.y = store.maps.ground;
        }
      }
    }

    if (this.alive) {
      if (this.chunk.blood_positions.length > 0) {
        this.bleed_timer -= delta;
      }

      if (this.bleed_timer < 0) {
        this.hit(store, 4, new THREE.Vector3(0, -3, 0), null);
        this.bleed_timer = 10;
        return;
      }

      if(this.bleed_timer < 10 && this.bleed_timer != 0) {
        if(this.base_type == "player") {
          if(!store.sounds.isPlaying("heartbeat")){
            store.sounds.PlaySound(store, "heartbeat", this.chunk.mesh.position, 500);
          }
        }
        for (let i = 0; i < this.chunk.blood_positions.length; i++) {
          if (Math.random() > 0.99) {
            store.particles.blood(
              this.chunk.blockSize * this.chunk.blood_positions[i].x + this.chunk.mesh.position.x,
              this.chunk.blockSize * this.chunk.blood_positions[i].y + this.chunk.mesh.position.y,
              this.chunk.blockSize * this.chunk.blood_positions[i].z + this.chunk.mesh.position.z,
              0.5, 0, 0, 0
            );
          }
        }
      }
      if (this.add_blood > 0 && this.moving) {
        this.add_blood--;
        store.world.addColorBlock(
          store,
          this.chunk.mesh.position.x + (2 - Math.random() * 4),
          store.maps.ground-1,
          this.chunk.mesh.position.z + (2 - Math.random() * 4),
          138 + Math.random() * 20,
          8 + Math.random() * 10,
          8 + Math.random() * 10
        );
      }
      if (this.add_radioactive > 0 && this.moving) {
        this.add_radioactive--;
        // Add radioactive footsteps
        store.world.addColorBlock(
          store,
          this.chunk.mesh.position.x + (2 - Math.random() * 4),
          store.maps.ground - 1,
          this.chunk.mesh.position.z + (2 - Math.random() * 4),
          Math.random() * 50 | 0,
          200 + Math.random() * 55 | 0,
          50 + Math.random() * 55 | 0
        );
      }
      if(this.radiation_poisoned > 0 && Math.random() > 0.9) {
        for(let q = 0; q < this.radiation_poisoned; q++) {
          store.particles.radiation(
            this.chunk.mesh.position.x + (2 - Math.random() * 4),
            this.chunk.to_y + 1,
            this.chunk.mesh.position.z + (2 - Math.random() * 4)
          );
          if(this.radiation_poisoned > 5) {
            this.chunk.hit(store, new THREE.Vector3(0,0,0), 1, null);
          }
        }
      }
      this.speed = this.moving ? this.speed : 0;
    }
  }
  cd(store) {
    const pos = this.chunk.mesh.position;
    const points = [
      new THREE.Vector3(
        pos.x+this.chunk.chunk_size_x * 0.5,
        pos.y,
        pos.z
      ),
      new THREE.Vector3(
        pos.x,
        pos.y,
        pos.z+this.chunk.chunk_size_z * 0.5,
      ),
      new THREE.Vector3(
        pos.x,
        pos.y,
        pos.z-this.chunk.chunk_size_z * 0.5,
      ),
      new THREE.Vector3(
        pos.x-this.chunk.chunk_size_x * 0.5,
        pos.y,
        pos.z
      ),
    ];

    let res = true;
    for (let i = 0; i < points.length && res; i++) {
      if (store.world.checkExists(store, points[i]).length > 0) {
        res = false;
      }
    }
    for (let idx = 0; idx < store.cdList.length && res; idx++) {
      const item = store.cdList[idx];
      // TODO: Need a flag for defining if something can collide or not.
      if (this.chunk.mesh.id != item.id && item.owner.alive && item.owner.base_type != "weapon" && item.owner.obj_type != "painkillers") {
        if (this.chunk.checkCD(item.position, 6)) {
          res = false;
        }
      }
    }
    return res;
  }
  onHit(store) { /* do nothing */ }
  hit(store, damage, direction, type, pos) {
    this.bleed_timer = this.chunk.health / 100 * 10;

    this.sound_hit(store);

    this.chunk.hit(store, direction, damage, pos);

    const die = this.chunk.health < 90;

    if (die && this.alive) {
      this.dropWeapon(store);
      this.onHit(store);
      this.dying = 0;
      let r = Math.random();
      if(r > 0.8) {
        this.dying = 1;
      } else if(r > 0.5) {
        this.dying = 2;
      } else if(r > 0.3) {
        this.dying = 3;
      } else {
        this.dying = 4;
      }
    }
    return die;
  }
}

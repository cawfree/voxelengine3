import * as THREE from "three";

export default class Particle {
  constructor(store, particle_type) {
    this.life = 0;
    this.active = 0;
    this.mesh = undefined;
    this.gravity = 9.82;
    this.e = -0.3; // restitution
    this.mass = 0.1; // kg
    this.airDensity = 1.2;
    this.area = 0.001;
    this.avg_ay = 0;

    this.vy = 0;
    this.vx = 0;
    this.vz = 0;
    this.avg_ax = 0;
    this.avg_az = 0;

    this.bounces = 0;
    this.bounces_orig = 0;
    this.fx_ = 0;
    this.fz_ = 0;
    this.ray = undefined;

    // Allocate once and reuse.
    this.new_ay = 0;
    this.new_ax = 0;
    this.new_az = 0;
    this.fx = 0;
    this.fy = 0;
    this.fz = 0;
    this.dx = 0;
    this.dy = 0;
    this.dz = 0;
    this.newPos = 0;
    this.ticks = 0;
    this.flip = 0.5;
    this.grav_mass = 0;
    this.air_area = 0;

    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.type = "regular";
    this.chunk = 0;
    this.damage = 0;
    this.cd_update = 0;
    this.old_mesh = 0;
    this.spin = 1;

    this.hit = false;
    this.size = 1;
    this.stay = true;

    this.particle_type = particle_type;

    const { getState } = store;
    const { model } = getState();

    if (particle_type == 0) {
      this.mesh = new THREE.Sprite(model.getIn(['material', 'sprite']).clone());
    } else {
      this.mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        model.getIn(['material', 'box']).clone(),
      );
    }

    store.scene.add(this.mesh);
    this.mesh.visible = false;
    this.mesh.castShadow = false;
  }
  set(store, opts) {
    if (!this.isVisible(store, new THREE.Vector3(opts.x, opts.y, opts.z))) {
      return;
    }
    for (let k in opts) {
      this[k] = opts[k];
    }
    this.grav_mass = this.gravity * this.mass;
    this.air_area = -0.5 * this.airDensity * this.area;

    if (this.type != "chunk_debris" && this.type != "empty_shell") {
      this.mesh.material.color.setRGB(opts.r / 255, opts.g / 255, opts.b / 255);
      this.mesh.material.needsUpdate = true;
      this.mesh.position.set(opts.x, opts.y, opts.z);
      this.mesh.visible = true;
      this.mesh.scale.set(this.size, this.size, this.size);
    } else {
      this.old_mesh = this.mesh;
      this.mesh.visible = false;
      this.mesh = this.chunk_mesh;
      this.mesh.visible = true;
      this.mesh.position.set(this.x, this.y, this.z);
    }
    if (this.light) {
      let p = store.p_light.clone();
      p.visible = true;
      p.intensity = 15;
      p.distance = 30;
      this.mesh.add(p);
      store.particles.lights.push(p);
    }
    this.active = 1;
  }
  reset(store) {
    if (this.type == "chunk_debris" || this.type == "empty_shell") {
      if (this.type == "empty_shell") {
        let found = -1;
        for (let i = 0; i < store.particles.old_shells.length; i++) {
          if (store.particles.old_shells[i] == null) {
            found = i;
            break;
          }
        }
        if (found == -1) {
          store.particles.old_shells.push(this.mesh);
        } else {
          store.particles.old_shells[found] = this.mesh;
        }
      }
      this.mesh = this.old_mesh;
      this.mesh.visible = true;
    }
    this.mesh.visible = false;
    this.type = "regular";
    this.life = 0;
    this.active = 0;
    this.gravity = 9.82;
    this.e = -0.3; // restitution
    this.mass = 0.1; // kg
    this.airDensity = 1.2;
    this.area = 1 / 1000;
    this.vy = 0;
    this.avg_ay = 0;
    this.size = 1;

    this.vx = 0;
    this.vz = 0;
    this.avg_ax = 0;
    this.avg_az = 0;

    this.spin = 1;

    this.bounces = 0;
    this.bounces_orig = (1 + Math.random() * 2) | 0;
    this.fx_ = Math.random() * 2;
    this.fz_ = Math.random() * 2;

    this.newPos = 0;
    this.ticks = 0;

    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.type = 0;
    this.chunk = null;
    this.light = false;
    this.hit = false;
    this.stay = true;
  }
  checkLife() {
    if (this.life <= 0 || this.mesh.position.y < 0) {
      this.active = 0;
      this.mesh.visible = false;
      return;
    }
  }
  isVisible(store, pos) {
    if (store.player != 0) {
      if (pos.distanceTo(store.player.chunk.mesh.position) > store.visible_distance) {
        return false;
      }
    }
    return true;
  }
  update(store, time, delta) {
    this.life -= delta;
    this.checkLife();

    if (this.life > 0 && this.active) { // || this.mesh.position.y < -5) {
      this.fy = this.grav_mass;
      this.fy += this.air_area * this.vy * this.vy;
      this.fx = this.air_area * this.vx * this.vx;
      this.fz = this.air_area * this.vz * this.vz;

      this.dy = this.vy * delta + (this.avg_ay * 0.0005);
      this.dx = this.vx * delta + (this.avg_ax * 0.0005);
      this.dz = this.vz * delta + (this.avg_az * 0.0005);

      this.mesh.position.x += this.dx * 10 * this.fx_;
      this.mesh.position.z += this.dz * 10 * this.fz_;
      this.mesh.position.y += this.dy * 10;

      this.new_ay = this.fy / this.mass;
      this.avg_ay = 0.5 * (this.new_ay + this.avg_ay);
      this.vy -= this.avg_ay * delta;

      this.new_ax = this.fx / this.mass;
      this.avg_ax = 0.5 * (this.new_ax + this.avg_ax);
      this.vx -= this.avg_ax * delta;

      this.new_az = this.fz / this.mass;
      this.avg_az = 0.5 * (this.new_az + this.avg_az);
      this.vz -= this.avg_az * delta;


      switch (this.type) {
        case "world_debris":
          if (Math.random() > 0.8) {
            store.particles.debris_smoke(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.5);
          }
          this.mesh.rotation.set(this.vx, this.vy, this.vz);
          this.bounce(store);
          break;
        case "debris":
          this.mesh.rotation.set(this.vx, this.vy, this.vz);
          this.bounce(store);
          break;
        case "chunk_debris":
          this.mesh.rotation.set(
            this.vx/this.spin, 
            this.vy/this.spin, 
            this.vz/this.spin
          );
          if(this.chunk.owner.base_type == "enemy" || this.chunk.owner.base_type == "player") {
            store.particles.blood(
              this.mesh.position.x + (2 - Math.random() * 4),
              this.mesh.position.y + (2 - Math.random() * 4),
              this.mesh.position.z + (2 - Math.random() * 4),
              0.5, this.vx/this.spin, this.vy/this.spin, this.vz/this.spin
            );
            this.bounce(store);
          }
          break;
        case "empty_shell":
          this.mesh.rotation.set(this.vx, this.vy, this.vz);
          if(Math.random() > 0.96) {
            store.sounds.PlaySound(store, "ammo_fall", this.mesh.position, 210);
          }
          this.bounce(store);
          if (Math.random() > 0.9) {
            store.particles.smoke(this.mesh.position.x + Math.random(), this.mesh.position.y, this.mesh.position.z, 0.3); // this.mesh.rotation);
          }
          break;
        case "radioactive_leak":
          this.addRadiationToGround(store);
          break;
        case "radioactive_splat":
          // this.gravity = Math.random()*Math.sin(time);
          break;
        case "blood":
          this.addBloodToGround(store);
          break;
        case "minigun":
          this.cd(store, time, delta);
          break;
        case "missile":
          this.cd(store, time, delta);
          store.particles.smoke(
            this.mesh.position.x - 0.5 + Math.random(),
            this.mesh.position.y - 0.5 + Math.random(),
            this.mesh.position.z - 0.5 + Math.random(),
            0.3); //, this.mesh.rotation);
          break;
        case "shell":
          this.cd(store, time, delta);
          break;
        case "grenade":
          store.particles.smoke(
            this.mesh.position.x - 0.5 + Math.random(),
            this.mesh.position.y - 0.5 + Math.random(),
            this.mesh.position.z - 0.5 + Math.random(),
            0.3); //, this.mesh.rotation);
          this.bounce(store);
          this.cd(store, time, delta);
          break;
        case "snow":
          this.mesh.position.z += Math.random()*Math.cos(time/5);
          this.mesh.position.x += Math.random()*Math.cos(time/5);
          break;
        case "rain":
          if(Math.random() > 0.5) {
            this.splatterRain(store);
          }
          break;
      }

      // Add blocks to ground
      if ((this.type == "snow" || this.type == "virtual_debris" || this.type == "debris" || this.type == "world_debris") && this.stay == true) {
        if (store.world.checkExists(store, this.mesh.position.clone()).length != 0) {
          if ((this.type == "debris" && this.bounces == 0) || this.type == "world_debris") {
            store.world.addBlock(store, this.mesh.position.x, this.mesh.position.y + 1, this.mesh.position.z, this.r, this.g, this.b);
            this.active = 0;
          }else if(this.type == "snow") {
            store.world.addBlock(store, this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.r, this.g, this.b);
          }
        }
      } else if (this.type == "empty_shell" || this.type == "chunk_debris") {
        this.keepOnGround(store);
      }

      // rotate box particles to make them look more "alive".
      if (this.particle_type == 1) {
        this.mesh.rotation.set(this.vx, this.vy, this.vz);
      }
    } 

    if (!this.active) {
      switch (this.type) {
          //case "chunk_debris":
          //  break;
        case "empty_shell":
          this.mesh.rotation.set(1.57, 0, Math.PI * Math.random());
          //this.placeOnGround();
          break;
        case "shell":
          store.particles.smoke(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.5);
          break;
        case "grenade":
          store.particles.explosion(store, this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.power, this.type);
          store.world.explode(store, this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.damage, this.type);
          store.sounds.PlaySound(store, "rocket_explode", this.mesh.position, 1000);
          break;
        case "missile":
          if(!this.hit) {
            store.particles.explosion(store, this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.power, this.type);
            store.world.explode(store, this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.damage, this.type);
          }
          store.sounds.PlaySound(store, "rocket_explode", this.mesh.position, 800);
          break;
          //   case "minigun":
          //store.world.explode(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.power);
          //store.particles.explosion(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.power);
          //       break;
      }
      this.reset(store);
    }
  }
  bounce(store) {
    if (this.bounces > 0 && this.mesh.position.y <= store.maps.ground+1) {
      this.mesh.position.y += this.bounces;
      this.bounces--;
      this.vy *= this.e;
      this.spin++;
      return true;
    }
    return false;
  }
  keepOnGround(store) {
    if (store.world.checkExists(store, this.mesh.position.clone()).length != 0) {
      this.active = 0;
      this.mesh.position.y = store.maps.ground;
    }
  }
  addRadiationToGround(store) {
    if (store.world.checkExists(store, this.mesh.position.clone()).length != 0) {
      store.world.addColorBlock(store, this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z, this.r, this.g, this.b);
      if (Math.random() > 0.5) {
        store.world.addColorBlock(store, this.mesh.position.x + 1, this.mesh.position.y-1, this.mesh.position.z + 1, this.r, this.g, this.b);
      }
      if (Math.random() > 0.5) {
        store.world.addColorBlock(store, this.mesh.position.x - 1, this.mesh.position.y-1, this.mesh.position.z + 1,this.r, this.g, this.b);
      }
      if (Math.random() > 0.5) {
        store.world.addColorBlock(store,this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z + 1, this.r, this.g, this.b);
      }
      if (Math.random() > 0.5) {
        store.world.addColorBlock(store, this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z - 1, this.r, this.g, this.b);
      }
      if (Math.random() > 0.5) {
        store.world.addColorBlock(store, this.mesh.position.x - 1, this.mesh.position.y-1, this.mesh.position.z - 1, this.r, this.g, this.b);
      }
      this.active = 0;
    }
  }
  addBloodToGround(store) {
    if (store.world.checkExists(store, this.mesh.position.clone()).length != 0) {
      store.world.addColorBlock(store, this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z, 138, 7, 7);
      if (Math.random() > 0.5) {
        store.world.addColorBlock(store, this.mesh.position.x + 1, this.mesh.position.y-1, this.mesh.position.z + 1, 128, 7, 7);
      }
      if (Math.random() > 0.5) {
        store.world.addColorBlock(store, this.mesh.position.x - 1, this.mesh.position.y-1, this.mesh.position.z + 1, 158, 7, 7);
      }
      if (Math.random() > 0.5) {
        store.world.addColorBlock(store, this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z + 1, 158, 7, 7);
      }
      if (Math.random() > 0.5) {
        store.world.addColorBlock(store, this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z - 1, 158, 20, 20);
      }
      if (Math.random() > 0.5) {
        store.world.addColorBlock(store, this.mesh.position.x - 1, this.mesh.position.y-1, this.mesh.position.z - 1, 128, 20, 20);
      }
      this.active = 0;
    }
  }
  splatterRain(store) {
    if (store.world.checkExists(store, this.mesh.position.clone()).length != 0) {
      store.particles.debris(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.2, this.r, this.g, this.b, false,null,null,null,false);
      store.particles.debris(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.2, this.r, this.g, this.b, false,null,null,null,false);
      this.active = 0;
    }
  }
  cd(store, time, delta) {
    let directionVector = new THREE.Vector3(this.vx, this.vy, this.vz);

    let o = 1;
    for (let idx = 0; idx < store.cdList.length; idx++) {
      const item = store.cdList[idx];
      if((item.position.x - item.owner.chunk.chunk_size_x*item.owner.chunk.blockSize * 0.5) <= this.mesh.position.x + o &&
        (item.position.x + item.owner.chunk.chunk_size_x*item.owner.chunk.blockSize * 0.5) >= this.mesh.position.x - o )
      {
        if((item.position.z - item.owner.chunk.chunk_size_z*item.owner.chunk.blockSize * 0.5) <= this.mesh.position.z + o &&
          (item.position.z + item.owner.chunk.chunk_size_z*item.owner.chunk.blockSize * 0.5) >= this.mesh.position.z - o)
        {
          if (item.owner.base_type == "object") {
            if(item.owner.hit) {
              if(item.owner.hit(store, this.damage, directionVector, this.type, this.mesh.position)) {
                this.active = 0;
                this.hit = true;
                return;
              }
            }
          } else if (item.owner.base_type == "player" || item.owner.base_type == "enemy") {
            if (item.owner.chunk.mesh.id != this.owner) {
              item.owner.hit(store, this.damage, directionVector, this.type, this.mesh.position);
              this.active = 0;
              this.hit = true;
              return;
            }
          }
        }
      }
    }
    if(store.world.checkExists(store, this.mesh.position.clone()).length > 0) {
      store.world.explode(store, this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.damage, this.type);
      if(this.type == "missile") {
        store.particles.explosion(store, this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.power, this.type);
        store.sounds.PlaySound(store, "rocket_explode", this.mesh.position, 800);
      }
      this.active = 0;
      return;
    }
  }
}

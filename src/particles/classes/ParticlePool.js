import * as THREE from "three";

import Particle from "./Particle";

export default class ParticlePool {
  constructor(store, size, type) {
    this.particles = [];
    this.queue = [];
    // XXX: Is size just particles.length?
    this.size = size;
    this.pos = 0;
    this.neg = 0;
    this.old_shells = [];
    this.clean_old_shells = 0;
    this.opts = 0;
    this.update_cnt = 0;
    this.lights = [];
    this.size = size;
    this.particles = [...Array(size)].map(
      () => new Particle(store, type),
    );
  }
  update(store, time, delta) {
    // Dim lights 
    for(let i = 0; i < this.lights.length; i++) {
      this.lights[i].intensity -= 0.5;
      if (this.lights[i].intensity <= 0) {
        if (this.lights[i].parent != null) {
          this.lights[i].parent.remove(this.lights[i]);
        } else {
          store.scene.remove(this.lights[i]);
        }
      }
    }

    // Clean up shells
    if (this.clean_old_shells > 0.2) {
      for (let i = 0; i < this.old_shells.length; i++) {
        if (this.old_shells[i] == null) {
          continue;
        }
        this.old_shells[i].position.y -= 0.06;
        if (this.old_shells[i].position.y < store.maps.ground-1) {
          this.old_shells[i].visible = false;
          this.old_shells[i] = null;
        }
      }
      this.clean_old_shells = 0;
    }
    this.clean_old_shells += delta;

    // Create max particles each frame
    for (let i = 0; i < 300; i++) {
      if (this.queue.length == 0) {
        break;
      }
      let p = this.queue.pop();
      if (this.create(store, p) == -1) {
        this.queue.push(p);
        break;
      }
    }

    let tot = 0;
    let ts = 0;
    for (let i = this.update_cnt; i < this.particles.length; i++) {
      this.update_cnt = i;
      if (this.particles[i].active) {
        if(this.particles[i].type == "grenade" || this.particles[i].type == "missile" || this.particles[i].type == "minigun" || this.particles[i].type == "shell") {
          this.particles[i].update(store, time, delta);
        } else {
          if(tot < 5) {
            ts = Date.now();
            this.particles[i].update(store, time, delta);
            tot += (Date.now() - ts);
          }
        }
      }
    }
    if(this.update_cnt == this.particles.length - 1) {
      this.update_cnt = 0;
    }
  }
  create(store, opts) {
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].active) {
        this.particles[i].set(store, opts);
        return this.particles[i];
      }
    }
    return -1;
  }
  get(opts) {
    this.queue.push(opts);
  }
  fire(store, x, y, z) {
    this.get({
      size: 0.5,
      type: "smoke",
      r: 200 + Math.random() * 55 | 0,
      g: Math.random() * 180 | 0,
      b: Math.random() * 200 | 0,
      x: x,
      y: y,
      z: z,
      life: Math.random() * 1,
      power: 0.01,
      gravity: 0,
      bounces: 0,
      mass: 10,
      fx_: 0.5,
      fz_: 0.5,
      vx: 0.5 - Math.random() * 1,
      vy: Math.random(),
      vz: 0.5 - Math.random() * 1
    });
  }
  explosion(store, x, y, z, power, type) {
    let c = 0;
    for (let i = 0; i < power * 10; i++) {
      c = 50+ Math.random()*205|0;
      // Add smoke
      this.get({
        size: 0.5,
        type: "smoke",
        x: x+2-Math.random()*4,
        y: y,
        z: z+2-Math.random()*4,
        r: c,
        g: c,
        b: c,
        life: Math.random()*3,
        power: Math.random() * 5,
        gravity: -0.5,
        bounces: 0,
        mass: 10,
        fx_: 0.1,
        fz_: 0.1,
        vx: Math.random(),
        vy: Math.random()*2,
        vz: Math.random()
      });
      // add fire
      this.get({
        size: 0.5,
        type: "smoke",
        r: 200+Math.random()*55|0,
        g: 180,
        b: Math.random()*50|0,
        x: x+2-Math.random()*4,
        y: y,
        z: z+2-Math.random()*4,
        life: Math.random()*3,
        power: 5 + Math.random() * 5,
        gravity: 5,
        bounces: 0,
        mass: 10,
        fx_: 0.5,
        fz_: 0.5,
        vx: 3 - Math.random() * 6,
        vy: Math.random() * 8,
        vz: 3 - Math.random() * 6
      });
    }
    if (type == "missile") {
      let p = store.p_light.clone();
      p.position.set(x, y, z);
      p.visible = true;
      p.intensity = 20;
      p.distance = 30;
      store.scene.add(p);
      store.particles.lights.push(p);
    }
  }
  chunkDebris(x, y, z, chunk, dirx, diry, dirz, power) {
    const fz = Math.random();
    const fx = Math.random();
    const vx = dirx + (1 - Math.random() * 2);
    const vy = diry + Math.random() * 4;
    const vz = dirz + (1 - Math.random() * 2);
    const type = "chunk_debris";
    this.get({
      chunk: chunk,
      chunk_mesh: chunk.mesh,
      size: chunk.blockSize,
      type: type,
      x: x,
      y: y,
      z: z,
      life: 5,
      power: (1 + Math.random() * 5),
      gravity: 9.82,
      bounces: 2 + Math.random() * 2 | 0,
      mass: 1,
      fx_: fx,
      fz_: fz,
      vx: vx,
      vy: vy,
      vz: vz
    });
  }
  empty_shell(x, y, z, mesh) {
    let vx, vy, vz, fx, fz;
    vx = Math.random();
    vy = Math.random();
    vz = Math.random();
    fx = 0.2 + Math.random();
    fz = 0.2 + Math.random();
    this.get({
      chunk_mesh: mesh,
      type: "empty_shell",
      size: 1,
      x: x,
      y: y,
      z: z,
      life: 2,
      power: 0.1,
      gravity: 9.82,
      bounces: 3,
      mass: 1,
      fx_: fx,
      fz_: fz,
      vx: vx,
      vy: vy,
      vz: vz
    });
    mesh.visible = true;
  }
  radioactive_splat(x, y, z, size, dirx, diry, dirz) {
    this.get({
      type: "radioactive_splat",
      r: Math.random() * 50 | 0,
      g: 200 + Math.random() * 100 | 0,
      b: 50 + Math.random() * 55 | 0,
      size: size,
      x: x,
      y: y,
      z: z,
      life: Math.random() * 20,
      power: 2 + Math.random() * 2,
      gravity: Math.random()*2,
      bounces: 0,
      mass: 10,
      fx_: 1.5 - Math.random()*3,
      fz_: 1.5 - Math.random()*3,
      vx: 0.5 - Math.random() * 2,
      vy: 0.5 + Math.random() * 2,
      vz: 0.5 - Math.random() * 2
    });
  }
  radioactive_leak(x, y, z, size) {
    this.get({
      type: "radioactive_leak",
      r: Math.random() * 50 | 0,
      g: 200 + Math.random() * 55 | 0,
      b: 50 + Math.random() * 55 | 0,
      size: size,
      x: x,
      y: y,
      z: z,
      life: Math.random() * 3,
      power: 2 + Math.random() * 2,
      gravity: 9.82,
      bounces: 0,
      mass: 10,
      fx: 0.2 + (0.5 - Math.random() * 1),
      fz: 0.2 + (0.5 - Math.random() * 1),
      vx: 1-Math.random()*2,
      vy: Math.random()*2.5,
      vz: 1-Math.random()*2,
    });
  }
  blood(x, y, z, size, dirx, diry, dirz) {
    this.get({
      type: "blood",
      size: size,
      x: x,
      y: y,
      z: z,
      life: Math.random() * 3,
      power: 3 + Math.random() * 3,
      gravity: 9.82,
      r: 138,
      g: Math.random() * 15 | 0,
      b: Math.random() * 15 | 0,
      bounces: 2,
      mass: 10,
      fx: 0.2 + (0.5 - Math.random() * 1),
      fz: 0.2 + (0.5 - Math.random() * 1),
      vx: dirx + (0.5 - Math.random() * 1),
      vy: diry + Math.random(),
      vz: dirz + (0.5 - Math.random() * 1)
    });
  }
  world_debris(x, y, z, size, r, g, b) {
    this.get({
      type: "world_debris",
      size: size,
      x: x,
      y: y,
      z: z,
      life: Math.random() * 4,
      power: 5 + Math.random() * 5,
      gravity: 9.82,
      r: r,
      g: g,
      b: b,
      bounces: 2 + Math.random() * 2 | 0,
      mass: 10,
      fx_: 0.5 - Math.random(),
      fz_: 0.5 - Math.random(),
      vx: 2 - Math.random() * 4,
      vy: 3 + Math.random() * 4,
      vz: 2 - Math.random() * 4
    });
  }
  debris(x, y, z, size, r, g, b, virtual, dirx, diry, dirz, stay) {
    if(stay == null) { stay = true; }
    let vx, vy, vz, fx, fz;
    let type;
    let gravity = 9.82;
    if (dirx != null) {
      vx = dirx;
      vy = diry + Math.random() * 4;
      vz = dirz;
      fx = 0.2;
      fz = 0.2;
    } else {
      if (virtual) {
        vx = 2 - Math.random() * 4;
        vy = 2 + Math.random() * 4;
        vz = 2 - Math.random() * 4;
        gravity = 12;
      } else {
        vx = 2 - Math.random() * 4;
        vy = 2 + Math.random() * 4;
        vz = 2 - Math.random() * 4;
      }
      fz = 0.4;
      fx = 0.4;
    }
    if (virtual) {
      type = "virtual_debris";
    } else {
      type = "debris";
      y += 2;
    }
    let bounces = 0;
    let life = 0;
    if(!stay) {
      bounces = 0;
      life = 0.8;
    } else {
      bounces = 2 + Math.random()*2|0;
      life = Math.random() * 4;
    }
    this.get({
      stay: stay,
      type: type,
      size: size,
      x: x,
      y: y,
      z: z,
      life: life,
      power: 5 + Math.random() * 5,
      gravity: gravity,
      r: r,
      g: g,
      b: b,
      bounces: bounces,
      mass: 10,
      fx_: fx,
      fz_: fz,
      vx: vx,
      vy: vy,
      vz: vz
    });
  }
  rain(store) {
    let rand1 = Math.random() * store.maps.width;
    let rand2 = Math.random() * store.maps.height;
    this.get({
      type: "rain",
      size: 0.5,
      x: rand1,
      y: 200,
      z: rand2,
      life: Math.random() * 15,
      power: 0,
      gravity: 5.82,
      r: 79,
      g: 213,
      b: 214,
      fx_: 0,
      fz_: 0,
      vx: 0.1,
      vy: 0.1,
      vz: 0.1,
    });
  }
  snow(store) {
    let rand1 = Math.random() * store.maps.width;
    let rand2 = Math.random() * store.maps.height;
    this.get({
      type: "snow",
      size: 0.8,
      x: rand1,
      y: 150,
      z: rand2,
      life: Math.random() * 25,
      power: 0,
      gravity: 0.8,
      r: 255,
      g: 245,
      b: 255,
      fx_: 0,
      fz_: 0,
      vx: 0.1,
      vy: 0.2,
      vz: 0.1,
    });
  }
  walkSmoke(x, y, z) {
    let rand = -2 + Math.random() * 4;
    let rand_c = Math.random() * 100 | 0;
    this.get({
      size: 1,
      x: x + rand,
      y: y - 3,
      z: z + rand,
      life: Math.random(),
      power: 0.1,
      gravity: 0,
      r: 155 + rand_c,
      g: 155 + rand_c,
      b: 155 + rand_c,
      fx_: 0,
      fz_: 0,
      vx: 0.5,
      vy: 0.5,
      vz: 0.5,
    });
  }
  portalMagic(x, y, z) {
    let r = 0; 
    let g = 0;
    let b = 0;
    if(Math.random() > 0.5) {
      r = Math.random() * 50 | 0;
      g = 100 + Math.random() * 100 | 0;
      b = 200 + Math.random() * 55 | 0;
    } else {
      r = 200 + Math.random() * 55 | 0;
      g = 0;
      b = 200 + Math.random() * 55 | 0; 
    }
    this.get({
      size: 0.5,
      x: 3 - Math.random() * 6 + x,
      y: 3 - Math.random() * 6 + y,
      z: 3 - Math.random() * 6 + z,
      life: Math.random() * 1.3,
      power: 0.5,
      gravity: -2,
      r: r,
      g: g,
      b: b,
    });
  }
  radiation(x, y, z) {
    this.get({
      size: 0.3,
      x: 3 - Math.random() * 6 + x,
      y: 3 - Math.random() * 6 + y,
      z: 3 - Math.random() * 6 + z,
      life: Math.random() * 1.3,
      power: 0.5,
      gravity: -1,
      r: Math.random() * 50 | 0,
      g: 200 + Math.random() * 100 | 0,
      b: 50 + Math.random() * 55 | 0,
    });
  }
  blueMagic(x, y, z) {
    this.get({
      size: 0.5,
      x: 3 - Math.random() * 6 + x,
      y: 3 - Math.random() * 6 + y,
      z: 3 - Math.random() * 6 + z,
      life: Math.random() * 1.3,
      power: 0.5,
      gravity: -2,
      r: Math.random() * 50 | 0,
      g: 100 + Math.random() * 100 | 0,
      b: 200 + Math.random() * 55 | 0,
    });
  }
  debris_smoke(x, y, z, size) {
    // random black/white + fire
    let r, g, b;
    let v = Math.random();
    if (v < 0.3) {
      r = 200 + Math.random() * 55;
      g = 150 + Math.random() * 80;
      b = 20 + Math.random() * 20;
      // white 
      //          r = g = b = 200+Math.random()*55;
    } else if (v < 0.6) {
      // black
      //            r = g = b = 0+Math.random()*50;

      r = 200 + Math.random() * 55;
      g = 80 + Math.random() * 80;
      b = 20 + Math.random() * 20;
    } else {
      r = 150 + Math.random() * 105;
      g = 80 + Math.random() * 80;
      b = 20 + Math.random() * 20;
    }
    this.get({
      size: size,
      x: x,
      y: y,
      z: z,
      life: Math.random() * 0.5,
      power: 0.5,
      gravity: -2,
      r: r,
      g: g,
      b: b,
    });
  }
  smoke(x, y, z, size) {
    this.get({
      size: size,
      x: x,
      y: y,
      z: z,
      life: Math.random(),
      power: 0.5,
      gravity: -2,
      r: 255,
      g: 255,
      b: 255,
    });
  }
  gunSmoke(x, y, z, dirx, diry, dirz) {
    let rand_c = Math.random() * 100 | 0;
    this.get({
      size: 0.5,
      x: x + (2 - Math.random() * 4),
      y: y,
      z: z + (2 - Math.random() * 4),
      life: Math.random() * 1,
      power: 5.5,
      gravity: Math.random() * 6,
      r: 200 + rand_c,
      g: 100 + rand_c,
      b: 0,
      fx_: 0.1,
      fz_: 0.1,
      vx: Math.random() + dirx,
      vy: Math.random() + diry,
      vz: Math.random() + dirz,
    });
  }
  ammoGrenadeLauncher(x, y, z, dirx, diry, dirz, speed, dmg) {
    this.get({
      damage: dmg,
      type: 'grenade',
      size: 1,
      x: x,
      y: y,
      z: z,
      life: 4+Math.random()*2,
      gravity: 9.82,
      bounces: Math.random()*3|0,
      power: 2,
      fx_: 1.2,
      fz_: 1.2,
      vx: dirx,
      vz: dirz,
      vy: diry+(0.6-Math.random()*1) + 5,
      light: false,
    });
  }
  ammoMissile(x, y, z, dirx, diry, dirz, owner, chunk, speed, dmg) {
    let p = this.get({
      damage: dmg,
      owner: owner,
      type: 'missile',
      size: 1,
      x: x,
      y: y,
      z: z,
      life: 2,
      gravity: 2,
      power: 6,
      fx_: 2.4 + speed,
      fz_: 2.4 + speed,
      vx: dirx+(0.1-Math.random()*0.2),
      vz: dirz+(0.1-Math.random()*0.2),
      vy: diry+(0.1-Math.random()*0.2),
      light: false,
    });
  }
  ammoShell(x, y, z, dirx, diry, dirz, owner, speed, dmg) {
    let shots = [];
    for (let i = 0; i < 10; i++) {
      shots.push(this.get({
        damage: dmg,
        owner: owner,
        type: 'shell',
        size: 0.5,
        r: 200,
        g: 200,
        b: 200,
        x: x,
        y: y,
        z: z,
        life: 0.7,
        gravity: 0,
        power: 6,
        fx_: 2.4 + speed,
        fz_: 2.4 + speed,
        vx: dirx + (1 - Math.random() * 2),
        vz: dirz + (1 - Math.random() * 2),
        vy: diry,
      }));
    }
  }
  ammoSniper(x, y, z, dirx, diry, dirz, owner, speed, dmg) {
    this.get({
      damage: dmg,
      owner: owner,
      type: 'shell',
      size: 0.5,
      r: 250,
      g: 250,
      b: 250,
      x: x,
      y: y,
      z: z,
      life: 1.5,
      gravity: 0,
      power: 10,
      fx_: 4.4 + speed,
      fz_: 4.4 + speed,
      vx: dirx,
      vz: dirz,
      vy: diry,
    });
  }
  ammoP90(x, y, z, dirx, diry, dirz, owner, speed, dmg) {
    this.get({
      damage: dmg,
      owner: owner,
      type: 'shell',
      size: 0.2,
      r: 200,
      g: 200,
      b: 200,
      x: x,
      y: y,
      z: z,
      life: 0.7,
      gravity: 0,
      power: 7,
      fx_: 2.4 + speed,
      fz_: 2.4 + speed,
      vx: dirx+(0.1-Math.random()*0.2),
      vz: dirz+(0.1-Math.random()*0.2),
      vy: diry,
    });
  }
  ammoMinigun(x, y, z, dirx, diry, dirz, owner, speed, dmg) {
    this.get({
      damage: dmg,
      owner: owner,
      type: 'minigun',
      size: 0.5,
      r: 200,
      g: 200,
      b: 200,
      x: x,
      y: y,
      z: z,
      life: 1,
      gravity: 0,
      power: 2,
      fx_: 2.4 + speed,
      fz_: 2.4 + speed,
      vx: dirx+(0.5-Math.random()),
      vz: dirz+(0.5-Math.random()),
      vy: diry+(0.5-Math.random()),
      light: false,
    });
  }
  ammoAk47(x, y, z, dirx, diry, dirz, owner, speed, dmg) {
    this.get({
      damage: dmg,
      owner: owner,
      type: 'shell',
      size: 0.4,
      r: 200,
      g: 200,
      b: 200,
      x: x,
      y: y,
      z: z,
      life: 1,
      gravity: 0,
      power: 6,
      fx_: 2.4 + speed,
      fz_: 2.4 + speed,
      vx: dirx+(0.1-Math.random()*0.2),
      vz: dirz+(0.1-Math.random()*0.2),
      vy: diry,
    });
  }
}

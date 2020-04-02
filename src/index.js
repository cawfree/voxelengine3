'use-strict'

import "@babel/polyfill";

import * as THREE from 'three';

import { getModel } from "./model";
import { Chunk } from "./chunk";
// TODO: Need to support external definitions.
import { Map } from "./map";
import { loadAllModels } from "./io";
import { Shell, Ammo, AmmoP90, AmmoSniper, Heart } from "./item";


// TODO: Okay, so this isn't really a class, it's some weird mutatable object.
//       Needs a heavy refactor about getModel.


(!Detector.webgl) && Detector.addGetWebGLMessage();

class Main {
  constructor() {
    this.renderer = 0;
    this.controls = 0;
    this.camera = 0;
    this.scene = 0;
    this.stats = 0;
    this.clock = 0;
    this.light1 = 0;
    this.particles = 0;
    this.particles_box = 0;
    this.t_start = Date.now();
    this.maps = 0;
    this.textures = new Textures();
    this.update_objects = [];
    this.cdList = [];
    this.player = 0;
    this.visible_distance = 250; // from player to hide chunks + enemies.
    this.chunk_material = 0;
    this.objects = {};
    this.ff_objects = [];
    this.sounds = new SoundLoader();
 

    this.box_material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    this.sprite_material = new THREE.SpriteMaterial({ color: 0xffffff });
    this.chunk_material = new THREE.MeshPhongMaterial({ vertexColors: THREE.VertexColors, wireframe: false });
    this.p_light = new THREE.PointLight(0xFFAA00, 1, 10);
  }
  async init() {
    this.world = new World(this);
    this.sounds.Add({name: "sniper", file: require("../assets/sounds/sniper.wav.mp3")});
    this.sounds.Add({name: "take_heart", file: require("../assets/sounds/heart.wav.mp3")});
    this.sounds.Add({name: "walk1", file: require("../assets/sounds/walk1.wav.mp3")});
    this.sounds.Add({name: "blood1", file: require("../assets/sounds/blood1.wav.mp3")});
    this.sounds.Add({name: "blood2", file: require("../assets/sounds/blood2.wav.mp3")});
    this.sounds.Add({name: "blood3", file: require("../assets/sounds/blood3.wav.mp3")});
    this.sounds.Add({name: "rocket", file: require("../assets/sounds/rocket_shoot.wav.mp3")});
    this.sounds.Add({name: "rocket_explode", file: require("../assets/sounds/rocket_explode.wav.mp3")});
    this.sounds.Add({name: "ak47", file: require("../assets/sounds/ak47.wav.mp3")});
    this.sounds.Add({name: "p90", file: require("../assets/sounds/p90.wav.mp3")});
    this.sounds.Add({name: "pistol", file: require("../assets/sounds/pistol.mp3")});
    this.sounds.Add({name: "grenadelauncher", file: require("../assets/sounds/grenadelauncher.mp3")});
    this.sounds.Add({name: "shotgun", file: require("../assets/sounds/shotgun_shoot.wav.mp3")});
    this.sounds.Add({name: "shotgun_reload", file: require("../assets/sounds/shotgun_reload.wav.mp3")});
    this.sounds.Add({name: "minigun", file: require("../assets/sounds/gunshot1.wav.mp3")});
    this.sounds.Add({name: "fall", file: require("../assets/sounds/fall.wav.mp3")});
    this.sounds.Add({name: "fall2", file: require("../assets/sounds/scream.wav.mp3")});
    this.sounds.Add({name: "footsteps", file: require("../assets/sounds/footsteps.wav.mp3")});
    this.sounds.Add({name: "heartbeat", file: require("../assets/sounds/heartbeat.wav.mp3")});
    this.sounds.Add({name: "painkillers", file: require("../assets/sounds/painkillers.wav.mp3")});
    this.sounds.Add({name: "ambient_horror", file: require("../assets/sounds/ambient_horror.wav.mp3")});
    this.sounds.Add({name: "ambient_street", file: require("../assets/sounds/ambient_street.mp3")});
    this.sounds.Add({name: "hit1", file: require("../assets/sounds/hit1.wav.mp3")});
    this.sounds.Add({name: "hit2", file: require("../assets/sounds/hit2.wav.mp3")});
    this.sounds.Add({name: "hunt1", file: require("../assets/sounds/kill_you.wav.mp3")});
    this.sounds.Add({name: "hunt2", file: require("../assets/sounds/take_him.wav.mp3")});
    this.sounds.Add({name: "ammo_fall", file: require("../assets/sounds/ammo_fall.wav.mp3")});
    this.sounds.Add({name: "reload", file: require("../assets/sounds/reload.wav.mp3")});
    this.sounds.Add({name: "bullet_wall", file: require("../assets/sounds/bullet_wall.mp3")});
    this.sounds.Add({name: "bullet_metal", file: require("../assets/sounds/bullet_metal.mp3")});

    let container = document.getElementById('container');
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    this.camera = this.createCamera();
    this.scene.fog = new THREE.Fog( 0x000000, 180, this.visible_distance );

    this.renderer = new THREE.WebGLRenderer({antialias: false});
    this.renderer.setPixelRatio( 1 );
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild( this.renderer.domElement );
    this.stats = new Stats();
    container.appendChild( this.stats.dom );
    window.addEventListener('resize', this.onWindowResize.bind(this), false);

    this.models = await loadAllModels(
      this,
      {
        // vox
        ['greenie']: [require("../assets/vox/greenie.vox"), 1, "object"],
        ['agent']: [require("../assets/vox/agent.vox"), 0.1, "object"],
        ['agentblack']: [require("../assets/vox/agent_black.vox"), 0.1, "object"],
        ['hearty']: [require("../assets/vox/hearty.vox"), 1, "object"],
        ['dead_hearty']: [require("../assets/vox/dead_hearty.vox"), 1, "object"],
        ['player']: [require("../assets/vox/player.vox"), 1, "object"],
        ['dudo']: [require("../assets/vox/dudo.vox"), 1, "object"],
        ['lamp1']: [require("../assets/vox/lamp1.vox"), 1, "object"],
        ['barrel']: [require("../assets/vox/barrel.vox"), 0.1, "object"],
        ['barrel_fire']: [require("../assets/vox/barrel_fire.vox"), 0.1, "object"],
        ['fbihq']: [require("../assets/vox/fbi_hq.vox"), 5, "object"],
        ['tree']: [require("../assets/vox/tree.vox"), 1, "object"],
        ['streetlamp']: [require("../assets/vox/StreetLamp.vox"), 1, "object"],
        ['paperagent']: [require("../assets/vox/paperagent.vox"), 1, "object"],
        ['paperpolicecar']: [require("../assets/vox/policecar.vox"), 1, "object"],
        // png
        ['shotgun']: [require("../assets/pixelart/shotgun.png"), 8, "object"],
        ['shell']: [require("../assets/pixelart/shell.png"), 20, "object"],
        ['heart']: [require("../assets/pixelart/heart.png"), 3, "object"],
        ['ammo']: [require("../assets/pixelart/ammo.png"), 20, "object"],
        ['ak47']: [require("../assets/pixelart/ak47.png"), 5, "object"],
        ['p90']: [require("../assets/pixelart/p90.png"), 5, "object"],
        ['pistol']: [require("../assets/pixelart/pistol.png"), 5, "object"],
        ['sniper']: [require("../assets/pixelart/sniper.png"), 5, "object"],
        ['minigun']: [require("../assets/pixelart/minigun.png"), 10, "object"],
        ['rocketlauncher']: [require("../assets/pixelart/rocketlauncher.png"), 8, "object"],
        ['grenadeLauncher']: [require("../assets/pixelart/grenadelauncher.png"), 8, "object"],
        ['spiderweb']: [require("../assets/pixelart/spiderweb.png"), 1, "object"],
        ['painkillers']: [require("../assets/pixelart/painkillers.jpg"), 1, "object"],
        ['radiation_sign']: [require("../assets/pixelart/radiation_sign.png"), 1, "object"],
        ['ufo_sign']: [require("../assets/pixelart/sign_ufo.png"), 1, "object"],
      },
    );

    // TODO: Some generic like these necessitate externalized caching.
    this.objects["shell"] = new Shell(this);
    this.objects["ammo"] = new Ammo(this);
    this.objects["ammo_p90"] = new AmmoP90(this);
    this.objects["ammo_sniper"] = new AmmoSniper(this);
    this.objects["heart"] = new Heart(this);



    this.particles = new ParticlePool(this, 2000, 0);
    this.particles_box = new ParticlePool(this, 1000, 1);

    // Wait for all resources to be loaded before loading map.
    this.textures.prepare();

    this.maps = new Level1();
    this.maps.init(this);
  
    this.render();
  }
  createCamera() {
    //// Iosmetric view
    //let aspect = window.innerWidth / window.innerHeight;
    //let d = 70;
    //let aspect = window.innerWidth/window.innerHeight;
    //this.camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, -d, 1, 3000 );
    //// Perspective View
    //this.camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, this.visible_distance );
    return new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, this.visible_distance );
  }
  reset() {
    this.camera = this.createCamera();
    this.world.reset(this);
    this.maps.reset(this);
    this.player.reset(this);
    this.cdList = [];
    for(let i = 0; i < this.update_objects.length; i++) {
      if(this.update_objects[i].chunk) {
        this.scene.remove(this.update_objects[i].chunk.mesh);
      }
    }
    this.update_objects = [];
    this.maps.init(this);
  }
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  addObject(obj) {
    this.update_objects.push(obj);
  }
  addToCD(obj) {
    if (obj.owner == null || obj.owner == "") {
      let err = new Error();
      console.log(err.stack);
    }
    if (obj != undefined) {
      this.cdList.push(obj);
    }
  }
  spliceCDList (index) {
    const len = this.cdList.length || 0;
    while (index < len) {
      this.cdList[index] = this.cdList[index + 1];
      index += 1;
    }
    this.cdList.length -= 1;
  }
  removeFromCD(obj) {
    for(let i = 0; i < this.cdList.length; i++) {
      const item = this.cdList[i];
      if (item !== undefined && item.id === obj.id) {
        this.spliceCDList(i);
        return;
      }
    }
  }
  render() {
    requestAnimationFrame(() => this.render());
    const time = (Date.now() - this.t_start) * 0.001;
    const delta = this.clock.getDelta();

    for(let f in this.update_objects) {
      if(this.update_objects[f] != null) {
        if(this.update_objects[f].update) {
          this.update_objects[f].update(this, time, delta);
        } else {
          this.update_objects[f] = null;
        }
      }
    }

    Object.values(this.objects)
      .map(f => f.update(this, time, delta));

    this.stats.update();
    this.particles.update(this, time, delta);
    this.particles_box.update(this, time, delta);
    this.world.update(this, time, delta);
    this.maps.update(this, time, delta);
    this.renderer.render(this.scene, this.camera);
  }
}

class Level1 extends Map {
  constructor() {
    super();
    this.wall_texture = WALL2;
    this.wall2_texture = WOOD_WALL;
    this.map_file = require("../assets/maps/map3_ground.png").default;
    this.obj_file = require("../assets/maps/map3_objects.png").default;
  }
  update(store, time, delta) {
    super.update(store, time, delta);
    for(let i= 0; i < 2; i++) {
      store.particles.rain(store);
    }
  }
  reset(store) {
    super.reset(store);
    store.sounds.StopSound("ambient_horror");
  }
  init(store) {
    super.init(store, "Level1", this.map_file, this.obj_file);
    this.setLighting(store);
    store.sounds.PlaySound(store, "ambient_horror", null, 800, true);
  }
  setLighting(store) {
    this.ambient_light = new THREE.AmbientLight( 0xFFFFFF, 0.8);
    store.scene.add(this.ambient_light);
  }
};

function ParticlePool(store, size, type) {
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

  ParticlePool.prototype.update = function (store, time, delta) {
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
  };

  ParticlePool.prototype.create = function (store, opts) {
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].active) {
        this.particles[i].set(store, opts);
        return this.particles[i];
      }
    }
    return -1;
  };

  ParticlePool.prototype.get = function (opts) {
    this.queue.push(opts);
  };

  //
  // Predefined types of particles
  //
  ParticlePool.prototype.fire = function (store, x, y, z) {
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
  };

  ParticlePool.prototype.explosion = function (store, x, y, z, power, type) {
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
  };

  ParticlePool.prototype.chunkDebris = function (x, y, z, chunk, dirx, diry, dirz, power) {
    let vx, vy, vz, fx, fz;
    fz = Math.random(); //0.3;//+power/50;
    fx = Math.random(); // 0.3;//+power/50;
    vx = dirx + (1 - Math.random() * 2);
    vy = diry + Math.random() * 4;
    vz = dirz + (1 - Math.random() * 2);
    type = "chunk_debris";
    //   if(chunk.current_blocks > 0) {
    //       mass = 1/(chunk.current_blocks*0.01); 
    //       console.log(mass);
    //   }
    //   if(mass > 1) { 
    //       mass = 1;
    //   }

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
    //   console.log("C:",chunk.current_blocks, "M:",mass, "VX:",vx, "VY:",vy*mass, "VZ:",vz, "FX:",fx, "FZ:",fz);
  };

  // Shell from a gun
  ParticlePool.prototype.empty_shell = function (x, y, z, mesh) {
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
  };

  // Radioactive splats
  ParticlePool.prototype.radioactive_splat = function (x, y, z, size, dirx, diry, dirz) {
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
  };

  // Radioactive leaks
  ParticlePool.prototype.radioactive_leak = function (x, y, z, size) {
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
  };

  // Blood
  ParticlePool.prototype.blood = function (x, y, z, size, dirx, diry, dirz) {
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
  };

  // World debris (with smoke and fire)
  ParticlePool.prototype.world_debris = function (x, y, z, size, r, g, b) {
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
  };


  // Debris 
  ParticlePool.prototype.debris = function (x, y, z, size, r, g, b, virtual, dirx, diry, dirz, stay) {
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
  };

  ParticlePool.prototype.rain = function (store) {
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
  };

  ParticlePool.prototype.snow = function (store) {
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
  };

  ParticlePool.prototype.walkSmoke = function (x, y, z) {
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
  };

  ParticlePool.prototype.portalMagic = function (x, y, z) {
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
  };

  ParticlePool.prototype.radiation = function (x, y, z) {
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
  };

  ParticlePool.prototype.blueMagic = function (x, y, z) {
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
  };

  ParticlePool.prototype.debris_smoke = function (x, y, z, size) {
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
  };

  ParticlePool.prototype.smoke = function (x, y, z, size) {
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
  };

  ParticlePool.prototype.gunSmoke = function (x, y, z, dirx, diry, dirz) {
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
  };

  //
  // Different types of ammo
  //
  ParticlePool.prototype.ammoGrenadeLauncher = function (x, y, z, dirx, diry, dirz, speed, dmg) {
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
  };

  ParticlePool.prototype.ammoMissile = function (x, y, z, dirx, diry, dirz, owner, chunk, speed, dmg) {
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
  };

  // Ammo for shotgun
  ParticlePool.prototype.ammoShell = function (x, y, z, dirx, diry, dirz, owner, speed, dmg) {
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
  };

  // Ammo for Sniper
  ParticlePool.prototype.ammoSniper = function (x, y, z, dirx, diry, dirz, owner, speed, dmg) {
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
  };

  // Ammo for p90
  ParticlePool.prototype.ammoP90 = function (x, y, z, dirx, diry, dirz, owner, speed, dmg) {
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
  };

  // Ammo for minigun
  ParticlePool.prototype.ammoMinigun = function (x, y, z, dirx, diry, dirz, owner, speed, dmg) {
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
  };

  // Ammo for ak47
  ParticlePool.prototype.ammoAk47 = function (x, y, z, dirx, diry, dirz, owner, speed, dmg) {
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
  };
}

function Particle(store, particle_type) {
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
  if (particle_type == 0) {
    this.mesh = new THREE.Sprite(store.sprite_material.clone());
  } else {
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), store.box_material.clone());
  }

  store.scene.add(this.mesh);
  this.mesh.visible = false;
  this.mesh.castShadow = false;

  Particle.prototype.set = function (store, opts) {
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
  };

  Particle.prototype.reset = function (store) {
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
  }; 

  Particle.prototype.checkLife = function () {
    if (this.life <= 0 || this.mesh.position.y < 0) {
      this.active = 0;
      this.mesh.visible = false;
      return;
    }
  };

  Particle.prototype.isVisible = function (store, pos) {
    if (store.player != 0) {
      if (pos.distanceTo(store.player.chunk.mesh.position) > store.visible_distance) {
        return false;
      }
    }
    return true;
  };

  Particle.prototype.update = function (store, time, delta) {
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
  };

  Particle.prototype.bounce = function (store) {
    if (this.bounces > 0 && this.mesh.position.y <= store.maps.ground+1) {
      this.mesh.position.y += this.bounces;
      this.bounces--;
      this.vy *= this.e;
      this.spin++;
      return true;
    }
    return false;
  };

  Particle.prototype.keepOnGround = function (store) {
    if (store.world.checkExists(store, this.mesh.position.clone()).length != 0) {
      this.active = 0;
      this.mesh.position.y = store.maps.ground;
    }
  };

  Particle.prototype.addRadiationToGround = function (store) {
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
  };

  Particle.prototype.addBloodToGround = function (store) {
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
  };

  Particle.prototype.splatterRain = function (store) {
    if (store.world.checkExists(store, this.mesh.position.clone()).length != 0) {
      store.particles.debris(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.2, this.r, this.g, this.b, false,null,null,null,false);
      store.particles.debris(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.2, this.r, this.g, this.b, false,null,null,null,false);
      this.active = 0;
    }
  };

  Particle.prototype.cd = function (store, time, delta) {
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
  };
}

function SoundLoader() {
  this.sounds = new Array();
  this.context;
  this.muted = false;

  SoundLoader.prototype.isPlaying = function(name) {
    if(this.sounds[name].source != null) {
      return true;
    }
    return false;
  };

  SoundLoader.prototype.StopSound = function(name) {
    this.sounds[name].source = null;
  };

  SoundLoader.prototype.PlaySound = function(store, name, position, radius, loop) {
    if(loop == null) { loop = false; }
    this.sounds[name].source = this.context.createBufferSource();
    this.sounds[name].source.buffer = this.sounds[name].buffer;
    this.sounds[name].gainNode = this.context.createGain();
    this.sounds[name].source.connect(this.sounds[name].gainNode);
    this.sounds[name].source.loop = loop;
    this.sounds[name].gainNode.connect(this.context.destination);
    this.sounds[name].source.start(0);

    this.sounds[name].source.onended = () => {
      this.sounds[name].source = null;
    };

    if(position != undefined) {
      let vector = store.camera.localToWorld(new THREE.Vector3(0,0,0));
      let distance = position.distanceTo( vector );
      if ( distance <= radius ) {
        let vol = 1 * ( 1 - distance / radius );
        this.sounds[name].gainNode.gain.value = vol;
      } else {
        this.sounds[name].gainNode.gain.value = 0;
      }
    } else {
      this.sounds[name].gainNode.gain.value = 1;
    }
  };

  SoundLoader.prototype.Add = function(args) {
    this.sounds[args.name] = new Object();
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    if(this.context == undefined) {
      this.context = new AudioContext();
    }
    let loader = new BufferLoader(this.context,
      [args.file.default],
      this.Load.bind(this, args.name));
    loader.load();
  };

  SoundLoader.prototype.Load = function(name, buffer) {
    this.sounds[name].buffer = buffer[0];
  };
}

function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;

  BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    //console.log("URL: "+url);
    let request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    let loader = this;

    request.onload = function() {
      // Asynchronously decode the audio file data in request.response
      loader.context.decodeAudioData(
        request.response,
        function(buffer) {
          if (!buffer) {
            alert('error decoding file data: ' + url);
            return;
          }
          loader.bufferList[index] = buffer;
          if (++loader.loadCount == loader.urlList.length)
            loader.onload(loader.bufferList);
        },
        function(error) {
          console.log("ERROR FOR URL: "+url);
          console.log('decodeAudioData error', error);
        }
      );
    }

    request.onerror = function() {
      alert('BufferLoader: XHR error');
    }

    request.send();
  };

  BufferLoader.prototype.load = function() {
    for (let i = 0; i < this.urlList.length; ++i)
      this.loadBuffer(this.urlList[i], i);
  };
}

const MAP1 = 0;
const WALL1 = 1;
const ROAD1 = 2;
const GRASS1 = 3;
const TREE1 = 4;
const DIRT1 = 5;
const STONE_WALL = 6;
const WALL2 = 7;
const FLOOR1 = 8;
const RADIOACTIVE_BARREL = 9;
const LEVEL1_WALL = 10;
const WOOD_WALL = 11;
const LEVEL1_WALL2 = 12;

const IMAGE = 0;
const HEIGHT_MAP = 1;

function Textures() {
  this.files = [
    [require("../assets/textures/map1.png").default, IMAGE],
    [require("../assets/textures/wall.jpg").default, IMAGE],
    [require("../assets/textures/road.jpg").default, IMAGE], 
    [require("../assets/textures/grass1.jpg").default, IMAGE], 
    [require("../assets/textures/tree1.jpg").default, IMAGE],
    [require("../assets/textures/dirt.jpg").default, IMAGE],
    [require("../assets/textures/stone_wall.jpg").default, IMAGE],
    [require("../assets/textures/wall2.png").default, IMAGE],
    [require("../assets/textures/floor1.png").default, IMAGE],
    [require("../assets/textures/radioactive.png").default, IMAGE],
    [require("../assets/textures/wall_level1.png").default, IMAGE],
    [require("../assets/textures/wood_fence.png").default, IMAGE],
    [require("../assets/textures/wall2_level1.png").default, IMAGE],
  ];
  this.tex = [];
  this.loaded = 0;
  this.heightMap = {};

  Textures.prototype.clean = function() {
    for(let i = 0; i < this.tex.length; i++) {
      this.tex[i].map = null;
      this.tex[i] = null;
    }
  };

  Textures.prototype.getMap = function(map_id) {
    return this.tex[map_id];
  };

  Textures.prototype.isLoaded = function() {
    return this.loaded == this.files.length? true : false;
  };

  Textures.prototype.prepare = function() {
    for(let i = 0; i < this.files.length; i++) {
      this.tex[i] = {};
      this.tex[i].file = this.files[i][0];
      if(this.files[i][1] == IMAGE) {
        this.load(this.tex[i].file, i);
      } else if(this.files[i][1] == HEIGHT_MAP) {
        this.loadHeightMap(this.tex[i].file, i);
      }
    }
  };

  Textures.prototype.getPixel = function(x, y, tex_id) {
    // Scale x,y to image size.
    //console.log(this.tex[tex_id], tex_id);
    let tx = (x/this.tex[tex_id].height)|0; 
    let xx = x - (tx*this.tex[tex_id].height);
    let ty = (y/this.tex[tex_id].width)|0; 
    let yy = y - (ty*this.tex[tex_id].width);
    //console.log(yy,xx);
    if(this.tex[tex_id].map[xx] == undefined) {
      console.log(xx,yy);
    }
    if(xx >= this.tex[tex_id].height) { xx = this.tex[tex_id].height - 10;}
    if(yy >= this.tex[tex_id].width) { yy = this.tex[tex_id].width - 10;}
    if(this.tex[tex_id].map[xx] == undefined) {
      console.log(this.tex[tex_id].map.length);
      console.log(this.tex[tex_id], xx,yy);
    }
    return {r: this.tex[tex_id].map[xx][yy].r,
      g: this.tex[tex_id].map[xx][yy].g,
      b: this.tex[tex_id].map[xx][yy].b
    };
  };

  Textures.prototype.loadHeightMap = function(filename, id) {
    let image = new Image();
    image.src = filename;
    image.id = id;
    let ctx = document.createElement('canvas').getContext('2d');

    image.onload = () => {
      let scale = 1;
      ctx.canvas.width = image.width;
      ctx.canvas.height = image.height;

      this.tex[image.id].width = image.width;
      this.tex[image.id].height = image.height;

      let size = image.width * image.height;
      let data = new Float32Array( size );

      ctx.drawImage(image,0,0);

      for ( let i = 0; i < size; i ++ ) {
        data[i] = 0
      }

      let imaged = ctx.getImageData(0, 0, image.width, image.height);
      let pix = imaged.data;

      this.tex[image.id].map = new Array();
      for(let y = 0; y < image.height; y++) {
        let pos = y * image.width * 4;
        this.tex[image.id].map[y] = new Array();
        for(let x = 0; x < image.width; x++) {
          let all = pix[pos]+pix[pos+1]+pix[pos+2];
          pos++;
          pos++;
          pos++;
          this.tex[image.id].map[y][x] = all;
        }
      }
      this.loaded++;
    }
  };

  Textures.prototype.load = function(filename, id) {
    let image = new Image();
    image.src = filename;
    image.id = id;
    let ctx = document.createElement('canvas').getContext('2d');
    image.onload = () => {
      ctx.canvas.width  = image.width;
      ctx.canvas.height = image.height;
      ctx.drawImage(image, 0, 0);
      this.tex[image.id].width = image.width;
      this.tex[image.id].height = image.height;
      this.tex[image.id].map = new Array();
      let imgData = ctx.getImageData(0, 0, image.width, image.height);
      for(let y = 0; y < image.height; y++) {
        let pos = y * image.width * 4;
        this.tex[image.id].map[y] = new Array();
        for(let x = 0; x < image.width; x++) {
          let r = imgData.data[pos++];
          let g = imgData.data[pos++];
          let b = imgData.data[pos++];
          let a = imgData.data[pos++];
          this.tex[image.id].map[y][x] = {'r': r, 'g': g, 'b': b, 'a': a};
        }
      }
      this.loaded++;
    }
  };

}

//////////////////////////////////////////////////////////////////////
// Random number generator (faster than Math.random())
// https://en.wikipedia.org/wiki/Linear_feedback_shift_register
//////////////////////////////////////////////////////////////////////
  let lfsr = (function(){
    let max = Math.pow(2, 16),
      period = 0,
      seed, out;
    return {
      setSeed : function(val) {
        out = seed = val || Math.round(Math.random() * max);
      },
      rand : function() {
        let bit;
        // From http://en.wikipedia.org/wiki/Linear_feedback_shift_register
        bit  = ((out >> 0) ^ (out >> 2) ^ (out >> 3) ^ (out >> 5) ) & 1;
        out =  (out >> 1) | (bit << 15);
        period++;
        return out / max;
      }
    };
  }());

// Set seed
lfsr.setSeed();

//////////////////////////////////////////////////////////////////////
// Load image files to pixel map
//////////////////////////////////////////////////////////////////////
 
class World {
  constructor(store) {
    this.obj_size_x = 16;
    this.obj_size_z = 16;
    this.obj_size_y = 2;
    this.chunks = [];
    this.cid = 0;
    this.textures = 0;
    this.debug_update = 0;
    this.rebuild_idx = 0;
    this.radioactive_blocks = [];
    this.rpc = 0;
    this.rpc_max = 0;
    this.obj_type = "world";
    this.base_type = "world";
    this.textures = new Textures();
    this.textures.prepare();
  }
  reset(store) {
    for (let i = 0; i < this.chunks.length; i++) {
      if(this.chunks[i].mesh) {
        store.scene.remove(this.chunks[i].mesh);
      }
    }
    this.radioactive_blocks = [];
    this.chunks = [];
    this.cid = 0;
    this.rebuild_idx = 0;
    this.rpc = 0;
    this.rpc_max = 0;
  }
  removeBatch(store, points) {
    for(let i = 0; i < points.length; i++) {
      let c = this.getChunkId(store, points[i].x, points[i].y, points[i].z, false);
      for (let n = 0; n < c.length; n++) {
        this.chunks[c[n]].rmBlock(store, points[i].x, points[i].y, points[i].z);
      }
    }
  }
  getChunkId(store, x, y, z, create) {
    // ?
    x |= 0;
    y |= 0;
    z |= 0;

    let finds = [];
    let c = 0;
    for (let i = 0; i < this.chunks.length; i++) {
      // Split for perf.
      if (x >= this.chunks[i].from_x && x <= this.chunks[i].to_x) {
        if(z >= this.chunks[i].from_z && z <= this.chunks[i].to_z) {
          if(y >= this.chunks[i].from_y && y <= this.chunks[i].to_y ) {
            finds[c++] = i;
          }
        }
      }
    }
    if(finds.length > 0) {
      return finds;
    }
    if (create) {
      // Create chunk based on world division by obj_size_x.
      let pos_x = (x/this.obj_size_x)|0;
      let pos_y = (y/this.obj_size_y)|0;
      let pos_z = (z/this.obj_size_z)|0;

      let chunk = new Chunk(
        store,
        pos_x * this.obj_size_x,
        pos_y * this.obj_size_y,
        pos_z * this.obj_size_z,
        this.obj_size_x, this.obj_size_y, this.obj_size_z,
        "CREATED", 1, "world");
      let i = this.addChunk(chunk);
      return [i];
    }
    return [];
  }
  hit(store, dmg, dir, type, pos) {
    return this.explode(store, pos.x, pos.y, pos.z, dmg, type);
  }
  addChunk(chunk) {
    this.chunks[this.cid] = chunk;
    this.chunks[this.cid].owner = this;
    this.cid++;
    return this.cid-1;
  }
  explode(store, x, y, z, power, type) {

    x |= 0;
    y |= 0;
    z |= 0;

    let pow = power*power;

    let list = [];
    let vx = 0, vy = 0, vz = 0, val = 0, offset = 0;
    let rx;
    let ry;
    let rz;
    for (rx = x-power; rx <= x+power; rx++) {
      vx = Math.pow((rx-x), 2); 
      for (rz = z-power; rz <= z+power; rz++) {
        vz = Math.pow((rz-z),2)+vx; 
        for (ry = y-power; ry <= y+power; ry++) {
          if (ry > 0) {
            val = Math.pow((ry-y),2) + vz;
            if (val <= pow) {
              list.push({x: rx, y: ry, z: rz});
            }
          }
        }
      }
    }
    // XXX: Need a flag for something which can destroy
    if (type == "missile" || type == "grenade") {
      let pos = 0;
      let pxp = x+power*2;
      let pxm = x-power*2;
      let pzp = z+power*2;
      let pzm = z-power*2;
      for (let i = 0; i < store.cdList.length; i++) {
        const { owner } = store.cdList[i];
        if (owner) {
          const { hit } = owner;
          if (typeof hit === "function") {
            pos = owner.chunk.mesh.position;
            if (pos.x >= pxm && pos.x <= pxp && pos.z >= pzm && pos.z <= pzp) {
              owner.hit(store, power, new THREE.Vector3(0,0,0), "missile", new THREE.Vector3(x,y,z));
            }
          }
        }
      }
    } else {
      store.sounds.PlaySound(store, "bullet_wall", new THREE.Vector3(x,y,z), 500);
    }
    this.removeBatch(store, list);
  }
  checkExists(store, pos) {
    pos.x |= 0;
    pos.y |= 0;
    pos.z |= 0;
    let c = this.getChunkId(store, pos.x, pos.y, pos.z, false);
    if(c.length == 0) {
      return [];
    }
    let list = [];
    for(let i = 0; i < c.length; i++) {
      let r = this.chunks[c[i]].checkExists(store, pos.x, pos.y, pos.z);
      if(r != -1) {
        list.push(r);
      }
    }
    return list;
  }
  addColorBlock(store, x, y, z, r, g, b) {
    x |= 0;
    y |= 0;
    z |= 0;
    const c = this.getChunkId(store, x,y,z, true);
    for (let i = 0; i < c.length; i++) {
      // Do not add blood to non-existing blocks.
      if(this.chunks[c[i]].blockExists(x, y, z)) {
        this.chunks[c[i]].addBlock(store, x, y, z, r, g, b);
        if(r <= 50  && g >= 200 && b < 105 && b >= 50) {
          for(let p = 0; p < this.radioactive_blocks.length; p++) {
            if(this.radioactive_blocks[p].x == x &&
              this.radioactive_blocks[p].y == y &&
              this.radioactive_blocks[p].z == z)
            {
              return;
            }
          }
          this.radioactive_blocks[this.rpc_max++] = [x,y,z];
        } else {
          for(let p = 0; p < this.radioactive_blocks.length; p++) {
            if(this.radioactive_blocks[p].x == x &&
              this.radioactive_blocks[p].y == y &&
              this.radioactive_blocks[p].z == z) {
              this.radioactive_blocks[p] = 0;
              break;
            }
          }
        }
      }
    }
  }
  addBlock(store, x, y, z, r, g, b) {
    x |= 0;
    y |= 0;
    z |= 0;
    let c = this.getChunkId(store, x,y,z, true);
    for (let i = 0; i < c.length; i++) {
      this.chunks[c[i]].addBlock(store, x, y, z, r, g, b);
    }
  }
  update(store, time, delta) {
    if(!store.player.chunk) {
      return;
    }

    for(let i = 0; i < this.chunks.length; i++) {
      if(this.chunks[i].dirty) {
        this.chunks[i].build(store);
      }
    }

    if(this.radioactive_blocks.length > 0) {
      let v = 0;
      for(let i = 0; i < 10; i++) {
        v = Math.random()*this.radioactive_blocks.length|0;
        if(this.radioactive_blocks[v] != 0) {
          if(this.checkExists(store, new THREE.Vector3(this.radioactive_blocks[v][0], this.radioactive_blocks[v][1], this.radioactive_blocks[v][2])).length == 0) {
            this.radioactive_blocks[v] = 0;
          } else {
            store.particles.radiation(
              this.radioactive_blocks[v][0]+(1-Math.random()*2),
              this.radioactive_blocks[v][1]+(1-Math.random()*2),
              this.radioactive_blocks[v][2]+(1-Math.random()*2),
            );
          }
        }
      }
    }
  }
}

(async () => {
  await new Main().init();
  // TODO: Sequential stuff...
})();

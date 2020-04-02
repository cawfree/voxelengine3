'use-strict'

import "@babel/polyfill";

import * as THREE from 'three';

import { getModel } from "./model";
import { Chunk } from "./chunk";
// TODO: Need to support external definitions.
import { Map } from "./map";
import { loadAllModels } from "./io";
import { Shell, Ammo, AmmoP90, AmmoSniper, Heart } from "./item";
import { ParticlePool } from "./particles";

import configureStore from "./configureStore";

// TODO: Okay, so this isn't really a class, it's some weird mutatable object.
//       Needs a heavy refactor about getModel.
(!Detector.webgl) && Detector.addGetWebGLMessage();

class Game {
  constructor() {
    // TODO: Eventually, everything will reference this.
    const { dispatch, getState } = configureStore();

    this.dispatch = dispatch;
    this.getState = getState;

    this.controls = 0;
    this.t_start = Date.now();
    this.textures = new Textures();
    this.update_objects = [];
    this.cdList = [];
    this.player = 0;
    this.visible_distance = 250; // from player to hide chunks + enemies.
    this.objects = {};
    this.ff_objects = [];
    this.sounds = new SoundLoader();
 
    //this.box_material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    //this.sprite_material = new THREE.SpriteMaterial({ color: 0xffffff });
    //this.chunk_material = new THREE.MeshPhongMaterial({ vertexColors: THREE.VertexColors, wireframe: false });

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

    let container = document.getElementById('container');
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

    this.objects = Object.freeze({
      ['shell']: new Shell(this),
      ['ammo']: new Ammo(this),
      ['ammo_p90']: new AmmoP90(this),
      ['ammo_sniper']: new AmmoSniper(this),
      ['heart']: new Heart(this),
    });
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

window.Game = Game;

import * as THREE from "three";

import { Chunk } from "../../chunk";

export default class World {
  constructor(store) {
    this.obj_size_x = 16;
    this.obj_size_z = 16;
    this.obj_size_y = 2;
    this.chunks = [];
    this.cid = 0;
    this.debug_update = 0;
    this.rebuild_idx = 0;
    this.radioactive_blocks = [];
    this.rpc = 0;
    this.rpc_max = 0;
    this.obj_type = "world";
    this.base_type = "world";
    //this.textures = new Textures();
    //this.textures.prepare();
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
      let pos_x = (x / this.obj_size_x) | 0;
      let pos_y = (y / this.obj_size_y) | 0;
      let pos_z = (z / this.obj_size_z) | 0;
      return [
        this.addChunk(
          new Chunk(
            store,
            pos_x * this.obj_size_x,
            pos_y * this.obj_size_y,
            pos_z * this.obj_size_z,
            this.obj_size_x, 
            this.obj_size_y,
            this.obj_size_z,
            "CREATED",
            1,
            "world",
          ),
        ),
      ];
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
    // TODO: Why? Specify dependencies?
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

import * as THREE from "three";

// TODO: Abstract this; should be supplied to the level.
import { Agent, AgentBlack, Character, Dudo, Enemy, Greenie, Hearty, Player } from "../../character";
import { Chunk } from "../../chunk";
import { Ammo, AmmoCrate, AmmoP90, AmmoSniper, Barrel, BarrelFire, DeadHearty, FBIHQ, Heart, Item, Lamp1, PainKillers, PaperAgent, PaperPoliceCar, Portal, RadiationSign, Shell, SpiderWeb, StreetLamp, Tree, UfoSign, } from "../../item";
import { loadImageFile } from "../../io";

export default class Map {
  constructor() {
    this.name = "";
    this.ground = 3;
    this.wall_height = 25;
    this.wall_thickness = 2;
    this.objects = [];
    this.wall_texture = 0;
    this.wall2_texture = 0;

    // Object => color in obj image ?
    this.objects["Agent"] = { r: 0xFF, g: 0x00, b: 0x00 };
    this.objects["Greenie"] = { r: 0xEE, g: 0x00, b: 0x00 };
    this.objects["Dudo"] = { r: 0xDD, g: 0x00, b: 0x00 };
    this.objects["Hearty"] = { r: 0xCC, g: 0x00, b: 0x00 };
    this.objects["AgentBlack"] = { r: 0xBB, g: 0x00, b: 0x00 };
    this.objects["Lamp1"] = { r: 0x00, g: 0xFF, b: 0x00 };
    this.objects["Portal"] = { r: 0x00, g: 0xEE, b: 0x00 };
    this.objects["RadiationSign"] = { r: 0x00, g: 0xDD, b: 0x00 };
    this.objects["UfoSign"] = { r: 0x00, g: 0xCC, b: 0x00 };
    this.objects["DeadHearty"] = { r: 0x00, g: 0xBB, b: 0x00 };
    this.objects["BarrelFire"] = { r: 0x00, g: 0xAA, b: 0x00 };
    this.objects["StreetLamp"] = { r: 0x00, g: 0x99, b: 0x00 };
    this.objects["Tree"] = { r: 0x00, g: 0x88, b: 0x00 };
    this.objects["PaperAgent"] = { r: 0x00, g: 0x77, b: 0x00 };
    this.objects["PaperPoliceCar"] = { r: 0x00, g: 0x66, b: 0x00 };
    this.objects["Barrel"] = { r: 0x00, g: 0x55, b: 0x00 };
    this.objects["Player"] = { r: 0x00, g: 0x00, b: 0xFF };
    this.objects["PainKillers"] = { r: 0x00, g: 0x00, b: 0xEE };
 
    this.walls = [];
    this.width = 0;
    this.height = 0;
    // Objects loaded 
    this.loaded = [];
    this.ambient_light = 0;
  }
  reset(store) {
    for(let i = 0; i < this.loaded.length; i++) {
      if(this.loaded[i].chunk) {
        store.scene.remove(this.loaded[i].chunk.mesh);
      }
    }
    this.loaded = [];
    this.walls = [];
    store.scene.remove(this.ambient_light);
  }
  update(store, time, delta) {
    let t1 = 0;
    for (let i = 0; i < this.loaded.length; i++) {
      if(this.loaded[i].chunk && this.loaded[i].chunk.dirty) {
        this.loaded[i].chunk.build(store);
        t1 = Date.now();
        if((Date.now() - t1) > 3) {
          break;
        }
      }
      t1 = Date.now();
      if (this.loaded[i].alive) {
        if(this.loaded[i].chunk) {
          if (this.loaded[i].chunk.mesh.position.distanceTo(store.player.chunk.mesh.position) < store.visible_distance) {
            this.loaded[i].update(store, time, delta);
          }
        } else if(this.loaded[i].x) {
          if (new THREE.Vector3(this.loaded[i].x, this.loaded[i].y, this.loaded[i].z).distanceTo(store.player.chunk.mesh.position) < store.visible_distance) {
            this.loaded[i].update(store, time, delta);
          }
        } else {
          this.loaded[i].update(store, time, delta);
        }
      }
      if((Date.now() - t1) > 3) {
        break;
      }
    }
  }
  init(store, name, ground, objects) {
    this.name = name;

    loadImageFile(ground)
      .then(
        ([data, width, height, map]) => {
          this.width = width;
          this.height = height;
          let walls = [];
          let floor = [];
          let wall_map = new Array(width);
          let wall_thickness = store.maps.wall_thickness;
          let wall_height = store.maps.wall_height;
          let found;
          for (let x = 0; x < width; x++) {
            wall_map[x] = new Array(height);
          }

          for (let x = 0; x < map.length; x++) {
            for (let z = 0; z < map[x].length; z++) {
              let p = map[x][z];
              if (p.a == 0) { continue; }

              // Black will dissapear in chunk algo.
              if (p.r == 0 && p.g == 0 && p.b == 0) {
                p.r = 1;
                p.g = 1;
                p.b = 1;
              }

              if(p.r == 0x22 && p.g == 0x22 && p.b == 0x22) {
                for (let y = 0; y < wall_height; y++) {
                  let pix = store.textures.getPixel(y, x, this.wall2_texture);
                  walls.push({ x: x, y: y, z: z, r: pix.r, g: pix.g, b: pix.b });
                  wall_map[x][z] = 1;
                }
              }

              if (map[x + 1][z].a == 0) {
                for (let y = 0; y < wall_height; y++) {
                  let pix = store.textures.getPixel(y, z, this.wall_texture);
                  for (let xx = 0; xx < wall_thickness; xx++) {
                    walls.push({ x: x + xx, y: y, z: z, r: pix.r, g: pix.g, b: pix.b });
                    walls.push({ x: x + xx, y: y, z: z - 1, r: pix.r, g: pix.g, b: pix.b });
                    walls.push({ x: x + xx, y: y, z: z + 1, r: pix.r, g: pix.g, b: pix.b });
                    wall_map[x + xx][z - 1] = 1;
                    wall_map[x + xx][z + 1] = 1;
                    wall_map[x + xx][z] = 1;
                  }
                }
              }
              if (map[x - 1][z].a == 0) {
                for (let y = 0; y < wall_height; y++) {
                  let pix = store.textures.getPixel(y, z, this.wall_texture);
                  for (let xx = 0; xx < wall_thickness; xx++) {
                    walls.push({ x: x - xx, y: y, z: z, r: pix.r, g: pix.g, b: pix.b });
                    walls.push({ x: x - xx, y: y, z: z - 1, r: pix.r, g: pix.g, b: pix.b });
                    wall_map[x - xx][z - 1] = 1;
                    wall_map[x - xx][z] = 1;
                  }
                }
              }
              if (map[x][z + 1].a == 0) {
                for (let y = 0; y < wall_height; y++) {
                  let pix = store.textures.getPixel(y, x, this.wall_texture);
                  for (let zz = 0; zz < wall_thickness; zz++) {
                    walls.push({ x: x - 1, y: y, z: z + zz, r: pix.r, g: pix.g, b: pix.b });
                    walls.push({ x: x, y: y, z: z + zz, r: pix.r, g: pix.g, b: pix.b });
                    wall_map[x - 1][z + zz] = 1;
                    wall_map[x][z + zz] = 1;
                  }
                }
              }
              if (map[x][z - 1].a == 0) {
                for (let y = 0; y < wall_height; y++) {
                  let pix = store.textures.getPixel(y, x, this.wall_texture);
                  for (let zz = 0; zz < wall_thickness; zz++) {
                    walls.push({ x: x - 1, y: y, z: z - zz, r: pix.r, g: pix.g, b: pix.b });
                    walls.push({ x: x, y: y, z: z - zz, r: pix.r, g: pix.g, b: pix.b });
                    wall_map[x][z - zz] = 1;
                    wall_map[x - 1][z - zz] = 1;
                  }
                }
              }

              // Draw floor
              for (let y = 0; y < store.maps.ground; y++) {
                floor.push({ x: x, y: y, z: z, r: p.r, g: p.g, b: p.b });
              }
            }
          }

          // Find floor and create chunks for it.
          let total_chunks = 0;
          while (true) {
            let x = 0;
            let z = 0;
            let found = false;
            for (x = 0; x < width; x++) {
              for (z = 0; z < height; z++) {
                if (map[x][z].a != 0) {
                  found = true;
                  break;
                }
              }
              if (found) break;
            }
            if (!found) {
              break;
            }
            // We found a wall position.
            // Get how far on X the wall is.
            let max_x = 0;
            let max_z = 1000;
            found = false;
            let max_width = 20;
            let max_height = 20;
            for (let x1 = 0; x + x1 < width && x1 < max_width; x1++) {
              if (map[x + x1][z].a != 0) {
                max_x++;
                // Check Z
                let mz = 0;
                for (let z1 = 0; z + z1 < height && z1 < max_height; z1++) {
                  if (map[x + x1][z + z1].a != 0) {
                    mz++;
                  } else {
                    break;
                  }
                }
                if (mz < max_z) {
                  max_z = mz;
                }
              } else {
                break;
              }
            }
            for (let x_ = x; x_ < x + max_x; x_++) {
              for (let z_ = z; z_ < z + max_z; z_++) {
                map[x_][z_].a = 0;
              }
            }

            // Now find all blocks within the range.
            let chunk = new Chunk(store, x, 0, z, max_x, store.maps.ground, max_z, "floor", 1, "world");
            for (let i = 0; i < floor.length; i++) {
              if (floor[i].x >= x && floor[i].x < x + max_x &&
                floor[i].z >= z && floor[i].z < z + max_z) {
                chunk.addBlock(store, floor[i].x, floor[i].y, floor[i].z, floor[i].r, floor[i].g, floor[i].b);
              }
            }

            store.world.addChunk(chunk);
          }


          // Find wall and create chunks for them.
          while (true) {
            let x = 0;
            let z = 0;
            found = false;
            for (x = 0; x < width; x++) {
              for (z = 0; z < height; z++) {
                if (wall_map[x][z] == 1) {
                  found = true;
                  break;
                }
              }
              if (found) break;
            }
            if (!found) {
              break;
            }
            found = false;
            // We found a wall position.
            // Get how far on X the wall is.
            let max_x = 0;
            let max_z = 1000;
            let max_width = 20;
            let max_height = 20;
            for (let x1 = 0; x + x1 < width && x1 < max_width; x1++) {
              if (wall_map[x + x1][z] == 1) {
                max_x++;
                // Check Z
                let mz = 0;
                for (let z1 = 0; z + z1 < height && z1 < max_height; z1++) {
                  if (wall_map[x + x1][z + z1] == 1) {
                    mz++;
                  } else {
                    break;
                  }
                }
                if (mz < max_z) {
                  max_z = mz;
                }
              } else {
                break;
              }
            }
            for (let x_ = x; x_ < x + max_x; x_++) {
              for (let z_ = z; z_ < z + max_z; z_++) {
                wall_map[x_][z_] = 0;
              }
            }

            // Now find all blocks within the range.
            // 0.01 = offset so we don't see black borders on the floor.
            let chunk = 0;
            if (max_x > max_z) {
              chunk = new Chunk(store, x - wall_thickness, this.ground, z - wall_thickness, max_x + wall_thickness, wall_height, max_z + wall_thickness, "x", 1, "world");
            } else {
              chunk = new Chunk(store, x - wall_thickness, this.ground, z, max_x + wall_thickness, wall_height, max_z + wall_thickness, "x", 1, "world");
            }
            for (let i = 0; i < walls.length; i++) {
              if (walls[i].x >= x && walls[i].x <= x + max_x &&
                walls[i].z >= z && walls[i].z <= z + max_z) {
                chunk.addBlock(store, walls[i].x, walls[i].y + this.ground, walls[i].z, walls[i].r, walls[i].g, walls[i].b);
              }
            }
            store.world.addChunk(chunk);
          }

          loadImageFile(objects)
            .then(
              ([data, width, height]) => {
                let list = [];
                for (let i = 0; i < data.length; i++) {
                  if (data[i].a == 0) { continue; }
                  for (let k in this.objects) {
                    if (data[i].r == this.objects[k].r && data[i].g == this.objects[k].g && data[i].b == this.objects[k].b) {
const Entities = Object.freeze({
  /* chars */
  Agent,
  AgentBlack,
  Greenie,
  Hearty,
  Player,
  Dudo,
  /* objs */
  Portal,
  UfoSign,
  RadiationSign,
  DeadHearty,
  BarrelFire,
  Barrel,
  FBIHQ,
  SpiderWeb,
  AmmoCrate,
  AmmoSniper,
  AmmoP90,
  Ammo,
  Shell,
  Heart,
  DeadHearty,
  Lamp1,
  BarrelFire,
  Tree,
  StreetLamp,
  PaperPoliceCar,
  PainKillers,
  PaperAgent,
});

                      const Entity = Entities[k];
                      if (!Entity) {
                        throw new Error(`Encountered unrecognized entity, ${k}.`);
                      }
                      const inst = new Entity(store, data[i].y, 0, data[i].x);
                      this.loaded.push(inst);
                      // TODO: Abstract stateful handling like this.
                      if (k == "Player") {
                        store.player = inst;
                      }
                    }
                  }
                }
              }
            );
        }
      );
  }
}


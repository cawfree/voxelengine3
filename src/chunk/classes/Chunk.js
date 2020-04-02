import * as THREE from "three";

import FreeFormChunk from "./FreeFormChunk";

export default class Chunk {
  constructor(store, x, y, z, cx, cy, cz, id, bs, type) {
    this.type = type;
    this.id = id;
    this.from_x = x;
    this.from_y = y;
    this.from_z = z;
    this.to_x = x+bs*cx;
    this.to_y = y+bs*cy;
    this.to_z = z+bs*cz;
    this.chunk_size_x = cx;
    this.chunk_size_y = cy;
    this.chunk_size_z = cz;
    this.blockSize = bs;
    this.owner = "";
    this.mesh = undefined;
    this.blocks = 0;
    this.wireframe = false;
    this.triangles = 0;
    this.total_blocks = 0;
    this.skips = 0;
    this.starting_blocks = 0;
    this.current_blocks = 0;
    this.blood_positions = [];
    this.health = 100;
    this.dirty = true;
    this.positions = 0;
    this.colors = 0;
    this.geometry = 0;
    this.v = 0;
    this.c = 0;
    this.prev_len = 0;
    this.offset = 0;
  
    this.material = store.chunk_material;
    this.blocks = [...Array(this.chunk_size_x)];
    for (let x = 0; x < this.chunk_size_x; x++) {
      this.blocks[x] = [...Array(this.chunk_size_y)];
      for (let y = 0; y < this.chunk_size_y; y++) {
        this.blocks[x][y] = [...Array(this.chunk_size_z)]
          .fill(0);
      }
    }
  }
  destroy(store) {
    store.scene.remove(this.mesh);
    this.blocks = null;
  }
  isSameColor(block1, block2) {
    return (((block1 >> 8) & 0xFFFFFF) == ((block2 >> 8) & 0xFFFFFF) && block1 != 0 && block2 != 0);
  }
  build(store) {
    let vertices = [];
    let colors = [];
    let cc = 0; // Color counter
    let r = 0;
    let g = 0;
    let b = 0;

    // Block structure
    // BLOCK: [R-color][G-color][B-color][0][00][back_left_right_above_front]
    //           8bit    8bit     8it   2bit(floodfill)     6bit(faces)

    // Reset faces
    for (let x = 0; x < this.chunk_size_x; x++) {
      for (let y = 0; y < this.chunk_size_y; y++) {
        for (let z = 0; z < this.chunk_size_z; z++) {
          this.blocks[x][y][z] &= 0xFFFFFFC0;
        }
      }
    }

    // this.shadow_blocks = [];
    this.total_blocks = 0;

    for (let x = 0; x < this.chunk_size_x; x++) {
      for (let y = 0; y < this.chunk_size_y; y++) {
        for (let z = 0; z < this.chunk_size_z; z++) {
          if (this.blocks[x][y][z] == 0) {
            continue; // Skip empty blocks
          }
          this.total_blocks++;
          // Check if hidden
          let left = 0, right = 0, above = 0, front = 0, back = 0, below = 0;
          if (z > 0) {
            if (this.blocks[x][y][z - 1] != 0) {
              back = 1;
              this.blocks[x][y][z] = this.blocks[x][y][z] | 0x10;
            }
          } else {
            if (this.type == "world") {
              // Check hit towards other chunks.
              if (store.world.checkExists(
                store,
                new THREE.Vector3(
                  (x + this.from_x * this.chunk_size_x) | 0,
                  (y + this.from_y * this.chunk_size_y) | 0,
                  ((z - 1) + this.from_z * this.chunk_size_z) | 0
                )).length != 0) {
                back = 1;
                this.blocks[x][y][z] = this.blocks[x][y][z] | 0x10;
              }
            }
          }
          if (x > 0) {
            if (this.blocks[x - 1][y][z] != 0) {
              left = 1;
              this.blocks[x][y][z] = this.blocks[x][y][z] | 0x8;
            }
          } else {
            if (this.type == "world") {
              // Check hit towards other chunks.
              if (store.world.checkExists(
                store,
                new THREE.Vector3(
                  ((x - 1) + this.from_x * this.chunk_size_x) | 0,
                  (y + this.from_y * this.chunk_size_y) | 0,
                  (z + this.from_z * this.chunk_size_z) | 0
                )).length != 0) {
                left = 1;
                this.blocks[x][y][z] = this.blocks[x][y][z] | 0x8;
              }
            }
          }
          if (x < this.chunk_size_x - 1) {
            if (this.blocks[x + 1][y][z] != 0) {
              right = 1;
              this.blocks[x][y][z] = this.blocks[x][y][z] | 0x4;
            }
          } else {
            if (this.type == "world") {
              if (store.world.checkExists(
                store,
                new THREE.Vector3(
                  (x + 1 + this.from_x * this.chunk_size_x) | 0,
                  (y + this.from_y * this.chunk_size_y) | 0,
                  (z + this.from_z * this.chunk_size_z) | 0
                )).length != 0) {
                right = 1;
                this.blocks[x][y][z] = this.blocks[x][y][z] | 0x4;
              }
            }
          }
          // Only check / draw bottom if we are a object!
          if (this.type != "world") {
            if (y > 0) {
              if (this.blocks[x][y - 1][z] != 0) {
                below = 1;
                this.blocks[x][y][z] = this.blocks[x][y][z] | 0x20; // bit 6 
              }
            }
          }

          if (y < this.chunk_size_y - 1) {
            if (this.blocks[x][y + 1][z] != 0) {
              above = 1;
              this.blocks[x][y][z] = this.blocks[x][y][z] | 0x2;
            }
          } else {
            if (this.type == "world") {
              // Check hit towards other chunks.
              if (store.world.checkExists(
                store,
                new THREE.Vector3(
                  (x + this.from_x * this.chunk_size_x) | 0,
                  ((y + 1) + this.from_y * this.chunk_size_y) | 0,
                  (z + this.from_z * this.chunk_size_z) | 0
                )).length != 0) {
                above = 1;
                this.blocks[x][y][z] = this.blocks[x][y][z] | 0x2;
              }
            }
          }
          if (z < this.chunk_size_z - 1) {
            if (this.blocks[x][y][z + 1] != 0) {
              front = 1;
              this.blocks[x][y][z] = this.blocks[x][y][z] | 0x1;
            }
          } else {
            if (this.type == "world") {
              // Check hit towards other chunks.
              if (store.world.checkExists(
                store,
                new THREE.Vector3(
                  (x + this.from_x * this.chunk_size_x) | 0,
                  (y + this.from_y * this.chunk_size_y) | 0,
                  ((z - 1) + this.from_z * this.chunk_size_z) | 0
                )).length != 0) {
                front = 1;
                this.blocks[x][y][z] = this.blocks[x][y][z] | 0x1;
              }
            }
          }

          if (this.type == "world") {
            if (front == 1 && left == 1 && right == 1 && above == 1 && back == 1) {
              continue; // block is hidden (world)
            }
          } else {
            if (front == 1 && left == 1 && right == 1 && above == 1 && back == 1 && below == 1) {
              continue; // block is hidden (object)
            }
          }

          // Draw blocks

          // Only draw below if we are an object
          if (this.type != "world") {
            if (!below) {
              // Get below (bit 6)
              if ((this.blocks[x][y][z] & 0x20) == 0) {
                let maxX = 0;
                let maxZ = 0;
                let end = 0;

                for (let x_ = x; x_ < this.chunk_size_x; x_++) {
                  // Check not drawn + same color
                  if ((this.blocks[x_][y][z] & 0x20) == 0 && this.isSameColor(this.blocks[x_][y][z], this.blocks[x][y][z])) {
                    maxX++;
                  } else {
                    break;
                  }
                  let tmpZ = 0;
                  for (let z_ = z; z_ < this.chunk_size_z; z_++) {
                    if ((this.blocks[x_][y][z_] & 0x20) == 0 && this.isSameColor(this.blocks[x_][y][z_], this.blocks[x][y][z])) {
                      tmpZ++;
                    } else {
                      break;
                    }
                  }
                  if (tmpZ < maxZ || maxZ == 0) {
                    maxZ = tmpZ;
                  }
                }
                for (let x_ = x; x_ < x + maxX; x_++) {
                  for (let z_ = z; z_ < z + maxZ; z_++) {
                    this.blocks[x_][y][z_] = this.blocks[x_][y][z_] | 0x20;
                  }
                }
                maxX--;
                maxZ--;

                vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize - this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);
                vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);
                vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);

                vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize - this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);
                vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
                vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);

                r = ((this.blocks[x][y][z] >> 24) & 0xFF) / 255;
                g = ((this.blocks[x][y][z] >> 16) & 0xFF) / 255;
                b = ((this.blocks[x][y][z] >> 8) & 0xFF) / 255;
                colors[cc++] = [r,g,b];
                colors[cc++] = [r,g,b];
                colors[cc++] = [r,g,b];
                colors[cc++] = [r,g,b];
                colors[cc++] = [r,g,b];
                colors[cc++] = [r,g,b];
              }
            }
          }

          if (!above) {
            // Get above (0010)
            if ((this.blocks[x][y][z] & 0x2) == 0) {
              let maxX = 0;
              let maxZ = 0;
              let end = 0;

              for (let x_ = x; x_ < this.chunk_size_x; x_++) {
                // Check not drawn + same color
                if ((this.blocks[x_][y][z] & 0x2) == 0 && this.isSameColor(this.blocks[x_][y][z], this.blocks[x][y][z])) {
                  maxX++;
                } else {
                  break;
                }
                let tmpZ = 0;
                for (let z_ = z; z_ < this.chunk_size_z; z_++) {
                  if ((this.blocks[x_][y][z_] & 0x2) == 0 && this.isSameColor(this.blocks[x_][y][z_], this.blocks[x][y][z])) {
                    tmpZ++;
                  } else {
                    break;
                  }
                }
                if (tmpZ < maxZ || maxZ == 0) {
                  maxZ = tmpZ;
                }
              }
              for (let x_ = x; x_ < x + maxX; x_++) {
                for (let z_ = z; z_ < z + maxZ; z_++) {
                  this.blocks[x_][y][z_] = this.blocks[x_][y][z_] | 0x2;
                }
              }
              maxX--;
              maxZ--;

              vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);
              vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize, z * this.blockSize - this.blockSize]);
              vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);

              vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);
              vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize, z * this.blockSize - this.blockSize]);
              vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize, z * this.blockSize - this.blockSize]);

              r = ((this.blocks[x][y][z] >> 24) & 0xFF) / 255;
              g = ((this.blocks[x][y][z] >> 16) & 0xFF) / 255;
              b = ((this.blocks[x][y][z] >> 8) & 0xFF) / 255;
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
            }
          }
          if (!back) {
            // back  10000
            // this.shadow_blocks.push([x, y, z]);
            if ((this.blocks[x][y][z] & 0x10) == 0) {
              let maxX = 0;
              let maxY = 0;

              for (let x_ = x; x_ < this.chunk_size_x; x_++) {
                // Check not drawn + same color
                if ((this.blocks[x_][y][z] & 0x10) == 0 && this.isSameColor(this.blocks[x_][y][z], this.blocks[x][y][z])) {
                  maxX++;
                } else {
                  break;
                }
                let tmpY = 0;
                for (let y_ = y; y_ < this.chunk_size_y; y_++) {
                  if ((this.blocks[x_][y_][z] & 0x10) == 0 && this.isSameColor(this.blocks[x_][y_][z], this.blocks[x][y][z])) {
                    tmpY++;
                  } else {
                    break;
                  }
                }
                if (tmpY < maxY || maxY == 0) {
                  maxY = tmpY;
                }
              }
              for (let x_ = x; x_ < x + maxX; x_++) {
                for (let y_ = y; y_ < y + maxY; y_++) {
                  this.blocks[x_][y_][z] = this.blocks[x_][y_][z] | 0x10;
                }
              }
              maxX--;
              maxY--;
              vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize + (this.blockSize * maxY), z * this.blockSize - this.blockSize]);
              vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
              vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);

              vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize + (this.blockSize * maxY), z * this.blockSize - this.blockSize]);
              vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
              vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize - this.blockSize]);

              r = ((this.blocks[x][y][z] >> 24) & 0xFF) / 255;
              g = ((this.blocks[x][y][z] >> 16) & 0xFF) / 255;
              b = ((this.blocks[x][y][z] >> 8) & 0xFF) / 255;
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
            }
          }
          if (!front) {
            // front 0001
            if ((this.blocks[x][y][z] & 0x1) == 0) {
              let maxX = 0;
              let maxY = 0;

              for (let x_ = x; x_ < this.chunk_size_x; x_++) {
                // Check not drawn + same color
                if ((this.blocks[x_][y][z] & 0x1) == 0 && this.isSameColor(this.blocks[x_][y][z], this.blocks[x][y][z])) {
                  maxX++;
                } else {
                  break;
                }
                let tmpY = 0;
                for (let y_ = y; y_ < this.chunk_size_y; y_++) {
                  if ((this.blocks[x_][y_][z] & 0x1) == 0 && this.isSameColor(this.blocks[x_][y_][z], this.blocks[x][y][z])) {
                    tmpY++;
                  } else {
                    break;
                  }
                }
                if (tmpY < maxY || maxY == 0) {
                  maxY = tmpY;
                }
              }
              for (let x_ = x; x_ < x + maxX; x_++) {
                for (let y_ = y; y_ < y + maxY; y_++) {
                  this.blocks[x_][y_][z] = this.blocks[x_][y_][z] | 0x1;
                }
              }
              maxX--;
              maxY--;

              vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize + (this.blockSize * maxY), z * this.blockSize]);
              vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize]);
              vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize - this.blockSize, z * this.blockSize]);

              vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize]);
              vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize]);
              vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize - this.blockSize, z * this.blockSize]);

              r = ((this.blocks[x][y][z] >> 24) & 0xFF) / 255;
              g = ((this.blocks[x][y][z] >> 16) & 0xFF) / 255;
              b = ((this.blocks[x][y][z] >> 8) & 0xFF) / 255;
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
            }
          }
          if (!left) {
            if ((this.blocks[x][y][z] & 0x8) == 0) {
              let maxZ = 0;
              let maxY = 0;

              for (let z_ = z; z_ < this.chunk_size_z; z_++) {
                // Check not drawn + same color
                if ((this.blocks[x][y][z_] & 0x8) == 0 && this.isSameColor(this.blocks[x][y][z_], this.blocks[x][y][z])) {
                  maxZ++;
                } else {
                  break;
                }
                let tmpY = 0;
                for (let y_ = y; y_ < this.chunk_size_y; y_++) {
                  if ((this.blocks[x][y_][z_] & 0x8) == 0 && this.isSameColor(this.blocks[x][y_][z_], this.blocks[x][y][z])) {
                    tmpY++;
                  } else {
                    break;
                  }
                }
                if (tmpY < maxY || maxY == 0) {
                  maxY = tmpY;
                }
              }
              for (let z_ = z; z_ < z + maxZ; z_++) {
                for (let y_ = y; y_ < y + maxY; y_++) {
                  this.blocks[x][y_][z_] = this.blocks[x][y_][z_] | 0x8;
                }
              }
              maxZ--;
              maxY--;

              vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
              vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);
              vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize + (this.blockSize * maxZ)]);

              vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
              vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize + (this.blockSize * maxZ)]);
              vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize - this.blockSize]);

              r = ((this.blocks[x][y][z] >> 24) & 0xFF) / 255;
              g = ((this.blocks[x][y][z] >> 16) & 0xFF) / 255;
              b = ((this.blocks[x][y][z] >> 8) & 0xFF) / 255;
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
            }
          }
          if (!right) {
            if ((this.blocks[x][y][z] & 0x4) == 0) {
              let maxZ = 0;
              let maxY = 0;

              for (let z_ = z; z_ < this.chunk_size_z; z_++) {
                // Check not drawn + same color
                if ((this.blocks[x][y][z_] & 0x4) == 0 && this.isSameColor(this.blocks[x][y][z_], this.blocks[x][y][z])) {
                  maxZ++;
                } else {
                  break;
                }
                let tmpY = 0;
                for (let y_ = y; y_ < this.chunk_size_y; y_++) {
                  if ((this.blocks[x][y_][z_] & 0x4) == 0 && this.isSameColor(this.blocks[x][y_][z_], this.blocks[x][y][z])) {
                    tmpY++;
                  } else {
                    break;
                  }
                }
                if (tmpY < maxY || maxY == 0) {
                  maxY = tmpY;
                }
              }
              for (let z_ = z; z_ < z + maxZ; z_++) {
                for (let y_ = y; y_ < y + maxY; y_++) {
                  this.blocks[x][y_][z_] = this.blocks[x][y_][z_] | 0x4;
                }
              }
              maxZ--;
              maxY--;

              vertices.push([x * this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
              vertices.push([x * this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize + (this.blockSize * maxZ)]);
              vertices.push([x * this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);

              vertices.push([x * this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize + (this.blockSize * maxZ)]);
              vertices.push([x * this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
              vertices.push([x * this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize - this.blockSize]);

              r = ((this.blocks[x][y][z] >> 24) & 0xFF) / 255;
              g = ((this.blocks[x][y][z] >> 16) & 0xFF) / 255;
              b = ((this.blocks[x][y][z] >> 8) & 0xFF) / 255;
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
              colors[cc++] = [r,g,b];
            }
          }
        }
      }
    }
    this.triangles = vertices.length / 3;

    if(this.mesh == undefined) {
      let starting_blocks = 0;
      for (let x = 0; x < this.chunk_size_x; x++) {
        for (let y = 0; y < this.chunk_size_y; y++) {
          for (let z = 0; z < this.chunk_size_z; z++) {
            if (this.blocks[x][y][z] != 0) {
              starting_blocks++;
              this.blocks[x][y][z] &= 0xFFFFFFE0;
            }
          }
        }
      }
      this.starting_blocks = starting_blocks;
      this.current_blocks = starting_blocks;
    }


    if(this.mesh != undefined && this.prev_len >= vertices.length) {
      for (let i = 0; i < vertices.length; i++) {
        this.v.setXYZ(i, vertices[i][0], vertices[i][1], vertices[i][2]);
        this.c.setXYZW(i, colors[i][0], colors[i][1], colors[i][2], 1);
      }

      this.geometry.setDrawRange(0, vertices.length); 
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.color.needsUpdate = true;
      this.geometry.computeVertexNormals();
      if(this.type != "world") {
        this.geometry.translate(this.offset.x, this.offset.y, this.offset.z);
      }
    } else {
      this.v = new THREE.BufferAttribute(new Float32Array(vertices.length * 3), 3);
      this.c = new THREE.BufferAttribute(new Float32Array(colors.length * 3), 3);
      for (let i = 0; i < vertices.length; i++) {
        this.v.setXYZ(i, vertices[i][0], vertices[i][1], vertices[i][2]);
        this.c.setXYZW(i, colors[i][0], colors[i][1], colors[i][2], 1);
      }
      this.geometry = new THREE.BufferGeometry();
      this.geometry.dynamic = true;
      this.geometry.addAttribute('position', this.v);
      this.geometry.addAttribute('color', this.c);
      this.geometry.attributes.position.dynamic = true;
      this.geometry.attributes.color.dynamic = true;
      this.geometry.computeBoundingBox();
      this.geometry.computeVertexNormals();
      this.prev_len = vertices.length;

      if(this.mesh == undefined) {
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(
          this.from_x,
          this.from_y,
          this.from_z
        );

        store.scene.add(this.mesh);

        if(this.type != "world") {
          this.offset = this.geometry.center();
          this.mesh.owner = this.owner;
          if(this.owner) {
            store.addToCD(this.mesh);
          }
        }
      } else {
        this.mesh.geometry = this.geometry;
        if(this.type != "world") {
          this.geometry.translate(this.offset.x, this.offset.y, this.offset.z);
        }
      }
    }
    this.dirty = false;
  }
  rmBlock(store, x, y, z, dir, dmg, local) {
    //this.batch_points[this.bp++] = { x: x, y: y, z: z};
    let wx = x;
    let wy = y;
    let wz = z;

    if(!local) {
      x = x - (this.from_x * this.blockSize + this.blockSize) | 0;
      y = y - (this.from_y * this.blockSize + this.blockSize) | 0;
      z = z - (this.from_z * this.blockSize + this.blockSize) | 0;
    } 
    let max = 0.5;
    if(this.total_blocks > 3000) {
      max = 0.98;
    } else if (this.total_blocks > 1000) {
      max = 0.85;
    } else if (this.total_blocks > 500) {
      max = 0.7;
    } else if(this.total_blocks < 200) {
      max = 0.2;
    }
    let mp_x = 0; 
    let mp_y = 0; 
    let mp_z = 0; 

    if (x >= 0 && y >= 0 && z >= 0) {
      let c = this.blocks[x][y][z];
      if (c != 0) {
        if (this.type == "world") {
          if (Math.random() > 0.4) {
            store.particles_box.world_debris(wx, wy, wz, this.blockSize, (c >> 24) & 0xFF, (c >> 16) & 0xFF, (c >> 8) & 0xFF);
          }
        } else {
          if (Math.random() > max) {
            mp_x = this.mesh.position.x - (this.blockSize*this.chunk_size_x * 0.5);
            mp_y = this.mesh.position.y - (this.blockSize*this.chunk_size_y * 0.5);
            mp_z = this.mesh.position.z - (this.blockSize*this.chunk_size_z * 0.5);
            let size = this.blockSize;
            if(Math.random() > 0.5) {
              size = 1;
            }
            store.particles_box.debris(
              mp_x + x * this.blockSize,
              mp_y + y * this.blockSize,
              mp_z + z * this.blockSize,
              size, (c >> 24) & 0xFF, (c >> 16) & 0xFF, (c >> 8) & 0xFF, false,
              dir.x, dir.y, dir.z
            );
          }
          if(this.owner.radioactive_leak) {
            if(Math.random() > 0.8) {
              let mp_x = this.mesh.position.x - (this.blockSize*this.chunk_size_x * 0.5);
              let mp_y = this.mesh.position.y - (this.blockSize*this.chunk_size_y * 0.5);
              let mp_z = this.mesh.position.z - (this.blockSize*this.chunk_size_z * 0.5);
              store.particles.radioactive_leak(
                mp_x + x * this.blockSize,
                mp_y + y * this.blockSize,
                mp_z + z * this.blockSize,
                0.5
              );
            }
          }
          if (this.owner.radioactive) {
            if(Math.random() > max) {
              let mp_x = this.mesh.position.x - (this.blockSize*this.chunk_size_x * 0.5);
              let mp_y = this.mesh.position.y - (this.blockSize*this.chunk_size_y * 0.5);
              let mp_z = this.mesh.position.z - (this.blockSize*this.chunk_size_z * 0.5);
              store.particles.radioactive_splat(
                mp_x + x * this.blockSize,
                mp_y + y * this.blockSize,
                mp_z + z * this.blockSize,
                0.2,
                dir.x,
                dir.y,
                dir.z
              );
            }
          }
          if (this.owner.base_type == "enemy" || this.owner.base_type == "player") {
            let size = this.blockSize;
            if(Math.random() > 0.5) {
              size = 1;
            }
            if(Math.random() > max) {
              let mp_x = this.mesh.position.x - (this.blockSize*this.chunk_size_x * 0.5);
              let mp_y = this.mesh.position.y - (this.blockSize*this.chunk_size_y * 0.5);
              let mp_z = this.mesh.position.z - (this.blockSize*this.chunk_size_z * 0.5);
              //for (let t = 0; t < 2; t++) {
              store.particles.blood(
                mp_x + x * this.blockSize,
                mp_y + y * this.blockSize,
                mp_z + z * this.blockSize,
                size,
                dir.x,
                dir.y,
                dir.z
              );
              //}
            }
          }
        }
        this.dirty = true;
        this.blocks[x][y][z] = 0;
      }
      this.current_blocks--;
    }
  }
  addBlock(store, x, y, z, r, g, b) {
    x -= this.from_x * this.blockSize;
    y -= this.from_y * this.blockSize;
    z -= this.from_z * this.blockSize;
    x |= 0;
    y |= 0;
    z |= 0;
    const shouldAdd = !(
      x < 0 || y < 0 || z < 0 || x >= this.chunk_size_x || y >= this.chunk_size_y || z >= this.chunk_size_z
    );
    if (shouldAdd) {
      this.blocks[x][y][z] = (r & 0xFF) << 24 | (g & 0xFF) << 16 | (b & 0xFF) << 8 | 0 & 0xFF;
      this.dirty = true;
    }
    return shouldAdd;
  }
  blockExists(x, y, z) {
    x -= this.from_x * this.blockSize;
    y -= this.from_y * this.blockSize;
    z -= this.from_z * this.blockSize;
    x |= 0;
    y |= 0;
    z |= 0;
    if (x < 0 || y < 0 || z < 0 ||
      x >= this.chunk_size_x || y >= this.chunk_size_y || z >= this.chunk_size_z) {
      return false;
    }
    return !!this.blocks[x][y][z];
  }
  hit(store, dir, power, pos) {
    if (this.blocks == null) {
      return;
    }
    let x = 0;
    let y = 0;
    let z = 0;
    let vx = 0, vy = 0, vz = 0, val = 0, offset = 5;
    let ff = [];
    power =  power * (1/this.blockSize);
    let pow = power * power;

    let max = 0.5;
    if(this.total_blocks > 3000) {
      max = 0.98;
    } else if (this.total_blocks > 1000) {
      max = 0.85;
    } else if (this.total_blocks > 500) {
      max = 0.7;
    } else if(this.total_blocks < 200) {
      max = 0.5;
    }


    if (pos == null || this.type == "ff_object") {
      x = Math.random() * this.chunk_size_x | 0;
      z = Math.random() * this.chunk_size_z | 0;
      y = Math.random() * this.chunk_size_y | 0;
    } else {
      let p = this.mesh.position.y - (this.chunk_size_y*this.blockSize) * 0.5;
      let h = pos.y - p;
      y = h*(1/this.blockSize) |0;

      p = this.mesh.position.x - (this.chunk_size_x * this.blockSize * 0.5);
      h = pos.x - p;
      x = h*(1/this.blockSize) |0;

      p = this.mesh.position.z - (this.chunk_size_z * this.blockSize * 0.5);
      h = pos.z - p;
      z = h*(1/this.blockSize) | 0;
    }

    x = x > 0? x: 0;
    y = y > 0? y: 0;
    z = z > 0? z: 0;

    if(this.type == "enemy") {
      offset = 20;
    }
    
    let isHit = 0;
    let from_x = (x - power) < 0? 0: x-power;
    let from_z = (z - power) < 0? 0: z-power;
    let from_y = (y - power) < 0? 0: y-power;
    for (let rx = from_x; rx <= x + power; rx++) {
      vx = Math.pow((rx - x), 2); //*(rx-x);
      for (let rz = from_z; rz <= z + power; rz++) {
        vz = Math.pow((rz - z), 2) + vx; //*(rz-z);
        for (let ry = from_y; ry <= y + power; ry++) {
          val = Math.pow((ry - y), 2) + vz;
          rx |= 0;
          ry |= 0;
          rz |= 0;
          if (val < pow) {
            if (rx >= 0 && ry >= 0 && rz >= 0 && rx < this.chunk_size_x && ry < this.chunk_size_y && rz < this.chunk_size_z) {
              if ((this.blocks[rx][ry][rz] >> 8) != 0) {
                if (this.owner.base_type == "enemy" || this.owner.base_type == "player") {
                  if(Math.random() > max) {
                    store.particles.blood(
                      this.mesh.position.x - (this.blockSize * this.chunk_size_x) * 0.5 +rx*this.blockSize,
                      this.mesh.position.y - (this.blockSize * this.chunk_size_y) * 0.5 +ry*this.blockSize,
                      this.mesh.position.z - (this.blockSize * this.chunk_size_z) * 0.5  +rz*this.blockSize, 
                      0.5,
                      dir.x,
                      dir.y,
                      dir.z
                    );
                  }
                }
                this.rmBlock(store, rx, ry, rz, dir, power, true);
                isHit = true;
              }
            }
          } else if (val >= pow) {
            if (rx >= 0 && ry >= 0 && rz >= 0 && rx < this.chunk_size_x && ry < this.chunk_size_y && rz < this.chunk_size_z) {
              if ((this.blocks[rx][ry][rz] >> 8) != 0) {
                ff.push(new THREE.Vector3(rx, ry, rz));
                if (this.owner.base_type == "enemy" || this.owner.base_type == "player") {
                  if(Math.random() > 0.5) {
                    this.blocks[rx][ry][rz] = (0xAA & 0xFF) << 24 | (0x08 & 0xFF) << 16 | (0x08 & 0xFF) << 8;
                    this.blood_positions.push(new THREE.Vector3(rx, ry, rz));
                  }
                }
              }
            }
          }
        }
      }
    }

    if(isHit) {
      this.health = (this.current_blocks / this.starting_blocks) * 100;
      let max_hp = 60;
      if(this.owner.base_type == "enemy" || this.owner.base_type == "player") {
        max_hp = 90;
      }
      if (((this.owner.base_type == "enemy" || this.owner.base_type == "player") && this.health < max_hp) ||
        ((this.owner.base_type == "object" || this.owner.base_type == "ff_object") && ff.length > 0))
      {
        for (let x = 0; x < this.chunk_size_x; x++) {
          for (let y = 0; y < this.chunk_size_y; y++) {
            for (let z = 0; z < this.chunk_size_z; z++) {
              this.blocks[x][y][z] &= 0xFFFFFF00;
            }
          }
        }

        for (let i = 0; i < ff.length; i++) {
          this.floodFill(store, ff[i], dir, power);
        }

        this.health = (this.current_blocks / this.starting_blocks) * 100;
        this.dirty = true;
        if(this.health < 20) {
          store.removeFromCD(this.mesh);
        }
      }
      return true;
    }
    return false;
  }
  floodFill(store, start, dir, power) {
    let stack = [];
    let result = [];

    let max_x = 0;
    let max_y = 0;
    let max_z = 0;

    if((this.blocks[start.x][start.y][start.z] & 0x40) != 0 ||
      (this.blocks[start.x][start.y][start.z] & 0x80) != 0) 
    {
      return;
    }

    stack.push(start);
    while (stack.length != 0) {
      let b = stack.pop();
      if (b.x < 0 || b.y < 0 || b.z < 0 || b.x > this.chunk_size_x || b.y > this.chunk_size_y || b.z > this.chunk_size_z) {
        continue;
      }
      if ((this.blocks[b.x][b.y][b.z] >> 8) == 0) {
        continue;
      }
      if ((this.blocks[b.x][b.y][b.z] & 0x80) != 0) {
        continue;
      }
      if ((this.blocks[b.x][b.y][b.z] & 0x40) != 0) {
        continue;
      }


      if (b.x > max_x) { max_x = b.x; }
      if (b.y > max_y) { max_y = b.y; }
      if (b.z > max_z) { max_z = b.z; }
      result.push([b, this.blocks[b.x][b.y][b.z]]);

      // this.blocks[b.x][b.y][b.z] = (200 & 0xFF) << 24 | (0 & 0xFF) << 16 | (200 & 0xFF) << 8;
      this.blocks[b.x][b.y][b.z] |= 0x80;

      if(b.y < 3) {
        for(let i = 0; i < result.length; i++) {
          this.blocks[b.x][b.y][b.z] |= 0x40;
          this.blocks[b.x][b.y][b.z] |= 0x80;
        }
        return;
      }

      stack.push(new THREE.Vector3(b.x, b.y + 1, b.z));
      stack.push(new THREE.Vector3(b.x, b.y, b.z + 1));
      stack.push(new THREE.Vector3(b.x + 1, b.y, b.z));
      stack.push(new THREE.Vector3(b.x, b.y, b.z - 1));
      stack.push(new THREE.Vector3(b.x - 1, b.y, b.z));
      stack.push(new THREE.Vector3(b.x, b.y - 1, b.z));
    }

    if(result.length < 5) {
      return; 
    } else if (result.length != this.current_blocks) {
      let chunk = new Chunk(store, 0, 0, 0, max_x, max_y, max_z, "ff_object", this.blockSize, false);
      for (let i = 0; i < result.length; i++) {
        let p = result[i][0];
        chunk.addBlock(store, p.x, p.y, p.z, (result[i][1] >> 24) & 0xFF, (result[i][1] >> 16) & 0xFF, (result[i][1] >> 8) & 0xFF);
        this.blocks[p.x][p.y][p.z] = 0;
        this.current_blocks--;
      }
      this.dirty = true;

      let ffc = new FreeFormChunk(store, chunk, this.owner.base_type);

      store.particles.chunkDebris(
        this.mesh.position.x,
        store.maps.ground+max_y*this.blockSize,
        this.mesh.position.z,
        ffc.chunk,
        dir.x,
        dir.y,
        dir.z,
        power
      );
    }
  }
  explode(store, dir, damage = 0) {
    for (let x = 0; x < this.chunk_size_x; x++) {
      for (let y = 0; y < this.chunk_size_y; y++) {
        for (let z = 0; z < this.chunk_size_z; z++) {
          if ((this.blocks[x][y][z] >> 8) != 0) {
            this.rmBlock(store, x, y, z, dir, damage);
          }
        }
      }
    }
    this.mesh.visible = false;
  }
  virtual_explode(store, pos) {
    for (let x = 0; x < this.chunk_size_x; x++) {
      for (let y = 0; y < this.chunk_size_y; y++) {
        for (let z = 0; z < this.chunk_size_z; z++) {
          let c = this.blocks[x][y][z];
          if (c != 0 && Math.random() > 0.9) {
            store.particles.debris(
              pos.x + x * this.blockSize * 0.5,
              pos.y + y * this.blockSize * 0.5,
              pos.z + z * this.blockSize * 0.5,
              this.blockSize,
              (c >> 24) & 0xFF, (c >> 16) & 0xFF, (c >> 8) & 0xFF,
              true
            );
          }
        }
      }
    }
  }
  blockExists_w(pos) {
    let l = (this.blockSize*this.chunk_size_x * 0.5)*(1/this.blockSize);
    let x = this.chunk_size_x - (pos.x - (this.mesh.position.x - l)) | 0; 
    let y = this.chunk_size_y - (pos.y - (this.mesh.position.y - l)) | 0; 
    let z = this.chunk_size_z - (pos.z - (this.mesh.position.z - l)) | 0; 
    const a = (x >= 0 && y >= 0 && z >= 0 && x < this.chunk_size_x && y < this.chunk_size_y && z < this.chunk_size_z);
    const b = ((this.blocks[x][y][z] >> 8) != 0);
    return a && b;
  }
  checkExists(store, x, y, z) {
    x -= this.from_x * this.blockSize + this.blockSize;
    y -= this.from_y * this.blockSize + this.blockSize;
    z -= this.from_z * this.blockSize + this.blockSize;
    x |= 0;
    y |= 0;
    z |= 0;
    if (!(x < 0 || y < 0 || z < 0)) {
      if (this.blocks[x][y][z] != 0) {
        return this.blocks[x][y][z];
      }
    }
    return -1;
  }
  checkCD(vec, range) {
    if(vec.x <= this.mesh.position.x + range &&
      vec.x >= this.mesh.position.x - range)
    {
      if(vec.z <= this.mesh.position.z + range &&
        vec.z >= this.mesh.position.z - range)
      {
        return true;
      }
    }
    return false;
  }
}

export default class FreeFormChunk {
  constructor(store, chunk, baseType) {
    this.base_type = "";
    this.type = "ff_chunk";
    this.chunk = chunk;
    this.base_type = baseType;
    this.chunk.owner = this;
    this.chunk.build(store);
    store.maps.loaded.push(this);
    store.addToCD(this.chunk.mesh);
  }
  hit(store, dmg, dir, type, pos) {
    dir.x += (1-Math.random()*2);
    dir.y += (1-Math.random()*2);
    dir.z += (1-Math.random()*2);
    this.chunk.explode(store, dir, dmg);
    this.alive = false;
    store.removeFromCD(this.chunk.mesh);
  }
}

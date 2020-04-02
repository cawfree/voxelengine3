import klona from "klona";

import { Chunk } from "../chunk";

export const getModel = (store, name, size = 1, obj) => { 
  const new_obj = cloneChunk(store, store.models[name]);
  new_obj.owner = obj;
  new_obj.blockSize = size;
  new_obj.mesh = undefined;
  new_obj.build(store);
  new_obj.mesh.visible = true;
  store.scene.add(new_obj.mesh);
  return new_obj;
}

export const cloneChunk = (store, chunk) => {
  const c = new Chunk(
    store,
    chunk.from_x,
    chunk.from_y,
    chunk.from_z,
    chunk.chunk_size_x,
    chunk.chunk_size_y,
    chunk.chunk_size_z,
    chunk.id,
    chunk.blockSize,
    chunk.type,
  );
  c.blocks = klona(chunk.blocks);
  return c;
};

export const getMesh = (store, name, size = 1, obj) => { 
  const new_obj = {};
  new_obj.owner = obj;
  new_obj.mesh = store.models[name].mesh.clone();
  new_obj.mesh.owner = obj;
  new_obj.mesh.visible = true;
  new_obj.mesh.scale.set(size, size, size);
  store.scene.add(new_obj.mesh);
  store.addToCD(new_obj.mesh);
  return new_obj;
};

import Item from "./Item";

export default class Heart extends Item {
  constructor(store, x, y, z) {
    super(store, "heart", x, y, z, 0.02);
  }
  grab(store, mesh_id) {
    for(let i = 0; i < this.active.length; i++) {
      if(this.active[i].id == mesh_id) {
        store.sounds.PlaySound(store, "take_heart", this.active[i].position, 250);
        store.removeFromCD(this.active[i]);
        this.active[i].alive = false;
      }
    }
  }
  update(store, time, delta) {
    super.update(store, time, delta);
    for(let i = 0; i < this.active.length; i++) {
      if (this.active[i].alive) {
        this.active[i].rotation.y += Math.sin(delta);
        this.active[i].position.y = store.maps.ground+6 + Math.sin(time * 2.5);
        if(Math.random() > 0.5) {
          store.particles.blueMagic(
            this.active[i].position.x,
            this.active[i].position.y,
            this.active[i].position.z
          );
        }
      } else {
        if (this.active[i].position.y < store.maps.ground+20) {
          //this.active[i].rotation.y += time*10;
          this.active[i].position.y += 0.3;
        } else {
          this.active[i].rotation.y = 0;
          this.chunk.virtual_explode(store, this.active[i].position);
          store.scene.remove(this.active[i]);
          this.active.splice(i, 1);
        }
      }
    }
  }
  add(store, x,y,z) {
    let m = this.chunk.mesh.clone();
    store.scene.add(m);
    m.position.set(x,y,z);
    m.visible = true;
    this.active.push(m);
    m.alive = true;
    m.owner = this;
    let l1 = this.red_light.clone();
    let l2 = this.red_light.clone();
    m.add(l1);
    m.add(l2);
    l1.position.y = 2;
    l1.position.z = -2;
    l2.position.y = 2;
    l2.position.z = 2;
    store.addToCD(m);
  }
}

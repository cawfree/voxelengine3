import Character from "./Character";

export default class Enemy extends Character {
  constructor(store, model, x, y, z, size = 1) {
    super(store, model, x, y, z, size);
    this.base_type = "enemy"; // global property defs
    this.view_range = 50;
    this.view_range_current = 50;
    this.run_speed = 20;
    this.walk_speed = 10;
    this.view = 0;
    this.target = 0;
    this.flee = false; // run!
    this.range_from_player = 30;
    this.follow_timer = 0;
    this.shoot_ability = 0.5;
    this.run_speed = 20 + Math.random() * 20;
    this.moving = true;
  }
  die(store) {
    this.chunk.mesh.position.y = store.maps.ground + 1;
  }
  hit(store, damage, dir, type, pos) {
    let die = super.hit(store, damage, dir, type, pos);
    if (die & this.moving) {
      this.moving = false;
      // TODO: Could drop something.
      this.die(store);
    } else {
      if (this.chunk.health > 95) {
        if (this.weapon != 0) {
          this.target = store.player;
        }
      } else if(Math.random() > 0.5) {
        this.target = 0;
        this.flee = true;
        this.moving = true;
      } else {
        this.range_from_player = 10;
      }
    }
    return die;
  }
  update(store, time, delta) {
    super.update(store, time, delta);
    if (!this.alive) { return; }
    this.speed = this.walk_speed;
    if (this.flee) {
      this.speed = this.run_speed;
      this.dropWeapon(store);
    }
    if (this.chunk.mesh.position.distanceTo(store.player.chunk.mesh.position) > store.visible_distance) {
      return;
    }
    if (this.target != 0) {
      if (this.follow_timer > 0) {
        this.follow_timer -= delta;
        if (this.follow_timer <= 0) {
          this.target = 0;
          this.follow_timer = 0;
        }
      }
      if (this.target.alive || this.target.base_type == "weapon") {
        let p = this.target.chunk.mesh.position.clone();
        p.y = this.chunk.mesh.position.y;
        this.chunk.mesh.lookAt(p);
        let dist = this.chunk.mesh.position.distanceTo(store.player.chunk.mesh.position);
        if (dist > this.range_from_player && this.weapon != 0) {
          if (dist > store.visible_distance * 0.5) {
            this.target = 0;
          } else {
            this.moving = true;
          }
        } else {
          if (this.target.base_type == "player") {
            this.moving = false;
            this.shoot(store);
          }
        }
      } else {
        this.target = 0;
        this.moving = true;
        this.unloadWeapon();
      }
    } else {
      this.unloadWeapon();
    }

    if (this.moving) {
      if (this.cd_check > 0.1) { // 10 fps
        this.cd_check = 0;
        for(let idx = 0; idx < store.cdList.length; idx++) {
          const current = store.cdList[idx];
          const { position, id, owner } = current;
          if(this.chunk.checkCD(position, this.view_range_current)) {
            if (this.chunk.mesh.id != id) {
              // TODO: What about collisions with another enemy?
              if (owner.obj_type != this.obj_type && (owner.base_type == "player")) {
                if (this.target == 0 && this.weapon != 0) {
                  if (owner.alive) {
                    this.target = owner;
                    this.follow_timer = Math.random()*10;
                    this.loadWeapon();
                  }
                }
                if (this.target != 0 && this.target.base_type == "player") {
                  this.loadWeapon();
                  this.shoot(store);
                }
              } else if (owner.base_type == "weapon") {
                if ((this.weapon == 0 || this.weapon.damage < owner.damage) && !this.flee) {
                  this.target = owner;
                }
              }
            }
          } 
          if (this.chunk.checkCD(position, 5)) {
            if (owner.base_type == "weapon") {
              if (this.weapon == 0) {
                this.addWeapon(store, owner);
                this.loadWeapon();
                this.target = 0;
              } else if(this.weapon.damage < owner.damage) {
                this.dropWeapon(store);
                this.addWeapon(store, owner);
                this.target = 0;
                this.loadWeapon();
              }
            }
          }
        }
      }

      this.cd_check += delta;
      this.chunk.mesh.rotation.y -= (1-Math.random()*2)*Math.sin(delta*3); 
      let pos = this.chunk.mesh.position.clone();
      pos.y = store.maps.ground;

      const res = store.world.checkExists(store, pos);

      if (res.length != 0) {
        this.chunk.mesh.translateZ(delta * this.speed);
        if (!this.cd(store)) {
          this.chunk.mesh.translateZ(-delta * this.speed);
          this.chunk.mesh.rotation.y -= Math.sin(time / this.speed);
          this.target = 0;
        }
      } else {
        this.chunk.mesh.translateZ(-delta * this.speed - 1);
        this.chunk.mesh.rotation.y -= Math.sin(time / this.speed);
        this.chunk.mesh.rotation.y -= Math.PI;
        this.target = 0;
      }
      this.chunk.mesh.rotation.z = 0.2 * Math.sin(time * this.speed);

      this.shouldBleedOrGlow(store, res);

      if (Math.random() < 0.4) {
        store.particles.walkSmoke(this.chunk.mesh.position.x, store.maps.ground + 1, this.chunk.mesh.position.z);
      }
    }
  }
  shoot(store) {
    if (Math.random() < this.shoot_ability) {
      super.shoot(store);
    }
  }
}

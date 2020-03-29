const x = require('../assets/vox/agent.vox');

console.log('got here');
console.log(x);


//////////////////////////////////////////////////////////////////////
// Char base class
//////////////////////////////////////////////////////////////////////
function Char() {
    this.hp = 0;
    this.chunk = 0;
    this.init_pos = new THREE.Vector3(0, 0, 0);
    this.weapon = 0;
    this.obj_type = "char";
    this.loaded = false;
    this.alive = true;
    this.y_offset = 0;
    this.cd_check = 0;
    this.moving = false;
    this.flee = false;
    this.add_blood = 0;
    this.add_radioactive = 0;
    this.speed = 0;
    this.bleed_timer = 0;
    this.can_shoot = false;
    this.cd_list = [];
    this.dying = false;
    this.radiation_poisoned = 0;
    this.dying_counter = 0;
    this.green_light = new THREE.PointLight(0x00FF00, 2, 10);
    this.radiation_light = 0;

    Char.prototype.sound_hit = function() {
        var r = get_rand();
        if(r < 0.4) {
            r = "blood1";
        } else if (r > 0.4 && r < 0.7) {
            r = "blood2";
        } else {
            r = "blood3";
        }
        game.sounds.PlaySound(r, this.chunk.mesh.position, 300);
        if(this.alive) {
            if(get_rand() > 0.8) {
                game.sounds.PlaySound("hit"+(1+Math.random()*2|0), 
                                      this.chunk.mesh.position,
                                      500);
            }
        }
    };

    Char.prototype.create = function (model, x, y, z, size) {
        if(!size) { size = 1; }
        // Load model.
        this.chunk = game.modelLoader.getModel(model, size, this);

        // Set initial position
        this.init_pos.x = x;
        this.init_pos.y = y;
        this.init_pos.z = z;
        this.chunk.mesh.position.set(x, y, z);
    };

    Char.prototype.addWeapon = function (weapon) {
        if (this.weapon == 0 && !this.flee) {
            if (weapon.attach(this.chunk.mesh)) {
                this.weapon = weapon;
                this.loadWeapon();
            }
        }
    };

    Char.prototype.dropWeapon = function () {
        if (this.weapon != 0) {
            this.unloadWeapon();
            this.weapon.detach(this.chunk.mesh, this.chunk.mesh.position);
            // Wait a while to not pick up same weapon again.
            var that = this;
            //setTimeout(function() {
            that.weapon = 0;
            //}, 500);
        }
    };

    Char.prototype.unloadWeapon = function () {
        var that = this;
        this.can_shoot = false;
        setTimeout(function () {
            that.loaded = false;
        }, 200);
    };

    Char.prototype.loadWeapon = function () {
        var that = this;
        this.can_shoot = true;
        setTimeout(function () {
            that.loaded = true;
        }, 200);
    };

    Char.prototype.shoot = function () {
        if (this.weapon != 0 && this.loaded && this.can_shoot) {
            //var light1 = new THREE.PointLight( 0xFFAA00, 3, 10 );
            //light1.position.set(
            //    this.weapon.position.x,
            //    this.weapon.position.y,
            //    this.weapon.position.z
            //);
            //game.scene.add( light1 );
            //setTimeout(function() { game.scene.remove(light1);}, 100);
            this.weapon.shoot(this.chunk.mesh.quaternion, this.chunk.mesh.id, this.chunk.mesh, this.speed / 30);
        }
    };

    Char.prototype.update = function (time, delta) {
        // open wound.
        if(this.dying != 0) {
            this.dying_counter++;
            var max = 5;
            var step = 0.05;
            if(this.dying == 1) {
                if(this.chunk.mesh.rotation.z < Math.PI/2) {
                    this.chunk.mesh.rotation.z += step;
                } else if(this.chunk.mesh.rotation.z > Math.PI/2) {
                    this.chunk.mesh.rotation.z -= step;
                }
                if(this.dying_counter == max) {
                    this.alive = false;
                    this.chunk.mesh.rotation.z = Math.PI/2;
                    this.chunk.mesh.position.y = game.maps.ground;
                }
            } else if(this.dying == 2) {
                if(this.chunk.mesh.rotation.z < -Math.PI/2) {
                    this.chunk.mesh.rotation.z += step;
                } else if(this.chunk.mesh.rotation.z > -Math.PI/2) {
                    this.chunk.mesh.rotation.z -= step;
                }
                if(this.dying_counter == max) {
                    this.alive = false;
                    this.chunk.mesh.rotation.z = -Math.PI/2;
                    this.chunk.mesh.position.y = game.maps.ground;
                }
            } else if(this.dying == 3) {
                if(this.chunk.mesh.rotation.x < -Math.PI/2) {
                    this.chunk.mesh.rotation.x += step;
                } else if(this.chunk.mesh.rotation.x > -Math.PI/2) {
                    this.chunk.mesh.rotation.x -= step;
                }
                if(this.dying_counter == max) {
                    this.alive = false;
                    this.chunk.mesh.rotation.x = -Math.PI/2;
                    this.chunk.mesh.position.y = game.maps.ground;
                }
            } else if(this.dying == 4) {
                if(this.chunk.mesh.rotation.x < Math.PI/2) {
                    this.chunk.mesh.rotation.x += step;
                } else if(this.chunk.mesh.rotation.x > Math.PI/2) {
                    this.chunk.mesh.rotation.x -= step;
                }
                if(this.dying_counter == max) {
                    this.alive = false;
                    this.chunk.mesh.rotation.x = Math.PI/2;
                    this.chunk.mesh.position.y = game.maps.ground;
                }
            }
        }

        if (this.alive) {
            if (this.chunk.blood_positions.length > 0) {
                this.bleed_timer -= delta;
            }

            if (this.bleed_timer < 0) {
                this.hit(4, new THREE.Vector3(0, -3, 0), null);
                this.bleed_timer = 10;
                return;
            }

            if(this.bleed_timer < 10 && this.bleed_timer != 0) {
                if(this.base_type == "player") {
                    if(!game.sounds.isPlaying("heartbeat")){
                        game.sounds.PlaySound("heartbeat", this.chunk.mesh.position, 500);
                    }
                }
                for (var i = 0; i < this.chunk.blood_positions.length; i++) {
                    if (get_rand() > 0.99) {
                        game.particles.blood(
                            this.chunk.blockSize*this.chunk.blood_positions[i].x + this.chunk.mesh.position.x,
                            this.chunk.blockSize*this.chunk.blood_positions[i].y + this.chunk.mesh.position.y,
                            this.chunk.blockSize*this.chunk.blood_positions[i].z + this.chunk.mesh.position.z,
                            0.5, 0, 0, 0
                        );
                    }
                }
            }
            if (this.add_blood > 0 && this.moving) {
                this.add_blood--;
                // Add blood footsteps
                game.world.addColorBlock(
                    this.chunk.mesh.position.x + (2 - get_rand() * 4),
                    game.maps.ground-1,
                    this.chunk.mesh.position.z + (2 - get_rand() * 4),
                    138 + get_rand() * 20,
                    8 + get_rand() * 10,
                    8 + get_rand() * 10
                );
            }
            if (this.add_radioactive > 0 && this.moving) {
                this.add_radioactive--;
                // Add radioactive footsteps
                game.world.addColorBlock(
                                    this.chunk.mesh.position.x + (2 - get_rand() * 4),
                                    game.maps.ground-1,
                                    this.chunk.mesh.position.z + (2 - get_rand() * 4),
                                    get_rand() * 50 | 0,
                                    200 + get_rand() * 55 | 0,
                                    50 + get_rand() * 55 | 0
                );
            }
            if(this.radiation_poisoned > 0 && get_rand() > 0.9) {
                for(var q = 0; q < this.radiation_poisoned; q++) {
                    game.particles.radiation(
                             this.chunk.mesh.position.x + (2 - get_rand() * 4),
                             this.chunk.to_y + 1,
                             this.chunk.mesh.position.z + (2 - get_rand() * 4)
                    );
                    if(this.radiation_poisoned > 5) {
                        this.chunk.hit(new THREE.Vector3(0,0,0), 1, null);
                    }
                }
            }
            if (!this.moving) {
                this.speed = 0;
            }
        }
    };

    // 4 directions based on chunk-size.
    // Move mesh -> check if any of directions are in a position.
    // If OK -> move mesh, otherwise move back mesh same amount.
    Char.prototype.cd = function() {
        var pos = this.chunk.mesh.position;
        var points = [];
        points[0] = new THREE.Vector3(
            pos.x+this.chunk.chunk_size_x/2,
            pos.y,
            pos.z
        );
        points[1] = new THREE.Vector3(
            pos.x,
            pos.y,
            pos.z+this.chunk.chunk_size_z/2
        );
        points[2] = new THREE.Vector3(
            pos.x,
            pos.y,
            pos.z-this.chunk.chunk_size_z/2
        );
        points[3] = new THREE.Vector3(
            pos.x-this.chunk.chunk_size_x/2,
            pos.y,
            pos.z
        );

        var res = true;
        for(var i = 0; i < points.length; i++) {
            if(game.world.checkExists(points[i]).length > 0) {
                res = false;
            }
        }
        for(var idx = 0; idx < game.cdList.length; idx++) {
            if(this.chunk.mesh.id != game.cdList[idx].id && game.cdList[idx].owner.alive && game.cdList[idx].owner.base_type != "weapon" && game.cdList[idx].owner.obj_type != "painkillers") {
                if(this.chunk.checkCD(game.cdList[idx].position, 6)) {
                    res = false;
                }
            }
        }
        return res;
    };

    Char.prototype.hit = function (damage, direction, type, pos) {
        this.bleed_timer = this.chunk.health / 100 * 10;

        var die = false;
        
        this.sound_hit();

        this.chunk.hit(direction, damage, pos);
        die = this.chunk.health < 90? true: false;
        if (die && this.alive) {
            this.dropWeapon();
           // this.alive = false; 
            if(this.base_type == "player") {
                this.chunk.mesh.remove(game.camera);
                var pos = this.chunk.mesh.position.clone();
                pos.y = game.maps.ground;
                game.scene.add(game.camera);
                game.camera.position.z = pos.z;
                game.camera.position.x = pos.x;
                game.camera.position.y = 150; //120; 150
                game.camera.rotation.x = -Math.PI/2;
                setTimeout(function() {
                    game.reset();
                }, 3000);
            }
            this.dying = 0;
            var r = get_rand();
            if(r > 0.8) {
                //this.chunk.mesh.rotation.z = Math.PI/2;
                this.dying = 1;
            } else if(r > 0.5) {
               // this.chunk.mesh.rotation.z = -Math.PI/2;
                this.dying = 2;
            } else if(r > 0.3) {
              //  this.chunk.mesh.rotation.x = -Math.PI/2;
                this.dying = 3;
            } else {
                //this.chunk.mesh.rotation.x = Math.PI/2;
                this.dying = 4;
            }
        }
        return die;
    };
}

//////////////////////////////////////////////////////////////////////
// Enemy base class
//
//////////////////////////////////////////////////////////////////////
function Enemy() {
    Char.call(this);
    this.base_type = "enemy";
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

    Enemy.prototype.die = function () {
        this.chunk.mesh.position.y = game.maps.ground+1;
    };

    Enemy.prototype.hit = function (damage, dir, type, pos) {
        var die = Char.prototype.hit.call(this, damage, dir, type, pos);
        if (die == true & this.moving) {
            //   game.removeFromCD(this.view);
            this.moving = false;
            //game.objects["heart"].add(this.chunk.mesh.position.x, this.chunk.mesh.position.y, this.chunk.mesh.position.z);
            this.die();
        } else {
            if (this.chunk.health > 95) {
                if (this.weapon != 0) {
                    this.target = game.player;
                }
            } else {
                if(get_rand() > 0.5) {
                    this.target = 0;
                    this.flee = true;
                    this.moving = true;
                } else {
                    this.range_from_player = 10;
                }
            }
        }
        return die;
    };

    Enemy.prototype.create = function (model, x, y, z, size) {
        if(!size) { size = 1; }
        Char.prototype.create.call(this, model, x, y, z, size);

        this.run_speed = 20; //+get_rand()*50;
        this.moving = true;
       // setTimeout(function () { that.moving = true; }, 3000);
    };

    Enemy.prototype.update = function (time, delta) {
        Char.prototype.update.call(this, time, delta);
        if (!this.alive) { return; }
        this.speed = this.walk_speed;
        if (this.flee) {
            this.speed = this.run_speed;
            this.dropWeapon();
        }

        if (this.chunk.mesh.position.distanceTo(game.player.chunk.mesh.position) > game.visible_distance) {
            //this.chunk.mesh.visible = false;
            return;
        }
        if (this.target != 0) {
            if(this.follow_timer > 0) {
                this.follow_timer -= delta;
                if(this.follow_timer <= 0) {
                    this.target = 0;
                    this.follow_timer = 0;
                }
            }
            if (this.target.alive || this.target.base_type == "weapon") { //&& this.chunk.mesh.position.distanceTo(this.target.chunk.mesh.position) > 5) {
                // this.view.material.color.setRGB(1,0,0);
                // this.view.material.needsUpdate = true;
                var p = this.target.chunk.mesh.position.clone();
                p.y = this.chunk.mesh.position.y;
                this.chunk.mesh.lookAt(p);

                var dist = this.chunk.mesh.position.distanceTo(game.player.chunk.mesh.position);
                if (dist > this.range_from_player && this.weapon != 0) {
                    if(dist > game.visible_distance/2) {
                        this.target = 0;
                    } else {
                        this.moving = true;
                    }
                } else {
                    if (this.target.base_type == "player") {
                        this.moving = false;
                        this.shoot();
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
            // Spare FPS by not checking CD every frame.
            if (this.cd_check > 0.1) { // 10 fps
                this.cd_check = 0;

                for(var idx = 0; idx < game.cdList.length; idx++) {
                    if(this.chunk.checkCD(game.cdList[idx].position, this.view_range_current)) {
                        if (this.chunk.mesh.id != game.cdList[idx].id) {
                            if (game.cdList[idx].owner.obj_type != this.obj_type && (game.cdList[idx].owner.base_type == "player")) { // TBD //|| game.cdList[idx].object.owner.base_type == "enemy")) {
                                if (this.target == 0 && this.weapon != 0) {
                                    if(game.cdList[idx].owner.alive) {
                                        this.target = game.cdList[idx].owner;
                                        this.follow_timer = get_rand()*10;
                                      //  game.sounds.PlaySound("hunt"+(1+Math.random()*2|0), 
                                      //                        this.chunk.mesh.position,
                                      //                        500);
                                        this.loadWeapon();
                                    }
                                }
                                if (this.target != 0 && this.target.base_type == "player") {
                                    this.loadWeapon();
                                    this.shoot();
                                }
                            } else if (game.cdList[idx].owner.base_type == "weapon") {
                                // walk to weapon
                                if ((this.weapon == 0 || this.weapon.damage < game.cdList[idx].owner.damage) && !this.flee) {
                                    this.target = game.cdList[idx].owner;
                                }
                            }
                        }
                    } 
                    if(this.chunk.checkCD(game.cdList[idx].position, 5)) {
                        if (game.cdList[idx].owner.base_type == "weapon") {
                            if (this.weapon == 0) {
                                this.addWeapon(game.cdList[idx].owner);
                                this.loadWeapon();
                                this.target = 0;
                            } else {
                                if(this.weapon.damage < game.cdList[idx].owner.damage) {
                                    this.dropWeapon();
                                    this.addWeapon(game.cdList[idx].owner);
                                    this.target = 0;
                                    this.loadWeapon();
                                }
                            }
                        }
                    }
                }
            }
            this.cd_check += delta;

            //if (res.length > 0) {
            this.chunk.mesh.rotation.y -= (1-get_rand()*2)*Math.sin(delta*3); 
            var pos = this.chunk.mesh.position.clone();
            pos.y = game.maps.ground;
            var res = game.world.checkExists(pos);
            if(res.length != 0) {
                this.chunk.mesh.translateZ(delta * this.speed);
                if(!this.cd()) {
                    this.chunk.mesh.translateZ(-delta * this.speed);
                    this.chunk.mesh.rotation.y -= Math.sin(time / this.speed);
                    this.target = 0;
                    //this.chunk.mesh.rotation.y -= Math.PI;
                }
            } else {
                this.chunk.mesh.translateZ(-delta * this.speed - 1);
                this.chunk.mesh.rotation.y -= Math.sin(time / this.speed);
                this.chunk.mesh.rotation.y -= Math.PI;
                this.target = 0;
            }
            
            this.chunk.mesh.rotation.z = 0.2 * Math.sin(time * this.speed);
            for (var i = 0; i < res.length; i++) {
                if (((res[i] >> 24) & 0xFF) > 100 &&
                    ((res[i] >> 16) & 0xFF) < 25 &&
                    ((res[i] >> 8) & 0xFF) < 25
                ) {
                    if(this.add_blood == 0 && get_rand() > 0.5) {
                        this.add_blood = 60; // Walking on blood
                    }
                } else if (((res[i] >> 24) & 0xFF) <= 50  &&
                    ((res[i] >> 16) & 0xFF) >= 200 &&
                    ((res[i] >> 8) & 0xFF) < 105 &&
                    ((res[i] >> 8) & 0xFF) >= 50)
                {
                    if(this.add_radioactive == 0 && get_rand() > 0.5) {
                        this.add_radioactive = 30; // walking on radioactive
                        if(this.radiation_poisoned == 0) {
                            this.radiation_light = this.green_light.clone();
                            this.radiation_light.intensity = 0.1;
                            this.radiation_light.position.y = 1;
                            this.chunk.mesh.add(this.radiation_light);
                        }
                        this.radiation_poisoned++;
                        this.radiation_light.intensity += 0.5;
                        this.radiation_light.distance += 2;
                        
                        // Add random radiation 
                        this.chunk.addBlock(Math.random()*this.chunk.chunk_size_x|0,
                                            Math.random()*this.chunk.chunk_size_y|0,
                                            Math.random()*this.chunk.chunk_size_z|0,
                                            (res[i][1] >> 24) & 0xFF, 
                                            (res[i][1] >> 16) & 0xFF,
                                            (res[i][1] >> 8) & 0xFF
                        );
                    }
                }
            }

            if (get_rand() < 0.4) {
                game.particles.walkSmoke(this.chunk.mesh.position.x, game.maps.ground+1, this.chunk.mesh.position.z);
            }
        }
    };

    Enemy.prototype.shoot = function () {
        if(get_rand() < this.shoot_ability) {
            Char.prototype.shoot.call(this);
        }
    };

}
Enemy.prototype = new Char;
Enemy.prototype.constructor = Enemy;

//////////////////////////////////////////////////////////////////////
// Enemy type: Dudo
//
//////////////////////////////////////////////////////////////////////
function Dudo(x, y, z) {
    Enemy.call(this);
    this.obj_type = "dudo";
    this.run_speed = 30;
    this.walk_speed = 15;
    this.y_offset = 5;

    Dudo.prototype.create = function (x, y, z) {
        Enemy.prototype.create.call(this, this.obj_type, x, game.maps.ground + this.y_offset, z);
        this.chunk.mesh.rotation.order = 'YXZ';
        if (get_rand() > 0.4) {
            this.addWeapon(new Shotgun());
            this.weapon.attach(this.chunk.mesh);
            this.unloadWeapon();
        }
    };

    Dudo.prototype.loadWeapon = function () {
        Enemy.prototype.loadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(-3, -1.5, 0.5);
            this.weapon.setRotation(Math.PI, Math.PI / 2, 0);
        }
    };

    Dudo.prototype.unloadWeapon = function () {
        Enemy.prototype.unloadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(0, 2, -1.5);
            this.weapon.setRotation(0, 0, Math.PI / 3);
        }
    };
}
Dudo.prototype = new Enemy;
Dudo.prototype.constructor = Dudo;

//////////////////////////////////////////////////////////////////////
// Enemy type: AgentBlack
//
//////////////////////////////////////////////////////////////////////
function AgentBlack(x, y, z) {
    Enemy.call(this);
    this.y_offset = 7;
    this.run_speed = 40;
    this.walk_speed = 15;
    this.obj_type = "agentblack";
    this.shoot_ability = 0.5;
    // this.create(this.obj_type, x, game.maps.ground+5, z); // Add space from floor
    //
    AgentBlack.prototype.die = function() {
        this.chunk.mesh.position.y = game.maps.ground+1;
    };

    AgentBlack.prototype.create = function (x, y, z) {
        Enemy.prototype.create.call(this, this.obj_type, x, game.maps.ground + this.y_offset, z, 0.5);
        this.chunk.mesh.rotation.order = 'YXZ';
        if (get_rand() > 0.8) {
            this.addWeapon(new Shotgun());
        } else if(get_rand() > 0.5) {
            this.addWeapon(new Sniper());
        } else {
            this.addWeapon(new Pistol());
        }
        this.weapon.attach(this.chunk.mesh);
        this.unloadWeapon();
    };

    AgentBlack.prototype.loadWeapon = function () {
        Enemy.prototype.loadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(-3, 0, 0.5);
            this.weapon.setRotation(Math.PI, Math.PI / 2, 0);
        }
    };

    AgentBlack.prototype.unloadWeapon = function () {
        Enemy.prototype.unloadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(0, 4, -1.5);
            this.weapon.setRotation(0, 0, Math.PI / 3);
        }
    };
}
AgentBlack.prototype = new Enemy;
AgentBlack.prototype.constructor = AgentBlack;

//////////////////////////////////////////////////////////////////////
// Enemy type: Agent
//
//////////////////////////////////////////////////////////////////////
function Agent(x, y, z) {
    Enemy.call(this);
    this.y_offset = 7;
    this.run_speed = 40;
    this.walk_speed = 15;
    this.obj_type = "agent";
    this.shoot_ability = 0.5;
    // this.create(this.obj_type, x, game.maps.ground+5, z); // Add space from floor
    //
    Agent.prototype.die = function() {
        this.chunk.mesh.position.y = game.maps.ground+1;
    };

    Agent.prototype.create = function (x, y, z) {
        Enemy.prototype.create.call(this, this.obj_type, x, game.maps.ground + this.y_offset, z, 0.5);
        this.chunk.mesh.rotation.order = 'YXZ';
        if (get_rand() > 0.8) {
            this.addWeapon(new Pistol());
        } else if(get_rand() > 0.5) {
            this.addWeapon(new Minigun());
        } else {
            this.addWeapon(new Shotgun());
        }
        this.weapon.attach(this.chunk.mesh);
        this.unloadWeapon();
    };

    Agent.prototype.loadWeapon = function () {
        Enemy.prototype.loadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(-3, 0, 0.5);
            this.weapon.setRotation(Math.PI, Math.PI / 2, 0);
        }
    };

    Agent.prototype.unloadWeapon = function () {
        Enemy.prototype.unloadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(0, 4, -1.5);
            this.weapon.setRotation(0, 0, Math.PI / 3);
        }
    };
}
Agent.prototype = new Enemy;
Agent.prototype.constructor = Agent;

//////////////////////////////////////////////////////////////////////
// Enemy type: Greenie
//
//////////////////////////////////////////////////////////////////////
function Greenie(x, y, z) {
    Enemy.call(this);
    this.y_offset = 5;
    this.run_speed = 40;
    this.walk_speed = 15;
    this.obj_type = "greenie";
    // this.create(this.obj_type, x, game.maps.ground+5, z); // Add space from floor

    Greenie.prototype.create = function (x, y, z) {
        Enemy.prototype.create.call(this, this.obj_type, x, game.maps.ground + this.y_offset, z, 1);
        this.chunk.mesh.rotation.order = 'YXZ';
        if (get_rand() > 0.4) {
            this.addWeapon(new P90());
            this.weapon.attach(this.chunk.mesh);
            this.unloadWeapon();
        } else {
            this.addWeapon(new Shotgun());
            this.weapon.attach(this.chunk.mesh);
            this.unloadWeapon();
        }
    };

    Greenie.prototype.loadWeapon = function () {
        Enemy.prototype.loadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(-3, -1.5, 0.5);
            this.weapon.setRotation(Math.PI, Math.PI / 2, 0);
        }
    };

    Greenie.prototype.unloadWeapon = function () {
        Enemy.prototype.unloadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(0, 2, -1.5);
            this.weapon.setRotation(0, 0, Math.PI / 3);
        }
    };
}
Greenie.prototype = new Enemy;
Greenie.prototype.constructor = Greenie;

//////////////////////////////////////////////////////////////////////
// Enemy type: Hearty
//
//////////////////////////////////////////////////////////////////////
function Hearty(x, y, z) {
    Enemy.call(this);
    this.obj_type = "hearty";
    this.run_speed = 50;
    this.walk_speed = 15;
    this.y_offset = 6;
    //   this.create(this.obj_type, x, game.maps.ground+6, z); // Add space from floor

    Hearty.prototype.create = function (x, y, z) {
        Enemy.prototype.create.call(this, this.obj_type, x, game.maps.ground + this.y_offset, z);
        this.chunk.mesh.rotation.order = 'YXZ';
        if (get_rand() > 0.4) {
            this.addWeapon(new Sniper());
        } else {
            this.addWeapon(new RocketLauncher());
        }
        this.weapon.attach(this.chunk.mesh);
        this.unloadWeapon();
    };

    Hearty.prototype.loadWeapon = function () {
        Enemy.prototype.loadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(-2.5, -2.5, 0.5);
            this.weapon.setRotation(Math.PI, Math.PI / 2, 0);
        }
    };

    Hearty.prototype.unloadWeapon = function () {
        Enemy.prototype.unloadWeapon.call(this);
        if (this.weapon) {
            this.weapon.setPosition(0, 2, -1.5);
            this.weapon.setRotation(0, 0, Math.PI / 3);
        }
    };
}
Hearty.prototype = new Enemy;
Hearty.prototype.constructor = Hearty;

//////////////////////////////////////////////////////////////////////
// Player class
//////////////////////////////////////////////////////////////////////
function Player(x, y, z) {
    Char.call(this);
    this.obj_type = "player";
    this.base_type = "player";
    this.run_speed = 50;
    this.keyboard = 0;
    this.y_offset = 6;
    this.weapons = [];
    this.can_switch = true;
    this.falling = false;
    this.flashlight = new THREE.SpotLight(0xFFFFFF);
    this.footsteps = false;

    Player.prototype.reset = function() {
        this.removeBindings();
        this.weapons = [];
        game.scene.remove(this.flashlight);
        this.keyboard = null;
    };

    Player.prototype.create = function (x, y, z) {
        Char.prototype.create.call(this, this.obj_type, x, game.maps.ground + this.y_offset, z);
        this.keyboard = new THREEx.KeyboardState();
        this.chunk.mesh.rotation.order = 'YXZ';
        game.player = this;
        var targetObject = new THREE.Object3D();
        targetObject.position.set(1, 1, 10);
        game.scene.add(targetObject);
        this.flashlight.target = targetObject;
        this.flashlight.decay = 1;
        this.flashlight.intensity = 2;
        this.flashlight.distance = 100;
        this.flashlight.angle = Math.PI/5;
        this.chunk.mesh.add(targetObject);
        this.chunk.mesh.add(this.flashlight);

        this.flashlight.position.set(0, 3, 0);
        //this.flashlight.target.position.set( 0, 0, 1 );
       // this.flashlight.target = this.chunk.mesh;
        //this.flashlight.castShadow = true;

        //this.flashlight.shadow.mapSize.width = 1024;
        //this.flashlight.shadow.mapSize.height = 1024;

        //this.flashlight.shadow.camera.near = 0;
        //this.flashlight.shadow.camera.far = 400;
        //this.flashlight.shadow.camera.fov = 80;

        this.addWeapon(new RocketLauncher());
        this.addWeapon(new Shotgun());

//        var t = new THREE.Mesh(new THREE.BoxGeometry(5,5,5),
//                               new THREE.MeshBasicMaterial({color: 0xFF0000}));
//        this.chunk.mesh.add(t);
//        t.position.set(0, 150, 0);


        this.addBindings();
       // game.camera.position.set(0,0,0);
       // game.camera.rotation.set(0,0,0);
        //game.camera.matrix.copy(this.chunk.mesh.matrix);
        this.chunk.mesh.add(game.camera);
        var pos = this.chunk.mesh.position.clone();
        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(0, 0, 0));
        game.camera.lookAt(point);
        game.camera.rotation.z = Math.PI;
        game.camera.rotation.x =-Math.PI/1.4;
        game.camera.position.y = 150;
        game.camera.position.z = -120;

    };

    Player.prototype.shiftWeapon = function () {
        if (this.weapons.length == 0) {
            return;
        }

        if(!this.can_switch) {
            return;
        }
        this.can_switch = false;
        var that = this;
        setTimeout(function () {
            that.can_switch = true;
        }, 200);

        // Check if a weapon is loaded, then unload it.
        var id = this.getWeaponId();
        if(id != -1) {
            this.unloadWeapon(id);
        } else {
            this.loadWeapon(0);
            return;
        }
        // Load next weapon, if any.
        if(this.weapons.length > 1) {
            if(id == this.weapons.length-1) {
                id = 0;
            } else {
                id++;
            }
            this.loadWeapon(id);
        }
    };

    Player.prototype.getWeaponId = function() {
        if(this.weapon == 0) {
            return -1;
        } 
        for(var i = 0; i < this.weapons.length; i++) {
            if(this.weapon.chunk.mesh.id == this.weapons[i].chunk.mesh.id) {
                return i;
            }
        }
        return -1;
    };

    Player.prototype.loadWeapon = function (id) {
        for(var i = 0; i < this.weapons.length; i++) {
            if(id != i) {
                this.unloadWeapon(i);
            }
        }
        this.weapon = this.weapons[id];
        this.weapon.setPosition(2.5, -0.5, 2.5);
        this.weapon.setRotation(Math.PI, Math.PI / 2, 0);
        this.can_shoot = true;
        this.loaded = true;
    };

    Player.prototype.unloadWeapon = function (id) {
        if (this.weapon != 0) {
            this.weapon.setPosition(0, 2, -1.5);
            this.weapon.setRotation(0, 0, Math.PI / 3);
            this.weapon = 0;
            this.can_shoot = false;
            this.loaded = false;
        }
    };

    Player.prototype.addWeapon = function (weapon) {
        if (this.weapons.length < 2) {
            if (weapon.attach(this.chunk.mesh)) {
                //this.weapon = weapon;
                this.weapons.push(weapon);
                this.loadWeapon(this.weapons.length-1);
            }
        }
    };

    Player.prototype.dropWeapon = function () {
        if (this.weapon != 0) {
            var wid = this.getWeaponId();
            this.unloadWeapon(wid);
            this.weapons[wid].detach(this.chunk.mesh, this.chunk.mesh.position);
            this.weapons.splice(wid, 1);
        }
    };

    Player.prototype.addBindings = function () {
        $(document).mouseup(this.mouseUp.bind(this));
        $(document).mousemove(this.mouseMove.bind(this));
        $(document).mousedown(this.mouseDown.bind(this));
    };

    Player.prototype.removeBindings = function () {
        $(document).unbind('mouseup');
        $(document).unbind('mousemove');
        $(document).unbind('mousedown');
    };


    Player.prototype.mouseUp = function () {
        if(!this.alive) {
            return;
        }
        this.shooting = false;
        if(this.weapon.obj_type == "sniper") {
            this.shoot();
            setTimeout(function() {
                game.camera.position.y = 150;
                game.camera.position.z = -120;
                game.camera.rotation.x = -Math.PI / 1.4;
            }, 1000);
        } else {
            game.camera.position.y = 150;
            game.camera.position.z = -120;
            game.camera.rotation.x = -Math.PI / 1.4;
        }
    };

    Player.prototype.mouseDown = function () {
        this.shooting = true;
    };

    Player.prototype.update = function (time, delta) {
        if(!this.alive) {
            game.sounds.StopSound("footsteps");
            game.sounds.StopSound("heartbeat");
            return;
        }
        this.speed = this.run_speed;
        Char.prototype.update.call(this, time, delta);
        if (this.shooting && this.weapon.obj_type != "sniper") {
            this.shoot();
        } else if(this.shooting && this.weapon.obj_type == "sniper") {
            if(game.camera.position.y > 10) {
                game.camera.position.y -= 10;
                game.camera.position.z += 10;
                game.camera.rotation.x += -0.01;
            } else {
                game.camera.rotation.x = -Math.PI;
                game.camera.position.z = -5;
                game.camera.position.x = 5;
                game.camera.position.y = 3;
            }
        }
        if(this.falling) {
            if(game.camera.position.y < game.maps.ground-5) {
                this.chunk.mesh.position.y -= 1;
                this.chunk.mesh.rotation.z -= Math.sin(time)/20;
                this.chunk.mesh.rotation.x -= Math.sin(time)/20;
                game.maps.ambient_light.color.r += 0.1;
                game.maps.ambient_light.color.g -= 0.01;
                game.maps.ambient_light.color.b -= 0.01;
            } else {
                if(game.maps.ambient_light.intensity < 0.8) {
                    game.maps.ambient_light.intensity += 0.1;
                }
                game.maps.ambient_light.color.r += 0.01;
                game.maps.ambient_light.color.g += 0.01;
                game.maps.ambient_light.color.b += 0.01;
                this.chunk.mesh.position.y -= 1;
                this.chunk.mesh.rotation.z -= Math.sin(time)/10;
                this.chunk.mesh.rotation.x -= Math.sin(time)/10;
                game.camera.position.y -= 1;
            }
            if(this.chunk.mesh.position.y < -250) {
                // RESPAWN?
                game.reset();
            }
            return;
        }
        this.KeyDown(time, delta);

        if (this.moving) {
            if(!game.sounds.isPlaying("footsteps")) {
                game.sounds.PlaySound("footsteps", this.chunk.mesh.position, 800);
            }
            //this.chunk.mesh.rotation.z = 0.2*Math.sin(time*speed);
            if (this.cd_check > 0.05) {
                this.cd_check = 0;
                var pos = this.chunk.mesh.position.clone();
                pos.y = game.maps.ground;
                var res = game.world.checkExists(pos);
                for (var i = 0; i < res.length; i++) {
                    if (((res[i] >> 24) & 0xFF) > 100 &&
                        ((res[i] >> 16) & 0xFF) < 25 &&
                        ((res[i] >> 8) & 0xFF) < 25
                    ) {
                        if(this.add_blood == 0 && get_rand() > 0.5) {
                            this.add_blood = 40;
                        }
                    } else if (((res[i] >> 24) & 0xFF) <= 50  &&
                               ((res[i] >> 16) & 0xFF) >= 200 &&
                               ((res[i] >> 8) & 0xFF) < 105 &&
                               ((res[i] >> 8) & 0xFF) >= 50)
                    {
                        if(this.add_radioactive == 0 && get_rand() > 0.5) {
                            this.add_radioactive = 30; // walking on radioactive
                            if(this.radiation_poisoned == 0) {
                                this.radiation_light = this.green_light.clone();
                                this.radiation_light.intensity = 0.1;
                                this.radiation_light.position.y = 1;
                                this.chunk.mesh.add(this.radiation_light);
                            }
                            this.radiation_poisoned++;
                            this.radiation_light.intensity += 0.5;
                            this.radiation_light.distance += 2;

                            this.chunk.addBlock(Math.random()*this.chunk.chunk_size_x|0,
                                                Math.random()*this.chunk.chunk_size_y|0,
                                                Math.random()*this.chunk.chunk_size_z|0,
                                                (res[i][1] >> 24) & 0xFF, 
                                                (res[i][1] >> 16) & 0xFF,
                                                (res[i][1] >> 8) & 0xFF
                            );
                        }
                    }
                }
                if(res.length == 0) {
                    this.falling = true;
                    // Only fall if hole is big enough to fit in :)
                    for(var ofx = -1; ofx <= 1; ofx++) {
                        for(var ofz = -1; ofz <= 1; ofz++) { 
                            for(var ofy = game.maps.ground; ofy >= 0; ofy--) {
                                var post = this.chunk.mesh.position.clone();
                                post.x += ofx;
                                post.y = ofy;
                                post.z += ofz;
                                var r = game.world.checkExists(post);
                                if(r.length != 0) {
                                    this.falling = false;
                                    break;
                                }
                            }
                            if(!this.falling) {
                                break;
                            }
                        }
                        if(!this.falling) {
                            break;
                        }
                    }
                    
                    if(this.falling) {
                        game.sounds.StopSound("footsteps");

                        if(get_rand() > 0.5) {
                            game.sounds.PlaySound("fall", this.chunk.mesh.position, 400);
                        } else {
                            game.sounds.PlaySound("fall2", this.chunk.mesh.position, 400);
                        }
                        game.maps.ambient_light.color.r = 0;
                        game.maps.ambient_light.color.g = 0;
                        game.maps.ambient_light.color.b = 0;
                        // Fall down!
                        this.chunk.mesh.remove(game.camera);
                        game.scene.add(game.camera);
                        //game.camera.lookAt(this.chunk.mesh);
                        game.camera.position.z = pos.z;
                        game.camera.position.x = pos.x;
                        game.camera.position.y = 150; //120; 150
                        game.camera.rotation.x = -Math.PI/2;
                    }

                }

                for(var idx = 0; idx < game.cdList.length; idx++) {
                    if(this.chunk.checkCD(game.cdList[idx].position, 5)) {
                        if (game.cdList[idx].owner.obj_type == "heart" || game.cdList[idx].owner.obj_type == "painkillers") {
                            game.cdList[idx].owner.grab(game.cdList[idx].id);
                        } else if (game.cdList[idx].owner.base_type == "weapon") {
                            if (this.weapons.length <= 2) {
                                this.addWeapon(game.cdList[idx].owner);
                            }
                        }
                    }
                }
            }
            this.cd_check += delta;
            if (get_rand() < 0.4) {
                game.particles.walkSmoke(this.chunk.mesh.position.x, this.chunk.mesh.position.y, this.chunk.mesh.position.z);
            }
            //            this.chunk.mesh.rotation.z = 0.2 * Math.sin(time * this.speed);
        }
    };

    Player.prototype.mouseMove = function (jevent) {
        if(this.alive) {
            var event = jevent.originalEvent; // jquery convert
            var movementX = event.movementX || event.mozMovementX || event.webkitMovementX ||0;
            var x = movementX*0.001;

            var axis = new THREE.Vector3(0,1,0);
            var radians = -(Math.PI/2)*x;
            var rotObjectMatrix = new THREE.Matrix4();
            rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
            this.chunk.mesh.matrix.multiply(rotObjectMatrix);
            this.chunk.mesh.rotation.setFromRotationMatrix(this.chunk.mesh.matrix);
        }
    };


    Player.prototype.KeyDown = function (time, delta) {
        this.moving = false;

        if (this.keyboard.pressed("space")) {
            this.shoot();
        }
        if (this.keyboard.pressed("w")) {
            this.chunk.mesh.translateZ(this.speed * delta);
            if(this.cd()) {
                this.moving = true;
            } else {
                this.chunk.mesh.translateZ(-this.speed * delta);
            }
        }
        if (this.keyboard.pressed("S")) {
            this.chunk.mesh.translateZ(-this.speed * delta);
            if(this.cd()) {
                this.moving = true;
            } else{
                this.chunk.mesh.translateZ(+this.speed * delta);
            }
        }
        if (this.keyboard.pressed("A")) {
            this.chunk.mesh.translateX(this.speed * delta);
            if(this.cd()) {
                this.moving = true;
            } else {
                this.chunk.mesh.translateX(-this.speed * delta);
            }
        }
        if (this.keyboard.pressed("D")) {
            this.chunk.mesh.translateX(-this.speed * delta);
            if(this.cd()) {
                this.moving = true;
            } else {
                this.chunk.mesh.translateX(this.speed * delta);
            }
        }
        if (this.keyboard.pressed("R")) {
            this.flashlight.visible = false;
            for(var i = 0; i < game.maps.loaded.length; i++) {
                if(game.maps.loaded[i].base_type == "enemy") {
                    game.maps.loaded[i].current_view_range = game.maps.loaded[i].view_range;
                }
            }
        }
        if (this.keyboard.pressed("T")) {
            this.flashlight.visible = true;
            for(var i = 0; i < game.maps.loaded.length; i++) {
                if(game.maps.loaded[i].base_type == "enemy") {
                    game.maps.loaded[i].current_view_range = game.maps.loaded[i].view_range * 2;
                }
            }
        }
        if (this.keyboard.pressed("E")) {
            this.dropWeapon();
        }
        if (this.keyboard.pressed("F")) {
            this.shiftWeapon();
        }


     //   if(this.moving && !this.footsteps) {
     //       game.sounds.PlaySound("footsteps", this.chunk.mesh.position, 300);
     //       this.footsteps = true;
     //   }
     //   if(!this.moving && this.footsteps) {
     //       game.sounds.StopSound("footsteps");
     //       this.footsteps = false;
     //   }

    };
}
Player.prototype = new Char;
Player.prototype.constructor = Player;



//////////////////////////////////////////////////////////////////////
// Chunk class
//////////////////////////////////////////////////////////////////////
function Chunk(x, y, z, cx, cy, cz, id, bs, type) {
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
   // this.bb = undefined; // boundingbox
    //this.batch_points = [];
    //this.bp = 0; // batch_points pointer
    this.blocks = 0;
    this.wireframe = false;
    this.triangles = 0;
    //this.shadow_blocks = [];
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
//    console.log("X:",this.from_x, this.to_x, "Z:", this.from_z, this.to_z, "Y: ", this.from_y, this.to_y );

    Chunk.prototype.destroy = function () {
        game.scene.remove(this.mesh);
    //    game.scene.remove(this.bb);
    //    game.removeFromCD(this.bb);
        //        this.mesh.geometry.dispose();
        //        this.mesh.material.dispose();
        //        this.bb.geometry.dispose();
        //        this.bb.material.dispose();
        this.blocks = null;
    };

    Chunk.prototype.SameColor = function (block1, block2) {
        if (((block1 >> 8) & 0xFFFFFF) == ((block2 >> 8) & 0xFFFFFF) && block1 != 0 && block2 != 0) {
            return true;
        }
        return false;
    };

    Chunk.prototype.init = function () {
        this.material = game.chunk_material;
        //this.material = new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors, wireframe: this.wireframe});
        //        this.material = new THREE.MeshPhongMaterial({bumpMap: bump, vertexColors: THREE.VertexColors, wireframe: this.wireframe});
        this.blocks = new Array(this.chunk_size_x);
        for (var x = 0; x < this.chunk_size_x; x++) {
            this.blocks[x] = new Array(this.chunk_size_y);
            for (var y = 0; y < this.chunk_size_y; y++) {
                this.blocks[x][y] = new Array(this.chunk_size_z);
                for (var z = 0; z < this.chunk_size_z; z++) {
                    this.blocks[x][y][z] = 0;
                }
            }
        }
    };

    Chunk.prototype.build = function () {
        var vertices = [];
        var colors = [];
        var cc = 0; // Color counter
        var r = 0;
        var g = 0;
        var b = 0;

        // Block structure
        // BLOCK: [R-color][G-color][B-color][0][00][back_left_right_above_front]
        //           8bit    8bit     8it   2bit(floodfill)     6bit(faces)

        // Reset faces
        for (var x = 0; x < this.chunk_size_x; x++) {
            for (var y = 0; y < this.chunk_size_y; y++) {
                for (var z = 0; z < this.chunk_size_z; z++) {
                    this.blocks[x][y][z] &= 0xFFFFFFC0;
                }
            }
        }

        // this.shadow_blocks = [];
        this.total_blocks = 0;

        for (var x = 0; x < this.chunk_size_x; x++) {
            for (var y = 0; y < this.chunk_size_y; y++) {
                for (var z = 0; z < this.chunk_size_z; z++) {
                    if (this.blocks[x][y][z] == 0) {
                        continue; // Skip empty blocks
                    }
                    this.total_blocks++;
                    // Check if hidden
                    var left = 0, right = 0, above = 0, front = 0, back = 0, below = 0;
                    if (z > 0) {
                        if (this.blocks[x][y][z - 1] != 0) {
                            back = 1;
                            this.blocks[x][y][z] = this.blocks[x][y][z] | 0x10;
                        }
                    } else {
                        if (this.type == "world") {
                            // Check hit towards other chunks.
                            if (game.world.checkExists(
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
                            if (game.world.checkExists(
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
                            if (game.world.checkExists(
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
                            if (game.world.checkExists(
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
                            if (game.world.checkExists(
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
                                var maxX = 0;
                                var maxZ = 0;
                                var end = 0;

                                for (var x_ = x; x_ < this.chunk_size_x; x_++) {
                                    // Check not drawn + same color
                                    if ((this.blocks[x_][y][z] & 0x20) == 0 && this.SameColor(this.blocks[x_][y][z], this.blocks[x][y][z])) {
                                        maxX++;
                                    } else {
                                        break;
                                    }
                                    var tmpZ = 0;
                                    for (var z_ = z; z_ < this.chunk_size_z; z_++) {
                                        if ((this.blocks[x_][y][z_] & 0x20) == 0 && this.SameColor(this.blocks[x_][y][z_], this.blocks[x][y][z])) {
                                            tmpZ++;
                                        } else {
                                            break;
                                        }
                                    }
                                    if (tmpZ < maxZ || maxZ == 0) {
                                        maxZ = tmpZ;
                                    }
                                }
                                for (var x_ = x; x_ < x + maxX; x_++) {
                                    for (var z_ = z; z_ < z + maxZ; z_++) {
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
                            var maxX = 0;
                            var maxZ = 0;
                            var end = 0;

                            for (var x_ = x; x_ < this.chunk_size_x; x_++) {
                                // Check not drawn + same color
                                if ((this.blocks[x_][y][z] & 0x2) == 0 && this.SameColor(this.blocks[x_][y][z], this.blocks[x][y][z])) {
                                    maxX++;
                                } else {
                                    break;
                                }
                                var tmpZ = 0;
                                for (var z_ = z; z_ < this.chunk_size_z; z_++) {
                                    if ((this.blocks[x_][y][z_] & 0x2) == 0 && this.SameColor(this.blocks[x_][y][z_], this.blocks[x][y][z])) {
                                        tmpZ++;
                                    } else {
                                        break;
                                    }
                                }
                                if (tmpZ < maxZ || maxZ == 0) {
                                    maxZ = tmpZ;
                                }
                            }
                            for (var x_ = x; x_ < x + maxX; x_++) {
                                for (var z_ = z; z_ < z + maxZ; z_++) {
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
                            var maxX = 0;
                            var maxY = 0;

                            for (var x_ = x; x_ < this.chunk_size_x; x_++) {
                                // Check not drawn + same color
                                if ((this.blocks[x_][y][z] & 0x10) == 0 && this.SameColor(this.blocks[x_][y][z], this.blocks[x][y][z])) {
                                    maxX++;
                                } else {
                                    break;
                                }
                                var tmpY = 0;
                                for (var y_ = y; y_ < this.chunk_size_y; y_++) {
                                    if ((this.blocks[x_][y_][z] & 0x10) == 0 && this.SameColor(this.blocks[x_][y_][z], this.blocks[x][y][z])) {
                                        tmpY++;
                                    } else {
                                        break;
                                    }
                                }
                                if (tmpY < maxY || maxY == 0) {
                                    maxY = tmpY;
                                }
                            }
                            for (var x_ = x; x_ < x + maxX; x_++) {
                                for (var y_ = y; y_ < y + maxY; y_++) {
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
                            var maxX = 0;
                            var maxY = 0;

                            for (var x_ = x; x_ < this.chunk_size_x; x_++) {
                               // Check not drawn + same color
                                if ((this.blocks[x_][y][z] & 0x1) == 0 && this.SameColor(this.blocks[x_][y][z], this.blocks[x][y][z])) {
                                    maxX++;
                                } else {
                                    break;
                                }
                                var tmpY = 0;
                                for (var y_ = y; y_ < this.chunk_size_y; y_++) {
                                    if ((this.blocks[x_][y_][z] & 0x1) == 0 && this.SameColor(this.blocks[x_][y_][z], this.blocks[x][y][z])) {
                                        tmpY++;
                                    } else {
                                        break;
                                    }
                                }
                                if (tmpY < maxY || maxY == 0) {
                                    maxY = tmpY;
                                }
                            }
                            for (var x_ = x; x_ < x + maxX; x_++) {
                                for (var y_ = y; y_ < y + maxY; y_++) {
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
                            var maxZ = 0;
                            var maxY = 0;

                            for (var z_ = z; z_ < this.chunk_size_z; z_++) {
                               // Check not drawn + same color
                                if ((this.blocks[x][y][z_] & 0x8) == 0 && this.SameColor(this.blocks[x][y][z_], this.blocks[x][y][z])) {
                                    maxZ++;
                                } else {
                                    break;
                                }
                                var tmpY = 0;
                                for (var y_ = y; y_ < this.chunk_size_y; y_++) {
                                    if ((this.blocks[x][y_][z_] & 0x8) == 0 && this.SameColor(this.blocks[x][y_][z_], this.blocks[x][y][z])) {
                                        tmpY++;
                                    } else {
                                        break;
                                    }
                                }
                                if (tmpY < maxY || maxY == 0) {
                                    maxY = tmpY;
                                }
                            }
                            for (var z_ = z; z_ < z + maxZ; z_++) {
                                for (var y_ = y; y_ < y + maxY; y_++) {
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
                            var maxZ = 0;
                            var maxY = 0;

                            for (var z_ = z; z_ < this.chunk_size_z; z_++) {
                                // Check not drawn + same color
                                if ((this.blocks[x][y][z_] & 0x4) == 0 && this.SameColor(this.blocks[x][y][z_], this.blocks[x][y][z])) {
                                    maxZ++;
                                } else {
                                    break;
                                }
                                var tmpY = 0;
                                for (var y_ = y; y_ < this.chunk_size_y; y_++) {
                                    if ((this.blocks[x][y_][z_] & 0x4) == 0 && this.SameColor(this.blocks[x][y_][z_], this.blocks[x][y][z])) {
                                        tmpY++;
                                    } else {
                                        break;
                                    }
                                }
                                if (tmpY < maxY || maxY == 0) {
                                    maxY = tmpY;
                                }
                            }
                            for (var z_ = z; z_ < z + maxZ; z_++) {
                                for (var y_ = y; y_ < y + maxY; y_++) {
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
            var starting_blocks = 0;
            for (var x = 0; x < this.chunk_size_x; x++) {
                for (var y = 0; y < this.chunk_size_y; y++) {
                    for (var z = 0; z < this.chunk_size_z; z++) {
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
            for (var i = 0; i < vertices.length; i++) {
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
            for (var i = 0; i < vertices.length; i++) {
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

                game.scene.add(this.mesh);

                if(this.type != "world") {
                    this.offset = this.geometry.center();
                    this.mesh.owner = this.owner;
                    if(this.owner) {
                        game.addToCD(this.mesh);
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
    };

    Chunk.prototype.rmBlock = function (x, y, z, dir, dmg, local) {
        //this.batch_points[this.bp++] = { x: x, y: y, z: z};
        var wx = x;
        var wy = y;
        var wz = z;
        
        if(!local) {
            x = x - (this.from_x * this.blockSize + this.blockSize) | 0;
            y = y - (this.from_y * this.blockSize + this.blockSize) | 0;
            z = z - (this.from_z * this.blockSize + this.blockSize) | 0;
        } 
        var max = 0.5;
        if(this.total_blocks > 3000) {
            max = 0.98;
        } else if (this.total_blocks > 1000) {
            max = 0.85;
        } else if (this.total_blocks > 500) {
            max = 0.7;
        } else if(this.total_blocks < 200) {
            max = 0.2;
        }
        var mp_x = 0; 
        var mp_y = 0; 
        var mp_z = 0; 

        if (x >= 0 && y >= 0 && z >= 0) {
            var c = this.blocks[x][y][z];
            if (c != 0) {
                if (this.type == "world") {
                    if (get_rand() > 0.4) {
                        game.particles_box.world_debris(wx, wy, wz, this.blockSize, (c >> 24) & 0xFF, (c >> 16) & 0xFF, (c >> 8) & 0xFF);
                    }
                } else {
                    if (get_rand() > max) {
                       // if(this.mesh.rotation.y == 0) {
                            mp_x = this.mesh.position.x - (this.blockSize*this.chunk_size_x/2);
                            mp_y = this.mesh.position.y - (this.blockSize*this.chunk_size_y/2);
                            mp_z = this.mesh.position.z - (this.blockSize*this.chunk_size_z/2);
                       // } else { // -Math.PI
                       //     mp_x = this.mesh.position.x - (this.blockSize*this.chunk_size_x)/(Math.PI*2);
                       //     mp_y = this.mesh.position.y - (this.blockSize*this.chunk_size_y)/(Math.PI*2);
                       //     mp_z = this.mesh.position.z - (this.blockSize*this.chunk_size_z)/(Math.PI*2);
                       // }
                        var size = this.blockSize;
                        if(get_rand() > 0.5) {
                            size = 1;
                        }
                        game.particles_box.debris(
                               mp_x + x * this.blockSize,
                               mp_y + y * this.blockSize,
                               mp_z + z * this.blockSize,
                               size, (c >> 24) & 0xFF, (c >> 16) & 0xFF, (c >> 8) & 0xFF, false,
                               //this.blockSize, (c >> 24) & 0xFF, (c >> 16) & 0xFF, (c >> 8) & 0xFF, false,
                               dir.x, dir.y, dir.z
                        );
                    }
                    if(this.owner.radioactive_leak) {
                        if(get_rand() > 0.8) {
                            var mp_x = this.mesh.position.x - (this.blockSize*this.chunk_size_x/2);
                            var mp_y = this.mesh.position.y - (this.blockSize*this.chunk_size_y/2);
                            var mp_z = this.mesh.position.z - (this.blockSize*this.chunk_size_z/2);
                            game.particles.radioactive_leak(
                                                             mp_x + x * this.blockSize,
                                                             mp_y + y * this.blockSize,
                                                             mp_z + z * this.blockSize,
                                                             0.5
                            );
                        }
                    }
                    if (this.owner.radioactive) {
                        if(get_rand() > max) {
                            var mp_x = this.mesh.position.x - (this.blockSize*this.chunk_size_x/2);
                            var mp_y = this.mesh.position.y - (this.blockSize*this.chunk_size_y/2);
                            var mp_z = this.mesh.position.z - (this.blockSize*this.chunk_size_z/2);
                            game.particles.radioactive_splat(
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
                        var size = this.blockSize;
                        if(get_rand() > 0.5) {
                            size = 1;
                        }
                        if(get_rand() > max) {
                            var mp_x = this.mesh.position.x - (this.blockSize*this.chunk_size_x/2);
                            var mp_y = this.mesh.position.y - (this.blockSize*this.chunk_size_y/2);
                            var mp_z = this.mesh.position.z - (this.blockSize*this.chunk_size_z/2);
                            //for (var t = 0; t < 2; t++) {
                            game.particles.blood(
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
    };

    Chunk.prototype.addBlock = function (x, y, z, r, g, b) {
        x -= this.from_x * this.blockSize;
        y -= this.from_y * this.blockSize;
        z -= this.from_z * this.blockSize;
        x |= 0;
        y |= 0;
        z |= 0;
        if (x < 0 || y < 0 || z < 0 ||
            x >= this.chunk_size_x || y >= this.chunk_size_y || z >= this.chunk_size_z) {
            return;
        }
        this.blocks[x][y][z] =
            (r & 0xFF) << 24 |
            (g & 0xFF) << 16 |
            (b & 0xFF) << 8 |
            0 & 0xFF;
        this.dirty = true;
    };

    Chunk.prototype.blockExists = function(x, y, z) {
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
        if(this.blocks[x][y][z] != 0) {
            return true;
        }
        return false;
    };

    Chunk.prototype.hit = function (dir, power, pos) {
        if (this.blocks == null) {
            return;
        }
        var x = 0;
        var y = 0;
        var z = 0;
        var vx = 0, vy = 0, vz = 0, val = 0, offset = 0;
        var ff = new Array();
        power =  power * (1/this.blockSize);
        var pow = power * power;

        var max = 0.5;
        if(this.total_blocks > 3000) {
            max = 0.98;
        } else if (this.total_blocks > 1000) {
            max = 0.85;
        } else if (this.total_blocks > 500) {
            max = 0.7;
        } else if(this.total_blocks < 200) {
            max = 0.5;
        }


        if(pos == null || this.type == "ff_object") {
            x = get_rand() * this.chunk_size_x | 0;
            z = get_rand() * this.chunk_size_z | 0;
            y = get_rand() * this.chunk_size_y | 0;
        } else {
          //  if(this.mesh.rotation.y == 0) {
                var p = this.mesh.position.y - (this.chunk_size_y*this.blockSize)/2;
                var h = pos.y - p;
                y = h*(1/this.blockSize) |0;

                p = this.mesh.position.x - (this.chunk_size_x * this.blockSize / 2);
                h = pos.x - p;
                x = h*(1/this.blockSize) |0;

                p = this.mesh.position.z - (this.chunk_size_z * this.blockSize / 2);
                h = pos.z - p;
                z = h*(1/this.blockSize) | 0;
           // } else if(this.mesh.rotation.y == -Math.PI) {
           //     var p = this.mesh.position.y - (this.chunk_size_y*this.blockSize)/2;
           //     var h = pos.y - p;
           //     y = h*(1/this.blockSize) |0;

           //     p = this.mesh.position.x + (this.chunk_size_x * this.blockSize / 2);
           //     h = pos.x - p;
           //     x = h*(1/this.blockSize) |0;

           //     p = this.mesh.position.z + (this.chunk_size_z * this.blockSize / 2);
           //     h = pos.z - p;
           //     z = h*(1/this.blockSize) | 0;
           // }
        }

        x = x > 0? x: 0;
        y = y > 0? y: 0;
        z = z > 0? z: 0;
        
        var offset = 5;
        if(this.type == "enemy") {
            offset = 20;
        }
        // Try to find a point which has a block to not repeat the hits
        if (x >= 0 && y >= 0 && z >= 0 && x < this.chunk_size_x && y < this.chunk_size_y && z < this.chunk_size_z) {
            if((this.blocks[x][y][z] >> 8) == 0) {
                var found = false;
                for(var x_ = x-offset; x_ < x+offset; x_++) {
                    for(var z_ = z-offset; z_ < z+offset; z_++) {
                        for(var y_ = y-offset; y_ < y+offset; y_++) {
                            if (x_ >= 0 && y_ >= 0 && z_ >= 0 && x_ < this.chunk_size_x && y_ < this.chunk_size_y && z_ < this.chunk_size_z) {
                                rx |= 0;
                                ry |= 0;
                                rz |= 0;
                                if((this.blocks[x_][y_][z_] >> 8) != 0) {
                                    found = true;
                                    x = x_; 
                                    y = y_;
                                    z = z_;
                                    break;
                                }
                            }
                        }
                        if(found) { break; }
                    }
                    if(found) { break; }
                }
            }
        }
        //if (x >= 0 && y >= 0 && z >= 0 && x < this.chunk_size_x && y < this.chunk_size_y && z < this.chunk_size_z) {
        //    if((this.blocks[x][y][z] >> 8) == 0) {
        //        var found = false;
        //        for(var x_ = x; x_ < this.chunk_size_x; x_++) {
        //            for(var z_ = z; z_ < this.chunk_size_z; z_++) {
        //                if (x_ >= 0 && z_ >= 0 && x_ < this.chunk_size_x  && z_ < this.chunk_size_z) {
        //                    if((this.blocks[x_][y][z_] >> 8) != 0) {
        //                        found = true;
        //                        console.log("NEW POS");
        //                        x = x_; 
        //                        z = z_;
        //                        break;
        //                    }
        //                }
        //            }
        //            if(found) { break; }
        //        }
        //    }
        //}

        var isHit = 0;
        var from_x = (x - power) < 0? 0: x-power;
        var from_z = (z - power) < 0? 0: z-power;
        var from_y = (y - power) < 0? 0: y-power;
        for (var rx = from_x; rx <= x + power; rx++) {
            vx = Math.pow((rx - x), 2); //*(rx-x);
            for (var rz = from_z; rz <= z + power; rz++) {
                vz = Math.pow((rz - z), 2) + vx; //*(rz-z);
                for (var ry = from_y; ry <= y + power; ry++) {
                    val = Math.pow((ry - y), 2) + vz;
                    rx |= 0;
                    ry |= 0;
                    rz |= 0;
                    if (val < pow) {
                        if (rx >= 0 && ry >= 0 && rz >= 0 && rx < this.chunk_size_x && ry < this.chunk_size_y && rz < this.chunk_size_z) {
                            if ((this.blocks[rx][ry][rz] >> 8) != 0) {
                                if (this.owner.base_type == "enemy" || this.owner.base_type == "player") {
                                    if(get_rand() > max) {
                                        game.particles.blood(
                       //                            this.mesh.position.x + rx * this.blockSize,
                       //                            this.mesh.position.y + ry * this.blockSize,
                       //                            this.mesh.position.z + rz * this.blockSize,
                                                   this.mesh.position.x - (this.blockSize * this.chunk_size_x)/2 +rx*this.blockSize,
                                                   this.mesh.position.y - (this.blockSize * this.chunk_size_y)/2 +ry*this.blockSize,
                                                   this.mesh.position.z - (this.blockSize * this.chunk_size_z)/2 +rz*this.blockSize, 
                                                   0.5,
                                                   dir.x,
                                                   dir.y,
                                                   dir.z
                                        );
                                    }
                                }
                                this.rmBlock(rx, ry, rz, dir, power, true);
                                isHit = true;
                            }
                        }
                    } else if (val >= pow) {
                        if (rx >= 0 && ry >= 0 && rz >= 0 && rx < this.chunk_size_x && ry < this.chunk_size_y && rz < this.chunk_size_z) {
                            if ((this.blocks[rx][ry][rz] >> 8) != 0) {
                                ff.push(new THREE.Vector3(rx, ry, rz));
                                if (this.owner.base_type == "enemy" || this.owner.base_type == "player") {
                                    if(get_rand() > 0.5) {
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
            var max_hp = 60;
            if(this.owner.base_type == "enemy" || this.owner.base_type == "player") {
                max_hp = 90;
            }
            if (((this.owner.base_type == "enemy" || this.owner.base_type == "player") && this.health < max_hp) ||
                ((this.owner.base_type == "object" || this.owner.base_type == "ff_object") && ff.length > 0))
            {

                
                for (var x = 0; x < this.chunk_size_x; x++) {
                    for (var y = 0; y < this.chunk_size_y; y++) {
                        for (var z = 0; z < this.chunk_size_z; z++) {
                            this.blocks[x][y][z] &= 0xFFFFFF00;
                        }
                    }
                }

                for (var i = 0; i < ff.length; i++) {
                    this.floodFill(ff[i], dir, power);
                }
                //this.build();
                // Recalc health after flood fill
                this.health = (this.current_blocks / this.starting_blocks) * 100;
                this.dirty = true;
                if(this.health < 20) {
                    game.removeFromCD(this.mesh);
                }
            }
            return true;
        }
        return false;
    };

    Chunk.prototype.floodFill = function (start, dir, power) {
        var ground = 1; //this.mesh.position.y - (this.chunk_size_y*this.blockSize / 2);
        var stack = new Array();
        var result = new Array();
        // Keep track of upcoming chunk size.
        var max_x = 0;
        var max_y = 0;
        var max_z = 0;
        
        if((this.blocks[start.x][start.y][start.z] & 0x40) != 0 ||
           (this.blocks[start.x][start.y][start.z] & 0x80) != 0) 
        {
            return;
        }

        stack.push(start);
        while (stack.length != 0) {
            var b = stack.pop();
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
                for(var i = 0; i < result.length; i++) {
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
        }


        if (result.length > 0 && result.length != this.current_blocks) {
           // console.log("CHUNK GND:", ground, "RES:",result.length, "CUR:", this.current_blocks);
            var chunk = new Chunk(0, 0, 0, max_x, max_y, max_z, "ff_object", this.blockSize, false);
            chunk.init();
            for (var i = 0; i < result.length; i++) {
                var p = result[i][0];
                chunk.addBlock(p.x, p.y, p.z, (result[i][1] >> 24) & 0xFF, (result[i][1] >> 16) & 0xFF, (result[i][1] >> 8) & 0xFF);
                //chunk.addBlock(p.x, p.y, p.z, 255 , 0, 200);
                this.blocks[p.x][p.y][p.z] = 0;
                this.current_blocks--;
                //this.rmBlock(p.x, p.y, p.z, dir, 1, true);
            }
            this.dirty = true;

            ffc = new FFChunk();
            ffc.create(chunk);
            ffc.base_type = this.owner.base_type;
            chunk.build();

            game.particles.chunkDebris(
                this.mesh.position.x,
                game.maps.ground+max_y*this.blockSize,
                this.mesh.position.z,
                ffc.chunk,
                dir.x,
                dir.y,
                dir.z,
                power
            );
        }
    };

    Chunk.prototype.explode = function (dir, damage) {
        if(!damage) { damage = 0; }
        for (var x = 0; x < this.chunk_size_x; x++) {
            for (var y = 0; y < this.chunk_size_y; y++) {
                for (var z = 0; z < this.chunk_size_z; z++) {
                    if ((this.blocks[x][y][z] >> 8) != 0) {
                        this.rmBlock(x, y, z, dir, damage);
                    }
                }
            }
        }
        this.mesh.visible = false;
    };

    Chunk.prototype.placeInWorld = function () {
        for (var x = 0; x < this.chunk_size_x; x++) {
            for (var y = 0; y < this.chunk_size_y; y++) {
                for (var z = 0; z < this.chunk_size_z; z++) {
                    if (this.blocks[x][y][z] != 0) {
                        var c = this.blocks[x][y][z];
                        game.world.addBlock(
                            this.mesh.position.x + x,
                            this.mesh.position.y + y,
                            this.mesh.position.z + z,
                            (c >> 24) & 0xFF,
                            (c >> 16) & 0xFF,
                            (c >> 8) & 0xFF
                        );
                    }
                }
            }
        }
        var that = this;
    };

    Chunk.prototype.virtual_explode = function (pos) {
        for (var x = 0; x < this.chunk_size_x; x++) {
            for (var y = 0; y < this.chunk_size_y; y++) {
                for (var z = 0; z < this.chunk_size_z; z++) {
                    if (this.blocks[x][y][z] != 0) {
                        var c = this.blocks[x][y][z];
                        if (get_rand() > 0.9) {
                            game.particles.debris(
                                pos.x + x * this.blockSize / 2,
                                pos.y + y * this.blockSize / 2,
                                pos.z + z * this.blockSize / 2,
                                this.blockSize,
                                (c >> 24) & 0xFF, (c >> 16) & 0xFF, (c >> 8) & 0xFF,
                                true
                            );
                        }
                    }
                }
            }
        }
    };

    Chunk.prototype.blockExists_w = function(pos) {
        var l = (this.blockSize*this.chunk_size_x/2)*(1/this.blockSize);
        var x = this.chunk_size_x - (pos.x - (this.mesh.position.x - l)) | 0; 
        var y = this.chunk_size_y - (pos.y - (this.mesh.position.y - l)) | 0; 
        var z = this.chunk_size_z - (pos.z - (this.mesh.position.z - l)) | 0; 
        if(x >= 0 && y >= 0 && z >= 0 && x < this.chunk_size_x && y < this.chunk_size_y && z < this.chunk_size_z) {
            if((this.blocks[x][y][z] >> 8) != 0) {
                return true;
            }
        }
        return false;
    };


    Chunk.prototype.checkExists = function (x, y, z) {
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
    };

    Chunk.prototype.checkCD = function(vec, range) {
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
    };


};


if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
//////////////////////////////////////////////////////////////////////
// Main class - Where the magic happens
//////////////////////////////////////////////////////////////////////
function Main() {
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
    this.modelLoader = new ModelLoader();
    this.maps = 0;
    this.world = new World();
    this.update_objects = [];
    this.cdList = [];
    this.player = 0;
    this.visible_distance = 250; // from player to hide chunks + enemies.
    this.textures = new Textures();
    this.chunk_material = 0;
    this.objects = {};
    this.ff_objects = [];
    this.sounds = new SoundLoader();

    // Particle stuff.
    this.box_material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    this.sprite_material = new THREE.SpriteMaterial({ color: 0xffffff });
    this.chunk_material = new THREE.MeshPhongMaterial({ vertexColors: THREE.VertexColors, wireframe: false });
    this.p_light = new THREE.PointLight(0xFFAA00, 1, 10);
 
    Main.prototype.init = function() {
        this.sounds.Add({name: "sniper", file: "assets/sounds/sniper.wav.mp3"});
        this.sounds.Add({name: "take_heart", file: "assets/sounds/heart.wav.mp3"});
        this.sounds.Add({name: "walk1", file: "assets/sounds/walk1.wav.mp3"});
        this.sounds.Add({name: "blood1", file: "assets/sounds/blood1.wav.mp3"});
        this.sounds.Add({name: "blood2", file: "assets/sounds/blood2.wav.mp3"});
        this.sounds.Add({name: "blood3", file: "assets/sounds/blood3.wav.mp3"});
        this.sounds.Add({name: "rocket", file: "assets/sounds/rocket_shoot.wav.mp3"});
        this.sounds.Add({name: "rocket_explode", file: "assets/sounds/rocket_explode.wav.mp3"});
        this.sounds.Add({name: "ak47", file: "assets/sounds/ak47.wav.mp3"});
        this.sounds.Add({name: "p90", file: "assets/sounds/p90.wav.mp3"});
        this.sounds.Add({name: "pistol", file: "assets/sounds/pistol.mp3"});
        this.sounds.Add({name: "grenadelauncher", file: "assets/sounds/grenadelauncher.mp3"});
        this.sounds.Add({name: "shotgun", file: "assets/sounds/shotgun_shoot.wav.mp3"});
        this.sounds.Add({name: "shotgun_reload", file: "assets/sounds/shotgun_reload.wav.mp3"});
        this.sounds.Add({name: "minigun", file: "assets/sounds/gunshot1.wav.mp3"});
        this.sounds.Add({name: "fall", file: "assets/sounds/fall.wav.mp3"});
        this.sounds.Add({name: "fall2", file: "assets/sounds/scream.wav.mp3"});
        this.sounds.Add({name: "footsteps", file: "assets/sounds/footsteps.wav.mp3"});
        this.sounds.Add({name: "heartbeat", file: "assets/sounds/heartbeat.wav.mp3"});
        this.sounds.Add({name: "painkillers", file: "assets/sounds/painkillers.wav.mp3"});
        this.sounds.Add({name: "ambient_horror", file: "assets/sounds/ambient_horror.wav.mp3"});
        this.sounds.Add({name: "ambient_street", file: "assets/sounds/ambient_street.mp3"});
        this.sounds.Add({name: "hit1", file: "assets/sounds/hit1.wav.mp3"});
        this.sounds.Add({name: "hit2", file: "assets/sounds/hit2.wav.mp3"});
        this.sounds.Add({name: "hunt1", file: "assets/sounds/kill_you.wav.mp3"});
        this.sounds.Add({name: "hunt2", file: "assets/sounds/take_him.wav.mp3"});
        this.sounds.Add({name: "ammo_fall", file: "assets/sounds/ammo_fall.wav.mp3"});
        this.sounds.Add({name: "reload", file: "assets/sounds/reload.wav.mp3"});
        this.sounds.Add({name: "bullet_wall", file: "assets/sounds/bullet_wall.mp3"});
        this.sounds.Add({name: "bullet_metal", file: "assets/sounds/bullet_metal.mp3"});
       // this.sounds.Add({name: "haha1", file: "assets/sounds/haha.wav.mp3"});
       // this.sounds.Add({name: "haha2", file: "assets/sounds/haha2.wav.mp3"});
       // this.sounds.Add({name: "haha3", file: "assets/sounds/haha3.wav.mp3"});
        //
        //var loader = new THREE.TextureLoader();
        //var that = this;
        //loader.load(
        //    'assets/textures/bump.png',
        //    function (texture) {
        //        //texture.anisotropy = 4;
        //        //texture.repeat.set(0.998, 0.998);
        //        //texture.offset.set(0.001, 0.001);
        //        //texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        //        //texture.format = THREE.RGBFormat;
        //        that.bump_map = new THREE.MeshPhongMaterial({ map: texture,specularMap: texture, vertexColors: THREE.VertexColors, wireframe: false });
        //    }
        //);
        var container = document.getElementById( 'container' );
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        
        // Iosmetric view
       // var aspect = window.innerWidth / window.innerHeight;
       // var d = 70;
       // var aspect = window.innerWidth/window.innerHeight;
       // this.camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, -d, 1, 3000 );
        this.camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, this.visible_distance );
       // this.camera.applyMatrix( new THREE.Matrix4().makeTranslation( 300, 150, 300 ) );
       // this.camera.applyMatrix( new THREE.Matrix4().makeRotationX( -0.8 ) );

        //this.camera.position.set( 200, 300, 700 ); 

      //  this.scene.fog = new THREE.FogExp2( 0xFFA1C1, 0.0059 );
        //this.scene.fog = new THREE.Fog( 0xFFA1C1, 180, this.visible_distance );
        this.scene.fog = new THREE.Fog( 0x000000, 180, this.visible_distance );

     //   this.controls = new THREE.FlyControls( this.camera );
     //   this.controls.movementSpeed = 700;
     //   this.controls.domElement = container;
     //   this.controls.rollSpeed = Math.PI / 10;
     //   this.controls.autoForward = false;
     //   this.controls.dragToLook = false;

        
//
 //       var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1.1 );
 //     //  hemiLight.color.setHSL( 0.6, 0.6, 0.6 );
 //      // hemiLight.groundColor.setHSL( 0.095, 0.5, 0.75 );
 //       hemiLight.position.set( 0, 10, 0 );
 //       this.scene.add( hemiLight );

       // var dirLight = new THREE.DirectionalLight( 0xffffff, 0.6 );
       // dirLight.position.set(0, 50, 40);
       // this.scene.add( dirLight );
       // var dirLight2 = new THREE.DirectionalLight( 0xffffff, 0.6 );
       // dirLight2.position.set(0, 50, -40);
       // this.scene.add( dirLight2 );
       // var dirLight2 = new THREE.DirectionalLight( 0xffffff, 0.6 );
       // dirLight2.position.set(-1000, 0, -40);
       // this.scene.add( dirLight2 );
       // var dirLight2 = new THREE.DirectionalLight( 0xffffff, 0.6 );
       // dirLight2.position.set(1000, 0, -40);
       // this.scene.add( dirLight2 );
//
//
     //   var dirLight = new THREE.DirectionalLight( 0x000000, 1.2 );
     //   dirLight.color.setHSL( 0.5, 0.9, 0.95 );
     //   dirLight.position.set( 20, 10, -20 );
     //   dirLight.position.multiplyScalar( 10);

     //   dirLight.castShadow = true;

     //   dirLight.shadow.mapSize.width = 2048;
     //   dirLight.shadow.mapSize.height = 2048; // 2048

     //   var d = 1500;

     //   dirLight.shadow.camera.left = -d;
     //   dirLight.shadow.camera.right = d;
     //   dirLight.shadow.camera.top = d;
     //   dirLight.shadow.camera.bottom = -d;

     //   dirLight.shadow.camera.far = 1500;
     // //  dirLight.shadow.bias = -0.00001;
     //   this.light1 = dirLight;
     //   this.scene.add(dirLight);

        //   this.controls = new THREE.FirstPersonControls(this.camera);
     //   this.controls.lookSpeed = 0.4;
     //   this.controls.noFly = true;
     //   this.controls.lookVertical = false;
     //   this.controls.constrainVertical = true;
     //   this.controls.verticalMin = Math.PI/2;
     //   //this.controls.verticalMax = 2.0;
     //   this.controls.lon = -150;
     //   this.controls.lat = 120;
     //   this.controls.movementSpeed = 70;

        this.renderer = new THREE.WebGLRenderer({antialias: false});
     //   console.log(window.devicePixelRatio);
        this.renderer.setPixelRatio( 1 );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
       // this.renderer.setClearColor(0xFFA1C1, 1);
      //  this.renderer.setClearColor(0xFFA1C1, 1);
        this.renderer.setClearColor(0x000000, 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild( this.renderer.domElement );
        this.stats = new Stats();
        container.appendChild( this.stats.dom );

        window.addEventListener( 'resize', this.onWindowResize.bind(this), false );

        // Load models
        this.modelLoader.init();
        this.modelLoader.loadFiles();

        // Init world.
        this.world.init();


        // Init particle engine
        this.particles = new ParticlePool();
        this.particles.init(2000, 0);
        this.particles_box = new ParticlePool();
        this.particles_box.init(1000, 1);
        
        // DEBUG STUFF
       // var gridHelper = new THREE.GridHelper( 5000, 100);
       // gridHelper.position.set(0,0,0);
       // game.scene.add( gridHelper );
        
        // Wait for all resources to be loaded before loading map.
        this.textures.prepare();
        this.waitForLoadTextures();
        
    };

    Main.prototype.waitForLoadTextures = function() {
        if(!game.textures.isLoaded()) {
            setTimeout(function() {
                console.log("waiting for load of textures...");
                game.waitForLoadTextures();
            }, 100);
        } else {
            game.waitForLoadMap();
        }
    };

    Main.prototype.waitForLoadMap = function() {
        if(game.modelLoader.files.length > 0) {
            setTimeout(function() {
                console.log("waiting for load of files...");
                game.waitForLoadMap();
            }, 500);
        } else {
            this.maps = new Level1();
            this.maps.init();
            //game.maps.init("Level 1", "assets/maps/map3_ground.png", "assets/maps/map3_objects.png");
            // Load objects here to reduce overhead of multiple objects of same type.
            this.objects["shell"] = new Shell();
            this.objects["shell"].create();
            this.objects["ammo"] = new Ammo();
            this.objects["ammo"].create();
            this.objects["ammo_p90"] = new AmmoP90();
            this.objects["ammo_p90"].create();
            this.objects["ammo_sniper"] = new AmmoSniper();
            this.objects["ammo_sniper"].create();
            this.objects["heart"] = new Heart();
            this.objects["heart"].create();

            this.render();
        }
    };

    Main.prototype.reset = function() {
        this.camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, this.visible_distance );
        this.world.reset();
        this.maps.reset();
        this.player.reset();
        this.cdList = [];
        for(var i = 0; i < this.update_objects.length; i++) {
            if(this.update_objects[i].chunk) {
                this.scene.remove(this.update_objects[i].chunk.mesh);
            }
        }
        this.update_objects = [];
        this.maps.init();
    };

    Main.prototype.onWindowResize = function() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize( window.innerWidth, window.innerHeight );

    };

  //  Main.prototype.animate = function() {
  //      requestAnimationFrame( this.animate.bind(this) );
  //      this.render();
  //  };

    Main.prototype.addObject = function(obj) {
        this.update_objects.push(obj);
    };

    Main.prototype.addToCD = function(obj) {
        if(obj.owner == null || obj.owner == "") {
            var err =  new Error();
            console.log( err.stack);
        }
        if(obj != undefined) {
            this.cdList.push(obj);
        }
    };

    Main.prototype.spliceCDList = function (index) {
        var len = this.cdList.length;
        if (!len) { return; }
        while (index < len) {
            this.cdList[index] = this.cdList[index + 1];
            index++
        }
        this.cdList.length--;
    };

    Main.prototype.removeFromCD = function(obj) {
        for(var i = 0; i < this.cdList.length; i++) {
            // if(this.cdList[i] == null) { continue; }
            if(this.cdList[i] != undefined) {
                if(this.cdList[i].id == obj.id) {
                    //this.cdList.splice(i, 1);
                    this.spliceCDList(i);
                    //this.cdList[i].r ;
                    return;
                }
            }
        }
    };

    Main.prototype.render = function() {
        requestAnimationFrame( this.render.bind(this) );

        var time = (Date.now() - this.t_start)*0.001;
        //var time = Date.now() * 0.00005;
        var delta = this.clock.getDelta();

        // Update all objects
        for(var f in this.update_objects) {
            if(this.update_objects[f] == null) { continue; }
            if(this.update_objects[f].update) {
                this.update_objects[f].update(time, delta);
            } else {
                this.update_objects[f] = null;
            }
        }

        for(var f in this.objects) {
            this.objects[f].update(time, delta);
        }

        //this.controls.update(delta);

        this.stats.update();
        this.particles.update(time, delta);
        this.particles_box.update(time, delta);
        this.world.update(time, delta);
        this.maps.update(time, delta);
        this.renderer.render(this.scene, this.camera);
    };
}

//////////////////////////////////////////////////////////////////////
// Maps class - Loading of maps from images
//////////////////////////////////////////////////////////////////////
function Maps() {
    this.name = "";
    this.ground = 3;
    this.wall_height = 25;
    this.wall_thickness = 2;
    this.objects = [];
    this.wall_texture = 0;
    this.wall2_texture = 0;
    // Object => color in obj image
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

    Maps.prototype.reset = function() {
        for(var i = 0; i < this.loaded.length; i++) {
            if(this.loaded[i].chunk) {
                game.scene.remove(this.loaded[i].chunk.mesh);
            }
        }
        this.loaded = [];
        this.walls = [];
        game.scene.remove(this.ambient_light);
    };

    Maps.prototype.update = function (time, delta) {
        var t1 = 0;
        for (var i = 0; i < this.loaded.length; i++) {
            if(this.loaded[i].chunk && this.loaded[i].chunk.dirty) {
                this.loaded[i].chunk.build();
                t1 = Date.now();
                if((Date.now() - t1) > 3) {
                    break;
                }
            }
            t1 = Date.now();
            if (this.loaded[i].alive) {
                if(this.loaded[i].chunk) {
                    if (this.loaded[i].chunk.mesh.position.distanceTo(game.player.chunk.mesh.position) < game.visible_distance) {
                        this.loaded[i].update(time, delta);
                    }
                } else if(this.loaded[i].x) {
                    if (new THREE.Vector3(this.loaded[i].x, this.loaded[i].y, this.loaded[i].z).distanceTo(game.player.chunk.mesh.position) < game.visible_distance) {
                        this.loaded[i].update(time, delta);
                    }
                } else {
                    this.loaded[i].update(time, delta);
                }
            }
            if((Date.now() - t1) > 3) {
                break;
            }
        }
    };

    Maps.prototype.init = function (name, ground, objects) {
        this.name = name;
        var that = this;

        // Load ground
        loadImageFile(ground, function (data, width, height, map) {
            that.width = width;
            that.height = height;
            var walls = [];
            var floor = [];
            var wall_map = new Array(width);
            for (var x = 0; x < width; x++) {
                wall_map[x] = new Array(height);
            }

            for (var x = 0; x < map.length; x++) {
                for (var z = 0; z < map[x].length; z++) {
                    var p = map[x][z];
                    if (p.a == 0) { continue; }

                    // Black will dissapear in chunk algo.
                    if (p.r == 0 && p.g == 0 && p.b == 0) {
                        p.r = 1;
                        p.g = 1;
                        p.b = 1;
                    }
                    var wall_thickness = game.maps.wall_thickness;
                    var wall_height = game.maps.wall_height;

                    if(p.r == 0x22 && p.g == 0x22 && p.b == 0x22) {
                        for (var y = 0; y < wall_height; y++) {
                            var pix = game.textures.getPixel(y, x, that.wall2_texture);
                            walls.push({ x: x, y: y, z: z, r: pix.r, g: pix.g, b: pix.b });
                            wall_map[x][z] = 1;
                        }
                    }

                    if (map[x + 1][z].a == 0) {
                        for (var y = 0; y < wall_height; y++) {
                            var pix = game.textures.getPixel(y, z, that.wall_texture);
                            for (var xx = 0; xx < wall_thickness; xx++) {
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
                        for (var y = 0; y < wall_height; y++) {
                            var pix = game.textures.getPixel(y, z, that.wall_texture);
                            for (var xx = 0; xx < wall_thickness; xx++) {
                                walls.push({ x: x - xx, y: y, z: z, r: pix.r, g: pix.g, b: pix.b });
                                walls.push({ x: x - xx, y: y, z: z - 1, r: pix.r, g: pix.g, b: pix.b });
                                wall_map[x - xx][z - 1] = 1;
                                wall_map[x - xx][z] = 1;
                            }
                        }
                    }
                    if (map[x][z + 1].a == 0) {
                        for (var y = 0; y < wall_height; y++) {
                            var pix = game.textures.getPixel(y, x, that.wall_texture);
                            for (var zz = 0; zz < wall_thickness; zz++) {
                                walls.push({ x: x - 1, y: y, z: z + zz, r: pix.r, g: pix.g, b: pix.b });
                                walls.push({ x: x, y: y, z: z + zz, r: pix.r, g: pix.g, b: pix.b });
                                wall_map[x - 1][z + zz] = 1;
                                wall_map[x][z + zz] = 1;
                            }
                        }
                    }
                    if (map[x][z - 1].a == 0) {
                        for (var y = 0; y < wall_height; y++) {
                            var pix = game.textures.getPixel(y, x, that.wall_texture);
                            for (var zz = 0; zz < wall_thickness; zz++) {
                                walls.push({ x: x - 1, y: y, z: z - zz, r: pix.r, g: pix.g, b: pix.b });
                                walls.push({ x: x, y: y, z: z - zz, r: pix.r, g: pix.g, b: pix.b });
                                wall_map[x][z - zz] = 1;
                                wall_map[x - 1][z - zz] = 1;
                            }
                        }
                    }

                    // Draw floor
                    for (var y = 0; y < game.maps.ground; y++) {
                        floor.push({ x: x, y: y, z: z, r: p.r, g: p.g, b: p.b });
                    }
                }
            }

            // Find floor and create chunks for it.
            var total_chunks = 0;
            while (true) {
                var x = 0;
                var z = 0;
                var found = false;
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
                var max_x = 0;
                var max_z = 1000;
                var found = false;
                var max_width = 20;
                var max_height = 20;
                for (var x1 = 0; x + x1 < width && x1 < max_width; x1++) {
                    if (map[x + x1][z].a != 0) {
                        max_x++;
                        // Check Z
                        var mz = 0;
                        for (var z1 = 0; z + z1 < height && z1 < max_height; z1++) {
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
                for (var x_ = x; x_ < x + max_x; x_++) {
                    for (var z_ = z; z_ < z + max_z; z_++) {
                        map[x_][z_].a = 0;
                    }
                }

                // Now find all blocks within the range.
                var chunk = new Chunk(x, 0, z, max_x, game.maps.ground, max_z, "floor", 1, "world");
                chunk.init();
                for (var i = 0; i < floor.length; i++) {
                    if (floor[i].x >= x && floor[i].x < x + max_x &&
                        floor[i].z >= z && floor[i].z < z + max_z) {
                        chunk.addBlock(floor[i].x, floor[i].y, floor[i].z, floor[i].r, floor[i].g, floor[i].b);
                    }
                }

                //chunk.addBatch();
                game.world.addChunk(chunk);
            }


            // Find wall and create chunks for them.
            while (true) {
                var x = 0;
                var z = 0;
                var found = false;
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
                // We found a wall position.
                // Get how far on X the wall is.
                var max_x = 0;
                var max_z = 1000;
                var found = false;
                var max_width = 20;
                var max_height = 20;
                for (var x1 = 0; x + x1 < width && x1 < max_width; x1++) {
                    if (wall_map[x + x1][z] == 1) {
                        max_x++;
                        // Check Z
                        var mz = 0;
                        for (var z1 = 0; z + z1 < height && z1 < max_height; z1++) {
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
                for (var x_ = x; x_ < x + max_x; x_++) {
                    for (var z_ = z; z_ < z + max_z; z_++) {
                        wall_map[x_][z_] = 0;
                    }
                }

                // Now find all blocks within the range.
                // 0.01 = offset so we don't see black borders on the floor.
                var chunk = 0;
                if (max_x > max_z) {
                    chunk = new Chunk(x - wall_thickness, that.ground, z - wall_thickness, max_x + wall_thickness, wall_height, max_z + wall_thickness, "x", 1, "world");
                } else {
                    chunk = new Chunk(x - wall_thickness, that.ground, z, max_x + wall_thickness, wall_height, max_z + wall_thickness, "x", 1, "world");
                }
                chunk.init();
                for (var i = 0; i < walls.length; i++) {
                    if (walls[i].x >= x && walls[i].x <= x + max_x &&
                        walls[i].z >= z && walls[i].z <= z + max_z) {
                        chunk.addBlock(walls[i].x, walls[i].y + that.ground, walls[i].z, walls[i].r, walls[i].g, walls[i].b);
                    }
                }
                //chunk.addBatch();
                game.world.addChunk(chunk);
            }

            // Load objects + enemies + player
            loadImageFile(objects, function (data, width, height) {
                var list = [];
                for (var i = 0; i < data.length; i++) {
                    if (data[i].a == 0) { continue; }
                    var found = 0;
                    for (var k in that.objects) {
                        if (data[i].r == that.objects[k].r && data[i].g == that.objects[k].g && data[i].b == that.objects[k].b) {
                            var o = new window[k]();
                            o.create(data[i].y, 0, data[i].x);
                            that.loaded.push(o);
                            if (k == "Player") {
                                game.player = o;
                            }
                            found = 0;
                        }
                        if (found) { break; }
                    }
                }
            });
        });

    };
};

function Map1() {
    Maps.call(this);
    this.wall_texture = WALL2; // from textures class.
    this.wall2_texture = WALL2; // from textures class.
    this.map_file = "assets/maps/map3_ground.png";
    this.obj_file = "assets/maps/map3_objects.png";
    
    
    Map1.prototype.init = function() {
        Maps.prototype.init.call(this, "Level1", this.map_file, this.obj_file);
        this.set_lightning();
        game.sounds.PlaySound("ambient_horror", null, 800, true);
    };

    Map1.prototype.set_lightning = function() {
        this.ambient_light = new THREE.AmbientLight( 0xFFFFFF, 0.9);
        game.scene.add( this.ambient_light );
    };
}
Map1.prototype = new Maps;
Map1.prototype.constructor = Map1;

function Level1() {
    Maps.call(this);
    this.wall_texture = WALL2; // from textures class.
    this.wall2_texture = WOOD_WALL; // from textures class.
    this.map_file = "assets/maps/map3_ground.png";
    this.obj_file = "assets/maps/map3_objects.png";
    
    Level1.prototype.update = function(time, delta) {
        Maps.prototype.update.call(this, time, delta);
        for(var i= 0; i < 2; i++) {
            game.particles.rain();
        }
    };

    Level1.prototype.reset = function() {
        Maps.prototype.reset.call(this);
        game.sounds.StopSound("ambient_horror");
    };
    
    Level1.prototype.init = function() {
        Maps.prototype.init.call(this, "Level1", this.map_file, this.obj_file);
        this.set_lightning();
        game.sounds.PlaySound("ambient_horror", null, 800, true);
    };

    Level1.prototype.set_lightning = function() {
        this.ambient_light = new THREE.AmbientLight( 0xFFFFFF, 0.8);
        game.scene.add( this.ambient_light );
    };
}
Level1.prototype = new Maps;
Level1.prototype.constructor = Level1;

//////////////////////////////////////////////////////////////////////
// ModelLoader class (Loads both .vox and image files)
//////////////////////////////////////////////////////////////////////
function ModelLoader() {
    this.models = []
    this.models["greenie"] = ["/assets/vox/greenie.vox", 1, "object"];
    this.models["agent"] = ["/assets/vox/agent.vox", 0.1, "object"];
    this.models["agentblack"] = ["/assets/vox/agent_black.vox", 0.1, "object"];
    this.models["hearty"] = ["/assets/vox/hearty.vox", 1, "object"];
    this.models["dead_hearty"] = ["/assets/vox/dead_hearty.vox", 1, "object"];
    this.models["player"] = ["/assets/vox/player.vox", 1, "object"];
    this.models["dudo"] = ["/assets/vox/dudo.vox", 1, "object"];
    this.models["lamp1"] = ["/assets/vox/lamp1.vox", 1, "object"];
    this.models["shotgun"] = ["/assets/pixelart/shotgun.png", 8, "object"];
    this.models["shell"] = ["/assets/pixelart/shell.png", 20, "object"];
    this.models["heart"] = ["/assets/pixelart/heart.png", 3, "object"];
    this.models["ammo"] = ["/assets/pixelart/ammo.png", 20, "object"];
    this.models["ak47"] = ["/assets/pixelart/ak47.png", 5, "object"];
    this.models["p90"] = ["/assets/pixelart/p90.png", 5, "object"];
    this.models["pistol"] = ["/assets/pixelart/pistol.png", 5, "object"];
    this.models["sniper"] = ["/assets/pixelart/sniper.png", 5, "object"];
    this.models["minigun"] = ["/assets/pixelart/minigun.png", 10, "object"];
    this.models["rocketlauncher"] = ["/assets/pixelart/rocketlauncher.png", 8, "object"];
    this.models["grenadelauncher"] = ["/assets/pixelart/grenadelauncher.png", 8, "object"];
    this.models["spiderweb"] = ["/assets/pixelart/spiderweb.png", 1, "object"];
    this.models["painkillers"] = ["/assets/pixelart/painkillers.jpg", 1, "object"];
    this.models["radiation_sign"] = ["/assets/pixelart/radiation_sign.png", 1, "object"];
    this.models["ufo_sign"] = ["/assets/pixelart/sign_ufo.png", 1, "object"];
    this.models["barrel"] = ["/assets/vox/barrel.vox", 0.1, "object"];
    this.models["barrel_fire"] = ["/assets/vox/barrel_fire.vox", 0.1, "object"];
    this.models["fbihq"] = ["/assets/vox/fbi_hq.vox", 5, "object"];
    this.models["tree"] = ["/assets/vox/tree.vox", 1, "object"];
    this.models["streetlamp"] = ["/assets/vox/StreetLamp.vox", 1, "object"];
    this.models["tree"] = ["/assets/vox/test1.vox", 1, "object"];
    this.models["paperagent"] = ["/assets/vox/paperagent.vox", 1, "object"];
    this.models["paperpolicecar"] = ["/assets/vox/policecar.vox", 1, "object"];
    //this.models["fbihq"] = ["/assets/vox/demon.vox", 1, "object"];

    this.files = [];

    ModelLoader.prototype.init = function() {
        for(var k in this.models) {
            this.files.push(k);
        }
    };

    ModelLoader.prototype.loadFiles = function() {
        if(this.files.length > 0) {
            key = this.files.pop();   
        } else {
            return;
        }

        var that = this;
        if(this.models[key][0].indexOf("vox") != -1) {
            var oReq = new XMLHttpRequest();
            oReq.open("GET", this.models[key][0], true);
            oReq.responseType = "arraybuffer";

            var that = this;
            oReq.send(null);
            oReq.onload = function () {
                that.models[key][0] = oReq.response;
                that.loadModel(key);
                that.loadFiles();
            };
        } else if(this.models[key][0].indexOf("png") != 1) {
            loadImageFile(this.models[key][0], function(data, width, height) {
                var chunk = new Chunk(0, 0, 0, width, height, that.models[key][1], key, 1, that.models[key][2]);
                chunk.init();
               // var data2 = [];
                for(var i = 0; i < data.length; i++) {
                    for(var y = 0; y < that.models[key][1]; y++) {
                        //data2.push({x: data[i].x, y: data[i].y, z: y, r: data[i].r, g: data[i].g, b: data[i].b});
                        chunk.addBlock(data[i].x, data[i].y, y, data[i].r, data[i].g, data[i].b);
                    }
                }
                chunk.blockSize = 1;
                chunk.build();
                //chunk.batch_points = data2;
                //chunk.bp = data2.length;
                //chunk.addBatch();
                that.models[key] = chunk;
                // Remove mesh from scene (cloned later)
                chunk.mesh.visible = false;
                that.loadFiles();
            });
        }
    };

    ModelLoader.prototype.loadModel = function(name) {
        var vox = new Vox();
        var model = vox.LoadModel(this.models[name][0], name);
        var p = 0, r = 0, g = 0, b = 0;
        var chunk = new Chunk(0, 0, 0, model.sx, model.sz, model.sy, name, this.models[name][1], this.models[key][2]);
        chunk.blockSize = this.models[name][1];
        chunk.init();
        for(var i = 0; i < model.data.length; i++) {
            p = model.data[i];
            r = (p.val >> 24) & 0xFF;
            g = (p.val >> 16) & 0xFF;
            b = (p.val >> 8) & 0xFF;
            if(p.y > model.sy || p.x > model.sx || p.z > model.sz) {
                continue;
            }
            chunk.addBlock(p.x, p.z, p.y, r, g, b);
        }
        //chunk.addBatch();
        // Remove mesh from scene (cloned later)
        chunk.build();
        chunk.mesh.visible = false;
        this.models[name] = chunk;
    };

    ModelLoader.prototype.getModel = function(name, size, obj, only_mesh) {
        if(size == null) { size = 1; }
        if(only_mesh == null) { only_mesh = false; }
        // Depp copy chunk
        var new_obj;
        if(only_mesh) {
            new_obj = {};
            new_obj.owner = obj;
            new_obj.mesh = this.models[name].mesh.clone();
            new_obj.mesh.owner = obj;
         //   new_obj.bb = this.models[name].bb.clone();
           // new_obj.bb.owner = obj;
            //new_obj.mesh.add(new_obj.bb);
            new_obj.mesh.visible = true;
            new_obj.mesh.scale.set(size, size, size);
            game.scene.add(new_obj.mesh);
            game.addToCD(new_obj.mesh);
        } else {
            var new_obj = jQuery.extend(true, {}, this.models[name]);
            new_obj.owner = obj;
            new_obj.blockSize = size;
           // new_obj.bb = undefined;
            new_obj.mesh = undefined;
            new_obj.build();
            // clone mesh and add to scene.
            // new_obj.mesh = this.models[name].mesh.clone();
            // new_obj.bb = this.models[name].bb.clone();
            
           // new_obj.mesh.geometry.computeBoundingBox();
           // new_obj.mesh.geometry.center();
            new_obj.mesh.visible = true;
            game.scene.add(new_obj.mesh);
        }
        return new_obj;
    };
}


/////////////////////////////////////////////////////////////////////
// Objects
/////////////////////////////////////////////////////////////////////
function Obj() {
    this.chunk = 0;
    this.active = [];
    this.ptr = 0;
    this.base_type = "object";
    this.red_light = new THREE.PointLight(0xFF00AA, 2, 10);
    this.yellow_light = new THREE.PointLight(0xFFAA00, 2, 80);
    this.green_light = new THREE.PointLight(0x00FF00, 2, 10);
    this.streetlight = new THREE.SpotLight(0xFFAA00);
    this.max = 20;

    Obj.prototype.create = function(model, size) {
        this.chunk = game.modelLoader.getModel(model, size, this);
        this.chunk.mesh.visible = false;
        this.chunk.mesh.rotation.set(Math.PI, 0, 0);
    };

    Obj.prototype.update = function(time, delta) {
    };

    Obj.prototype.destroy = function() {
      //  this.chunk.explode();
    };
}

function FFChunk() {
    Obj.call(this);
    this.base_type = "";
    this.type = "ff_chunk";

    FFChunk.prototype.hit = function(dmg, dir, type, pos) {
        dir.x += (1-get_rand()*2);
        dir.y += (1-get_rand()*2);
        dir.z += (1-get_rand()*2);
        this.chunk.explode(dir, dmg);
        this.alive = false;
        game.removeFromCD(this.chunk.mesh);
    };

    FFChunk.prototype.create = function(chunk) {
        this.chunk = chunk;
        this.base_type = chunk.owner.base_type;
        this.chunk.owner = this;
        this.chunk.build();
        game.maps.loaded.push(this);
        game.addToCD(this.chunk.mesh);
        //game.addToCD(this.chunk.bb);

    };
};
FFChunk.prototype = new Obj; 
FFChunk.prototype.constructor = FFChunk;

function Portal() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "portal";
    this.alive = true;
    this.x = 0;
    this.y = 0;
    this.z = 0;

    Portal.prototype.create = function(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    };

    Portal.prototype.update = function(time, delta) {
        var x = 0; 
        var r = 10;
        for(var a = 0; a < Math.PI*2; a+=Math.PI/4) {
            x = this.x + r * Math.cos(a)
            z = this.z + r * Math.sin(a)
            game.particles.portalMagic(x, game.maps.ground, z);
        }
    };
}
Portal.prototype = new Obj; 
Portal.prototype.constructor = Portal;

// Painkillers
function PainKillers() {
    Obj.call(this);
    this.base_type = "object";
    this.obj_type = "painkillers";
    this.alive = true;
    this.light = 0;
    this.taken = false;

    PainKillers.prototype.grab = function (mesh_id) {
        if(!this.taken) {
            game.sounds.PlaySound("painkillers", this.chunk.mesh.position, 250);
            game.removeFromCD(this.chunk.mesh);
            game.player.bleed_timer += 60; // add 60 sec.
            this.taken = true;
        }
    };

    PainKillers.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("painkillers", 0.2, this);
        this.chunk.owner = this;
        this.chunk.mesh.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.position.set(x, game.maps.ground+1, z);
        game.addToCD(this.chunk.mesh);
    };

    PainKillers.prototype.update = function(time, delta) {
        Obj.prototype.update.call();
        if(!this.taken) {
            this.chunk.mesh.rotation.y += Math.sin(delta);
            this.chunk.mesh.position.y = game.maps.ground+6 + Math.sin(time * 2.5);
        } else {
            this.chunk.mesh.position.y += 0.5;
            if(this.chunk.mesh.position.y > game.maps.ground + 30) {
                this.chunk.virtual_explode(this.chunk.mesh.position);
                this.chunk.destroy();
                this.alive = false;
            }
        }
    };
}
PainKillers.prototype = new Obj; 
PainKillers.prototype.constructor = PainKillers;

function PaperPoliceCar() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "paperpolicecar";
    this.alive = true;

    PaperPoliceCar.prototype.hit = function(dmg, dir, type, pos) {
        this.chunk.hit(dir, dmg, pos);
    };

    PaperPoliceCar.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("paperpolicecar", 0.6, this);
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.position.set(x, game.maps.ground+(this.chunk.chunk_size_y*this.chunk.blockSize)/2, z);
    };
}
PaperPoliceCar.prototype = new Obj; 
PaperPoliceCar.prototype.constructor = PaperPoliceCar;

function PaperAgent() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "paperagent";
    this.alive = true;

    PaperAgent.prototype.hit = function(dmg, dir, type, pos) {
        this.chunk.hit(dir, dmg, pos);
    };

    PaperAgent.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("paperagent", 0.2, this);
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.position.set(x, game.maps.ground+(this.chunk.chunk_size_y*this.chunk.blockSize)/2, z);
    };
}
PaperAgent.prototype = new Obj; 
PaperAgent.prototype.constructor = PaperAgent;

function Tree() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "tree";
    this.alive = true;
    this.light = 0;

    Tree.prototype.hit = function(dmg, dir, type, pos) {
        this.chunk.hit(dir, dmg, pos);
    };

    Tree.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("tree", 0.5, this);
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.position.set(x, game.maps.ground+(this.chunk.chunk_size_y*this.chunk.blockSize)/2, z);
    };
}
Tree.prototype = new Obj; 
Tree.prototype.constructor = Tree;

function StreetLamp() {
    Obj.call(this);
    this.base_type = "object";
    this.obj_type = "street_lamp";
    this.alive = true;
    this.light = 0;

    StreetLamp.prototype.hit = function(dmg, dir, type, pos) {
        if(this.chunk.hit(dir, dmg, pos)) {
            if(type != "missile" && type != "grenade") {
                game.sounds.PlaySound("bullet_metal", pos, 300);
            }
           // if(this.light.intensity > 0) {
           //     this.light.intensity -= 0.5*dmg;
           //     if(this.light.intensity < 0) {
           //         this.light.intensity = 0;
           //     }
           // }
            if (this.chunk.health < 60) {
                this.alive = false;
            }
            return true;
        }
        return false;
    };

    StreetLamp.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("streetlamp", 0.4, this);
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
      //  this.light = this.streetlight.clone();
      //  var targetObject = new THREE.Object3D();
      //  targetObject.position.set(0, 0, 0);
      //  game.scene.add(targetObject);
      //  this.light.target = targetObject;
      //  this.light.decay = 1;
      //  this.light.intensity = 2.4;
      //  this.light.distance = 80;
      //  this.light.angle = Math.PI;
       // this.chunk.mesh.add(targetObject);
       // this.chunk.mesh.add(this.light);
        // DEBUG
      //  var m = new THREE.Mesh(new THREE.BoxGeometry(2,2,2),
      //                         new THREE.MeshBasicMaterial({color: 0xFF0000}));
      //  this.light.add(m);

       // this.light.position.set(0, 15, 0);
   //     this.chunk.mesh.rotation.x = -Math.PI;
        // Check rotation depending on wall
        this.chunk.mesh.position.set(x, game.maps.ground+10, z);
        //this.chunk.mesh.position.set(x, game.maps.ground+this.chunk.to_y*(1/this.chunk.blockSize), z);
        var res = game.world.checkExists(new THREE.Vector3(x-1,game.maps.ground+10,z));
        if(res.length > 0) {
       //     this.chunk.mesh.rotation.y = -Math.PI*2;
            this.chunk.mesh.position.x += 10;
        //    this.light.position.set(7, 18, 0);
        }
        res = game.world.checkExists(new THREE.Vector3(x,game.maps.ground+10,z-1));
        //if(res.length > 0) {
        //    this.chunk.mesh.rotation.y = -Math.PI;
        //}
        //res = game.world.checkExists(new THREE.Vector3(x+1,game.maps.ground+10,z+2));
        //if(res.length > 0) {
        //    this.chunk.mesh.rotation.y = -Math.PI;
        //   // this.chunk.mesh.position.x -= 10;
        //}
        for(var i = 0; i < 10; i++) {
            res = game.world.checkExists(new THREE.Vector3(x+i,game.maps.ground+10,z));
            if(res.length > 0) {
        //        this.chunk.mesh.rotation.y = Math.PI;
                this.chunk.mesh.position.x -= 10;
                //this.light.position.set(7, 18, 0);
                break;
            }
        }
    };

    StreetLamp.prototype.update = function(time, delta) {
      //  if (get_rand() < this.light.intensity) {
      //      game.particles_box.fire(
      //          this.chunk.mesh.position.x,
      //          this.chunk.mesh.position.y + 15,
      //          this.chunk.mesh.position.z
      //      );
      //  }
    };
}
StreetLamp.prototype = new Obj; 
StreetLamp.prototype.constructor = StreetLamp;

// UfoSign
function UfoSign() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "radiation_sign";
    this.alive = true;
    this.light = 0;

    UfoSign.prototype.hit = function(dmg, dir, type, pos) {
       return this.chunk.hit(dir, dmg, pos);
    };

    UfoSign.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("ufo_sign", 0.2, this);
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.rotation.y = Math.PI/2;
   //     this.chunk.mesh.rotation.x = -Math.PI;
        // Check rotation depending on wall
        var res = game.world.checkExists(new THREE.Vector3(x-1,game.maps.ground+10,z));
        if(res.length > 0) {
            this.chunk.mesh.rotation.y = -Math.PI/2;
        }
        res = game.world.checkExists(new THREE.Vector3(x,game.maps.ground+10,z-1));
        if(res.length > 0) {
            this.chunk.mesh.rotation.y = 2*Math.PI;
        }
        res = game.world.checkExists(new THREE.Vector3(x,game.maps.ground+10,z+2));
        if(res.length > 0) {
            this.chunk.mesh.rotation.y = -Math.PI;
        }

        this.chunk.mesh.position.set(x, game.maps.ground+10, z);
    };
}
UfoSign.prototype = new Obj; 
UfoSign.prototype.constructor = UfoSign;

// RadiationSign
function RadiationSign() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "radiation_sign";
    this.alive = true;
    this.light = 0;

    RadiationSign.prototype.hit = function(dmg, dir, type, pos) {
        this.chunk.hit(dir, dmg, pos);
    };

    RadiationSign.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("radiation_sign", 0.2, this);
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.rotation.y = Math.PI/2;
        this.chunk.mesh.rotation.x = -Math.PI;
        // Check rotation depending on wall
        var res = game.world.checkExists(new THREE.Vector3(x-1,game.maps.ground+10,z));
        if(res.length > 0) {
            this.chunk.mesh.rotation.y = -Math.PI/2;
        }
        res = game.world.checkExists(new THREE.Vector3(x,game.maps.ground+10,z-1));
        if(res.length > 0) {
            this.chunk.mesh.rotation.y = 2*Math.PI;
        }
        res = game.world.checkExists(new THREE.Vector3(x,game.maps.ground+10,z+2));
        if(res.length > 0) {
            this.chunk.mesh.rotation.y = Math.PI;
        }

        this.chunk.mesh.position.set(x, game.maps.ground+10, z);
    };
}
RadiationSign.prototype = new Obj; 
RadiationSign.prototype.constructor = RadiationSign;

// Dead hearty
function DeadHearty() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "dead_hearty";
    this.alive = true;
    this.light = 0;
    this.radioactive = true;
    this.radioactive_leak = true;

    DeadHearty.prototype.hit = function(dmg, dir, type, pos) {
        //this.chunk.explode(dir, dmg);
        this.chunk.hit(dir, dmg, pos);
        this.alive = false;
    };

    DeadHearty.prototype.update = function(time, delta) {
        var pos = this.chunk.mesh.position;
        game.particles.radiation(pos.x+(2-get_rand()*4), pos.y, pos.z+(2-get_rand()*4));
        if(get_rand() > 0.9) {
            this.light.intensity = (2-get_rand());
        }
    };

    DeadHearty.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("dead_hearty", 1, this);
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.rotation.y = Math.random()*Math.PI*2;
        this.chunk.mesh.position.set(x, game.maps.ground+1, z);
        this.light = this.green_light.clone();
        this.light.position.set(0, 3, 0);
        this.chunk.mesh.add(this.light);
    };
}
DeadHearty.prototype = new Obj; 
DeadHearty.prototype.constructor = DeadHearty;

function BarrelFire() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "barrel_fire";
    this.alive = true;
    this.light = 0;

    BarrelFire.prototype.hit = function(dmg, dir, type, pos) {
        if(this.chunk.hit(dir, dmg, pos)) {
            if(type != "missile" && type != "grenade") {
                game.sounds.PlaySound("bullet_metal", pos, 300);
            }
            this.alive = false;
            return true;
        } 
        return false;
    };

    BarrelFire.prototype.update = function(time, delta) {
        var pos = this.chunk.mesh.position;
        game.particles.fire(pos.x+(4-get_rand()*8), game.maps.ground+6+this.chunk.to_y*2, pos.z+(4-get_rand()*8));
        if(get_rand() > 0.9) {
            this.light.intensity = 2-get_rand()*0.1;
            this.light.distance = (20+get_rand()*5);
        }
    };

    BarrelFire.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("barrel_fire", 0.5, this);
        this.chunk.mesh.position.set(x, game.maps.ground+this.chunk.to_y*(1/this.chunk.blockSize), z);
        this.light = this.yellow_light.clone();
        this.light.position.set(0, 10, 0);
        this.chunk.mesh.add(this.light);
    };
}
BarrelFire.prototype = new Obj; 
BarrelFire.prototype.constructor = BarrelFire;

function Barrel() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "barrel";
    this.alive = true;
    this.light = 0;
    this.radioactive = true;
    this.radioactive_leak = true;

    Barrel.prototype.hit = function(dmg, dir, type, pos) {
        //this.chunk.explode(dir, dmg);
        if(this.chunk.hit(dir, dmg, pos)) {
            if(type != "missile" && type != "grenade") {
                game.sounds.PlaySound("bullet_metal", pos, 300);
            }
            this.alive = false;
            return true;
        } 
        return false;
    };

    Barrel.prototype.update = function(time, delta) {
        var pos = this.chunk.mesh.position;
        game.particles.radiation(pos.x+(1-get_rand()*2), game.maps.ground+4+this.chunk.to_y*2, pos.z+(1-get_rand()*2));
        if(get_rand() > 0.9) {
            this.light.intensity = 2-get_rand()*0.1;
            this.light.distance = (20+get_rand()*5);
        }
    };

    Barrel.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("barrel", 0.5, this);
        //this.chunk.owner = this;
        //this.chunk.mesh.visible = true;
      //  this.chunk.mesh.rotation.y = Math.random()*Math.PI*2;
       // this.chunk.mesh.rotation.y = -Math.PI;
        this.chunk.mesh.position.set(x, game.maps.ground+this.chunk.to_y*(1/this.chunk.blockSize), z);
        this.light = this.green_light.clone();
        this.light.position.set(0, 10, 0);
        this.chunk.mesh.add(this.light);
    };
}
Barrel.prototype = new Obj; 
Barrel.prototype.constructor = Barrel;

function FBIHQ() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "fbihq";
    this.alive = true;

    FBIHQ.prototype.hit = function(dmg, dir, type, pos) {
        this.chunk.hit(dir, dmg, pos);
    };

    FBIHQ.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("fbihq", 1, this);
        //this.chunk.mesh.rotation.y = -Math.PI;
        this.chunk.mesh.position.set(x, game.maps.ground+this.chunk.chunk_size_y*this.chunk.blockSize/2, z);
    };
}
FBIHQ.prototype = new Obj; 
FBIHQ.prototype.constructor = FBIHQ;

// Spiderweb
function SpiderWeb() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "spiderweb";
    this.alive = true;
    this.light = 0;

    SpiderWeb.prototype.hit = function(dmg, dir, type) {
        this.chunk.explode(dir, dmg);
        this.alive = false;
    };

    SpiderWeb.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("spiderweb", 0.2, this);
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.position.set(x, game.maps.ground+1, z);
    };
}
SpiderWeb.prototype = new Obj; 
SpiderWeb.prototype.constructor = SpiderWeb;

// Ammo crate 
function Lamp1() {
    Obj.call(this);
    this.base_type = "object";
    this.type = "lamp1";
    this.alive = true;
    this.light = 0;

    Lamp1.prototype.hit = function(dmg, dir, type, pos) {
        this.chunk.hit(dir, dmg, pos)
        if(this.light.intensity > 0) {
            this.light.intensity -= 0.5*dmg;
            if(this.light.intensity < 0) {
                this.light.intensity = 0;
            }
        }
        if (this.chunk.health < 60) {
            this.alive = false;
        }
    };

    Lamp1.prototype.create = function(x, y, z) {
        this.chunk = game.modelLoader.getModel("lamp1", 1, this);
        this.chunk.type = "object";
        this.chunk.owner = this;
        this.chunk.mesh.visible = true;
        this.chunk.mesh.position.set(x, game.maps.ground+7, z);
        this.light = this.yellow_light.clone();
        this.light.position.set(0, 12, 0);
        this.chunk.mesh.add(this.light);
    };

    Lamp1.prototype.update = function(time, delta) {
        if (get_rand() < this.light.intensity) {
            game.particles_box.fire(
                this.chunk.mesh.position.x,
                this.chunk.mesh.position.y + 8,
                this.chunk.mesh.position.z
            );
        }
    };
}
Lamp1.prototype = new Obj; 
Lamp1.prototype.constructor = Lamp1;

// Ammo crate 
function AmmoCrate() {
    Obj.call(this);
    this.sides = [];

    AmmoCrate.prototype.create = function() {
        var up = game.modelLoader.getModel("crate", 1, this);
        up.mesh.visible = false;
        up.mesh.rotation.set(Math.PI, 0, 0);
        up.mesh.position.set(200, 8, 300);

    };
}
AmmoCrate.prototype = new Obj; 
AmmoCrate.prototype.constructor = AmmoCrate;

// Ammo shell 
function AmmoSniper() {
    Obj.call(this);

    AmmoSniper.prototype.create = function() {
        Obj.prototype.create.call(this, "ammo", 0.02);
        for(var i = 0; i < this.max; i++) {
            var c = this.chunk.mesh.clone();
            c.visible = false;
            game.scene.add(c);
            this.active.push(c);

        }
    };

    AmmoSniper.prototype.add = function(x,y,z) {
        if(this.ptr++ >= this.max - 1) {
            this.ptr = 0;
        }
        game.particles.empty_shell(x,y,z, this.active[this.ptr]);
    };
}
AmmoSniper.prototype = new Obj; 
AmmoSniper.prototype.constructor = AmmoSniper;

// Ammo shell
function AmmoP90() {
    Obj.call(this);

    AmmoP90.prototype.create = function() {
        Obj.prototype.create.call(this, "ammo", 0.009);
        for(var i = 0; i < this.max; i++) {
            var c = this.chunk.mesh.clone();
            c.visible = false;
            game.scene.add(c);
            this.active.push(c);

        }
    };

    AmmoP90.prototype.add = function(x,y,z) {
        if(this.ptr == this.max - 1) {
            this.ptr = 0;
        }
        this.ptr++;
        game.particles.empty_shell(x,y,z, this.active[this.ptr]);
    };
}
AmmoP90.prototype = new Obj; 
AmmoP90.prototype.constructor = AmmoP90;

// Ammo shell
function Ammo() {
    Obj.call(this);

    Ammo.prototype.create = function() {
        Obj.prototype.create.call(this, "ammo", 0.015);
        for(var i = 0; i < this.max; i++) {
            var c = this.chunk.mesh.clone();
            c.visible = false;
            game.scene.add(c);
            this.active.push(c);
        }
    };

    Ammo.prototype.add = function(x,y,z) {
        if(this.ptr == this.max - 1) {
            this.ptr = 0;
        }
        this.ptr++;
        game.particles.empty_shell(x,y,z, this.active[this.ptr]);
    };
}
Ammo.prototype = new Obj; 
Ammo.prototype.constructor = Ammo;

// Shotgun shell
function Shell() {
    Obj.call(this);

    Shell.prototype.create = function() {
        Obj.prototype.create.call(this, "shell", 0.025);
        for(var i = 0; i < this.max; i++) {
            var c = this.chunk.mesh.clone();
            c.visible = false;
            game.scene.add(c);
            this.active.push(c);
        }
    };

    Shell.prototype.add = function(x,y,z) {
//        game.particles.empty_shell(x,y,z, this.chunk);
        if(this.ptr++ >= this.max - 1) {
            this.ptr = 0;
        }
        game.particles.empty_shell(x,y,z, this.active[this.ptr]);
    };
}
Shell.prototype = new Obj; 
Shell.prototype.constructor = Shell;

// Heart
function Heart() {
    Obj.call(this);
    this.obj_type = "heart";

    Heart.prototype.create = function() {
        Obj.prototype.create.call(this, "heart", 0.2);
    };

    Heart.prototype.grab = function (mesh_id) {
        for(var i = 0; i < this.active.length; i++) {
            if(this.active[i].id == mesh_id) {
                game.sounds.PlaySound("take_heart", this.active[i].position, 250);
                game.removeFromCD(this.active[i]);
                this.active[i].alive = false;
            }
        }
    };

    Heart.prototype.update = function(time, delta) {
        Obj.prototype.update.call();
        for(var i = 0; i < this.active.length; i++) {
            if (this.active[i].alive) {
                this.active[i].rotation.y += Math.sin(delta);
                this.active[i].position.y = game.maps.ground+6 + Math.sin(time * 2.5);
                if(get_rand() > 0.5) {
                    game.particles.blueMagic(
                                             this.active[i].position.x,
                                             this.active[i].position.y,
                                             this.active[i].position.z
                    );
                }
            } else {
                if (this.active[i].position.y < game.maps.ground+20) {
                    //this.active[i].rotation.y += time*10;
                    this.active[i].position.y += 0.3;
                } else {
                    this.active[i].rotation.y = 0;
                    this.chunk.virtual_explode(this.active[i].position);
                    game.scene.remove(this.active[i]);
                    this.active.splice(i, 1);
                }
            }
        }
    };

    Heart.prototype.add = function(x,y,z) {
        var m = this.chunk.mesh.clone();
        game.scene.add(m);
        m.position.set(x,y,z);
        m.visible = true;
        this.active.push(m);
        m.alive = true;
        m.owner = this;
        var l1 = this.red_light.clone();
        var l2 = this.red_light.clone();
        m.add(l1);
        m.add(l2);
        l1.position.y = 2;
        l1.position.z = -2;
        l2.position.y = 2;
        l2.position.z = 2;
        game.addToCD(m);
      //  var light1 = new THREE.PointLight( 0xFF00AA, 2, 20 );
      //  m.add( light1 );
    };
}
Heart.prototype = new Obj; 
Heart.prototype.constructor = Heart;


function ParticlePool(size, type) {
    this.particles = [];
    this.queue = [];
    this.size = size;
    this.pos = 0;
    this.neg = 0;
    this.old_shells = [];
    this.clean_old_shells = 0;
    this.opts = 0;
    this.update_cnt = 0;
    this.lights = [];

    ParticlePool.prototype.init = function (size, type) {
        this.size = size;
        for (var i = 0; i < this.size; i++) {
            var p = new Particle();
            p.init(type);
            this.particles.push(p);
        }
    };

    ParticlePool.prototype.update = function (time, delta) {
        // Dim lights 
        for(var i = 0; i < this.lights.length; i++) {
            this.lights[i].intensity -= 0.5;
            if (this.lights[i].intensity <= 0) {
                if (this.lights[i].parent != null) {
                    this.lights[i].parent.remove(this.lights[i]);
                } else {
                    game.scene.remove(this.lights[i]);
                }
            }
        }

        // Clean up shells
        if (this.clean_old_shells > 0.2) {
            for (var i = 0; i < this.old_shells.length; i++) {
                if (this.old_shells[i] == null) {
                    continue;
                }
                this.old_shells[i].position.y -= 0.06;
                if (this.old_shells[i].position.y < game.maps.ground-1) {
                    //game.scene.remove(this.old_shells[i]);
                    this.old_shells[i].visible = false;
                    //   this.old_shells[i].geometry.dispose();
                    //   this.old_shells[i].material.dispose();
                    //this.old_shells.splice(i, 1);
                    this.old_shells[i] = null;
                }
            }
            this.clean_old_shells = 0;
        }
        this.clean_old_shells += delta;

        // Create max particles each frame
        for (var i = 0; i < 300; i++) {
            if (this.queue.length == 0) {
                break;
            }
            var p = this.queue.pop();
            if (this.create(p) == -1) {
                this.queue.push(p);
                break;
            }
        }

        var tot = 0;
        var ts = 0;
        for (var i = this.update_cnt; i < this.particles.length; i++) {
            this.update_cnt = i;
            if (this.particles[i].active) {
                if(this.particles[i].type == "grenade" || this.particles[i].type == "missile" || this.particles[i].type == "minigun" || this.particles[i].type == "shell") {
                    this.particles[i].update(time, delta);
                } else {
                    if(tot < 5) {
                        ts = Date.now();
                        this.particles[i].update(time, delta);
                        tot += (Date.now() - ts);
                    }
                }
            }
        }
        if(this.update_cnt == this.particles.length - 1) {
            this.update_cnt = 0;
        }
    };

    ParticlePool.prototype.create = function (opts) {
        for (var i = 0; i < this.particles.length; i++) {
            if (!this.particles[i].active) {
                this.particles[i].set(opts);
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
    ParticlePool.prototype.fire = function (x, y, z) {
        this.get({
            size: 0.5,
            type: "smoke",
            r: 200 + get_rand() * 55 | 0,
            g: get_rand() * 180 | 0,
            b: get_rand() * 200 | 0,
            x: x,
            y: y,
            z: z,
            life: get_rand() * 1,
            power: 0.01,
            gravity: 0,
            bounces: 0,
            mass: 10,
            fx_: 0.5,
            fz_: 0.5,
            vx: 0.5 - get_rand() * 1,
            vy: get_rand(),
            vz: 0.5 - get_rand() * 1
        });
    };

    ParticlePool.prototype.explosion = function (x, y, z, power, type) {
        var c = 0;
        for (var i = 0; i < power*10; i++) {
            c = 50+ get_rand()*205|0;
           // Add smoke
            this.get({
                size: 0.5,
                type: "smoke",
                x: x+2-get_rand()*4,
                y: y,
                z: z+2-get_rand()*4,
                r: c,
                g: c,
                b: c,
                life: get_rand()*3,
                power: get_rand() * 5,
                gravity: -0.5,
                bounces: 0,
                mass: 10,
                fx_: 0.1,
                fz_: 0.1,
                vx: get_rand(),
                vy: get_rand()*2,
                vz: get_rand()
            });
            // add fire
            this.get({
                size: 0.5,
                type: "smoke",
                r: 200+get_rand()*55|0,
                g: 180,
                b: get_rand()*50|0,
                x: x+2-get_rand()*4,
                y: y,
                z: z+2-get_rand()*4,
                life: get_rand()*3,
                power: 5 + get_rand() * 5,
                gravity: 5,
                bounces: 0,
                mass: 10,
                fx_: 0.5,
                fz_: 0.5,
                vx: 3 - get_rand() * 6,
                vy: get_rand() * 8,
                vz: 3 - get_rand() * 6
            });
        }
        if (type == "missile") {
            var p = game.p_light.clone();
            p.position.set(x, y, z);
            p.visible = true;
            p.intensity = 20;
            p.distance = 30;
            game.scene.add(p);
            game.particles.lights.push(p);
        } else {
           // var p = game.p_light.clone();
           // p.position.set(x, y, z);
           // p.visible = true;
           // p.intensity = 4;
           // p.distance = 10;
           // game.scene.add(p);
           // game.particles.lights.push(p);
        }
    };



    ParticlePool.prototype.chunkDebris = function (x, y, z, chunk, dirx, diry, dirz, power) {
        var vx, vy, vz, fx, fz;
        fz = get_rand(); //0.3;//+power/50;
        fx = get_rand(); // 0.3;//+power/50;
        vx = dirx + (1 - get_rand() * 2);
        vy = diry + get_rand() * 4;
        vz = dirz + (1 - get_rand() * 2);
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
            power: (1 + get_rand() * 5),
            gravity: 9.82,
            bounces: 2 + get_rand() * 2 | 0,
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
        var vx, vy, vz, fx, fz;
        vx = get_rand();
        vy = get_rand();
        vz = get_rand();
        fx = 0.2 + get_rand();
        fz = 0.2 + get_rand();
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
            r: get_rand() * 50 | 0,
            g: 200 + get_rand() * 100 | 0,
            b: 50 + get_rand() * 55 | 0,
            size: size,
            x: x,
            y: y,
            z: z,
            life: get_rand() * 20,
            power: 2 + get_rand() * 2,
            gravity: get_rand()*2,
            bounces: 0,
            mass: 10,
            fx_: 1.5 - Math.random()*3,
            fz_: 1.5 - Math.random()*3,
            vx: 0.5 - get_rand() * 2,
            vy: 0.5 + get_rand() * 2,
            vz: 0.5 - get_rand() * 2
        });
    };

    // Radioactive leaks
    ParticlePool.prototype.radioactive_leak = function (x, y, z, size) {
        this.get({
            type: "radioactive_leak",
            r: get_rand() * 50 | 0,
            g: 200 + get_rand() * 55 | 0,
            b: 50 + get_rand() * 55 | 0,
            size: size,
            x: x,
            y: y,
            z: z,
            life: get_rand() * 3,
            power: 2 + get_rand() * 2,
            gravity: 9.82,
            bounces: 0,
            mass: 10,
            fx: 0.2 + (0.5 - get_rand() * 1),
            fz: 0.2 + (0.5 - get_rand() * 1),
            vx: 1-Math.random()*2,
            vy: get_rand()*2.5,
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
            life: get_rand() * 3,
            power: 3 + get_rand() * 3,
            gravity: 9.82,
            r: 138,
            g: get_rand() * 15 | 0,
            b: get_rand() * 15 | 0,
            bounces: 2,
            mass: 10,
            fx: 0.2 + (0.5 - get_rand() * 1),
            fz: 0.2 + (0.5 - get_rand() * 1),
            vx: dirx + (0.5 - get_rand() * 1),
            vy: diry + get_rand(),
            vz: dirz + (0.5 - get_rand() * 1)
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
            life: get_rand() * 4,
            power: 5 + get_rand() * 5,
            gravity: 9.82,
            r: r,
            g: g,
            b: b,
            bounces: 2 + get_rand() * 2 | 0,
            mass: 10,
            fx_: 0.5 - Math.random(),
            fz_: 0.5 - Math.random(),
            vx: 2 - get_rand() * 4,
            vy: 3 + get_rand() * 4,
            vz: 2 - get_rand() * 4
        });
    };


    // Debris 
    ParticlePool.prototype.debris = function (x, y, z, size, r, g, b, virtual, dirx, diry, dirz, stay) {
        if(stay == null) { stay = true; }
        var vx, vy, vz, fx, fz;
        var type;
        var gravity = 9.82;
        if (dirx != null) {
            vx = dirx;
            vy = diry + get_rand() * 4;
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
                vx = 2 - get_rand() * 4;
                vy = 2 + get_rand() * 4;
                vz = 2 - get_rand() * 4;
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
        var bounces = 0;
        var life = 0;
        if(!stay) {
            bounces = 0;
            life = 0.8;
        } else {
            bounces = 2 + get_rand()*2|0;
            life = get_rand() * 4;
        }
        this.get({
            stay: stay,
            type: type,
            size: size,
            x: x,
            y: y,
            z: z,
            life: life,
            power: 5 + get_rand() * 5,
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

    ParticlePool.prototype.rain = function () {
        var rand1 = Math.random() * game.maps.width;
        var rand2 = Math.random() * game.maps.height;
        this.get({
            type: "rain",
            size: 0.5,
            x: rand1,
            y: 200,
            z: rand2,
            life: get_rand() * 15,
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

    ParticlePool.prototype.snow = function () {
        var rand1 = Math.random() * game.maps.width;
        var rand2 = Math.random() * game.maps.height;
        this.get({
            type: "snow",
            size: 0.8,
            x: rand1,
            y: 150,
            z: rand2,
            life: get_rand() * 25,
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
        var rand = -2 + get_rand() * 4;
        var rand_c = get_rand() * 100 | 0;
        this.get({
            size: 1,
            x: x + rand,
            y: y - 3,
            z: z + rand,
            life: get_rand(),
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
        var r = 0; 
        var g = 0;
        var b = 0;
        if(get_rand() > 0.5) {
            r = get_rand() * 50 | 0;
            g = 100 + get_rand() * 100 | 0;
            b = 200 + get_rand() * 55 | 0;
        } else {
            r = 200 + get_rand() * 55 | 0;
            g = 0;
            b = 200 + get_rand() * 55 | 0; 
        }
        this.get({
            size: 0.5,
            x: 3 - get_rand() * 6 + x,
            y: 3 - get_rand() * 6 + y,
            z: 3 - get_rand() * 6 + z,
            life: get_rand() * 1.3,
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
            x: 3 - get_rand() * 6 + x,
            y: 3 - get_rand() * 6 + y,
            z: 3 - get_rand() * 6 + z,
            life: get_rand() * 1.3,
            power: 0.5,
            gravity: -1,
            r: get_rand() * 50 | 0,
            g: 200 + get_rand() * 100 | 0,
            b: 50 + get_rand() * 55 | 0,
        });
    };

    ParticlePool.prototype.blueMagic = function (x, y, z) {
        this.get({
            size: 0.5,
            x: 3 - get_rand() * 6 + x,
            y: 3 - get_rand() * 6 + y,
            z: 3 - get_rand() * 6 + z,
            life: get_rand() * 1.3,
            power: 0.5,
            gravity: -2,
            r: get_rand() * 50 | 0,
            g: 100 + get_rand() * 100 | 0,
            b: 200 + get_rand() * 55 | 0,
        });
    };

    ParticlePool.prototype.debris_smoke = function (x, y, z, size) {
        // random black/white + fire
        var r, g, b;
        var v = get_rand();
        if (v < 0.3) {
            r = 200 + get_rand() * 55;
            g = 150 + get_rand() * 80;
            b = 20 + get_rand() * 20;
            // white 
            //          r = g = b = 200+get_rand()*55;
        } else if (v < 0.6) {
            // black
            //            r = g = b = 0+get_rand()*50;

            r = 200 + get_rand() * 55;
            g = 80 + get_rand() * 80;
            b = 20 + get_rand() * 20;
        } else {
            r = 150 + get_rand() * 105;
            g = 80 + get_rand() * 80;
            b = 20 + get_rand() * 20;
        }
        this.get({
            size: size,
            x: x,
            y: y,
            z: z,
            life: get_rand() * 0.5,
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
            life: get_rand(),
            power: 0.5,
            gravity: -2,
            r: 255,
            g: 255,
            b: 255,
        });
    };

    ParticlePool.prototype.gunSmoke = function (x, y, z, dirx, diry, dirz) {
        var rand_c = get_rand() * 100 | 0;
        this.get({
            size: 0.5,
            x: x + (2 - get_rand() * 4),
            y: y,
            z: z + (2 - get_rand() * 4),
            life: get_rand() * 1,
            power: 5.5,
            gravity: get_rand() * 6,
            r: 200 + rand_c,
            g: 100 + rand_c,
            b: 0,
            fx_: 0.1,
            fz_: 0.1,
            vx: get_rand() + dirx,
            vy: get_rand() + diry,
            vz: get_rand() + dirz,
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
            life: 4+get_rand()*2,
            gravity: 9.82,
            bounces: get_rand()*3|0,
            power: 2,
            fx_: 1.2,
            fz_: 1.2,
            vx: dirx,
            vz: dirz,
            vy: diry+(0.6-get_rand()*1) + 5,
            light: false,
        });
    };

    ParticlePool.prototype.ammoMissile = function (x, y, z, dirx, diry, dirz, owner, chunk, speed, dmg) {
        var p = this.get({
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
            vx: dirx+(0.1-get_rand()*0.2),
            vz: dirz+(0.1-get_rand()*0.2),
            vy: diry+(0.1-get_rand()*0.2),
            light: false,
        });
    };

    // Ammo for shotgun
    ParticlePool.prototype.ammoShell = function (x, y, z, dirx, diry, dirz, owner, speed, dmg) {
        var shots = [];
        for (var i = 0; i < 10; i++) {
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
                vx: dirx + (1 - get_rand() * 2),
                vz: dirz + (1 - get_rand() * 2),
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
            vx: dirx+(0.1-get_rand()*0.2),
            vz: dirz+(0.1-get_rand()*0.2),
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
            vx: dirx+(0.5-get_rand()),
            vz: dirz+(0.5-get_rand()),
            vy: diry+(0.5-get_rand()),
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
            vx: dirx+(0.1-get_rand()*0.2),
            vz: dirz+(0.1-get_rand()*0.2),
            vy: diry,
        });
    };
}

function Particle() {
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

    Particle.prototype.set = function (opts) {
        if (!this.isVisible(new THREE.Vector3(opts.x, opts.y, opts.z))) {
            return;
        }
        for (var k in opts) {
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
            // game.scene.remove(this.mesh);
            this.mesh = this.chunk_mesh;
            //            game.scene.add(this.mesh);
            this.mesh.visible = true;
            this.mesh.position.set(this.x, this.y, this.z);
        }
        if (this.light) {
            var p = game.p_light.clone();
            p.visible = true;
            p.intensity = 15;
            p.distance = 30;
            this.mesh.add(p);
            game.particles.lights.push(p);
            // var light = game.p_light.clone();
            // this.mesh.add(light);
            // TBD: Handle this better w/o setTimeout
            //setTimeout(function () { p.mesh.remove(light); }, p.life * 500);
        }
        this.active = 1;
    };

    Particle.prototype.reset = function () {
        if (this.type == "chunk_debris" || this.type == "empty_shell") {
            if (this.type == "empty_shell") {
                var found = -1;
                for (var i = 0; i < game.particles.old_shells.length; i++) {
                    if (game.particles.old_shells[i] == null) {
                        found = i;
                        break;
                    }
                }
                if (found == -1) {
                    game.particles.old_shells.push(this.mesh);
                } else {
                    game.particles.old_shells[found] = this.mesh;
                }
            }
            this.mesh = this.old_mesh;
            this.mesh.visible = true;
            //            game.scene.add(this.mesh);
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
        this.bounces_orig = (1 + get_rand() * 2) | 0;
        this.fx_ = get_rand() * 2;
        this.fz_ = get_rand() * 2;

        this.newPos = 0;
        this.ticks = 0;
       // this.flip = 0.5;

        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.type = 0;
        this.chunk = null;
        this.light = false;
        this.hit = false;
        this.stay = true;
    };

    Particle.prototype.init = function (particle_type) {
        this.particle_type = particle_type;
        if (particle_type == 0) {
            this.mesh = new THREE.Sprite(game.sprite_material.clone());
        } else {
            this.mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), game.box_material.clone());
        }

        game.scene.add(this.mesh);
        this.mesh.visible = false;
        this.mesh.castShadow = false;
    };

    Particle.prototype.checkLife = function () {
        if (this.life <= 0 || this.mesh.position.y < 0) {
            this.active = 0;
            this.mesh.visible = false;
            return;
        }
    };

    Particle.prototype.isVisible = function (pos) {
        if (game.player != 0) {
            if (pos.distanceTo(game.player.chunk.mesh.position) > game.visible_distance) {
                return false;
            }
        }
        return true;
    };

    Particle.prototype.update = function (time, delta) {
        this.life -= delta;
        this.checkLife();

        if (this.life > 0 && this.active) { // || this.mesh.position.y < -5) {
            this.fy = this.grav_mass;
           // this.fx = this.grav_mass * this.flip;
           // this.fz = this.fx;
            //if (this.flip > 0) {
            //    this.flip = -0.5;
            //} else {
            //    this.flip = 0.5;
            //}

            //this.fy += this.air_area * this.vy * this.vy;
            //this.fx += this.air_area * this.vx * this.vx;
            //this.fz += this.air_area * this.vz * this.vz;
            this.fy += this.air_area * this.vy * this.vy;
            this.fx = this.air_area * this.vx * this.vx;
            this.fz = this.air_area * this.vz * this.vz;

            this.dy = this.vy * delta + (this.avg_ay * 0.0005);
            this.dx = this.vx * delta + (this.avg_ax * 0.0005);
            this.dz = this.vz * delta + (this.avg_az * 0.0005);

            // 10
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
                    if (get_rand() > 0.8) {
                        game.particles.debris_smoke(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.5);
                    }
                    this.mesh.rotation.set(this.vx, this.vy, this.vz);
                    this.bounce();
                    break;
                case "debris":
                    this.mesh.rotation.set(this.vx, this.vy, this.vz);
                    this.bounce();
                break;
            case "chunk_debris":
                this.mesh.rotation.set(
                        this.vx/this.spin, 
                        this.vy/this.spin, 
                        this.vz/this.spin
                );
                if(this.chunk.owner.base_type == "enemy" || this.chunk.owner.base_type == "player") {
                    game.particles.blood(
                              this.mesh.position.x + (2 - get_rand() * 4),
                              this.mesh.position.y + (2 - get_rand() * 4),
                              this.mesh.position.z + (2 - get_rand() * 4),
                              0.5, this.vx/this.spin, this.vy/this.spin, this.vz/this.spin
                    );
                    this.bounce();
                }
                break;
                case "empty_shell":
                    this.mesh.rotation.set(this.vx, this.vy, this.vz);
                    if(get_rand() > 0.96) {
                        game.sounds.PlaySound("ammo_fall", this.mesh.position, 210);
                    }
                    this.bounce();
                    if (get_rand() > 0.9) {
                        game.particles.smoke(this.mesh.position.x + get_rand(), this.mesh.position.y, this.mesh.position.z, 0.3); // this.mesh.rotation);
                    }
                    break;
                case "radioactive_leak":
                    this.addRadiationToGround();
                    break;
                case "radioactive_splat":
                   // this.gravity = get_rand()*Math.sin(time);
                    break;
                case "blood":
                    this.addBloodToGround();
                    break;
                case "minigun":
                   // if (get_rand() > 0.9) {
                   //     game.particles.smoke(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.3); //, this.mesh.rotation);
                   // }
                    this.cd(time, delta);
                    break;
                case "missile":
                    //game.particles.smoke(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.2); //, this.mesh.rotation);
                    this.cd(time, delta);
                    game.particles.smoke(
                        this.mesh.position.x - 0.5 + get_rand(),
                        this.mesh.position.y - 0.5 + get_rand(),
                        this.mesh.position.z - 0.5 + get_rand(),
                        0.3); //, this.mesh.rotation);
                    break;
                case "shell":
                    this.cd(time, delta);
                    break;
                case "grenade":
                    game.particles.smoke(
                        this.mesh.position.x - 0.5 + get_rand(),
                        this.mesh.position.y - 0.5 + get_rand(),
                        this.mesh.position.z - 0.5 + get_rand(),
                        0.3); //, this.mesh.rotation);
                    this.bounce();
                    this.cd(time, delta);
                    break;
                case "snow":
                    this.mesh.position.z += get_rand()*Math.cos(time/5);
                    this.mesh.position.x += get_rand()*Math.cos(time/5);
                    break;
                case "rain":
                    if(get_rand() > 0.5) {
                        this.splatterRain();
                    }
                    break;
            }

            // Add blocks to ground
            if ((this.type == "snow" || this.type == "virtual_debris" || this.type == "debris" || this.type == "world_debris") && this.stay == true) {
                if (game.world.checkExists(this.mesh.position.clone()).length != 0) {
                    if ((this.type == "debris" && this.bounces == 0) || this.type == "world_debris") {
                        //if(this.size >= 1) {
                            game.world.addBlock(this.mesh.position.x, this.mesh.position.y + 1, this.mesh.position.z, this.r, this.g, this.b);
                        //}
                        this.active = 0;
                    }else if(this.type == "snow") {
                        game.world.addBlock(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.r, this.g, this.b);
                    }
                }
            } else if (this.type == "empty_shell" || this.type == "chunk_debris") {
                this.keepOnGround();
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
                    this.mesh.rotation.set(1.57, 0, Math.PI * get_rand());
                    //this.placeOnGround();
                    break;
                case "shell":
                    game.particles.smoke(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.5);
                    break;
                case "grenade":
                    game.particles.explosion(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.power, this.type);
                    game.world.explode(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.damage, this.type);
                    game.sounds.PlaySound("rocket_explode", this.mesh.position, 1000);
                    break;
                case "missile":
                    //game.world.explode(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.power);
                    if(!this.hit) {
                        game.particles.explosion(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.power, this.type);
                        game.world.explode(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.damage, this.type);
                    }
                    game.sounds.PlaySound("rocket_explode", this.mesh.position, 800);
                    break;
             //   case "minigun":
                    //game.world.explode(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.power);
                    //game.particles.explosion(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.power);
             //       break;
            }
            this.reset();
        }
    };

    Particle.prototype.bounce = function () {
        if (this.bounces > 0 && this.mesh.position.y <= game.maps.ground+1) {
            this.mesh.position.y += this.bounces;
            this.bounces--;
            this.vy *= this.e;
            this.spin++;
            return true;
        }
        return false;
    };

    Particle.prototype.keepOnGround = function () {
        if (game.world.checkExists(this.mesh.position.clone()).length != 0) {
            this.active = 0;
            this.mesh.position.y = game.maps.ground;
        }
    };

    Particle.prototype.addRadiationToGround = function () {
        if (game.world.checkExists(this.mesh.position.clone()).length != 0) {
            game.world.addColorBlock(this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z, this.r, this.g, this.b);
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x + 1, this.mesh.position.y-1, this.mesh.position.z + 1, this.r, this.g, this.b);
            }
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x - 1, this.mesh.position.y-1, this.mesh.position.z + 1,this.r, this.g, this.b);
            }
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z + 1, this.r, this.g, this.b);
            }
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z - 1, this.r, this.g, this.b);
            }
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x - 1, this.mesh.position.y-1, this.mesh.position.z - 1, this.r, this.g, this.b);
            }
            this.active = 0;
        }
    };

    Particle.prototype.addBloodToGround = function () {
        if (game.world.checkExists(this.mesh.position.clone()).length != 0) {
            game.world.addColorBlock(this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z, 138, 7, 7);
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x + 1, this.mesh.position.y-1, this.mesh.position.z + 1, 128, 7, 7);
            }
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x - 1, this.mesh.position.y-1, this.mesh.position.z + 1, 158, 7, 7);
            }
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z + 1, 158, 7, 7);
            }
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x, this.mesh.position.y-1, this.mesh.position.z - 1, 158, 20, 20);
            }
            if (get_rand() > 0.5) {
                game.world.addColorBlock(this.mesh.position.x - 1, this.mesh.position.y-1, this.mesh.position.z - 1, 128, 20, 20);
            }
            this.active = 0;
        }
    };

    Particle.prototype.splatterRain = function (time, delta) {
        if (game.world.checkExists(this.mesh.position.clone()).length != 0) {
            game.particles.debris(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.2, this.r, this.g, this.b, false,null,null,null,false);
            game.particles.debris(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0.2, this.r, this.g, this.b, false,null,null,null,false);
            this.active = 0;
        }
    };

    Particle.prototype.cd = function (time, delta) {
        var directionVector = new THREE.Vector3(this.vx, this.vy, this.vz);

        var o = 1;
        for(var idx = 0; idx < game.cdList.length; idx++) {
            if((game.cdList[idx].position.x - game.cdList[idx].owner.chunk.chunk_size_x*game.cdList[idx].owner.chunk.blockSize/2) <= this.mesh.position.x + o &&
               (game.cdList[idx].position.x + game.cdList[idx].owner.chunk.chunk_size_x*game.cdList[idx].owner.chunk.blockSize/2) >= this.mesh.position.x - o )
            {
                if((game.cdList[idx].position.z - game.cdList[idx].owner.chunk.chunk_size_z*game.cdList[idx].owner.chunk.blockSize/2) <= this.mesh.position.z + o &&
                   (game.cdList[idx].position.z + game.cdList[idx].owner.chunk.chunk_size_z*game.cdList[idx].owner.chunk.blockSize/2) >= this.mesh.position.z - o)
                {
                    if (game.cdList[idx].owner.base_type == "object") {
                        if(game.cdList[idx].owner.hit) {
                            if(game.cdList[idx].owner.hit(this.damage, directionVector, this.type, this.mesh.position)) {
                                this.active = 0;
                                this.hit = true;
                                return;
                            }
                        }
                    } else if (game.cdList[idx].owner.base_type == "player" || game.cdList[idx].owner.base_type == "enemy") {
                        if (game.cdList[idx].owner.chunk.mesh.id != this.owner) {
                            game.cdList[idx].owner.hit(this.damage, directionVector, this.type, this.mesh.position);
                            this.active = 0;
                            this.hit = true;
                            return;
                        }
                    }
                }
            }
        }
        if(game.world.checkExists(this.mesh.position.clone()).length > 0) {
            game.world.explode(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.damage, this.type);
            if(this.type == "missile") {
                game.particles.explosion(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.power, this.type);
                game.sounds.PlaySound("rocket_explode", this.mesh.position, 800);
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

    SoundLoader.prototype.PlaySound = function(name, position, radius, loop) {
        if(loop == null) { loop = false; }
        this.sounds[name].source = this.context.createBufferSource();
        this.sounds[name].source.buffer = this.sounds[name].buffer;
        this.sounds[name].gainNode = this.context.createGain();
        this.sounds[name].source.connect(this.sounds[name].gainNode);
        this.sounds[name].source.loop = loop;
        this.sounds[name].gainNode.connect(this.context.destination);
        this.sounds[name].source.start(0);

        var that = this;
        this.sounds[name].source.onended = function() {
            that.sounds[name].source = null;
        };

        if(position != undefined) {
            var vector = game.camera.localToWorld(new THREE.Vector3(0,0,0));
            var distance = position.distanceTo( vector );
            if ( distance <= radius ) {
                var vol = 1 * ( 1 - distance / radius );
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
        //var context = new AudioContext();
        var loader = new BufferLoader(this.context,
                                      [args.file],
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
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";

        var loader = this;

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
        for (var i = 0; i < this.urlList.length; ++i)
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
        ["map1.png", IMAGE],
        ["wall.jpg", IMAGE],
        ["road.jpg", IMAGE], 
        ["grass1.jpg", IMAGE], 
        ["tree1.jpg", IMAGE],
        ["dirt.jpg", IMAGE],
        ["stone_wall.jpg", IMAGE],
        ["wall2.png", IMAGE],
        ["floor1.png", IMAGE],
        ["radioactive.png", IMAGE],
        ["wall_level1.png", IMAGE],
        ["wood_fence.png", IMAGE],
        ["wall2_level1.png", IMAGE],
    ];
    this.tex = [];
    this.loaded = 0;
    this.heightMap = {};

    Textures.prototype.clean = function() {
        for(var i = 0; i < this.tex.length; i++) {
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
        for(var i = 0; i < this.files.length; i++) {
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
        var tx = (x/this.tex[tex_id].height)|0; 
        var xx = x - (tx*this.tex[tex_id].height);
        var ty = (y/this.tex[tex_id].width)|0; 
        var yy = y - (ty*this.tex[tex_id].width);
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
        var image = new Image();
        image.src = "assets/textures/"+filename;
        image.id = id;
        var ctx = document.createElement('canvas').getContext('2d');
        var that = this;

        image.onload = function() {
            var scale = 1;
            ctx.canvas.width = image.width;
            ctx.canvas.height = image.height;

            that.tex[image.id].width = image.width;
            that.tex[image.id].height = image.height;

            var size = image.width * image.height;
            var data = new Float32Array( size );

            ctx.drawImage(image,0,0);

            for ( var i = 0; i < size; i ++ ) {
                data[i] = 0
            }

            var imaged = ctx.getImageData(0, 0, image.width, image.height);
            var pix = imaged.data;

            that.tex[image.id].map = new Array();
            for(var y = 0; y < image.height; y++) {
                var pos = y * image.width * 4;
                that.tex[image.id].map[y] = new Array();
                for(var x = 0; x < image.width; x++) {
                    var all = pix[pos]+pix[pos+1]+pix[pos+2];
                    pos++;
                    pos++;
                    pos++;
                    that.tex[image.id].map[y][x] = all;
                }
            }
            that.loaded++;
        }
    };

    Textures.prototype.load = function(filename, id) {
        var image = new Image();
        image.src = "assets/textures/"+filename;
        image.id = id;
        var ctx = document.createElement('canvas').getContext('2d');
        var that = this;
        image.onload = function() {
            ctx.canvas.width  = image.width;
            ctx.canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            that.tex[image.id].width = image.width;
            that.tex[image.id].height = image.height;
            that.tex[image.id].map = new Array();
            var imgData = ctx.getImageData(0, 0, image.width, image.height);
            for(var y = 0; y < image.height; y++) {
                var pos = y * image.width * 4;
                that.tex[image.id].map[y] = new Array();
                for(var x = 0; x < image.width; x++) {
                    var r = imgData.data[pos++];
                    var g = imgData.data[pos++];
                    var b = imgData.data[pos++];
                    var a = imgData.data[pos++];
                    that.tex[image.id].map[y][x] = {'r': r, 'g': g, 'b': b, 'a': a};
                }
            }
            that.loaded++;
        }
    };

}

//////////////////////////////////////////////////////////////////////
// Random number generator (faster than Math.random())
// https://en.wikipedia.org/wiki/Linear_feedback_shift_register
//////////////////////////////////////////////////////////////////////
var lfsr = (function(){
  var max = Math.pow(2, 16),
      period = 0,
      seed, out;
  return {
    setSeed : function(val) {
      out = seed = val || Math.round(Math.random() * max);
    },
    rand : function() {
      var bit;
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
// Static random numbers used where repetition is not an issue
// ruby: x = [] ; 200.times do |d| x << (rand(100000).to_f)/100000.0 end
//////////////////////////////////////////////////////////////////////
// Between 0 - 1
var stat_num_map = [
    0.77746, 0.38325, 0.82969, 0.05736, 0.33151, 0.43286, 0.26037, 0.85439, 0.57122, 0.73872, 0.28077,
    0.49789, 0.58933, 0.09512, 0.75828, 0.41196, 0.0807, 0.50793, 0.75701, 0.68665, 0.08474, 0.16016,
    0.43875, 0.81966, 0.61215, 0.13987, 0.50136, 0.95285, 0.57436, 0.70174, 0.67813, 0.49587, 0.83456,
    0.73027, 0.86012, 0.0924, 0.43373, 0.98667, 0.45188, 0.79781, 0.3626, 0.59903, 0.99556, 0.43216,
    0.45571, 0.64112, 0.85143, 0.75009, 0.94958, 0.36195, 0.35397, 0.58863, 0.01064, 0.68362, 0.05133,
    0.44274, 0.68037, 0.63273, 0.74691, 0.17625, 0.73156, 0.52864, 0.35168, 0.72908, 0.89366, 0.83301,
    0.42203, 0.06304, 0.94694, 0.54525, 0.32247, 0.57608, 0.80634, 0.12162, 0.02639, 0.27409, 0.25831,
    0.44754, 0.11184, 0.02311, 0.03436, 0.34766, 0.79593, 0.6783, 0.19008, 0.00183, 0.9768, 0.3301,
    0.20512, 0.11993, 0.58733, 0.03422, 0.18652, 0.33865, 0.24856, 0.77101, 0.09319, 0.55872, 0.4192,
    0.19792, 0.38903, 0.18217, 0.65521, 0.94122, 0.6499, 0.30811, 0.89826, 0.09543, 0.87178, 0.51089,
    0.89722, 0.1274, 0.9531, 0.13679, 0.25896, 0.37279, 0.43501, 0.21727, 0.88999, 0.11503, 0.17848,
    0.16564, 0.88475, 0.3432, 0.39633, 0.5139, 0.36382, 0.69775, 0.06262, 0.66089, 0.33486, 0.78529,
    0.93855, 0.43085, 0.47818, 0.51298, 0.03996, 0.46495, 0.66424, 0.70112, 0.82315, 0.23446, 0.41075,
    0.04516, 0.52066, 0.17212, 0.49415, 0.63684, 0.03172, 0.33451, 0.72341, 0.18837, 0.2362, 0.97798,
    0.90431, 0.11286, 0.05978, 0.15245, 0.3747, 0.49159, 0.09513, 0.75614, 0.05216, 0.4333, 0.45121,
    0.1803, 0.80168, 0.54211, 0.70403, 0.11684, 0.16551, 0.2291, 0.20917, 0.87581, 0.01812, 0.78673,
    0.42666, 0.1552, 0.3867, 0.71406, 0.58447, 0.80413, 0.72927, 0.99886, 0.18384, 0.48211, 0.60929,
    0.87499, 0.30788, 0.34838, 0.73324, 0.2314, 0.3593, 0.91898, 0.10065, 0.39987, 0.72087, 0.4016,
    0.25805, 0.05051, 0.70141, 0.83446, 0.84307, 0.05106, 0.00964, 0.3026, 0.31798, 0.95077, 0.11042,
    0.14119, 0.84516, 0.98542, 0.98902, 0.05506, 0.6112, 0.67786, 0.69112, 0.84239, 0.36507, 0.01173,
    0.87732, 0.6359, 0.35604, 0.24673, 0.44617, 0.37018, 0.76193, 0.72712, 0.88626, 0.01643, 0.9409,
    0.18734, 0.03506, 0.67585, 0.28602, 0.74197, 0.17264, 0.9465, 0.42938, 0.41604, 0.21111, 0.2791,
    0.9034, 0.16715, 0.59769, 0.73084, 0.60744, 0.67604, 0.48812, 0.12001, 0.76125, 0.46963, 0.39409,
    0.36054, 0.32468, 0.19014, 0.66838, 0.54969, 0.09771, 0.22431, 0.1457, 0.66945, 0.71004, 0.69441,
    0.36207, 0.48927, 0.89035, 0.90515, 0.43973, 0.02986, 0.3815, 0.86726, 0.13784, 0.68904, 0.38601,
    0.69549, 0.78781, 0.3029, 0.86677, 0.5366, 0.62056, 0.0575, 0.20683, 0.10916, 0.0233, 0.25164,
    0.72227, 0.97402, 0.45464, 0.55953, 0.45408, 0.27305, 0.63581, 0.38718, 0.04453, 0.78245, 0.67373,
    0.72035, 0.38357, 0.26547
];
var cnt = 0;
function get_rand() {
    if(cnt < stat_num_map.length-1) {
        cnt++;
    } else {
        cnt = 0;
    }
    return stat_num_map[cnt];
}


//////////////////////////////////////////////////////////////////////
// Load image files to pixel map
//////////////////////////////////////////////////////////////////////
function loadImageFile(file, callback) {
    var image = new Image();
    image.src = file;
    var ctx = document.createElement('canvas').getContext('2d');
    var that = this;
    image.onload = function() {
        ctx.canvas.width  = image.width;
        ctx.canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        var map = new Array();
        var imgData = ctx.getImageData(0, 0, image.width, image.height);

        var list = [];
        for(var y = 0; y < image.height; y++) {
            var pos = y * image.width * 4;
            map[y] = new Array();
            for(var x = 0; x < image.width; x++) {
                var r = imgData.data[pos++];
                var g = imgData.data[pos++];
                var b = imgData.data[pos++];
                var a = imgData.data[pos++];
                map[y][x] = {};
                map[y][x].r = r;
                map[y][x].g = g;
                map[y][x].b = b;
                map[y][x].a = a;
                if(a != 0 && !(r == 0 && g == 0 && b == 0)) {
                    list.push({x: x, y: y, z: 0, r: r, g: g, b: b, a: a});
                }
            }
        }
        //callback(map, image.width, image.height);
        callback(list, image.width, image.height, map);
    }
}

function LockPointer() {
    var e = document.body;
    //var e = document.getElementById('container');
    e.requestPointerLock = e.requestPointerLock ||
        e.mozRequestPointerLock ||
        e.webkitRequestPointerLock;

    e.requestPointerLock();
}

function isFrontOfPlayer(v1) {
    var targetPosition = new THREE.Vector3();
    targetPosition = targetPosition.setFromMatrixPosition(v1.matrixWorld);
    var lookAt = game.player.chunk.mesh.getWorldDirection();
    var pos = targetPosition.sub(game.player.chunk.mesh.position);

    return (pos.angleTo(lookAt))-0.4 < (Math.PI /6);
}

//==============================================================================
// Author: Nergal
// http://webgl.nu
// Date: 2014-11-17
//==============================================================================
function VoxelData() {
    this.x;
    this.y;
    this.z;
    this.color;

    VoxelData.prototype.Create = function(buffer, i) {
        this.x = buffer[i++] & 0xFF;
        this.y = buffer[i++] & 0xFF;
        this.z = buffer[i++] & 0xFF;
        this.color = buffer[i] & 0xFF;
    };
}
VoxelData.prototype = new VoxelData();
VoxelData.prototype.constructor = VoxelData;

var Vox = function() {
    var voxColors = [
        0x00000000, 0xffffffff, 0xffccffff, 0xff99ffff, 0xff66ffff, 0xff33ffff, 0xff00ffff, 0xffffccff, 0xffccccff, 0xff99ccff, 0xff66ccff, 0xff33ccff, 0xff00ccff, 0xffff99ff, 0xffcc99ff, 0xff9999ff,
        0xff6699ff, 0xff3399ff, 0xff0099ff, 0xffff66ff, 0xffcc66ff, 0xff9966ff, 0xff6666ff, 0xff3366ff, 0xff0066ff, 0xffff33ff, 0xffcc33ff, 0xff9933ff, 0xff6633ff, 0xff3333ff, 0xff0033ff, 0xffff00ff,
        0xffcc00ff, 0xff9900ff, 0xff6600ff, 0xff3300ff, 0xff0000ff, 0xffffffcc, 0xffccffcc, 0xff99ffcc, 0xff66ffcc, 0xff33ffcc, 0xff00ffcc, 0xffffcccc, 0xffcccccc, 0xff99cccc, 0xff66cccc, 0xff33cccc,
        0xff00cccc, 0xffff99cc, 0xffcc99cc, 0xff9999cc, 0xff6699cc, 0xff3399cc, 0xff0099cc, 0xffff66cc, 0xffcc66cc, 0xff9966cc, 0xff6666cc, 0xff3366cc, 0xff0066cc, 0xffff33cc, 0xffcc33cc, 0xff9933cc,
        0xff6633cc, 0xff3333cc, 0xff0033cc, 0xffff00cc, 0xffcc00cc, 0xff9900cc, 0xff6600cc, 0xff3300cc, 0xff0000cc, 0xffffff99, 0xffccff99, 0xff99ff99, 0xff66ff99, 0xff33ff99, 0xff00ff99, 0xffffcc99,
        0xffcccc99, 0xff99cc99, 0xff66cc99, 0xff33cc99, 0xff00cc99, 0xffff9999, 0xffcc9999, 0xff999999, 0xff669999, 0xff339999, 0xff009999, 0xffff6699, 0xffcc6699, 0xff996699, 0xff666699, 0xff336699,
        0xff006699, 0xffff3399, 0xffcc3399, 0xff993399, 0xff663399, 0xff333399, 0xff003399, 0xffff0099, 0xffcc0099, 0xff990099, 0xff660099, 0xff330099, 0xff000099, 0xffffff66, 0xffccff66, 0xff99ff66,
        0xff66ff66, 0xff33ff66, 0xff00ff66, 0xffffcc66, 0xffcccc66, 0xff99cc66, 0xff66cc66, 0xff33cc66, 0xff00cc66, 0xffff9966, 0xffcc9966, 0xff999966, 0xff669966, 0xff339966, 0xff009966, 0xffff6666,
        0xffcc6666, 0xff996666, 0xff666666, 0xff336666, 0xff006666, 0xffff3366, 0xffcc3366, 0xff993366, 0xff663366, 0xff333366, 0xff003366, 0xffff0066, 0xffcc0066, 0xff990066, 0xff660066, 0xff330066,
        0xff000066, 0xffffff33, 0xffccff33, 0xff99ff33, 0xff66ff33, 0xff33ff33, 0xff00ff33, 0xffffcc33, 0xffcccc33, 0xff99cc33, 0xff66cc33, 0xff33cc33, 0xff00cc33, 0xffff9933, 0xffcc9933, 0xff999933,
        0xff669933, 0xff339933, 0xff009933, 0xffff6633, 0xffcc6633, 0xff996633, 0xff666633, 0xff336633, 0xff006633, 0xffff3333, 0xffcc3333, 0xff993333, 0xff663333, 0xff333333, 0xff003333, 0xffff0033,
        0xffcc0033, 0xff990033, 0xff660033, 0xff330033, 0xff000033, 0xffffff00, 0xffccff00, 0xff99ff00, 0xff66ff00, 0xff33ff00, 0xff00ff00, 0xffffcc00, 0xffcccc00, 0xff99cc00, 0xff66cc00, 0xff33cc00,
        0xff00cc00, 0xffff9900, 0xffcc9900, 0xff999900, 0xff669900, 0xff339900, 0xff009900, 0xffff6600, 0xffcc6600, 0xff996600, 0xff666600, 0xff336600, 0xff006600, 0xffff3300, 0xffcc3300, 0xff993300,
        0xff663300, 0xff333300, 0xff003300, 0xffff0000, 0xffcc0000, 0xff990000, 0xff660000, 0xff330000, 0xff0000ee, 0xff0000dd, 0xff0000bb, 0xff0000aa, 0xff000088, 0xff000077, 0xff000055, 0xff000044,
        0xff000022, 0xff000011, 0xff00ee00, 0xff00dd00, 0xff00bb00, 0xff00aa00, 0xff008800, 0xff007700, 0xff005500, 0xff004400, 0xff002200, 0xff001100, 0xffee0000, 0xffdd0000, 0xffbb0000, 0xffaa0000,
        0xff880000, 0xff770000, 0xff550000, 0xff440000, 0xff220000, 0xff110000, 0xffeeeeee, 0xffdddddd, 0xffbbbbbb, 0xffaaaaaa, 0xff888888, 0xff777777, 0xff555555, 0xff444444, 0xff222222, 0xff111111
    ];


    Vox.prototype.readInt = function(buffer, from) {
        return buffer[from]| (buffer[from+1] << 8) |  (buffer[from+2] << 16) | (buffer[from+3] << 24);
    };

    Vox.prototype.LoadModel = function(data, name) {
        var colors = [];
        var colors2 = undefined;
        var voxelData = [];

        var map = new Array();
        var sizex = 0, sizey = 0, sizez = 0;

        if (data) {
            var buffer = new Uint8Array(data);

            var i = 0;
            var type = String.fromCharCode(parseInt(buffer[i++]))+
                String.fromCharCode(parseInt(buffer[i++]))+
                String.fromCharCode(parseInt(buffer[i++]))+
                String.fromCharCode(parseInt(buffer[i++]));
            var version = this.readInt(buffer, i);
            i += 4;

            while(i < buffer.length) {
                var id = String.fromCharCode(parseInt(buffer[i++]))+
                    String.fromCharCode(parseInt(buffer[i++]))+
                    String.fromCharCode(parseInt(buffer[i++]))+
                    String.fromCharCode(parseInt(buffer[i++]));

                var chunkSize = this.readInt(buffer, i) & 0xFF;
                i += 4;
                var childChunks = this.readInt(buffer, i) & 0xFF;
                i += 4;

                if(id == "SIZE") {
                    sizex = this.readInt(buffer, i) & 0xFF;
                    i += 4;
                    sizey = this.readInt(buffer, i) & 0xFF;
                    i += 4;
                    sizez = this.readInt(buffer, i) & 0xFF;
                    i += 4;

                    for(var x = 0; x < sizex; x++) {
                        map[x] = new Array();
                        for(var y = 0; y < sizey; y++) {
                            map[x][y] = new Array();
                        }
                    }
                   // i += chunkSize - 4 * 3;
                } else if (id == "XYZI") {
                    var numVoxels = this.readInt(buffer, i);
                    i += 4;
                    voxelData = new Array(numVoxels);
                    for (var n = 0; n < voxelData.length; n++) {
                        voxelData[n] = new VoxelData();
                        voxelData[n].Create(buffer, i); // Read 4 bytes
                        i += 4;
                       // if(voxelData[n].x > sizex || voxelData[n].y > sizey || voxelData[n].z > sizez) {
                       //     console.log("VOXELS:",numVoxels, "N:",n);
                       //     voxelData.length = n;
                       //     break;
                       // }
                        //   // Workaround for some issues I can't figure out!?
                        //   // numVoxels are not correct in some particular case and I can't see anything wrong
                        //   // towards the .vox specification.
                        //    var id = String.fromCharCode(parseInt(buffer[i++]))+
                        //        String.fromCharCode(parseInt(buffer[i++]))+
                        //        String.fromCharCode(parseInt(buffer[i++]))+
                        //        String.fromCharCode(parseInt(buffer[i++]));
                        //    if(id == "RGBA") {
                        //        i -= 4;
                        //        continue;
                        //    }
                        //}
                    }
                } else if (id == "MAIN") {
                } else if (id == "PACK") {
                    var numModels = this.readInt(buffer, i);
                    i += 4;
                } else if (id == "MATT") {
                } else if (id == "RGBA") {
                    colors2 = new Array(255);
                    for (var n = 0; n <= 254; n++ ) {
                        var r = buffer[i++] & 0xFF;
                        var g = buffer[i++] & 0xFF;
                        var b = buffer[i++] & 0xFF;
                        var a = buffer[i++] & 0xFF;
                        colors2[n+1] = {'r': r, 'g': g, 'b': b, 'a': a};
                    }
                } else {
                    i += chunkSize;
                }
            }

            if (voxelData == null || voxelData.length == 0) {
                return null;
            }
            for (var n = 0; n < voxelData.length; n++) {
                if(colors2 == undefined) {
                    var c = voxColors[voxelData[n].color-1];
                    var r = (c & 0xff0000) >> 16;
                    var g = (c & 0x00ff00) >> 8;
                    var b = (c & 0x0000ff);
                    voxelData[n].val = (r & 0xFF) << 24 | (g & 0xFF) << 16 | (b & 0xFF) << 8;
                } else {
                    var color = colors2[voxelData[n].color];
                    voxelData[n].val = (color.r & 0xFF) << 24 | (color.g & 0xFF) << 16 | (color.b & 0xFF) << 8;
                }
            }
            return {name: name, data: voxelData, sx: sizex + 1, sy: sizey + 1, sz: sizez + 1};
        }
    };
}


//////////////////////////////////////////////////////////////////////
// Weapon base class
//////////////////////////////////////////////////////////////////////
function Weapon() {
    this.ammo = 0;
    this.base_type = "weapon";
    this.chunk = 0;
    this.name = "";
    this.fire_rate = 0; // in ms between each
    this.reloading = 0;
    this.attached = false;
    this.attached_id = 0;
    this.alive = true;
    this.timeout = 0;
    this.relative_speed = 0;
    this.shoot_light = new THREE.PointLight( 0xFFAA00, 3, 10 );
    this.damage = 1;

    Weapon.prototype.create = function(model, size) {
        game.scene.add(this.shoot_light);
        this.chunk = game.modelLoader.getModel(model, size, this, true);
        game.removeFromCD(this.chunk.mesh);
        game.addObject(this);
    };

    Weapon.prototype.destroy = function() {
        game.scene.remove(this.chunk.mesh);
        game.removeFromCD(this.chunk.mesh);
       // this.chunk.mesh.geometry.dispose();
       // this.chunk.mesh.material.dispose();
       // this.chunk.bb.geometry.dispose();
       // this.chunk.bb.material.dispose();
        this.alive = false;
    };

    Weapon.prototype.setPosition = function(x, y, z) {
        this.chunk.mesh.position.set(x, y, z);
    };

    Weapon.prototype.setRotation = function(x, y, z) {
        this.chunk.mesh.rotation.set(x, y, z);
    };

    Weapon.prototype.detach = function(mesh, pos) {
        if (this.attached && mesh.id == this.attached_id) {
            this.chunk.mesh.visible = true;
            mesh.remove(this.chunk.mesh);
            game.scene.add(this.chunk.mesh);
            game.addToCD(this.chunk.mesh);
            this.setRotation(Math.PI, Math.PI, 0);
            this.setPosition(pos.x+(6-get_rand()*12), 6, pos.z+(6-get_rand()*12));
            this.attached = false;
            this.attached_id = 0;
        }
    };

    Weapon.prototype.attach = function(mesh) {
        if(!this.attached) {
            game.sounds.PlaySound("reload", this.chunk.mesh.position, 800);
            this.timeout = 0;
            mesh.add(this.chunk.mesh);
            game.removeFromCD(this.chunk.mesh);
            this.attached = true;
            this.attached_id = mesh.id;
            return true;
        }
        return false;
    };

    Weapon.prototype.shoot = function(dir, id, mesh, speed) {
        if(this.reloading <= 0) {
            this.fire(dir, id, mesh, speed);
            this.reloading = this.fire_rate;
            //var light = this.shoot_light.clone();
            var draw_light = false;
            // Keep fps higher
            if(this.obj_type == "minigun" && get_rand() > 0.5) {
            //    draw_light = false;
            }
            if (draw_light) {
                var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
                this.shoot_light.position.set(
                    point.x,
                    point.y,
                    point.z
                );
                this.shoot_light.visible = true;
            }
            //game.scene.add( light );
            //setTimeout(function() { game.scene.remove(light);}, 10);
            //this.lights.push(light);
        }
    };

    Weapon.prototype.update = function(time, delta) {
        if(!this.attached) {
            if(this.timeout > 60) { // Remove after 1min.
                this.destroy();
            }
            this.timeout += delta;
        }
        // Update reload time
        if(this.reloading >= 0) {
            this.reloading -= delta;
        }
        // Animate dropped weapon
        if(!this.attached) {
            this.chunk.mesh.position.y = game.maps.ground+6+Math.sin(time*2.5);
            this.chunk.mesh.rotation.y += Math.sin(delta);
        }
        if (this.shoot_light.visible) {
            this.shoot_light.visible = false;
        }
    };
}

//////////////////////////////////////////////////////////////////////
// Shotgun class
//////////////////////////////////////////////////////////////////////
function Shotgun() {
    Weapon.call(this);
    this.obj_type = "shotgun";
    this.fire_rate = 0.5;
    this.create("shotgun", 0.1);
    this.recoil = 1;
    this.damage = 1;

    Shotgun.prototype.create = function(model, size) {
        Weapon.prototype.create.call(this, model, size);
    };

    Shotgun.prototype.fire = function(q, id, shooter, speed) {
        game.sounds.PlaySound("shotgun", game.player.chunk.mesh.position, 250);
        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
        var dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);

        for (var i = 0; i < 10; i++) {
            game.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
            game.particles.smoke(point.x + (1 - get_rand() * 2), point.y + (1 - get_rand() * 2), point.z + (1 - get_rand() * 2), 0.5);
        }
       // shooter.translateZ(-this.recoil);
        game.particles.ammoShell(point.x, point.y, point.z, dir.x, dir.y, dir.z, id, speed, this.damage);
        game.objects["shell"].add(point.x, point.y, point.z);
        game.sounds.PlaySound("shotgun_reload", game.player.chunk.mesh.position, 300);
    };

}
Shotgun.prototype = new Weapon;
Shotgun.prototype.constructor = Shotgun;

//////////////////////////////////////////////////////////////////////
// Sniper class
//////////////////////////////////////////////////////////////////////
function Sniper() {
    Weapon.call(this);
    this.obj_type = "sniper";
    this.fire_rate = 1.5;
    this.create("sniper", 0.1);
    this.recoil = 5;
    this.damage = 5;

    Sniper.prototype.create = function(model, size) {
        Weapon.prototype.create.call(this, model, size);
    };

    Sniper.prototype.fire = function(q, id, shooter, speed) {
        game.sounds.PlaySound("sniper", game.player.chunk.mesh.position, 300);

        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
        var dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);

        for(var i = 0; i < 2; i++) {
            game.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
            game.particles.smoke(point.x, point.y, point.z, 0.4);
        }
       // shooter.translateZ(-this.recoil);
        game.particles.ammoSniper(point.x, point.y, point.z, dir.x, dir.y, dir.z, id, speed, this.damage);
        game.objects["ammo_sniper"].add(point.x, point.y, point.z);
    };

}
Sniper.prototype = new Weapon;
Sniper.prototype.constructor = Sniper;

//////////////////////////////////////////////////////////////////////
// Pistol class
//////////////////////////////////////////////////////////////////////
function Pistol() {
    Weapon.call(this);
    this.obj_type = "pistol";
    this.fire_rate = 0.5;
    this.create("pistol", 0.1);
    this.recoil = 0.2;
    this.damage = 1;

    Pistol.prototype.create = function(model, size) {
        Weapon.prototype.create.call(this, model, size);
    };

    Pistol.prototype.fire = function(q, id, shooter, speed) {
        game.sounds.PlaySound("pistol", game.player.chunk.mesh.position, 450);
        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
        var dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);

        for(var i = 0; i < 2; i++) {
            game.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
            game.particles.smoke(point.x, point.y, point.z, 0.4);
        }
       // shooter.translateZ(-this.recoil);
        game.particles.ammoP90(point.x, point.y, point.z, dir.x, dir.y, dir.z, id, speed, this.damage);
        game.objects["ammo_p90"].add(point.x, point.y, point.z);
    };

}
Pistol.prototype = new Weapon;
Pistol.prototype.constructor = Pistol;

//////////////////////////////////////////////////////////////////////
// Grenade Launcher class
//////////////////////////////////////////////////////////////////////
function GrenadeLauncher() {
    Weapon.call(this);
    this.obj_type = "grenadelauncher";
    this.fire_rate = 1;
    this.create("grenadelauncher", 0.1);
    this.recoil = 0.2;
    this.damage = 8;

    GrenadeLauncher.prototype.create = function(model, size) {
        Weapon.prototype.create.call(this, model, size);
    };

    GrenadeLauncher.prototype.fire = function(q, id, shooter, speed) {
        game.sounds.PlaySound("grenadelauncher", game.player.chunk.mesh.position, 450);
        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
        var dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);

        for(var i = 0; i < 2; i++) {
            game.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
            game.particles.smoke(point.x, point.y, point.z, 0.4);
        }
       // shooter.translateZ(-this.recoil);
        game.particles.ammoGrenadeLauncher(point.x, point.y, point.z, dir.x, dir.y, dir.z, speed, this.damage);
    };

}
GrenadeLauncher.prototype = new Weapon;
GrenadeLauncher.prototype.constructor = GrenadeLauncher;

//////////////////////////////////////////////////////////////////////
// P90 class
//////////////////////////////////////////////////////////////////////
function P90() {
    Weapon.call(this);
    this.obj_type = "p90";
    this.fire_rate = 0.07;
    this.create("p90", 0.1);
    this.recoil = 0.2;
    this.damage = 1;

    P90.prototype.create = function(model, size) {
        Weapon.prototype.create.call(this, model, size);
    };

    P90.prototype.fire = function(q, id, shooter, speed) {
        game.sounds.PlaySound("p90", game.player.chunk.mesh.position, 350);
        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
        var dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);

        for(var i = 0; i < 2; i++) {
            game.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
            game.particles.smoke(point.x, point.y, point.z, 0.4);
        }
       // shooter.translateZ(-this.recoil);
        game.particles.ammoP90(point.x, point.y, point.z, dir.x, dir.y, dir.z, id, speed, this.damage);
        game.objects["ammo_p90"].add(point.x, point.y, point.z);
    };

}
P90.prototype = new Weapon;
P90.prototype.constructor = P90;

//////////////////////////////////////////////////////////////////////
// Minigun class
//////////////////////////////////////////////////////////////////////
function Minigun() {
    Weapon.call(this);
    this.obj_type = "minigun";
    this.fire_rate = 0.1;
    this.create("minigun", 0.1);
    this.recoil = 0.2;
    this.damage = 2;

    Minigun.prototype.create = function(model, size) {
        Weapon.prototype.create.call(this, model, size);
    };

    Minigun.prototype.fire = function(q, id, shooter, speed) {
        game.sounds.PlaySound("minigun", game.player.chunk.mesh.position, 250);
        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
        var dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);

        for(var i = 0; i < 5; i++) {
            game.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
            game.particles.smoke(point.x, point.y, point.z, 0.4);
        }
       // shooter.translateZ(-this.recoil);
        game.particles.ammoMinigun(point.x, point.y, point.z, dir.x, dir.y, dir.z, id, speed, this.damage);
        game.objects["ammo"].add(point.x, point.y, point.z);
    };

}
Minigun.prototype = new Weapon;
Minigun.prototype.constructor = Minigun;


//////////////////////////////////////////////////////////////////////
// Ak47 class
//////////////////////////////////////////////////////////////////////
function Ak47() {
    Weapon.call(this);
    this.obj_type = "ak47";
    this.fire_rate = 0.15;
    this.create("ak47", 0.1);
    this.recoil = 1;
    this.damage = 2;

    Ak47.prototype.create = function(model, size) {
        Weapon.prototype.create.call(this, model, size);
    };

    Ak47.prototype.fire = function(q, id, shooter, speed) {
        game.sounds.PlaySound("ak47", game.player.chunk.mesh.position, 350);

        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
        var dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);

        for(var i = 0; i < 5; i++) {
            game.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
            game.particles.smoke(point.x, point.y, point.z, 0.4);
        }
       // shooter.translateZ(-this.recoil);
        game.particles.ammoAk47(point.x, point.y, point.z, dir.x, dir.y, dir.z, id, speed, this.damage);
        game.objects["ammo"].add(point.x, point.y, point.z);
    };

}
Ak47.prototype = new Weapon;
Ak47.prototype.constructor = Ak47;

//////////////////////////////////////////////////////////////////////
// RocketLauncher class
//////////////////////////////////////////////////////////////////////
function RocketLauncher() {
    Weapon.call(this);
    this.obj_type = "rocketlauncher";
    this.fire_rate = 1;
    this.create("rocketlauncher", 0.1);
    this.recoil = 4;
    this.damage = 6;

    RocketLauncher.prototype.create = function(model, size) {
        Weapon.prototype.create.call(this, model, size);
    };

    RocketLauncher.prototype.fire = function(q, id, shooter, speed) {
        game.sounds.PlaySound("rocket", game.player.chunk.mesh.position, 350);
        var point = this.chunk.mesh.localToWorld(new THREE.Vector3(60, -1, 0));
        var dir = new THREE.Vector3(0, 0, Math.PI).applyQuaternion(q);
        game.particles.ammoMissile(point.x, point.y, point.z, dir.x, dir.y, dir.z, this, null, speed, this.damage);

        for(var i = 0; i < 50; i++) {
            game.particles.gunSmoke(point.x, point.y, point.z, dir.x, dir.y, dir.z);
            game.particles.smoke(point.x+(1-get_rand()*2), point.y + (1-get_rand()*2), point.z+(1-get_rand()*2), 0.5);
        }
//        shooter.translateZ(-this.recoil);
    };

}
RocketLauncher.prototype = new Weapon;
RocketLauncher.prototype.constructor = RocketLauncher;

//////////////////////////////////////////////////////////////////////
// World class - Helper for world chunks
//////////////////////////////////////////////////////////////////////
function World() {
    // Generic chunk
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

    World.prototype.reset = function() {
        for(var i = 0; i < this.chunks.length; i++) {
            if(this.chunks[i].mesh) {
                game.scene.remove(this.chunks[i].mesh);
            }
        }
        this.radioactive_blocks = [];
        this.chunks = [];
        this.cid = 0;
        this.rebuild_idx = 0;
        this.rpc = 0;
        this.rpc_max = 0;
    };

    World.prototype.init = function() {
        this.textures = new Textures();
        this.textures.prepare();
    };

    World.prototype.getChunkId = function(x, y, z, create) {
        x |= 0;
        y |= 0;
        z |= 0;

        var finds = [];
        var c = 0;
        for (var i = 0; i < this.chunks.length; i++) {
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
           var pos_x = (x/this.obj_size_x)|0;
           var pos_y = (y/this.obj_size_y)|0;
           var pos_z = (z/this.obj_size_z)|0;

           var chunk = new Chunk(
               pos_x * this.obj_size_x,
               pos_y * this.obj_size_y,
               pos_z * this.obj_size_z,
               this.obj_size_x, this.obj_size_y, this.obj_size_z,
               "CREATED", 1, "world");
           chunk.init();
           var i = this.addChunk(chunk);
           return [i];
       }
        return [];
    };

    World.prototype.hit = function(dmg, dir, type, pos) {
        this.explode(pos.x, pos.y, pos.z, dmg, type);
    };

    World.prototype.addChunk = function(chunk) {
        this.chunks[this.cid] = chunk;
        this.chunks[this.cid].owner = this;
        this.cid++;
        return this.cid-1;
    };

    World.prototype.explode = function(x, y, z, power, type) {
        x |= 0;
        y |= 0;
        z |= 0;
        var pow = power*power;

        var list = [];
        var vx = 0, vy = 0, vz = 0, val = 0, offset = 0;
        for(var rx = x-power; rx <= x+power; rx++) {
            vx = Math.pow((rx-x), 2); 
                for(var rz = z-power; rz <= z+power; rz++) {
                    vz = Math.pow((rz-z),2)+vx; 
                        for(var ry = y-power; ry <= y+power; ry++) {
                            if(ry < 0) {
                                continue;
                            }
                            val = Math.pow((ry-y),2)+vz;
                            if(val <= pow) {
                                list.push({x: rx, y: ry, z: rz});
                            }
                        }
                }
        }
        // Check if any object is in the way.
        if(type == "missile" || type == "grenade") {
            var pos = 0;
            var pxp = x+power*2;
            var pxm = x-power*2;
            var pzp = z+power*2;
            var pzm = z-power*2;
            for(var i = 0; i < game.cdList.length; i++) {
                if(game.cdList[i].owner) {
                    pos = game.cdList[i].owner.chunk.mesh.position;
                    if(game.cdList[i].owner.chunk.hit) {
                        if(pos.x >= pxm && pos.x <= pxp && 
                           pos.z >= pzm && pos.z <= pzp) {
                            if(this.isFunction(game.cdList[i].owner.hit)) {
                                game.cdList[i].owner.hit(power, new THREE.Vector3(0,0,0), "missile", new THREE.Vector3(x,y,z));
                            }
                        }
                    }
                }
            }
        } else {
            game.sounds.PlaySound("bullet_wall", new THREE.Vector3(x,y,z), 500);
        }
        this.removeBatch(list);
    };

    World.prototype.isFunction = function(object) {
        return !!(object && object.constructor && object.call && object.apply);
    };

    World.prototype.getColor = function(pos) {
        pos.x |= 0;
        pos.y |= 0;
        pos.z |= 0;
        var c = this.getChunkId(pos.x, pos.y, pos.z, false);
        if(c == -1) {
            return  -1;
        } 
        // Return first color?
        return this.chunks[c[0]].getColor(pos.x, pos.y, pos.z);
    };

    World.prototype.checkExists = function(pos) {
        pos.x |= 0;
        pos.y |= 0;
        pos.z |= 0;
       // console.log("CHECK:",pos);
        var c = this.getChunkId(pos.x, pos.y, pos.z, false);
       // console.log("ID: ",c);
        if(c.length == 0) {
            return [];
        }
        
        var list = [];
        for(var i = 0; i < c.length; i++) {
            var r = this.chunks[c[i]].checkExists(pos.x, pos.y, pos.z);
            if(r != -1) {
                list.push(r);
            }
        }
        return list;
    };

    World.prototype.removeBatch = function(points) {
        for(var i = 0; i < points.length; i++) {
            var c = this.getChunkId(points[i].x, points[i].y, points[i].z, false);
            if(c.length == 0) { 
                continue; 
            }
            for (var n = 0; n < c.length; n++) {
                this.chunks[c[n]].rmBlock(points[i].x, points[i].y, points[i].z);
            }
        }
        //for(var i in list) {
        //    this.chunks[i].removeBatch();
        //}
    };

    World.prototype.addBatch = function(points) {
        for(var i = 0; i < points.length; i++) {
            var c = this.getChunkId(points[i].x, points[i].y, points[i].z, true);
            if(c.length == 0) {
                return;
            }
            for(var n = 0; n < c.length; n++) {
                this.chunks[c[n]].addBlock(points[i].x,points[i].y, points[i].z, points[i].r,points[i].g, points[i].b);
            }
        }
    };

    World.prototype.addColorBlock = function(x, y, z, r, g, b) {
        x |= 0;
        y |= 0;
        z |= 0;
        var c = this.getChunkId(x,y,z, true);
        if(c.length != 0) {
            for (var i = 0; i < c.length; i++) {
                // Do not add blood to non-existing blocks.
                if(this.chunks[c[i]].blockExists(x, y, z)) {
                    this.chunks[c[i]].addBlock(x, y, z, r, g, b);
                    if(r <= 50  && g >= 200 && b < 105 && b >= 50) {
                        for(var p = 0; p < this.radioactive_blocks.length; p++) {
                            if(this.radioactive_blocks[p].x == x &&
                               this.radioactive_blocks[p].y == y &&
                               this.radioactive_blocks[p].z == z)
                            {
                                return;
                            }
                        }
                        this.radioactive_blocks[this.rpc_max++] = [x,y,z];
                    } else {
                        for(var p = 0; p < this.radioactive_blocks.length; p++) {
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
    };

    World.prototype.addBlock = function(x, y, z, r, g, b) {
        x |= 0;
        y |= 0;
        z |= 0;
        var c = this.getChunkId(x,y,z, true);
        if(c.length != 0) {
            for (var i = 0; i < c.length; i++) {
                this.chunks[c[i]].addBlock(x, y, z, r, g, b);
            }
        }
    };

    World.prototype.removeBlock = function(x, y, z) {
        var c = this.getChunkId(x,y,z, false); 
        if(c.length != 0) {
            for(var i = 0; i < c.length; i++) {
                this.chunks[c[i]].rmBlock(x, y, z);
            }
        }
    };

   // World.prototype.rebuildBatches = function() {
   //     for(var i = 0; i < this.chunks.length; i++) {
   //         this.chunks[i].build();
   //     }
   // };

    World.prototype.update = function(time, delta) {
        if(!game.player.chunk) {
            return;
        }

        for(var i = 0; i < this.chunks.length; i++) {
           if(this.chunks[i].dirty) {
               var t1 = Date.now();
               this.chunks[i].build();
               if((Date.now() - t1) > 5) {
                   break;
               }
            }
        }

        if(this.radioactive_blocks.length > 0) {
            var v = 0;
            for(var i = 0; i < 10; i++) {
                v = Math.random()*this.radioactive_blocks.length|0;
                if(this.radioactive_blocks[v] != 0) {
                    if(this.checkExists(new THREE.Vector3(this.radioactive_blocks[v][0],
                                 this.radioactive_blocks[v][1], 
                                 this.radioactive_blocks[v][2])).length == 0)
                    {
                        this.radioactive_blocks[v] = 0;
                    } else {
                        game.particles.radiation
                        (
                         this.radioactive_blocks[v][0]+(1-get_rand()*2),
                         this.radioactive_blocks[v][1]+(1-get_rand()*2),
                         this.radioactive_blocks[v][2]+(1-get_rand()*2)
                        );
                    }
                }
            }
        }


     //   this.debug_update += delta;
       // if(this.debug_update > 2) {
       //     this.debug_update = 0;
       //     var tris = 0;
       //     var blocks = 0;
       //     var skips = 0;
       //     var visible = 0;
       //     var all_blocks = 0;
       //     for(var i = 0; i < this.chunks.length; i++) {
       //         if(this.chunks[i].mesh) {
       //             if(this.chunks[i].mesh.visible) {
       //                 visible++;
       //             }
       //         }
       //         tris += this.chunks[i].triangles;
       //         blocks += this.chunks[i].total_blocks;
       //         all_blocks += this.chunks[i].chunk_size_x * this.chunks[i].chunk_size_y * this.chunks[i].chunk_size_z;
       //         skips += this.chunks[i].skips;
       //         //this.chunks[i].applyShadow();
       //     }
       //     $('#blocks').html("Blocks:"+blocks+ " (Chunks: "+this.chunks.length+") (Visible: "+visible+") (ALL: "+all_blocks+")");
       //     $('#triangles').html("Triangles:"+tris);
       //     $('#skipped').html("Triangles skipped:"+skips);
       //     //$('#particles').html("Particles Total: "+(game.particles.size+game.particles_box.size)+ "  Free: "+(game.particles.free.length+game.particles_box.free.length) + " Active: "+(game.particles.active.length+game.particles_box.active.length)+ " Queue: "+(game.particles.queue.length+game.particles_box.queue.length));
       //     var active1 = 0;
       //     for(var i = 0; i < game.particles_box.particles.length; i++) {
       //         if(game.particles_box.particles[i].active == 1) {
       //             active1++;
       //         }
       //     }
       //     var free = game.particles_box.size - active1;
       //     var free_boxes = free;
       //     var active2 = 0;
       //     for(var i = 0; i < game.particles.particles.length; i++) {
       //         if(game.particles.particles[i].active == 1) {
       //             active2++;
       //         }
       //     }
       //     free += game.particles.size - active2;
       //     $('#particles').html("Particles Total: "+(game.particles.size+game.particles_box.size)+ "  Free: "+(free) + " Active: " + (active2+active1) + " Free Block: "+free_boxes);
       // }
    };

}

let game = new Main();

game.init();

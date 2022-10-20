// minden osztály őse, amik a pályán / gráfon helyezkednek el
class Entity {
    constructor(data) {
        this.x = (data.x !== undefined ? data.x : 0);
        this.y = (data.y !== undefined ? data.y : 0);
        this.id = (data.id !== undefined ? data.id : null);
        this.speed = (data.speed !== undefined ? data.speed : g_broadcasted_constants.entity.speed);
        this.rot_speed = (data.rot_speed !== undefined ? data.rot_speed : g_broadcasted_constants.entity.rspeed);
        let texture = (data.texture !== undefined ? data.texture : '');
        this.sprite = new PIXI.Sprite(texture);
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.rotation = (data.rotation !== undefined ? data.rotation : 0);
        this.tint = (data.tint !== undefined ? data.tint : '0xffffff');
        //this.sprite.alpha = (data.alpha !== undefined ? data.alpha : 1);
        this.collision_block = []; //kell a tank predictionhoz
        g_pixi_containers.game_container.addChild(this.sprite);
        if (data.width) {
            this.sprite.width = data.width;
        }
        if (data.height) {
            this.sprite.height = data.height;
        }

        //interpolációért felelős adatok
        this.ipol_data = {
            'start': {
                'x': -1,
                'y': -1,
                'direction': 0
            },
            'end': {
                'x': -1,
                'y': -1,
                'direction': 0
            },
            'speed': 1, //TODO: hátrafele menetnél a szerver oldalon ténylegesen állítgatni kéne a speed-et, ahelyett, hogy csak a kalkulációnál szorozzuk le. így helyes sebességet küld a klienseknek
            'rotate_speed': 0.2 //TODO kéne egy ilyen a szerver oldalra, és pozitív vagy negatív értéket kapjon, amikor erre vagy arra fordul az entity.
        };
        this.init_ipol(this.x, this.y, this.rotation);
    }

    //hogy ne a világ végéről interpoláljon a legelső tikben sem
    init_ipol(x, y, dir) {
        this.ipol_data.start.x = this.ipol_data.end.x = x;
        this.ipol_data.start.y = this.ipol_data.end.y = y;
        this.ipol_data.start.direction = this.ipol_data.end.direction = dir;
    }
    //amikor a szerverről jön az utasítás, hogy 'mennyé oda'
    start_ipol(x, y, dir) {
        //első körben oda tesszük az entityt, ahol az előző üzenet szerint kellett lennie (hátha eltért az interpoláció miatt)
        this.ipol_data.start.x = this.ipol_data.end.x;
        this.ipol_data.start.y = this.ipol_data.end.y;
        this.ipol_data.start.direction = this.ipol_data.end.direction;
        //utána megadjuk az új célpontot és az irányt
        this.ipol_data.end.x = x;
        this.ipol_data.end.y = y;
        this.ipol_data.end.direction = dir;
        
        let dist_x = this.ipol_data.end.x - this.ipol_data.start.x;
        let dist_y = this.ipol_data.end.y - this.ipol_data.start.y;
        let distance = Math.sqrt(Math.pow(dist_x, 2) + Math.pow(dist_y, 2));
        this.ipol_data.speed = distance/3; //20 fps szerver update esetén
        let dist_angle = Math.abs(this.ipol_data.start.direction - this.ipol_data.end.direction);
        this.ipol_data.rotate_speed = dist_angle/3; //20 fps szerver update esetén
        if (this.ipol_data.start.direction > this.ipol_data.end.direction) {
            this.ipol_data.rotate_speed *= -1;
        }
    }
    //maga a mozgatás: 60 fps-sel fusson
    ipol() {
        let difference = false;
        let dist_x = this.ipol_data.end.x - this.ipol_data.start.x;
        let dist_y = this.ipol_data.end.y - this.ipol_data.start.y;
        if (this.ipol_data.start.x !== this.ipol_data.end.x || this.ipol_data.start.y !== this.ipol_data.end.y) {
            let rotation = Math.atan2(dist_y, dist_x);
            let next = {
                'x': Math.cos(rotation) * this.ipol_data.speed,
                'y': Math.sin(rotation) * this.ipol_data.speed
            };
            this.ipol_data.start.x += next.x;
            this.ipol_data.start.y += next.y;
            difference = true;
        }
        if (this.ipol_data.start.direction !== this.ipol_data.end.direction) {
            this.ipol_data.start.direction += this.ipol_data.rotate_speed;
            difference = true;
        }
        if (difference) {
            this.x = this.sprite.x = this.ipol_data.start.x;
            this.y = this.sprite.y = this.ipol_data.start.y;
            this.rotation = this.ipol_data.start.direction; //itt a sprite-t nem állítom, felül van definiálva a tank classban. mert bulletnél pl. nem kell.
        }
    }

    //meg kell szüntetni minden referenciát ami rá mutat, akkor törlődik csak! (garbage collector) + a sprite-t is ki kell pucolni
    destroy(lists = []) {//tömb-tömböt vár, nem sima tömböt
        if (lists.length < 1) {
            console.log('warning: destroy funkció nem kapott elem-tömböt');
        }
        for (let list of lists) {
            delete list[this.id]; //kitörli a kapott listákban az objektumra mutató referenciát
        }
        g_pixi_containers.game_container.removeChild(this.sprite); //kiszedi a pixi-s referenciát a sprite-ra
        this.sprite = null; //kiszedi a saját referenciát a sprite-ra (elvileg nem kötelező, mert ha törlődik ő, akkor a sprite-ja is)
    }
    ;
}

class Wall extends Entity {
    constructor(data) {
        if (data.texture === undefined) {
            data.texture = g_textures.wall;
        }
        super(data);
        this.sprite.anchor.set(0.5, 0.5);
        let width = (data.width !== undefined ? data.width : 10);
        let height = (data.height !== undefined ? data.height : 10);
        this.hitbox = {//téglalap 4 sarka
            'x1': this.x - width / 2,
            'x2': this.x + width / 2,
            'y1': this.y - height / 2,
            'y2': this.y + height / 2
        };
    }
}

class Tank extends Entity {
    constructor(data) {
        if (data.texture === undefined) {
            data.texture = g_textures.tank;
        }
        if (data.width === undefined) {
            data.width = 41;
        }
        if (data.height === undefined) {
            data.height = 26;
        }
        if (data.rotation === undefined) {
            data.rotation = Math.random() * 2 * Math.PI;
        }
        super(data);
        this.inactive = true;
        this.normal_speed = this.speed; //normal speed az alapértelmezett sebesség, erre jönnek rá a bónuszok. minden lehetséges speed modifier külön változót kap.
        this.sprite.rotation = this.rotation;
        this.sprite.anchor.set(0.45, 0.5);
        this.sprite.tint = this.tint;
        this.nametag = new PIXI.Text((data.nametag === '' ? 'unnamed' : data.nametag), {fontFamily: 'Arial', fontSize: 18, fill: 0x000000, align: 'center'});
        this.nametag.alpha = 0.6;
        this.nametag.x = this.x;
        this.nametag.y = this.y - 30;
        this.nametag.anchor.set(0.5, 0.5);
        g_pixi_containers.game_container.addChild(this.nametag);
        this.shoot_button_up = true;
        this.movement_timer = 0;
        this.inputsForCorrection = []; //az inputok listája, ami csak szerver update után ürül. ezt használjuk korrigálásra
        this.inputsForServer = []; //csak a szervernek nem elküldött inputokat tárolja
        this.active_blade = false; // melee extra követésére.
        this.mods = {
            'blade_boost': 0
        };
        this.events = [];

        //this.can_shoot = true;
        //this.shoot_type = "bb"; // mchg --- machinegun , normal--- sima bullet, bb --- BigBoom, 
        //this.bullet_timer = 3;
        this.keypress = {
            'left': false,
            'up': false,
            'right': false,
            'down': false
        };
        this.predict();
    }
    //triggerShoot() {}
    //createBullet() {};	
    //ext_machinegun(){};
    changeColor(color) {
        this.tint = this.sprite.tint = color;
    }
    ipol() {
        super.ipol();
        this.sprite.rotation = this.rotation;
        this.nametag.x = this.x;
        this.nametag.y = this.y - 30;
        this.manage_blade();
    }
    start_ipol(x, y, dir) {
        super.start_ipol(x, y, dir);
    }
    keyevent(name, value) {
        this.keypress[name] = value;
    }
    update_cycle() {
        for (let key in this.events) {
            switch (this.events[key]) {
                case 'blade':
                    draw_blade(this);
                    break;
                default:
                    console.log('warning, ismeretlen event: '.this.events[key]);
            }
        }
        this.events = [];
    }
    predict(delta) {
        if (this.inactive) {
            return;
        }
        //logoljuk az inputokat
        let input_data = {
            'keys': {
                'up': this.keypress['up'],
                'down': this.keypress['down'],
                'left': this.keypress['left'],
                'right': this.keypress['right'],
            },
            'tick': this.movement_timer,
            'mods': this.mods,
        };
        this.movement_timer++;
        if (this.movement_timer > 300000) {
            this.movement_timer = 0;
        }
        this.inputsForCorrection.push(input_data); //szerveres adat utáni korrekcióra TODO in a perfect world ez nem kellene
        
        let self_start_position = {
            'x': this.x,
            'y': this.y,
            'd': this.rotation
        };
        //console.log(input_data);
        let simulated_pos = this.simulate_input(self_start_position, input_data);
        this.x = simulated_pos.x;
        this.y = simulated_pos.y;
        this.rotation = simulated_pos.d;

        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.nametag.x = this.x;
        this.nametag.y = this.y - 30;
        this.sprite.rotation = this.rotation;
        this.manage_blade();

        this.inputsForServer.push(input_data); //input csomag küldés szervernek

        // TODO collisionnal detektálni kéne hogy extrát felszedtük, vagy a pengét elhasználta, a lendi fgv nem jó vmiért
        /*let collision_data = g_collisioner.check_collision_one_to_n(this, Extra);
        let colliding_extra = collision_data['collision'];
        if ((colliding_extra.right || colliding_extra.left || colliding_extra.up || colliding_extra.down) && this.shoot_type === 'normal') {
            for (let e of collision_data['collided']) {
                if (e.type === 'bl') {
                    this.mods.blade_boost = 1;
                    console.log('boost');
                }
            }
        }*/
    };
    send_move_data_to_server() {
        //elküldjük a szervernek az utolsó néhány tik mozgását.
        socket.emit('input_list', this.inputsForServer);
        this.inputsForServer = [];
    };
    simulate_input(start_pos, input_data) {
        let ret = {'x': start_pos.x, 'y': start_pos.y, 'd': start_pos.d};
        let reset_x = this.x;
        let reset_y = this.y;
        let reset_spd = this.speed;

        this.speed = this.normal_speed + input_data.mods.blade_boost * 0.5;
        if (input_data.keys.down) {
            this.speed *= 0.7;
        }

        let final_rotate = 0;
        if (input_data.keys.right) {
            final_rotate = this.rot_speed + input_data.mods.blade_boost * 0.02;
        }
        if (input_data.keys.left) {
            final_rotate = -1 * (this.rot_speed + input_data.mods.blade_boost * 0.02);
        }
        ret.d += final_rotate;
        
        this.x = ret.x;
        this.y = ret.y;
        let rotate = ret.d;
        this.hitbox = {//téglalap 4 sarka
            'x1': this.x - 13,
            'x2': this.x + 13,
            'y1': this.y - 13,
            'y2': this.y + 13
        };
        g_collisioner.update_arrays();

        if (input_data.tick === undefined) {
            console.log('kapott input: nincs index');
        }

        let x_wannago = 0;
        let y_wannago = 0;
        let cosos = Math.cos(rotate) * this.speed;
        let sines = Math.sin(rotate) * this.speed;
        if (input_data.keys.up) {
            x_wannago = cosos;
            y_wannago = sines;
        } else if (input_data.keys.down) {
            x_wannago = -1 * cosos;
            y_wannago = -1 * sines;
        }

        //mozgás és fal-ütközés
        if (x_wannago !== 0 || y_wannago !== 0) {
            let x_w_rounded = x_wannago > 0 ? Math.ceil(x_wannago) : Math.floor(x_wannago);
            let y_w_rounded = y_wannago > 0 ? Math.ceil(y_wannago) : Math.floor(y_wannago);
            let collision_data = g_collisioner.check_collision_one_to_n(this, Wall, x_w_rounded, y_w_rounded);
            let colliding = collision_data['collision'];

            if ((x_wannago > 0 && !colliding.right) || (x_wannago < 0 && !colliding.left)) {
                ret.x += x_wannago;
            }
            if ((y_wannago > 0 && !colliding.down) || (y_wannago < 0 && !colliding.up)) {
                ret.y += y_wannago;
            }
        }

        this.x = reset_x;
        this.y = reset_y;
        this.speed = reset_spd;
        
        return ret;
    }
    apply_server_info(s_id, starting_point) {
        //megkapja a szervertől, hogy adott input után a szerveren hol van a tank. ebből ismerve a saját inputjait, kiszámolja, hogy hol kellene lennie, és ha eltérést lát, korrigál. lehetne ritkábban futtatni, pl. másodpercenként...
        //van starting point, oda állítja a playert és onnan futtatja a cuccot
        if (s_id === false) {
            return; //kihagyott a szerver valamiért. nem csinálunk semmit
        }

        //---kidobáljuk a felesleges adatokat---
        let start_doing = false;
        let remove_count = 0;

        for (let loop_index = 0; loop_index < this.inputsForCorrection.length; loop_index++) {
            let input_data = this.inputsForCorrection[loop_index]; //kiolvassuk a tömbből
            if (input_data.tick === undefined) {
                console.log('input: nincs s_id: ' + JSON.stringify(input_data));
                continue;
            }
            if (input_data.tick === s_id) {
                start_doing = true;
            }
            if (!start_doing) {
                remove_count++;
                continue;
            }
        }
        if (starting_point) {
            this.inputsForCorrection.splice(0, remove_count);
        }
        this.repair_movement(s_id, starting_point);
    };
    repair_movement(s_id, starting_point) { //TODO: ha a saját pozíció nagyon eltér a szervertől kapottól, ne updatelje magát egy darabig, csak várjon a szerver-pozícióra.
        
        let simulated_from_server_spot = starting_point;
        for (let loop_index = 0; loop_index < this.inputsForCorrection.length; loop_index++) {
            let input_data_temp = this.inputsForCorrection[loop_index];
            simulated_from_server_spot = this.simulate_input(simulated_from_server_spot, input_data_temp);
        }
        this.x = simulated_from_server_spot.x;
        this.y = simulated_from_server_spot.y;
        this.rotation = simulated_from_server_spot.d;
        /*if (g_ghost && ghosttank !== undefined) {
            ghosttank.x = simulated_from_server_spot.x;
            ghosttank.y = simulated_from_server_spot.y;
            ghosttank.rotation = simulated_from_server_spot.d;
        }*/
    };
    //akármikor a penge pozícióját / állapotát frissíteni kell, azt itt teszi
    manage_blade() {
        if (!this.active_blade) {
            return;
        }
        if (this.active_blade.currentFrame === this.active_blade.totalFrames - 1) {
            g_pixi_containers.game_container.removeChild(this.active_blade);
            this.active_blade = false;
        } else {
            this.active_blade.x = this.x;
            this.active_blade.y = this.y;
            this.active_blade.rotation = this.sprite.rotation;
        }
    }
    destroy(param) {//tömb-tömböt vár, nem sima tömböt
        draw_tank_explosion(this);
        g_pixi_containers.game_container.removeChild(this.nametag);
        super.destroy(param);
    };
}

//lövedék
class Bullet extends Entity {
    constructor(data) {
        if (data.texture === undefined) {
            data.texture = g_textures.bullet;
        }
        if (data.width === undefined) {
            data.width = 10;
        }
        if (data.height === undefined) {
            data.height = 10;
        }
        super(data);
        this.sprite.tint = this.tint;
        this.sprite.anchor.set(0.5, 0.5);
        //this.x_graph = x; //a gráfban elfoglalt hely
        //this.y_graph = y;
        //this.rotation = (data.rotation !== undefined ? data.rotation : 0);
        //this.timer = (data.timer !== undefined ? data.timer : 600);
        //this.player_id = (data.player_id !== undefined ? data.player_id : 0);
        //this.Boom = false;
        //this.updatePosition();
    };
}

class FragBullet extends Bullet {
    constructor(data) {
        super(data);
        this.sprite.width = this.sprite.height = 15;
    };
};

class GhostBullet extends Bullet {
    constructor(data) {
        super(data);
        this.sprite.alpha = 0.6;
    };
};

class Extra extends Entity {
    constructor(data) {
        let type = (data.type !== undefined ? data.type : 'boom');
        if (data.texture === undefined) {
            data.texture = g_textures.extras[type];
        }
        if (data.width === undefined) {
            data.width = 30;
        }
        if (data.height === undefined) {
            data.height = 30;
        }
        super(data);

        this.sprite.anchor.set(0.5, 0.5);
    };
};

//csak a játékos és fal ütközését nézi a prediction miatt
CollisionManager = class CollisionManager {
    constructor(data) {
        this.field_size = (data.field_size !== undefined ? data.field_size : 80); //hányszor hányas kockákra ossza fel a teret
    }
    //megnézi melyik dobozba/dobozokba kell tenni az entity-t
    get_placing_boxes(entity) {
        let results = [];
        let border = 3; //ennyi pixellel számol ráhagyást a tényleges hitboxra, hogy elkerüljük az épp blokk szélén lévő falak hiányának problémáját
        let x_start = Math.floor((entity.hitbox.x1 - border) / this.field_size);
        let x_end = Math.floor((entity.hitbox.x2 + border) / this.field_size);
        let y_start = Math.floor((entity.hitbox.y1 - border) / this.field_size);
        let y_end = Math.floor((entity.hitbox.y2 + border) / this.field_size);
        for (let i = x_start; i <= x_end; i++) {
            for (let j = y_start; j <= y_end; j++) {
                results.push([i, j]);
            }
        }
        return results;
    }
    //elhelyezi a kapott entity-t a felosztott táblázatában. több helyre is teheti, ha nem fér pont egybe
    place(entity) {
        let boxes = this.get_placing_boxes(entity);
        for (let box of boxes) {
            if (CollisionManager.map[box[0]] === undefined) {
                CollisionManager.map[box[0]] = [];
            }
            if (CollisionManager.map[box[0]][box[1]] === undefined) {
                CollisionManager.map[box[0]][box[1]] = [];
            }
            CollisionManager.map[box[0]][box[1]].push(entity);
            entity.collision_block.push([box[0], box[1]]);
        }
    }
    //mindent updatel
    update_arrays() {
        CollisionManager.map = [];
        for (let key in Wall.list) {
            Wall.list[key].collision_block = [];
            this.place(Wall.list[key]);
        }
        if (Tank.list !== undefined && Tank.list[g_self_data.id] !== undefined) {
            Tank.list[g_self_data.id].collision_block = [];
            this.place(Tank.list[g_self_data.id]);
        }
    }
    //sima egy az n-hez ütközést ellenőriz, tömbbel tér vissza. (4 irány)
    check_collision_one_to_n(target, c_class, xnext = 0, ynext = 0) {
        let t_width = Math.abs(target.hitbox.x1 - target.hitbox.x2);
        let t_height = Math.abs(target.hitbox.y1 - target.hitbox.y2);
        let collision = {'right': false, 'up': false, 'left': false, 'down': false};
        let collided = [];
        for (let block of target.collision_block) {
            for (let obj of CollisionManager.map[block[0]][block[1]]) {
                if (!(obj instanceof c_class)) {
                    continue;
                }
                let c_width = Math.abs(obj.hitbox.x1 - obj.hitbox.x2);
                let c_height = Math.abs(obj.hitbox.y1 - obj.hitbox.y2);

                let w = 0.5 * (t_width + c_width);
                let h = 0.5 * (t_height + c_height);
                let dx = target.x - obj.x;
                let dy = target.y - obj.y;
                let dx_m = target.x + xnext - obj.x;
                let dy_m = target.y + ynext - obj.y;

                if (Math.abs(dx_m) <= w && Math.abs(dy_m) <= h)
                {
                    collided.push(obj);

                    let wy = w * dy_m;
                    let hx = h * dx_m;
                    if (wy > hx) {
                        if (wy > -hx) {
                            if (Math.abs(dx) <= w && Math.abs(dy_m) <= h) { //téves ütközés elkerülésére
                                collision.up = true;
                            }
                        } else {
                            if (Math.abs(dx_m) <= w && Math.abs(dy) <= h) {
                                collision.right = true;
                            }
                        }
                    } else {
                        if (wy > -hx) {
                            if (Math.abs(dx_m) <= w && Math.abs(dy) <= h) {
                                collision.left = true;
                            }
                        } else {
                            if (Math.abs(dx) <= w && Math.abs(dy_m) <= h) {
                                collision.down = true;
                            }
                        }
                    }
                }
            }
        }
        return {'collision': collision, 'collided': collided};
    }
}
class Particle {
    constructor(data) {
        this.x = (data.x !== undefined ? data.x : 0);
        this.y = (data.y !== undefined ? data.y - 10 : 0);
        this.id = (data.id !== undefined ? data.id : null);
        let texture = (data.texture !== undefined ? data.texture : '');
        this.sprite = new PIXI.Sprite(texture);
        this.sprite.anchor.set(0.5);
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.rotation = (data.rotation !== undefined ? data.rotation : Math.PI*(1/2));
        this.speed = (data.speed !== undefined ? data.speed : 0.5);
        this.timer = (data.timer !== undefined ? data.timer : 50);
        this.sprite.alpha = (data.alpha !== undefined ? data.alpha : 1.1);
        g_pixi_containers.game_container.addChild(this.sprite);
        
        if (data.e_layer === '10') {
            this.sprite.parentGroup = g_pixi_layers.effect_10;
        } else if (data.e_layer === '0') {
            this.sprite.parentGroup = g_pixi_layers.effect_0;
        }
        
    }
    destroy(lists = []) {//tömb-tömböt vár, nem sima tömböt
        if (lists.length < 1) {
            console.log('warning: particle destroy funkció nem kapott elem-tömböt');
        }
        for (let list of lists) {
            delete list[this.id]; //kitörli a kapott listákban az objektumra mutató referenciát
        }
        g_pixi_containers.game_container.removeChild(this.sprite); //kiszedi a pixi-s referenciát a sprite-ra
    };
    update() {
        this.timer--;
        this.sprite.alpha -= this.sprite.alpha / this.timer;
        this.sprite.x += Math.cos(this.rotation) * this.speed,
        this.sprite.y -= Math.sin(this.rotation) * this.speed;
        //this.sprite.y -= 0.7;
        if (this.timer <= 0) {
            this.destroy([Particle.list]);
        }
    }
}
Particle.list = {};
Particle.list_counter = 0;

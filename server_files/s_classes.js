// minden osztály őse, amik a pályán / gráfon helyezkednek el
Entity = class Entity {
    constructor(data) {
        this.x = (data.x !== undefined ? data.x : 0);
        this.y = (data.y !== undefined ? data.y : 0);
        this.x_graph = (data.x_graph !== undefined ? data.x_graph : 0); //a gráfban elfoglalt hely
        this.y_graph = (data.y_graph !== undefined ? data.y_graph : 0);
        this.id = (data.id !== undefined ? data.id : null);
        this.speed = (data.speed !== undefined ? data.speed : 2.2);
        this.rot_speed = (data.rot_speed !== undefined ? data.rot_speed : 0.07);
        this.collision_block = []; //collisionManager melyik dobozkájában van éppen. több is lehet, ha átlóg
        this.width = (data.width !== undefined ? data.width : 10);
        this.height = (data.height !== undefined ? data.height : 10);
        this.rotation = (data.rotation !== undefined ? data.rotation : 0);
        this.tint = (data.tint !== undefined ? data.tint : '0xffffff');
        this.inactive = false;
    }
    //meg kell szüntetni minden referenciát ami rá mutat, akkor törlődik csak! (garbage collector)
    destroy(lists = []) {//dupla-tömböt [[]] vár, nem sima tömböt
        if (lists.length < 1) {
            console.log('warning: destroy funkció nem kapott elem-tömböt');
        }
        for (let list of lists) {
            delete list[this.id]; //kitörli a kapott listákban az objektumra mutató referenciát
    }
    }
    ;
};

Wall = class Wall extends Entity {
    constructor(data) {
        super(data);
        this.hitbox = {//téglalap 4 sarka
            'x1': this.x - this.width / 2,
            'x2': this.x + this.width / 2,
            'y1': this.y - this.height / 2,
            'y2': this.y + this.height / 2
        };
    }
}

Tank = class Tank extends Entity {
    constructor(data) {
        if (data.rotation === undefined) {
            data.rotation = Math.random() * 2 * Math.PI;
        }
        if (data.tint === undefined) {
            data.tint = g_tank_colors[0];
        }
        super(data);
        this.nametag = ((data.nametag === undefined || data.nametag === '') ? 'unnamed' : data.nametag);
        this.inactive = true;
        this.normal_speed = this.speed;
        this.shoot_phase = 'shoot' //lehet 'shoot'(lőhet),'trigger'(aktivál),'wait'(tiltva),'hold'(nyomvatart?)
        this.shoot_type = 'normal'; //normal: sima, mg: machinegun, fr: fragbullet, gh: ghostbullet. bl: blade
        this.bullet_timer = 3;
        this.list_of_inputs = [];
        this.bullet_count = 3;
        this.mods = { // tank adatai, amik gyakran módosulhatnak játék során.
            'blade_boost': 0
        };
        this.events = []; //szerver küld a kliensnek adatokat, ha történik valami a tankkal (nem külön send message minden)
        
        this.updatePosition();
    }
    updatePosition() {
        this.hitbox = {//téglalap 4 sarka
            'x1': this.x - 13,
            'x2': this.x + 13,
            'y1': this.y - 13,
            'y2': this.y + 13
        };
        if (this.inactive) {
            return;
        }
        //többet, mint 1, ha ugrani kell
        this.apply_input_movement_data(1);

        //fegyver összeszedési kapcsolók 
        //mchg
        /*if (this.shoot_type === "mchg") {
         this.can_shoot = false;
         if (!this.shoot_button_up) {this.shoot_type = "mchg_s"};
         };
         
         //machine gun
         if (this.shoot_type === "mchg_s") {
         if (this.shoot_button_up){
         this.can_shoot = true;
         this.shoot_type = "normal";
         };
         if (!this.shoot_button_up) {
         if (this.bullet_timer < 0){
         this.ext_machinegun();
         this.bullet_timer = 3;
         };
         };
         this.bullet_timer -= 0.75;	
         }*/

        //ha Tank ütközik bullettel
        let collision_data = g_collisioner.check_collision_one_to_n(this, Bullet);
        let colliding_bullet = collision_data['collision'];
        if (colliding_bullet.right || colliding_bullet.left || colliding_bullet.up || colliding_bullet.down) {
            for (let b of collision_data['collided']) {
                if (b.inactive === false && this.inactive === false && !(b.parent_protect && b.player_id === this.id)) {
                    if (b.constructor.name === 'FragBullet') {
                        b.boom();
                    }
                    b.inactive = true;
                    this.inactive = true;
                    kill_one_tank(this, b);
                }
            }
        }
        ;
        //ha Tank ütközik extrával
        collision_data = g_collisioner.check_collision_one_to_n(this, Extra);
        let colliding_extra = collision_data['collision'];
        if ((colliding_extra.right || colliding_extra.left || colliding_extra.up || colliding_extra.down) && this.shoot_type === 'normal') {
            for (let e of collision_data['collided']) {
                this.shoot_type = e.type;
                e.destroy([Extra.list]);
                if (e.type === 'bl') {
                    this.mods.blade_boost = 1;
                }
            }
        }
        ;
        //ha a tank kimegy a játszható területről
        let playarea = g_worlds[g_playerdata[this.id].world_id].playarea;
        if (!this.inactive && (this.x < playarea.x || this.y < playarea.y || this.x > playarea.xend || this.y > playarea.yend)) {
            this.inactive = true;
            kill_one_tank(this);
        }

    }
    ;
    apply_input_movement_data(repeat) {
        if (this.inactive) {
            return;
        }
        for (let rep = 0; rep < repeat; rep++) {

            let input_data = this.list_of_inputs.splice(0, 1); //kiszedjük a tömbből
            input_data = (input_data[0] === undefined ? [0, 0, 0, 0] : input_data[0]); //csak az elsőre vagyunk kíváncsiak. a splice tömböt ad vissza mindig. ha üres, nem megy.
            let rotate = false;

            if (input_data[1] === 1) {
                this.speed = this.normal_speed * 0.7;
            } else {
                this.speed = this.normal_speed;
            }

            let final_rotate = 0;
            if (input_data[3] === 1) { //right
                final_rotate = this.rot_speed + this.mods.blade_boost*0.02;
            }
            if (input_data[2] === 1) { //left
                final_rotate = -1 * (this.rot_speed + this.mods.blade_boost*0.02);
            }
            this.rotation += final_rotate; //*delta

            this.hitbox = {//téglalap 4 sarka
                'x1': this.x - 13,
                'x2': this.x + 13,
                'y1': this.y - 13,
                'y2': this.y + 13
            };

            let x_wannago = 0;
            let y_wannago = 0;
            let final_spd = this.speed + this.mods.blade_boost*0.5;
            let cosos = Math.cos(this.rotation) * final_spd;
            let sines = Math.sin(this.rotation) * final_spd;
            if (input_data[0] === 1) { //up
                x_wannago = cosos; //*delta
                y_wannago = sines; //*delta
            } else if (input_data[1] === 1) { //down
                x_wannago = -1 * cosos; //*delta
                y_wannago = -1 * sines; //*delta
            }

            //mozgás és fal-ütközés
            if (x_wannago !== 0 || y_wannago !== 0) {
                let x_w_rounded = x_wannago > 0 ? Math.ceil(x_wannago) : Math.floor(x_wannago);
                let y_w_rounded = y_wannago > 0 ? Math.ceil(y_wannago) : Math.floor(y_wannago);
                let collision_data = g_collisioner.check_collision_one_to_n(this, Wall, x_w_rounded, y_w_rounded);
                let colliding = collision_data['collision'];

                if ((x_wannago > 0 && !colliding.right) || (x_wannago < 0 && !colliding.left)) {
                    this.x += x_wannago;
                }
                if ((y_wannago > 0 && !colliding.down) || (y_wannago < 0 && !colliding.up)) {
                    this.y += y_wannago;
                }
            }
        }
    }
    triggerShoot(turn) {
        if (this.inactive) {
            return;
        }
        if (this.shoot_phase === 'shoot') {
            // fordulás közben kicsit más irányba lövi, hogy kompenzálja a lag-ot
            let t = 0;
            if (turn === 'l') {
                t = -1;
            } else if (turn === 'r') {
                t = 1;
            }
            let fixed_rotation = this.rotation + 3 * t * Math.abs(this.rot_speed);

            switch (this.shoot_type) {
                case 'wait':
                    //nem lövünk
                    break;
                case 'gh': //ghost
                    this.createGhostBullet({'rotation': fixed_rotation});
                    this.shoot_type = 'normal';
                    break;
                case 'fr': //repesz
                    this.createFragBullet({'rotation': fixed_rotation});
                    this.shoot_phase = 'trigger';
                    break;
                case 'be': //beam erősen TODO
                    this.createBeam();
                    this.shoot_phase = 'wait';
                    break;
                case 'bl': //blade
                    this.shoot_phase = 'wait';
                    this.events.push('blade');
                    
                    g_worlds[g_playerdata[this.id].world_id].countdowns.push ({
                        'timer': 15,
                        'call': function (tank) {
                            tank.shoot_phase = 'shoot'; //lőhet
                            tank.shoot_type = 'normal'; //normál lövedéket
                        },
                        'params': [this]
                    });
                    
                    this.mods.blade_boost = 0;
                    break;
                default: //sima lövedék
                    this.createBullet({'rotation': fixed_rotation});
            }
        } else if (this.shoot_phase === 'trigger') {
            switch (this.shoot_type) {
                case 'fr': //repesz
                    for (let t in Bullet.list) {
                        if (Bullet.list[t].constructor.name === 'FragBullet' && Bullet.list[t].player_id == this.id) {
                            Bullet.list[t].boom();
                        }
                    }
                    break;
            }
        }
    };
    createBullet(data) {
        let rot = (data.rotation !== undefined ? data.rotation : this.rotation);
        if (this.bullet_count > 0) {
            Bullet.list[Bullet.list_id_count] = new Bullet({
                'x': this.x,
                'y': this.y,
                'x_graph': this.x_graph,
                'y_graph': this.y_graph,
                'id': Bullet.list_id_count,
                'player_id': this.id,
                'rotation': rot,
                'tint': this.tint
            });
            Bullet.list[Bullet.list_id_count].move_starting_pos(); //a tank csövéhez teszi a golyót
            let send_bullet = Bullet.list[Bullet.list_id_count] //TODO: csak a legszükségesebb adatokat küldeni. máshol is!
            send_bullet.type = 'Bullet';
            let bl = {
                'bullets': {self_id: send_bullet}
            };
            broadcast_simple('init', bl);
            Bullet.list_id_count++;
            this.bullet_count--;
        };
    };
    createGhostBullet(data) {
        let angle = 0.2;
        let rot = (data.rotation !== undefined ? data.rotation : this.rotation) - angle;
        for (let r = 0; r <= 2; r += 1) {
            Bullet.list[Bullet.list_id_count] = new GhostBullet({
                'x': this.x,
                'y': this.y,
                'id': Bullet.list_id_count,
                'player_id': this.id,
                'rotation': rot,
                'tint': this.tint
            });
            rot += angle;
            Bullet.list[Bullet.list_id_count].move_starting_pos(); //a tank csövéhez teszi a golyót
            let send_bullet = Bullet.list[Bullet.list_id_count]; //TODO: csak a legszükségesebb adatokat küldeni. máshol is!
            send_bullet.type = 'GhostBullet';
            let bl = {
                'bullets': {self_id: send_bullet}
            };
            broadcast_simple('init', bl);
            Bullet.list_id_count++;
        }
    };
    createFragBullet(data) {
        let rot = (data.rotation !== undefined ? data.rotation : this.rotation);
        Bullet.list[Bullet.list_id_count] = new FragBullet({
            'x': this.x,
            'y': this.y,
            'id': Bullet.list_id_count,
            'player_id': this.id,
            'rotation': rot,
            'tint': this.tint,
            'timer': 500
        });
        Bullet.list[Bullet.list_id_count].move_starting_pos(); //a tank csövéhez teszi a golyót
        let send_bullet = Bullet.list[Bullet.list_id_count]; //TODO: csak a legszükségesebb adatokat küldeni. máshol is!
        send_bullet.type = 'FragBullet';
        let bl = {
            'bullets': {self_id: send_bullet}
        };
        broadcast_simple('init', bl);
        Bullet.list_id_count++;
    };
    createBeam(data) {
        let rot = (data.rotation !== undefined ? data.rotation : this.rotation);
        Bullet.list[Bullet.list_id_count] = new Beam({
            'x': this.x + 20 * Math.cos(rot),
            'y': this.y + 20 * Math.sin(rot),
            'id': Bullet.list_id_count,
            'player_id': this.id,
            'rotation': rot,
            'tint': this.tint,
            'timer': 60
        });
        let send_bullet = Bullet.list[Bullet.list_id_count]; //TODO: csak a legszükségesebb adatokat küldeni. máshol is!
        send_bullet.type = 'Beam';
        let bl = {
            'bullets': {self_id: send_bullet}
        };
        broadcast_simple('init', bl);
        Bullet.list_id_count++;
    };
    ext_machinegun() {
        Bullet.list[Bullet.list_id_count] = new Bullet({
            'x': this.x,
            'y': this.y,
            'x_graph': this.x_graph,
            'y_graph': this.y_graph,
            'id': Bullet.list_id_count,
            'player_id': this.id,
            'rotation': this.rotation + Math.PI / 8 * Math.random() - Math.PI / 8 * Math.random(),
            'tint': this.tint
        });
        Bullet.list_id_count++;
    };
    destroy(param) {
        super.destroy(param);
        let self_id = this.id;
        let data = {//ide jön minden, amit a játékos kilépésénél pucolni kell
            'tanks': {self_id: self_id} //itt direkt tömb van, hátha többet akarunk destroyolni
        };
        broadcast_simple('destroy', data);
    }
};

//lövedék
Bullet = class Bullet extends Entity {
    constructor(data) {
        if (data.speed === undefined) {
            data.speed = 2.6;
        }
        if (data.width === undefined) {
            data.width = 10;
        }
        if (data.height === undefined) {
            data.height = 10;
        }
        super(data);
        this.inactive = false;
        this.parent_protect = true; //ameddig el nem távolodik biztonságos távra (vagy falnak ütközik), nem öli meg a saját tankot
        this.starting_pos = false; //csak ameddig a while-ban a tank csövéhez teszem
        this.starting_timer = 0; //ha közel pattintja a falnak a játékos a golyót, egy darabig még nem aktiválódik, hogy kicsit megengedőbb legyen
        this.timer = (data.timer !== undefined ? data.timer : 400);
        this.player_id = (data.player_id !== undefined ? data.player_id : 0);
        this.Boom = false;
        this.hitbox = {
            'x1': this.x - 4,
            'x2': this.x + 4,
            'y1': this.y - 4,
            'y2': this.y + 4
        };
    }
    ;
            updatePosition() { //TODO: a szögfüggvényes számolást nem kell minden tikben elvégezni, csak ha változás történik

        this.rotation = normalize_rad(this.rotation);

        this.hitbox = {//TODO: más lövedékeknél ez eltérő lehet...
            'x1': this.x - 4,
            'x2': this.x + 4,
            'y1': this.y - 4,
            'y2': this.y + 4
        };

        let x_wannago = 0;
        let y_wannago = 0;
        let cosos = Math.cos(this.rotation) * this.speed;
        let sines = Math.sin(this.rotation) * this.speed;

        x_wannago = cosos; //*delta
        y_wannago = sines; //*delta

        let x_w_rounded = x_wannago >= 0 ? Math.ceil(x_wannago) : Math.floor(x_wannago);
        let y_w_rounded = y_wannago >= 0 ? Math.ceil(y_wannago) : Math.floor(y_wannago);
        let collision_data = g_collisioner.check_collision_one_to_n(this, Wall, x_w_rounded, y_w_rounded);
        let colliding = collision_data['collision'];
        if ((x_wannago > 0 && colliding.right) || (x_wannago < 0 && colliding.left)) {
            this.rotation = Math.PI - this.rotation; //vízszintesen tükrözöm az irányát
            x_wannago = -x_wannago; //és a mostani célzott helyet is felülírom
            if (this.parent_protect || !this.starting_pos) {
                this.starting_pos = true;
                if (this.starting_timer == 0) {
                    this.starting_timer = 8;
                }
            }
        }
        if ((y_wannago > 0 && colliding.down) || (y_wannago < 0 && colliding.up)) {
            this.rotation = 2 * Math.PI - this.rotation; //függőlegesen tükrözöm az irányát
            y_wannago = -y_wannago; //és a mostani célzott helyet is felülírom
            if (this.parent_protect || !this.starting_pos) {
                this.starting_pos = true;
                if (this.starting_timer == 0) {
                    this.starting_timer = 8;
                }
            }

        }
        this.x += x_wannago;
        this.y += y_wannago;

        if (this.starting_timer > 0) {
            this.starting_timer--;
            if (this.starting_timer == 0) {
                this.parent_protect = false;
            }
        }

        if (!this.starting_pos || this.parent_protect) {
            if (Tank.list[this.player_id] === undefined) {
                this.starting_pos = true;
            } else {
                let dist = Math.sqrt(Math.pow(this.x - Tank.list[this.player_id].x, 2) + Math.pow(this.y - Tank.list[this.player_id].y, 2));
                if (dist > 20) { //20 pixelnél már kirajzoljuk
                    this.starting_pos = true;
                }
                if (dist > 30) { //30 pixelnél már a saját tankot is ölheti
                    this.parent_protect = false;
                }
            }
        }

        this.timer--;

        if (this.timer < 1) {
            this.destroy([Bullet.list]);
        }
    }
    ;
            destroy(param) { //override-oljuk a destroyt mer object specifikus cuccot csinálunk
        if (Tank.list[this.player_id] !== undefined && this.constructor.name === 'Bullet' && this.stop_count !== true) { //csak sima bulletnél kell visszaállítani a limitet
            Tank.list[this.player_id].bullet_count++;
        }
        super.destroy(param);
        let self_id = this.id;
        let data = {
            'bullets': {self_id: self_id} //itt direkt tömb van, hátha többet akarunk destroyolni
        };
        broadcast_simple('destroy', data);
    }
    move_starting_pos() {
        g_collisioner.update_arrays();
        do {
            this.updatePosition();
        } while (!this.starting_pos);
    }
};

GhostBullet = class GhostBullet extends Bullet {
    constructor(data) {
        super(data);
        this.timer = (data.timer !== undefined ? data.timer : 600);
    }
    ;
            updatePosition() {

        this.rotation = normalize_rad(this.rotation);

        this.hitbox = {
            'x1': this.x - 4,
            'x2': this.x + 4,
            'y1': this.y - 4,
            'y2': this.y + 4
        };

        let x_wannago = 0;
        let y_wannago = 0;
        let cosos = Math.cos(this.rotation) * this.speed;
        let sines = Math.sin(this.rotation) * this.speed;

        x_wannago = cosos;
        y_wannago = sines;
        this.x += x_wannago;
        this.y += y_wannago;

        if (this.starting_timer > 0) {
            this.starting_timer--;
            if (this.starting_timer == 0) {
                this.parent_protect = false;
            }
        }

        if (!this.starting_pos || this.parent_protect) {
            if (Tank.list[this.player_id] === undefined) {
                this.starting_pos = true;
            } else {
                let dist = Math.sqrt(Math.pow(this.x - Tank.list[this.player_id].x, 2) + Math.pow(this.y - Tank.list[this.player_id].y, 2));
                if (dist > 20) { //20 pixelnél már kirajzoljuk
                    this.starting_pos = true;
                }
                if (dist > 30) { //30 pixelnél már a saját tankot is ölheti
                    this.parent_protect = false;
                }
            }
        }

        this.timer--;

        if (this.timer < 1) {
            this.destroy([Bullet.list]);
        }
    }
    ;
};

FragBullet = class FragBullet extends Bullet {
    constructor(data) {
        if (data.speed === undefined) {
            data.speed = 2.5;
        }
        if (data.width === undefined) {
            data.width = 10;
        }
        if (data.height === undefined) {
            data.height = 10;
        }
        super(data);
        this.starting_timer = data.timer;
    }
    ;
            boom() {
        let parent = Tank.list[this.player_id];
        if (parent !== undefined) {
            parent.shoot_type = 'normal';
            parent.shoot_phase = 'shoot';
            for (let i = 0; i < 12; i++) {
                Bullet.list[Bullet.list_id_count] = new Bullet({
                    'x': this.x,
                    'y': this.y,
                    'x_graph': this.x_graph,
                    'y_graph': this.y_graph,
                    'id': Bullet.list_id_count,
                    'player_id': this.player_id,
                    'rotation': this.rotation + i * Math.PI / 6,
                    'speed': 2 + 2 * Math.random(),
                    'timer': 80,
                    'tint': this.tint
                });
                Bullet.list[Bullet.list_id_count].stop_count = true; //hogy ne növelje a max darabszámot, amikor elpusztul.
                Bullet.list[Bullet.list_id_count].move_starting_pos(); //a tank csövéhez teszi a golyót
                let send_bullet = Bullet.list[Bullet.list_id_count]; //TODO: csak a legszükségesebb adatokat küldeni. máshol is!
                send_bullet.type = 'Bullet';
                let bl = {
                    'bullets': {self_id: send_bullet}
                };
                broadcast_simple('init', bl); //TODO: az inicializálásokat össze lehetne szedni, és a sima 20fps-es csomagban egyszerre küldeni, nem külön-külön üzenetekben.
                Bullet.list_id_count++;
            }
            ;
        }

        Tank.list[this.player_id].can_shoot = true;
        this.destroy([Bullet.list]);
    }
    ;
            updatePosition() {
        if (this.timer <= 1) {
            this.boom();
        } else {
            super.updatePosition();
        }
    }
    ;
};

Beam = class Beam extends Bullet {
    constructor(data) {
        if (data.speed === undefined) {
            data.speed = 2.5;
        }
        if (data.width === undefined) {
            data.width = 10;
        }
        if (data.height === undefined) {
            data.height = 10;
        }
        super(data);
    }
    ;
            updatePosition() {
        this.timer--;
        if (this.timer < 1) {
            this.destroy([Bullet.list]);
        }
    }
    ;
};

Extra = class Extra extends Entity {
    constructor(data) {
        if (data.width === undefined) {
            data.width = 20;
        }
        if (data.height === undefined) {
            data.height = 20;
        }
        super(data);
        let width = (data.width !== undefined ? data.width : 10);
        let height = (data.height !== undefined ? data.height : 10);
        this.hitbox = {//téglalap 4 sarka
            'x1': this.x - width / 2,
            'x2': this.x + width / 2,
            'y1': this.y - height / 2,
            'y2': this.y + height / 2
        };
        this.type = (data.type !== undefined ? data.type : 'gh'); //defaultként a ghost-bulletre inicializálom, mert miért ne.
    }
    ;
            destroy(param) {
        super.destroy(param);
        let self_id = this.id;
        let data = {
            'extras': {self_id: self_id}
        };
        broadcast_simple('destroy', data);
    }
};

//labirintus egy mezője
Node = class Node {
    constructor(data) {
        this.x_graph = (data.x !== undefined ? data.x : 0); //0 -> n ig a gráfban elfoglalt x, y pozíció
        this.y_graph = (data.y !== undefined ? data.y : 0);
        this.x = border.x + this.x_graph * g_field_size; //a pályán ténylegesen elfoglalt x, y pozíció
        this.y = border.x + this.y_graph * g_field_size;
        this.block_id = -1; //melyik összefüggő blokkba tartozik. -1=egyikbe sem.
        this.unused_paths = 2; //mennyi utat tudna még létrehozni
        this.path = [0, 0]; // 0 vagy 1: nincs/van út jobbra / lefele. így azokra csak ő tehet utat, nincs ütközés. -1 akkor lesz, ha mellette/alatta vége a pályának
        if (this.x_graph == g_dimensions.x - 1) {
            this.path[0] = -1;
            this.unused_paths--;
        }
        if (this.y_graph == g_dimensions.y - 1) {
            this.path[1] = -1;
            this.unused_paths--;
        }

    }
    //csinál utakat magának
    generate_paths() {
        for (var i = 0; i < 2; i++) {
            if (this.path[i] == 0 && Math.random() < g_path_gen_chance) {
                this.path[i] = 1;
                this.unused_paths--;
            }
        }
    }
    //rekurzív funkció: besorolja egy blokkba magát és az összes hozzá kapcsolódó node-ot. visszatér a blokk tőle indult darabszámával
    besorol(actual_block, graph) {
        if (this.block_id !== -1) {
            //ha már be volt sorolva, nem folytatja
            return 0;
        } else {
            this.block_id = actual_block;
            var children_size = 1; //1 mert önmaga is hozzáadódik a blokkhoz.
            //először a balra és felette lévőket kérdezzük le
            if (graph[this.x_graph - 1] !== undefined && graph[this.x_graph - 1][this.y_graph].path[0] == 1) {
                children_size += graph[this.x_graph - 1][this.y_graph].besorol(actual_block, graph);
            }
            if (graph[this.x_graph][this.y_graph - 1] !== undefined && graph[this.x_graph][this.y_graph - 1].path[1] == 1) {
                children_size += graph[this.x_graph][this.y_graph - 1].besorol(actual_block, graph);
            }
            //majd a jobbra és alatta lévőket
            if (this.path[0] == 1) {
                children_size += graph[this.x_graph + 1][this.y_graph].besorol(actual_block, graph);
            }
            if (this.path[1] == 1) {
                children_size += graph[this.x_graph][this.y_graph + 1].besorol(actual_block, graph);
            }
            return children_size;
        }
    }
}

//ütközések vizsgálatáért felelős osztály (pálya-felosztósdival optimalizálva)
CollisionManager = class CollisionManager {
    constructor(data) {
        this.field_size = (data.field_size !== undefined ? data.field_size : 80); //hányszor hányas kockákra ossza fel a teret
    }
    //megnézi melyik dobozba/dobozokba kell tenni az entity-t
    get_placing_boxes(entity) {
        let results = [];
        let border = 5; //ennyi pixellel számol ráhagyást a tényleges hitboxra, hogy elkerüljük az épp blokk szélén lévő falak hiányának problémáját
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
        for (let key in Tank.list) {
            Tank.list[key].collision_block = [];
            this.place(Tank.list[key]);
        }
        for (let key in Wall.list) {
            Wall.list[key].collision_block = [];
            this.place(Wall.list[key]);
        }
        for (let key in Bullet.list) {
            Bullet.list[key].collision_block = [];
            this.place(Bullet.list[key]);
        }
        for (let key in Extra.list) {
            Extra.list[key].collision_block = [];
            this.place(Extra.list[key]);
        }
    }
    //sima egy az n-hez ütközést ellenőriz, tömbbel tér vissza. (4 irány)
    check_collision_one_to_n(target, c_class, xnext = 0, ynext = 0, obj_id = false) {
        let t_width = Math.abs(target.hitbox.x1 - target.hitbox.x2);
        let t_height = Math.abs(target.hitbox.y1 - target.hitbox.y2);
        let collision = {'right': false, 'up': false, 'left': false, 'down': false};
        let collided = [];
        for (let block of target.collision_block) {
            if (CollisionManager.map === undefined || CollisionManager.map[block[0]] === undefined) {
                return {'collision': collision, 'collided': collided};
            }
            for (let obj of CollisionManager.map[block[0]][block[1]]) {
                if (!(obj instanceof c_class)) {
                    continue;
                }
                if (obj_id !== false && obj.id !== obj_id) {
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

                    if (target instanceof Tank) {
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
                    } else {
                        let wy = w * dy;
                        let hx = h * dx;
                        if (wy > hx) {
                            if (wy > -hx) {
                                if (Math.abs(dx) <= w) { //téves ütközés elkerülésére
                                    collision.up = true;
                                }
                            } else {
                                if (Math.abs(dy) <= h) {
                                    collision.right = true;
                                }
                            }
                        } else {
                            if (wy > -hx) {
                                if (Math.abs(dy) <= h) {
                                    collision.left = true;
                                }
                            } else {
                                if (Math.abs(dx) <= w) {
                                    collision.down = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return {'collision': collision, 'collided': collided};
    }
};

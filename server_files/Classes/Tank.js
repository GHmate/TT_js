const Entity = require("./Entity");
require("../Functions/s_functions.js");
const tankFunctions = require("../Functions/tankFunctions.js");
const boardFunctions = require("../Functions/boardFunctions.js");

module.exports = class Tank extends Entity {
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
        let collision_data = g_collisioner.check_collision_one_to_n(this, 'Bullet');
        let colliding_bullet = collision_data['collision'];
        if (colliding_bullet.right || colliding_bullet.left || colliding_bullet.up || colliding_bullet.down) {
            for (let b of collision_data['collided']) {
                if (b.inactive === false && this.inactive === false && !(b.parent_protect && b.player_id === this.id)) {
                    if (b.constructor.name === 'FragBullet') {
                        b.boom();
                    }
                    b.inactive = true;
                    this.inactive = true;
                    boardFunctions.kill_one_tank(this, b);
                }
            }
        }

        //ha Tank ütközik extrával
        collision_data = g_collisioner.check_collision_one_to_n(this, 'Extra');
        let colliding_extra = collision_data['collision'];
        if ((colliding_extra.right || colliding_extra.left || colliding_extra.up || colliding_extra.down) && this.shoot_type === 'normal') {
            for (let e of collision_data['collided']) {
                this.shoot_type = e.type;
                e.destroy([g_worlds[0].lists.extra]);
                if (e.type === 'bl') {
                    this.mods.blade_boost = 1;
                }
            }
        }
        //ha a tank kimegy a játszható területről
        let playarea = g_worlds[g_playerdata[this.id].world_id].playarea;
        if (!this.inactive && (this.x < playarea.x || this.y < playarea.y || this.x > playarea.xend || this.y > playarea.yend)) {
            this.inactive = true;
            boardFunctions.kill_one_tank(this);
        }

    }
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
                let collision_data = g_collisioner.check_collision_one_to_n(this, 'Wall', x_w_rounded, y_w_rounded);
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
                    createGhostBullet({'rotation': fixed_rotation}, this);
                    this.shoot_type = 'normal';
                    break;
                /*case 'fr': //repesz
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

                    this.do_blade(this.id);
                    g_worlds[g_playerdata[this.id].world_id].countdowns.push ({
                        'timer': 5,
                        'call': this.do_blade,
                        'params': [this.id]
                    });

                    //timer, ameddig nem engedjük lőni / extrát felvenni
                    g_worlds[g_playerdata[this.id].world_id].countdowns.push ({
                        'timer': 15,
                        'call': function (tank) {
                            tank.shoot_phase = 'shoot'; //lőhet
                            tank.shoot_type = 'normal'; //normál lövedéket
                        },
                        'params': [this]
                    });

                    this.mods.blade_boost = 0;
                    break;*/
                default: //sima lövedék
                    tankFunctions.createBullet({'rotation': fixed_rotation}, this);
            }
        } else if (this.shoot_phase === 'trigger') {
            switch (this.shoot_type) {
                case 'fr': //repesz
                    for (let t in g_worlds[0].lists.bullet) {
                        if (g_worlds[0].lists.bullet[t].constructor.name === 'FragBullet' && g_worlds[0].lists.bullet[t].player_id == this.id) {
                            g_worlds[0].lists.bullet[t].boom();
                        }
                    }
                    break;
            }
        }
    }
/*

    createFragBullet(data) {
        let rot = (data.rotation !== undefined ? data.rotation : this.rotation);
        g_worlds[0].lists.bullet[g_worlds[0].lists.bullet_id_count] = new FragBullet({
            'x': this.x,
            'y': this.y,
            'id': g_worlds[0].lists.bullet_id_count,
            'player_id': this.id,
            'rotation': rot,
            'tint': this.tint,
            'timer': 500
        });
        g_worlds[0].lists.bullet[g_worlds[0].lists.bullet_id_count].move_starting_pos(); //a tank csövéhez teszi a golyót
        let send_bullet = g_worlds[0].lists.bullet[g_worlds[0].lists.bullet_id_count]; //TODO: csak a legszükségesebb adatokat küldeni. máshol is!
        send_bullet.type = 'FragBullet';
        let bl = {
            'bullets': {self_id: send_bullet}
        };
        broadcast_simple('init', bl);
        g_worlds[0].lists.bullet_id_count++;
    }
    createBeam(data) {
        let rot = (data.rotation !== undefined ? data.rotation : this.rotation);
        g_worlds[0].lists.bullet[g_worlds[0].lists.bullet_id_count] = new Beam({
            'x': this.x + 20 * Math.cos(rot),
            'y': this.y + 20 * Math.sin(rot),
            'id': g_worlds[0].lists.bullet_id_count,
            'player_id': this.id,
            'rotation': rot,
            'tint': this.tint,
            'timer': 60
        });
        let send_bullet = g_worlds[0].lists.bullet[g_worlds[0].lists.bullet_id_count]; //TODO: csak a legszükségesebb adatokat küldeni. máshol is!
        send_bullet.type = 'Beam';
        let bl = {
            'bullets': {self_id: send_bullet}
        };
        broadcast_simple('init', bl);
        g_worlds[0].lists.bullet_id_count++;
    }
    ext_machinegun() {
        g_worlds[0].lists.bullet[g_worlds[0].lists.bullet_id_count] = new Bullet({
            'x': this.x,
            'y': this.y,
            'x_graph': this.x_graph,
            'y_graph': this.y_graph,
            'id': g_worlds[0].lists.bullet_id_count,
            'player_id': this.id,
            'rotation': this.rotation + Math.PI / 8 * Math.random() - Math.PI / 8 * Math.random(),
            'tint': this.tint
        });
        g_worlds[0].lists.bullet_id_count++;
    }
    do_blade(id) {
        let tank = g_worlds[0].lists.tank[id];
        let final_pos_x = tank.x + 105 * Math.cos(tank.rotation);
        let final_pos_y = tank.y + 105 * Math.sin(tank.rotation);
        let blade_obj = {'x1': tank.x,'y1': tank.y,'x2': final_pos_x,'y2': final_pos_y};
        g_collisioner.blade_collision(blade_obj,tank.id);
    }*/
    destroy(param) {
        super.destroy(param);
        let self_id = this.id;
        let data = {//ide jön minden, amit a játékos kilépésénél pucolni kell
            'tanks': {self_id: self_id} //itt direkt tömb van, hátha többet akarunk destroyolni
        };
        broadcast_simple('destroy', data);
    }
}

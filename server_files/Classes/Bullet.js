const Entity = require("./Entity");

module.exports = class Bullet extends Entity {
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
        this.type = data.type;
    }
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
        let collision_data = g_collisioner.check_collision_one_to_n(this, 'Wall', x_w_rounded, y_w_rounded);
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
            if (g_worlds[0].lists.tank[this.player_id] === undefined) {
                this.starting_pos = true;
            } else {
                let dist = Math.sqrt(Math.pow(this.x - g_worlds[0].lists.tank[this.player_id].x, 2) + Math.pow(this.y - g_worlds[0].lists.tank[this.player_id].y, 2));
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
            this.destroy([g_worlds[0].lists.bullet]);
        }
    }
    destroy(param) { //override-oljuk a destroyt mer object specifikus cuccot csinálunk
        if (g_worlds[0].lists.tank[this.player_id] !== undefined && this.constructor.name === 'Bullet' && this.stop_count !== true) { //csak sima bulletnél kell visszaállítani a limitet
            g_worlds[0].lists.tank[this.player_id].bullet_count++;
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
}

const Bullet = require("./Bullet");

module.exports = class GhostBullet extends Bullet {
    constructor(data) {
        super(data);
        this.timer = (data.timer !== undefined ? data.timer : 600);
    }
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
}

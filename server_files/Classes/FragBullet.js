const Bullet = require("./Bullet");
require("../s_functions.js");

module.exports = class FragBullet extends Bullet {
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
    boom() {
        let parent = g_worlds[0].lists.tank[this.player_id];
        if (parent !== undefined) {
            parent.shoot_type = 'normal';
            parent.shoot_phase = 'shoot';
            for (let i = 0; i < 12; i++) {
                let newBullet = g_worlds[0].lists.bullet[g_worlds[0].lists.bullet_id_count] = new Bullet({
                    'x': this.x,
                    'y': this.y,
                    'x_graph': this.x_graph,
                    'y_graph': this.y_graph,
                    'id': g_worlds[0].lists.bullet_id_count,
                    'player_id': this.player_id,
                    'rotation': this.rotation + i * Math.PI / 6,
                    'speed': 2 + 2 * Math.random(),
                    'timer': 80,
                    'tint': this.tint
                });
                newBullet.stop_count = true; //hogy ne növelje a max darabszámot, amikor elpusztul.
                broadcastBullet(newBullet);
            }
        }

        g_worlds[0].lists.tank[this.player_id].can_shoot = true;
        this.destroy([g_worlds[0].lists.bullet]);
    }
    updatePosition() {
        if (this.timer <= 1) {
            this.boom();
        } else {
            super.updatePosition();
        }
    }
}

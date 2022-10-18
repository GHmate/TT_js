const Bullet = require("./Bullet");

module.exports = class Beam extends Bullet {
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
    updatePosition() {
        this.timer--;
        if (this.timer < 1) {
            this.destroy([g_worlds[0].lists.bullet]);
        }
    }
}

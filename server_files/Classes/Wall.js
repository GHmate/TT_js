const Entity = require("./Entity");

module.exports = class Wall extends Entity {
    constructor(data) {
        super(data);
        this.hitbox = { //téglalap 4 sarka
            'x1': this.x - this.width / 2,
            'x2': this.x + this.width / 2,
            'y1': this.y - this.height / 2,
            'y2': this.y + this.height / 2
        };
    }
}

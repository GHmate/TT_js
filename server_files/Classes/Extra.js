const Entity = require("./Entity");

module.exports = class Extra extends Entity {
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
    destroy(param) {
        super.destroy(param);
        let self_id = this.id;
        let data = {
            'extras': {self_id: self_id}
        };
        broadcast_simple('destroy', data);
    }
}

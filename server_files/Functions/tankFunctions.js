require("./s_functions.js");
const Bullet = require("../Classes/Bullet");

module.exports.createBullet = (data, tank) => {
    let rot = (data.rotation !== undefined ? data.rotation : tank.rotation);
    if (tank.bullet_count > 0) {
        let newBullet = g_worlds[0].lists.bullet[g_worlds[0].lists.bullet_id_count] = new Bullet({
            'x': tank.x,
            'y': tank.y,
            'id': g_worlds[0].lists.bullet_id_count,
            'player_id': tank.id,
            'rotation': rot,
            'tint': tank.tint
        });
        broadcastBullet(newBullet);
        tank.bullet_count--;
    }
}

module.exports.createGhostBullet = (data, tank) => {
    let angle = 0.2;
    let rot = (data.rotation !== undefined ? data.rotation : tank.rotation) - angle;
    for (let r = 0; r <= 2; r += 1) {
        let newBullet = g_worlds[0].lists.bullet[g_worlds[0].lists.bullet_id_count] = new GhostBullet({
            'x': tank.x,
            'y': tank.y,
            'id': g_worlds[0].lists.bullet_id_count,
            'player_id': tank.id,
            'rotation': rot,
            'tint': tank.tint
        });
        rot += angle;
        broadcastBullet(newBullet);
    }
}

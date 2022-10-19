require("./s_functions.js");
const Bullet = require("../Classes/Bullet");
const GhostBullet = require("../Classes/GhostBullet");
const FragBullet = require("../Classes/FragBullet");

module.exports.createBullet = (data, tank) => {
    let rot = (data.rotation !== undefined ? data.rotation : tank.rotation);
    if (tank.bullet_count > 0) {
        let newBullet = g_worlds[0].lists.bullet[g_worlds[0].lists.bullet_id_count] = new Bullet({
            'x': tank.x,
            'y': tank.y,
            'id': g_worlds[0].lists.bullet_id_count,
            'player_id': tank.id,
            'rotation': rot,
            'tint': tank.tint,
            'type': 'Bullet'
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
            'tint': tank.tint,
            'type': 'GhostBullet'
        });
        rot += angle;
        broadcastBullet(newBullet);
    }
}

module.exports.createFragBullet = (data, tank) => {
    let rot = (data.rotation !== undefined ? data.rotation : tank.rotation);
    let newBullet = g_worlds[0].lists.bullet[g_worlds[0].lists.bullet_id_count] = new FragBullet({
        'x': tank.x,
        'y': tank.y,
        'id': g_worlds[0].lists.bullet_id_count,
        'player_id': tank.id,
        'rotation': rot,
        'tint': tank.tint,
        'timer': 500,
        'type': 'FragBullet'
    });
    broadcastBullet(newBullet);
    g_worlds[0].lists.bullet_id_count++;
}

module.exports.swingBlade = (tank) => {
    tank.shoot_phase = 'wait';
    tank.events.push('blade');

    // I make the blade hitbox trigger twice with a delay, to mimic "rotating" it during the animation.
    createBladeHitbox(tank);
    g_worlds[g_playerdata[tank.id].world_id].countdowns.push ({
        'timer': 5,
        'call': createBladeHitbox,
        'params': [tank]
    });

    //timer, ameddig nem engedjük lőni / extrát felvenni
    g_worlds[g_playerdata[tank.id].world_id].countdowns.push ({
        'timer': 15,
        'call': function (tank) {
            tank.shoot_phase = 'shoot'; //lőhet
            tank.shoot_type = 'normal'; //normál lövedéket
        },
        'params': [tank]
    });

    tank.mods.blade_boost = 0;
}

function createBladeHitbox (tank) {
    let final_pos_x = tank.x + 105 * Math.cos(tank.rotation);
    let final_pos_y = tank.y + 105 * Math.sin(tank.rotation);
    let blade_obj = {'x1': tank.x,'y1': tank.y,'x2': final_pos_x,'y2': final_pos_y};
    g_collisioner.blade_collision(blade_obj, tank.id);
}

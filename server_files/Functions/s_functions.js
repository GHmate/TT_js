const Extra = require('../Classes/Extra');
const boardFunctions = require("./boardFunctions");

//tömb sorrend keverés
shuffle = function (a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
}

//futás megállítása
die = function (data) {
    console.log('die:');
    console.log(data);
    throw new Error('run_stopped');
};
//extra spawn
createExtra = function () {
    let koordinata = g_worlds[0].leteheto_nodes[getRandomInt(0, g_worlds[0].leteheto_nodes.length - 1)];
    let customnode = graph[koordinata[0]][koordinata[1]];
    g_worlds[0].lists.extra[g_worlds[0].lists.extra_id_count] = new Extra({
        'x': customnode.x,
        'y': customnode.y,
        'x_graph': customnode.x_graph,
        'y_graph': customnode.y_graph,
        'id': g_worlds[0].lists.extra_id_count,
        'type': Extra.type_list[getRandomInt(0, Extra.type_list.length - 1)]
    });
    let ex = {
        'extras': {self_id: g_worlds[0].lists.extra[g_worlds[0].lists.extra_id_count]}
    };
    broadcast_simple('init', ex);
    g_worlds[0].lists.extra_id_count++;

    g_worlds[0].countdowns.push ({
        'timer': 100,
        'call': createExtra
    });
};
//random int
getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
//visszateszi a szöget 0 és 2pi közé, biztos ami biztos
normalize_rad = function (rad) {
    while (rad < 0) {
        rad += 2 * Math.PI;
    }
    while (rad > 2 * Math.PI) {
        rad -= 2 * Math.PI;
    }
    return rad;
};

get_world_sockets = function (socket_list, exception = - 1, world_id = 0) {
    let ret = [];
    for (var i in socket_list) {
        if (socket_list[i].id !== exception && g_playerdata[socket_list[i].id].world_id == world_id) {
            ret.push(socket_list[i]);
        }
    }
    return ret;
};

broadcast_simple = function (name, data = '', world_id = 0) {
    let socket_list = get_world_sockets(SOCKET_LIST, -1, world_id);
    for (var i in socket_list) {
        socket_list[i].emit(name, data);
    }
}

broadcast_simple_except_one = function (one, name, data = '', world_id = 0) {
    let socket_list = get_world_sockets(SOCKET_LIST, one, world_id);
    for (var i in socket_list) {
        socket_list[i].emit(name, data);
    }
}

/*broadcast_all = function(name,data = '',socket_list = get_world_sockets(SOCKET_LIST)) { //TODO: minden emberkének broadcastoló funkció, még ha nincs tankja akkor is.
 
 }*/

world_has_tank = function (world_id, tank_id) {
    if (world_id == -1) {
        console.log('HIBA: world_has_tank -> world_id = -1');
        return false;
    }
    let index = g_worlds[world_id].tanks.indexOf(tank_id);
    return (index !== -1);
};

world_add_remove_tank = function (world_id, tank_id, add) {
    if (world_id == -1) {
        console.log('HIBA: world_add_remove_tank -> world_id = -1');
        return;
    }
    if (g_worlds[world_id] === undefined) {
        console.log('HIBA: world_add_remove_tank -> world_id = undefined');
        return;
    }
    let index = g_worlds[world_id].tanks.indexOf(tank_id);
    if (add && index === -1) {
        g_worlds[world_id].tanks.push(tank_id);
    }
    if (!add && index !== -1) {
        g_worlds[world_id].tanks.splice(index, 1);
    }
};

world_check_for_winner = function (world_id) {
    if (g_worlds[world_id] === undefined) {
        return false;
    }
    if (g_worlds[world_id].tanks.length < 2) {
        return g_worlds[world_id].tanks[0];
    }
    return false;
};

request_modify_user_data = function (socket_id, data) {
    if (data.display_name !== undefined) {
        if (g_playerdata[socket_id].world_id === -1) {
            g_playerdata[socket_id].display_name = data.display_name;
            /*for (var i in SOCKET_LIST) { //nem kell, ameddig pálya közben nem akarunk nevet váltani
             SOCKET_LIST[i].emit('update_nametag', {'id': socket_id, 'val': data.display_name});
             }*/
        }
    }
    if (data.tint !== undefined) {
        g_playerdata[socket_id].tint = data.tint;
        if (g_worlds[0].lists.tank[socket_id] !== undefined) {
            g_worlds[0].lists.tank[socket_id].tint = data.tint;
        }

        let update_tank = [];
        for (let i in g_worlds[0].lists.tank) {
            update_tank.push({
                'id': g_worlds[0].lists.tank[i].id,
                'tint': g_worlds[0].lists.tank[i].tint
            });
        }

        for (var i in SOCKET_LIST) {
            SOCKET_LIST[i].emit('update_tint', {'tank': update_tank});
        }

    }
};

update_score_board = function (world_id) {
    let scboard = [];
    for (let p_id in g_playerdata) {
        pdata = g_playerdata[p_id];
        if (pdata.world_id !== world_id) {
            continue;
        }
        scboard.push({'id': p_id, 'name': pdata.display_name, 'score': pdata.score});
    }
    scboard.sort(function (a, b) {
        return b.score - a.score
    });
    broadcast_simple('update_world_scores', scboard, world_id);
};

broadcastBullet = function (newBullet) {
    newBullet.move_starting_pos(); //a tank csövéhez teszi a golyót
    let send_bullet = newBullet; //TODO: csak a legszükségesebb adatokat küldeni. máshol is!
    send_bullet.type = 'Bullet';
    let bl = {
        'bullets': {self_id: send_bullet}
    };
    broadcast_simple('init', bl); //TODO: az inicializálásokat össze lehetne szedni, és a sima 20fps-es csomagban egyszerre küldeni, nem külön-külön üzenetekben.
    g_worlds[0].lists.bullet_id_count++;
}

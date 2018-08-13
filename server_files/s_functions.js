/**
 * generálunk és amég nem találunk megfelelő méretű blokkot, újrageneráljuk a pályát
 * 
 * @param obj dimensions, a gráf szélessége és hosszúsága (node-ok száma)
 * @returns obj: {obj: gráf, int: választott blokk azonosítója}
 */
generate_map = function (dimensions) {
    var max_block_num = 0; //legnagyobb talált darabszám
    var actual_block = 0; //jelenleg kalkulálandó blokk id
    var selected_block = 0; //eddig választott blokk id
    do {
        max_block_num = 0; //nullázunk minden generálás előtt
        actual_block = 0;
        selected_block = 0;
        var graph = []; //2 dimenziós mátrix, elemei node-ok
        for (var x = 0; x < dimensions.x; x++) {
            graph[x] = [];
            for (var y = 0; y < dimensions.y; y++) {
                graph[x][y] = new Node({
                    'x': x,
                    'y': y
                });
                //legenerálunk random utakat
                graph[x][y].generate_paths();
            }
        }

        //megnézzük az összefüggő blokkokat
        for (var x = 0; x < dimensions.x; x++) {
            for (var y = 0; y < dimensions.y; y++) {
                //rekurzív funkció
                result_darab = graph[x][y].besorol(actual_block, graph);
                if (max_block_num < result_darab) {
                    max_block_num = result_darab;
                    selected_block = actual_block;
                }
                actual_block++;
            }
        }
    } while (max_block_num < g_max_player_num * g_player_distance_fields); //ha a legnagyobb blokk elegendő méretű, rátesszük a tankokat, ha nem, újragenerálás
    return {
        'graph': graph,
        'selected_block': selected_block
    };
};

//lekérdezi, hogy adott node-ra tehet-e tankot
free_pos = function (node) {
    var free = true;
    for (id in Tank.list) {
        if (Math.abs(Tank.list[id].x_graph - node.x_graph) + Math.abs(Tank.list[id].y_graph - node.y_graph) < g_player_min_distance) {
            free = false;
        }
    }
    return free;
};

create_walls = function (graph, dimensions) {
    for (let x = 0; x < dimensions.x; x++) {
        for (let y = 0; y < dimensions.y; y++) {
            let node = graph[x][y];

            //fal adatok, amik csak a konstruktorokhoz kellenek
            let wall = {};
            let x_self = border.x + x * g_field_size;
            let y_self = border.y + y * g_field_size;
            let longer_side = g_field_size + g_field_size / 10;
            let shorter_side = Math.ceil(g_field_size / 10);

            //jobb oldali és lenti falak
            for (let dir in node.path) {
                if (node.path[dir] !== 1) {
                    switch (dir) {
                        case '0': //jobbra kell a fal
                            wall.height = longer_side;
                            wall.width = shorter_side;
                            wall.x = x_self + g_field_size / 2;
                            wall.y = y_self;
                            break;
                        case '1': //lefele kell a fal
                            wall.height = shorter_side;
                            wall.width = longer_side;
                            wall.x = x_self;
                            wall.y = y_self + g_field_size / 2;
                            break;
                    }
                    Wall.list[Wall.list_id_counter] = new Wall({
                        'x': wall.x,
                        'y': wall.y,
                        'x_graph': x,
                        'y_graph': y,
                        'id': Wall.list_id_counter,
                        'width': wall.width,
                        'height': wall.height
                    });
                    Wall.list_id_counter++;
                }
            }
            //bal szélére, tetejére plusz falak
            if (x === 0) {
                wall.height = longer_side;
                wall.width = shorter_side;
                wall.x = x_self - g_field_size / 2;
                wall.y = y_self;
                Wall.list[Wall.list_id_counter] = new Wall({
                    'x': wall.x,
                    'y': wall.y,
                    'x_graph': x,
                    'y_graph': y,
                    'id': Wall.list_id_counter,
                    'width': wall.width,
                    'height': wall.height
                });
                Wall.list_id_counter++;
            }
            if (y === 0) {
                wall.height = shorter_side;
                wall.width = longer_side;
                wall.x = x_self;
                wall.y = y_self - g_field_size / 2;
                Wall.list[Wall.list_id_counter] = new Wall({
                    'x': wall.x,
                    'y': wall.y,
                    'x_graph': x,
                    'y_graph': y,
                    'id': Wall.list_id_counter,
                    'width': wall.width,
                    'height': wall.height
                });
                Wall.list_id_counter++;
            }
        }
    }
};

regenerate_map = function (world_id = 0, timer = 0) { //játék elején vagy egy pálya végén az új pályakezdésért felelő funkció
    //timer: ennyi másodperc múlva fut csak le. pályák végénél van értelme.


    g_worlds[world_id] = {'leteheto_nodes': [], 'tanks': []};
    g_worlds[world_id].countdown = 100; //a kezdés előtt várakozandó idő

    //visszaszámlálások listája. objectekkel lehet tölteni, amiknek a timer paramétere egy szám és a call paramétere egy funkció. minden frame-n léptetve lesznek a countdown-ok.
    //esetleg később paused paramot is kaphat stb.
    g_worlds[world_id].countdowns = [];

    g_worlds[world_id].countdowns.push ({
        'timer': 100,
        'call': createExtra
    });

    g_worlds[world_id].timelimit = 500; //ez triggereli a pálya-vége effektet
    g_worlds[world_id].timelimit_ticker = -1;
    g_worlds[world_id].playarea = {'x': 0, 'y': 0, 'xend': g_site_orig_width, 'yend': g_site_orig_height};

    Wall.list = {};
    Wall.list_id_counter = 0; //új id-ket kapnak a falak, csak növekszik
    Tank.list = {}; //statikus osztály-változó
    Bullet.list = {};
    Bullet.list_id_count = 0;
    CollisionManager.map = []; //egy mátrix, ami alapján nézi, hogy egyáltalán mi ütközhet mivel

    Extra.type_list = [/*'nu',*/'fr', 'gh', 'bl'/*,'be'*/]; //egyezzen a tank class shoot_type lehetőségeivel
    Extra.list = {};
    Extra.list_id_count = 0;

    g_collisioner = new CollisionManager({});
    gen_result = generate_map(g_dimensions);
    graph = gen_result.graph;
    selected_block = gen_result.selected_block;

    for (var x = 0; x < g_dimensions.x; x++) {
        for (var y = 0; y < g_dimensions.y; y++) {
            if (graph[x][y].block_id == selected_block) {
                g_worlds[0].leteheto_nodes.push([x, y]);
            }
        }
    }

    //legyártjuk a falakat
    create_walls(graph, g_dimensions);

    for (var i in SOCKET_LIST) {
        if (g_playerdata[SOCKET_LIST[i].id].world_id == world_id) {
            add_tank(SOCKET_LIST[i].id);
        }
    }
    //elmeséljük mindenkinek, hogy hol vannak a tankok meg a falak
    let init = {
        'clear_all': true,
        'walls': Wall.list,
        'tanks': Tank.list,
        'playarea': false
    };
    broadcast_simple('init', init, world_id);
    update_score_board(world_id);
};

add_tank = function (id) {
    //legyártjuk a tankot
    let success = false;
    shuffle(g_worlds[0].leteheto_nodes);
    for (k in g_worlds[0].leteheto_nodes) {
        var node = graph[g_worlds[0].leteheto_nodes[k][0]][g_worlds[0].leteheto_nodes[k][1]];

        if (free_pos(node)) {
            Tank.list[id] = new Tank({
                'x': node.x,
                'y': node.y,
                'x_graph': node.x_graph,
                'y_graph': node.y_graph,
                'id': id,
                'tint': g_playerdata[id].tint,
                'nametag': g_playerdata[id].display_name
            });
            success = true;
            break;
        }
    }

    if (!success) {
        die('baj van, nem elég nagy a pálya!');
    } else {
        world_add_remove_tank(0, id, 1);
    }
};

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
    Extra.list[Extra.list_id_count] = new Extra({
        'x': customnode.x,
        'y': customnode.y,
        'x_graph': customnode.x_graph,
        'y_graph': customnode.y_graph,
        'id': Extra.list_id_count,
        'type': Extra.type_list[getRandomInt(0, Extra.type_list.length - 1)]
    });
    let ex = {
        'extras': {self_id: Extra.list[Extra.list_id_count]}
    };
    broadcast_simple('init', ex);
    Extra.list_id_count++;

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
};

broadcast_simple_except_one = function (one, name, data = '', world_id = 0) {
    let socket_list = get_world_sockets(SOCKET_LIST, one, world_id);
    for (var i in socket_list) {
        socket_list[i].emit(name, data);
}
};

/*broadcast_all = function(name,data = '',socket_list = get_world_sockets(SOCKET_LIST)) { //TODO: minden emberkének broadcastoló funkció, még ha nincs tankja akkor is.
 
 }*/

kill_one_tank = function (tank, bullet = false, killer_player = false) {
    //killer_player akkor jön, ha nem bullet típusú megölés történik.
    let world_id = g_playerdata[tank.id].world_id;
    if (!world_has_tank(world_id, tank.id)) {
        return;
    }
    let killer_socket;
    if (bullet === false) {
        if (killer_player !== false) {
            killer_socket = (SOCKET_LIST[killer_player] === undefined ? false : SOCKET_LIST[killer_player]);
        } else {
            killer_socket = (SOCKET_LIST[tank.id] === undefined ? false : SOCKET_LIST[tank.id]);
        }
    } else {
        killer_socket = (SOCKET_LIST[bullet.player_id] === undefined ? false : SOCKET_LIST[bullet.player_id]);
    }

    if (bullet !== false && tank.id != bullet.player_id) {
        g_playerdata[bullet.player_id].score++;
        if (killer_socket) {
            killer_socket.emit('effect', 'p1');
        }
    } else if (killer_player !== false) {
        g_playerdata[killer_player].score++;
        if (killer_socket) {
            killer_socket.emit('effect', 'p1');
        }
    } else {
        if (bullet === false) {
            if (g_playerdata[tank.id].score > 0) {
                g_playerdata[tank.id].score--;
            }
            if (killer_socket) {
                killer_socket.emit('effect', 'm1');
            }
        } else {
            if (g_playerdata[bullet.player_id].score > 0) {
                g_playerdata[bullet.player_id].score--;
            }
            if (killer_socket) {
                killer_socket.emit('effect', 'm1');
            }
        }
    }
    update_score_board(world_id);

    world_add_remove_tank(world_id, tank.id, 0);
    tank.destroy([Tank.list]);
    if (bullet !== false) {
        bullet.destroy([Bullet.list]);
    }

    let winner = world_check_for_winner(world_id);
    if (winner !== false) {
        g_worlds[world_id].countdowns.push ({
            'timer': 60,
            'call': regenerate_map
        });
    }
};

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
        if (Tank.list[socket_id] !== undefined) {
            Tank.list[socket_id].tint = data.tint;
        }

        let update_tank = [];
        for (let i in Tank.list) {
            update_tank.push({
                'id': Tank.list[i].id,
                'tint': Tank.list[i].tint
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
require("./s_functions.js");
const Node = require("../Classes/Node");
const Wall = require("../Classes/Wall");
const CollisionManager = require("../Classes/CollisionManager");
const Extra = require("../Classes/Extra");
const Tank = require("../Classes/Tank");

/**
 * generálunk és amég nem találunk megfelelő méretű blokkot, újrageneráljuk a pályát
 *
 * @param dimensions obj, a gráf szélessége és hosszúsága (node-ok száma)
 * @returns obj: {obj: gráf, int: választott blokk azonosítója}
 */
function generate_map (dimensions) {
    var max_block_num = 0; //legnagyobb talált darabszám
    var actual_block = 0; //jelenleg kalkulálandó blokk id
    var selected_block = 0; //eddig választott blokk id
    do {
        max_block_num = 0; //nullázunk minden generálás előtt
        actual_block = 0;
        selected_block = 0;
        var graph = []; //2 dimenziós mátrix, elemei node-ok
        for (let x = 0; x < dimensions.x; x++) {
            graph[x] = [];
            for (let y = 0; y < dimensions.y; y++) {
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
}

//lekérdezi, hogy adott node-ra tehet-e tankot
function free_pos (node) {
    var free = true;
    for (id in g_worlds[0].lists.tank) {
        if (Math.abs(g_worlds[0].lists.tank[id].x_graph - node.x_graph) + Math.abs(g_worlds[0].lists.tank[id].y_graph - node.y_graph) < g_player_min_distance) {
            free = false;
        }
    }
    return free;
}

function create_walls (graph, dimensions) {
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
                    g_worlds[0].lists.wall[g_worlds[0].lists.wall_id_counter] = new Wall({
                        'x': wall.x,
                        'y': wall.y,
                        'x_graph': x,
                        'y_graph': y,
                        'id': g_worlds[0].lists.wall_id_counter,
                        'width': wall.width,
                        'height': wall.height
                    });
                    g_worlds[0].lists.wall_id_counter++;
                }
            }
            //bal szélére, tetejére plusz falak
            if (x === 0) {
                wall.height = longer_side;
                wall.width = shorter_side;
                wall.x = x_self - g_field_size / 2;
                wall.y = y_self;
                g_worlds[0].lists.wall[g_worlds[0].lists.wall_id_counter] = new Wall({
                    'x': wall.x,
                    'y': wall.y,
                    'x_graph': x,
                    'y_graph': y,
                    'id': g_worlds[0].lists.wall_id_counter,
                    'width': wall.width,
                    'height': wall.height
                });
                g_worlds[0].lists.wall_id_counter++;
            }
            if (y === 0) {
                wall.height = shorter_side;
                wall.width = longer_side;
                wall.x = x_self;
                wall.y = y_self - g_field_size / 2;
                g_worlds[0].lists.wall[g_worlds[0].lists.wall_id_counter] = new Wall({
                    'x': wall.x,
                    'y': wall.y,
                    'x_graph': x,
                    'y_graph': y,
                    'id': g_worlds[0].lists.wall_id_counter,
                    'width': wall.width,
                    'height': wall.height
                });
                g_worlds[0].lists.wall_id_counter++;
            }
        }
    }
}

module.exports.regenerate_map = (world_id = 0, timer = 0) => { //játék elején vagy egy pálya végén az új pályakezdésért felelő funkció
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

    g_worlds[0].lists = {};
    g_worlds[0].lists.wall = {};
    g_worlds[0].lists.wall_id_counter = 0; //új id-ket kapnak a falak, csak növekszik
    g_worlds[0].lists.tank = {}; //statikus osztály-változó
    g_worlds[0].lists.bullet = {};
    g_worlds[0].lists.bullet_id_count = 0;
    CollisionManager.map = []; //egy mátrix, ami alapján nézi, hogy egyáltalán mi ütközhet mivel

    Extra.type_list = [/*'nu',*/'fr', 'gh', 'bl'/*,'be'*/]; //egyezzen a tank class shoot_type lehetőségeivel
    g_worlds[0].lists.extra = {};
    g_worlds[0].lists.extra_id_count = 0;

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
            module.exports.add_tank(SOCKET_LIST[i].id);
        }
    }
    //elmeséljük mindenkinek, hogy hol vannak a tankok meg a falak
    let init = {
        'clear_all': true,
        'walls': g_worlds[0].lists.wall,
        'tanks': g_worlds[0].lists.tank,
        'playarea': false
    };
    broadcast_simple('init', init, world_id);
    update_score_board(world_id);
}

module.exports.add_tank = (id) => {
    //legyártjuk a tankot
    let success = false;
    shuffle(g_worlds[0].leteheto_nodes);
    for (k in g_worlds[0].leteheto_nodes) {
        var node = graph[g_worlds[0].leteheto_nodes[k][0]][g_worlds[0].leteheto_nodes[k][1]];

        if (free_pos(node)) {
            g_worlds[0].lists.tank[id] = new Tank({
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
}

module.exports.kill_one_tank = (tank, bullet = false, killer_player = false) => {
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
    tank.destroy([g_worlds[0].lists.tank]);
    if (bullet !== false) {
        bullet.destroy([g_worlds[0].lists.bullet]);
    }

    let winner = world_check_for_winner(world_id);
    if (winner !== false) {
        g_worlds[world_id].countdowns.push ({
            'timer': 60,
            'call': module.exports.regenerate_map
        });
    }
};

function createExtra () {
    let coords = g_worlds[0].leteheto_nodes[getRandomInt(0, g_worlds[0].leteheto_nodes.length - 1)];
    let customNode = graph[coords[0]][coords[1]];
    g_worlds[0].lists.extra[g_worlds[0].lists.extra_id_count] = new Extra({
        'x': customNode.x,
        'y': customNode.y,
        'x_graph': customNode.x_graph,
        'y_graph': customNode.y_graph,
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

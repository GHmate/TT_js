var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/ttgen.html');
});
app.use('/', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 8081);
console.log("Ready to roll out!");
SOCKET_LIST = {};

var io = require('socket.io')(serv, {});
require("./server_files/s_config.js");
require("./server_files/Functions/s_functions.js");
const boardFunctions = require("./server_files/Functions/boardFunctions");

//ha még nem volt generálva, legenerálja a pályát.
if (g_worlds_number < 1) {
    g_worlds_number++;
    boardFunctions.regenerate_map(0);
}

io.sockets.on('connection', function (socket) {
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
    console.log('new socket: ' + socket.id);

    g_playerdata[socket.id] = {
        'world_id': -1,
        'score': 0,
        'tint': g_tank_colors[getRandomInt(0, g_tank_colors.length - 1)],
        'display_name': 'unnamed'
    };

    socket.on('request_world_join', function (data) {
        if (g_playerdata[socket.id].world_id !== -1) {
            return;
        }
        g_playerdata[socket.id].world_id = data.w_id;
        g_playerdata[socket.id].score = 0;

        //kreálunk új tankot, ha játék közben lépett be (ami ki lesz szedve a végleges verzióban amúgy)
        boardFunctions.add_tank(socket.id);

        //elmeséljük az újonnan érkezett zöldfülűnek, hogy mi a helyzet a pályán
        let level_limiter = false;
        if (g_worlds[data.w_id].timelimit_ticker > -1) {
            level_limiter = g_worlds[data.w_id].playarea;
        }
        socket.emit('init', {
            'clear_all': true,
            'global': {'id': socket.id},
            'walls': g_worlds[0].lists.wall,
            'tanks': g_worlds[0].lists.tank,
            'bullets': g_worlds[0].lists.bullet,
            'playarea': level_limiter,
            'g_broadcasted_constants': g_broadcasted_constants
        });

        if (g_worlds[data.w_id].countdown === 0) {
            socket.emit('world_active', true);
            g_worlds[0].lists.tank[socket.id].inactive = false;
        }

        //megmondjuk mindenki másnak, hogy hol az új játékos tankja
        let self_id = socket.id;//kényszerűségből... nem akarja kulcsként engedni a socket.id-t vagy a socket['id']-t
        let init = {
            'tanks': {self_id: g_worlds[0].lists.tank[socket.id]} //itt direkt tömb van, hátha többet akarunk inicializálni TODO: ne küldjük a teljes objectet
        };
        broadcast_simple_except_one(socket.id, 'init', init, data.w_id);
        update_score_board(data.w_id);
    });

    socket.on('keyPress', function (data) {
        if (g_worlds[0].lists.tank[socket.id] === undefined) { //TODO: kliens ne is küldjön ilyen kérést, ha nincs tankja
            return;
        }
        if (data.inputId === 'shoot' && data.state) {
            let turn = '';
            if (data.turning.left && !data.turning.right) {
                turn = 'l';
            }
            if (!data.turning.left && data.turning.right) {
                turn = (turn === '' ? 'r' : '');
            }
            g_worlds[0].lists.tank[socket.id].triggerShoot(turn);
        }
    });

    socket.on('input_list', function (data) {
        if (g_worlds[0].lists.tank[socket.id] === undefined || g_worlds[0].lists.tank[socket.id].inactive === true) { //TODO: kliens ne is küldjön ilyen kérést, ha nincs tankja
            return;
        }
        let nextRow = (data[0] === undefined ? false : data[0].tick);
        //g_worlds[0].lists.tank[socket.id].apply_input_movement_data(g_worlds[0].lists.tank[socket.id].list_of_inputs.length);//a maradék inputokat gyorsan végigfuttatom még
        g_worlds[0].lists.tank[socket.id].list_of_inputs = data;
        let response_data = {
            'x': g_worlds[0].lists.tank[socket.id].x,
            'y': g_worlds[0].lists.tank[socket.id].y,
            'rotation': g_worlds[0].lists.tank[socket.id].rotation,
            'spd': g_worlds[0].lists.tank[socket.id].speed,
            'rot_spd': g_worlds[0].lists.tank[socket.id].rot_speed,
            'next_processed': nextRow
        };
        socket.emit('input_response', response_data);
    });

    socket.on('disconnect', function () {
        let self_id = socket.id;
        let world_id = g_playerdata[socket.id].world_id;
        console.log('socket disconnected: ' + socket.id);
        if (g_worlds[0].lists.tank[self_id] !== undefined) {
            g_worlds[0].lists.tank[self_id].destroy([g_worlds[0].lists.tank]);
            delete g_worlds[0].lists.tank[self_id];
        }
        delete SOCKET_LIST[socket.id];
        if (g_playerdata[socket.id] !== undefined) {
            delete g_playerdata[socket.id];
        }

        if (world_id != -1) { //ha épp játszott
            world_add_remove_tank(world_id, socket.id, 0);
            update_score_board(world_id);

            let winner = world_check_for_winner(world_id);
            if (winner !== false) {
                boardFunctions.regenerate_map();
            }
        }
    });

    socket.on('request_modify_user_data', function (data) {
        request_modify_user_data(socket.id, data);
    });

});

setInterval(function () {

    //összeszűkül a pálya, ha régóta megy a meccs
    if (g_worlds[0].timelimit_ticker > 0) {
        g_worlds[0].timelimit_ticker--;
        if (g_worlds[0].timelimit_ticker == 0) {
            g_worlds[0].playarea.x += 0.5;
            g_worlds[0].playarea.y += 0.5;
            g_worlds[0].playarea.xend -= 0.5;
            g_worlds[0].playarea.yend -= 0.5;
            g_worlds[0].timelimit_ticker = 4;
            for (var i in SOCKET_LIST) {
                if (g_playerdata[SOCKET_LIST[i].id].world_id == 0) {
                    SOCKET_LIST[i].emit('time_is_up', g_worlds[0].playarea);
                }
            }
        }
    }

    if (g_worlds_number >= 1) {
        g_collisioner.update_arrays();

        for (let t in g_worlds[0].lists.tank) {
            g_worlds[0].lists.tank[t].updatePosition();
        }
        for (let t in g_worlds[0].lists.bullet) {
            g_worlds[0].lists.bullet[t].updatePosition();
        }
    }
    for (let i in g_worlds) {
        let world = g_worlds[i];
        if (world.countdown > 0) {
            world.countdown--;
            if (world.countdown === 0) {
                broadcast_simple('world_active', true, i); //itt i a world_id, mert abban iterálok
                for (let index in world.tanks) {
                    if (g_worlds[0].lists.tank[world.tanks[index]] !== undefined) {
                        g_worlds[0].lists.tank[world.tanks[index]].inactive = false;
                    }
                }
            }
        }
    }
}, 1000 / g_broadcasted_constants.gameTick);

//komenikáció
setInterval(function () {

    let update_tank = [];
    let update_bullet = [];
    for (let i in g_worlds[0].lists.tank) {
        update_tank.push({
            'id': g_worlds[0].lists.tank[i].id,
            'x': g_worlds[0].lists.tank[i].x,
            'y': g_worlds[0].lists.tank[i].y,
            'rotation': g_worlds[0].lists.tank[i].rotation,
            'tint': g_worlds[0].lists.tank[i].tint, //TODO: kiölni: kicsit feleslegesnek érzem 20 fps-sel szín adatot küldeni...
            'mods': g_worlds[0].lists.tank[i].mods,
            'events': g_worlds[0].lists.tank[i].events
        });
        g_worlds[0].lists.tank[i].events = [];
    }
    for (let i in g_worlds[0].lists.bullet) {
        update_bullet.push({
            'id': g_worlds[0].lists.bullet[i].id,
            'x': g_worlds[0].lists.bullet[i].x,
            'y': g_worlds[0].lists.bullet[i].y,
            'rotation': g_worlds[0].lists.bullet[i].rotation,
            'spd': g_worlds[0].lists.bullet[i].speed,
            'rot_spd': g_worlds[0].lists.bullet[i].rot_speed
        });
    }

    //for (let w_id in g_worlds) { //TODO: majd saját lista kell minden world-nek, és itt loopolni.
    for (var i in SOCKET_LIST) {
        if (g_playerdata[SOCKET_LIST[i].id].world_id == 0) {
            SOCKET_LIST[i].emit('update_entities', {'tank': update_tank, 'bullet': update_bullet});
        }
    }
    //}
    if (g_worlds[0].timelimit > 0) {
        g_worlds[0].timelimit--;
    } else {
        if (g_worlds[0].timelimit > -1) {
            g_worlds[0].timelimit_ticker = 4;
            for (var i in SOCKET_LIST) {
                if (g_playerdata[SOCKET_LIST[i].id].world_id == 0) {
                    SOCKET_LIST[i].emit('time_is_up', g_worlds[0].playarea);
                }
            }
            g_worlds[0].timelimit = -1;
        }
    }

    //visszaszámlálások listája. objectekkel lehet tölteni, amiknek a timer paramétere egy szám és a call paramétere egy funkció. minden frame-n léptetve lesznek a countdown-ok.
    //esetleg később paused paramot is kaphat stb.
    for (let key = 0; key < g_worlds[0].countdowns.length; key++) {
        if (g_worlds[0].countdowns[key] == undefined) {
            //valami error volt, pucolás
            console.log('ííí, countdown hiba');
            continue;
        }
        g_worlds[0].countdowns[key].timer--;
        let this_countdown = g_worlds[0].countdowns[key];
        if (this_countdown.timer < 1) {
            g_worlds[0].countdowns.splice(key, 1); //fontos, előbb törlünk, aztán hívunk...
            let called_function = this_countdown.call;
            
            //ha olyan elvetemült dolgot akarnánk csinálni, hogy egy felparaméterezett anonym funkciót akarunk hívni, a .apply pont kapóra jönne.
            if (Array.isArray(this_countdown.params)) {
                called_function.apply(null,this_countdown.params);
            } else {
                called_function();
            }
        }
    }
    //TODO: figyelni kell, hogy resetelődjenek a countdown-ok!

}, 1000 / 20);

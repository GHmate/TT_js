var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/client/ttgen.html');
});
app.use('/', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 8080);
console.log("Ready to roll out!");
SOCKET_LIST = {};

var io = require('socket.io')(serv, {});

require("./server_files/s_config.js");
require("./server_files/s_functions.js");
require("./server_files/s_classes.js");

//ha még nem volt generálva, legenerálja a pályát.
if (g_worlds_number < 1) {
	g_worlds['0'] = {'leteheto_nodes':[],'tanks': []};
	g_worlds_number++;
	g_worlds['0'].countdown = 110;
	regenerate_map();
}

var new_players_emit_stuff = [];

io.sockets.on('connection', function (socket) {
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	console.log('new socket: '+socket.id);

	g_playerdata[socket.id] = {
		'world_id': '0',
		'score': 0,
		'tint': g_tank_colors[getRandomInt(0,g_tank_colors.length-1)]
	};
	
	//kreálunk új tankot, ha játék közben lépett be (ami ki lesz szedve a végleges verzióban amúgy)
	add_tank(socket.id);
	
	new_players_emit_stuff.push(socket);
	
	socket.on('keyPress', function (data) {
		if (Tank.list[socket.id] === undefined) { //TODO: kliens ne is küldjön ilyen kérést, ha nincs tankja
			return;
		}
		if(data.inputId === 'shoot' && data.state) {
			let turn = '';
			if (data.turning.left && !data.turning.right) {
				turn = 'l';
			}
			if (!data.turning.left && data.turning.right) {
				turn = (turn === '' ? 'r' : '');
			}
			Tank.list[socket.id].triggerShoot(turn);
		}
	});
	
	socket.on('input_list', function (data) {
		if (Tank.list[socket.id] === undefined || Tank.list[socket.id].inactive === true) { //TODO: kliens ne is küldjön ilyen kérést, ha nincs tankja
			return;
		}
		let next_id = (data[0] === undefined?false:data[0][4]);
		Tank.list[socket.id].apply_input_movement_data(Tank.list[socket.id].list_of_inputs.length);//a maradék inputokat gyorsan végigfuttatom még
		Tank.list[socket.id].list_of_inputs = Tank.list[socket.id].list_of_inputs.concat(data);
		let response_data = {
			'x': Tank.list[socket.id].x,
			'y': Tank.list[socket.id].y,
			'rotation': Tank.list[socket.id].rotation,
			'spd': Tank.list[socket.id].speed,
			'rot_spd': Tank.list[socket.id].rot_speed,
			'next_processed': next_id
		};
		socket.emit('input_response', response_data);
	});
	
	socket.on('disconnect', function () {
		let self_id = socket.id;
		console.log('socket disconnected: '+socket.id);
		if (Tank.list[self_id] !== undefined) {
			Tank.list[self_id].destroy([Tank.list]);
		}
		delete SOCKET_LIST[socket.id];
		if (g_playerdata[socket.id] !== undefined) {
			delete g_playerdata[socket.id];
		}
		world_add_remove_tank('0',socket.id,0);
	});
	
	socket.on('request_modify_user_data', function (data) {
		request_modify_user_data(socket.id,data);
	});
});

setInterval(function () {
	if (g_worlds_number >= 1) {
		g_collisioner.update_arrays ();
		
		for (let t in Tank.list) {
			Tank.list[t].updatePosition();
		}
		for (let t in Bullet.list) {
			Bullet.list[t].updatePosition();
		}
	}
	for (let i in g_worlds) {
		let world = g_worlds[i];
		if (world.countdown > 0) {
			world.countdown--;
			if (world.countdown === 0) {
				broadcast_simple('world_active',true);
				for (let index in world.tanks) {
					if (Tank.list[world.tanks[index]] !== undefined) {
						Tank.list[world.tanks[index]].inactive = false;
					}
				}
			}
		}
	}
}, 1000 / 60); //60 fps

//komenikáció
setInterval(function () {
	for (let socket of new_players_emit_stuff) {
		//elmeséljük az újonnan érkezett zöldfülűnek, hogy mi a helyzet a pályán
		socket.emit ('init',{
			'clear_all': true,
			'global': {'id': socket.id},
			'walls': Wall.list,
			'tanks': Tank.list,
			'bullets': Bullet.list
		});
		
		if (g_worlds['0'].countdown === 0) {
			socket.emit('world_active',true);
			Tank.list[socket.id].inactive = false;
		}

		//megmondjuk mindenki másnak, hogy hol az új játékos tankja
		let self_id = socket.id;//kényszerűségből... nem akarja kulcsként engedni a socket.id-t vagy a socket['id']-t
		let init = {
			'tanks': {self_id: Tank.list[socket.id]} //itt direkt tömb van, hátha többet akarunk inicializálni TODO: ne küldjük a teljes objectet
		};
		broadcast_simple('init',init,get_world_sockets(SOCKET_LIST,socket.id));
	}
	new_players_emit_stuff = [];

	let update_tank = [];
	let update_bullet = [];
	for (let i in Tank.list) {
		update_tank.push({
			'id': Tank.list[i].id,
			'x': Tank.list[i].x,
			'y': Tank.list[i].y,
			'rotation': Tank.list[i].rotation,
			'spd': Tank.list[i].speed,
			'rot_spd': Tank.list[i].rot_speed,
			'tint': Tank.list[i].tint
		});
	}
	for (let i in Bullet.list) {
		update_bullet.push({
			'id': Bullet.list[i].id,
			'x': Bullet.list[i].x,
			'y': Bullet.list[i].y,
			'rotation': Bullet.list[i].rotation,
			'spd': Bullet.list[i].speed,
			'rot_spd': Bullet.list[i].rot_speed
		});
	}

	for (var i in SOCKET_LIST) {
		SOCKET_LIST[i].emit('update_entities', {'tank': update_tank, 'bullet': update_bullet});
	}
}, 1000 / 20); //20-30 fps
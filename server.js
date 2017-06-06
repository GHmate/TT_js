var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/client/ttgen.html');
});
app.use('/', express.static(__dirname + '/client'));

serv.listen(8080);
console.log("Server started.");
SOCKET_LIST = {};

var io = require('socket.io')(serv, {});

require("./server_files/s_config.js");
require("./server_files/s_functions.js");
require("./server_files/s_classes.js");

io.sockets.on('connection', function (socket) {
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	console.log('new socket: '+socket.id);
	
	//ha még nem volt generálva, legenerálja a pályát.
	if (g_worlds_number < 1) {
		g_worlds['0'] = {'leteheto_nodes':[],'tanks': {},'tank_count': 0};
		g_worlds_number++;
		regenerate_map();
	}
	g_playerdata[socket.id] = {
		'world_id': '0',
		'score': 0
	};
	add_tank(socket.id);
	g_worlds['0'].tanks[socket.id] = true;
	g_worlds['0'].tank_count++;
	
	g_collisioner.place(Tank.list[socket.id]);
	let self_id = socket.id;
	let init = {
			'tanks': {self_id: Tank.list[socket.id]} //itt direkt tömb van, hátha többet akarunk inicializálni TODO: ne küldjük a teljes objectet
		};
	broadcast_small_init(get_world_sockets(SOCKET_LIST,socket.id), init, socket.id);
	
	socket.emit ('total_init',{
		'global': {'id': socket.id},
		'walls': Wall.list,
		'tanks': Tank.list
	});
	
	socket.on('keyPress', function (data) {
		if (data.inputId == 'left' || data.inputId == 'right' || data.inputId == 'up' || data.inputId == 'down' ) {
			Tank.list[socket.id].keypress[data.inputId] = data.state;
		}
		if(data.inputId === 'shoot' && data.state) {
			console.log('trigger');
			Tank.list[socket.id].triggerShoot();
		}
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
	});
});

setInterval(function () {
	if (g_worlds_number >= 1) {
		g_collisioner.update_arrays ();
		
		for (let t in Tank.list) {
			Tank.list[t].updatePosition();
		}
		let update_tank = Tank.list; //TODO: ne küldjük a teljes objecteket. és ne 60-at másodpercenként

		for (let t in Bullet.list) {
			Bullet.list[t].updatePosition();
		}
		let update_bullet = Bullet.list;

		for (var i in SOCKET_LIST) {
			SOCKET_LIST[i].emit('update_tank', update_tank);
			SOCKET_LIST[i].emit('update_bullet', update_bullet);
		}
	}
	
}, 1000 / 60);
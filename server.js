var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/client/ttgen.html');
});
app.use('/', express.static(__dirname + '/client'));

serv.listen(8080);
console.log("Server started.");
var SOCKET_LIST = {};

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
		g_worlds['0'] = {'leteheto_nodes':[]};
		g_worlds_number++;
		regenerate_map();
	}
	add_tank(socket.id);
	g_collisioner.place(Tank.list[socket.id]);
	let self_id = socket.id;
	broadcast_small_init({
		'tanks': {self_id: Tank.list[socket.id]} //itt direkt tömb van, hátha többet akarunk inicializálni TODO: ne küldjük a teljes objectet
	},socket.id);
	
	socket.emit ('total_init',{
		'global': {'id': socket.id},
		'walls': Wall.list,
		'tanks': Tank.list
	});
	
	socket.on('keyPress', function (data) {
		if (data.inputId == 'left' || data.inputId == 'right' || data.inputId == 'up' || data.inputId == 'down' ) {
			Tank.list[socket.id].keypress[data.inputId] = data.state;
		}
		if(data.inputId === 'space') { //space
			Tank.list[socket.id].triggerShoot();
		}
	});
	
	socket.on('disconnect', function () {
		let self_id = socket.id;
		console.log('socket disconnected: '+socket.id);
		let data = { //ide jön minden, amit a játékos kilépésénél pucolni kell
			'tanks': {self_id: self_id} //itt direkt tömb van, hátha többet akarunk destroyolni
		};
		Tank.list[self_id].destroy([Tank.list]);
		broadcast_destroy(data,socket.id);
		delete SOCKET_LIST[socket.id];
	});
});

function broadcast_small_init (data,exception = -1) {
	for (var i in SOCKET_LIST) {
		if (SOCKET_LIST[i].id !== exception) {
			SOCKET_LIST[i].emit('small_init', data);
		}
	}
}

function broadcast_destroy (data,exception = -1) {
	for (var i in SOCKET_LIST) {
		if (SOCKET_LIST[i].id !== exception) {
			SOCKET_LIST[i].emit('destroy', data);
		}
	}
}

setInterval(function () {
	if (g_worlds_number >= 1) {
		g_collisioner.update_arrays ();
		
		for (let t in Tank.list) {
			Tank.list[t].updatePosition();
		}
		var update_tank = Tank.list; //TODO: ne küldjük a teljes objecteket

		for (var i in SOCKET_LIST) {
			SOCKET_LIST[i].emit('update_tank', update_tank);
		}
	}
	
}, 1000 / 60);
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
	
	socket.on('disconnect', function () {
		console.log('socket disconnected: '+socket.id);
		delete SOCKET_LIST[socket.id];
	});
	
	//ha még nem volt generálva, legenerálja a pályát.
	if (g_worlds_number < 1) {
		g_worlds['0'] = {'leteheto_nodes':[]};
		g_worlds_number++;
		regenerate_map();
	}
	add_tank(socket.id);
	
	socket.emit ('map_init',{'walls':Wall.list});
	
	//socket.emit('wall_init',classes.Wall.list);
	//socket.emit('tank_init',classes.Player.list);
});

setInterval(function () {
	/*var pack = {
		player: Player_update(),
		bullet: Bullet_update()
	};

	for (var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions', pack);
	}*/
}, 1000 / 10);
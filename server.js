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

//ha még nem volt generálva, legenerálja a pályát.
if (g_worlds_number < 1) {
	g_worlds['0'] = {'leteheto_nodes':[],'tanks': {},'tank_count': 0};
	g_worlds_number++;
	regenerate_map();
}

var new_players_emit_stuff = [];

io.sockets.on('connection', function (socket) {
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	console.log('new socket: '+socket.id);

	g_playerdata[socket.id] = {
		'world_id': '0',
		'score': 0
	};

	//kreálunk új tankot, ha játék közben lépett be (ami ki lesz szedve a végleges verzióban amúgy)
	add_tank(socket.id);
	
	new_players_emit_stuff.push(socket);
	
	socket.on('keyPress', function (data) {
		if (Tank.list[socket.id] === undefined) { //TODO: kliens ne is küldjön ilyen kérést, ha nincs tankja
			return;
		}
		if (data.inputId == 'left' || data.inputId == 'right' || data.inputId == 'up' || data.inputId == 'down' ) {
			Tank.list[socket.id].keypress[data.inputId] = data.state;
		}
		if(data.inputId === 'shoot' && data.state) {
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
		g_worlds['0'].tank_count--;
	});
});

setInterval(function () {
	if (g_worlds_number >= 1) {
		g_collisioner.update_arrays ();
		
		for (let t in Tank.list) {
			Tank.list[t].updatePosition();
		}
		
		//----- kommunikáció start
		
		for (let socket of new_players_emit_stuff) {
			//elmeséljük az újonnan érkezett zöldfülűnek, hogy mi a helyzet a pályán
			socket.emit ('init',{ //TODO: bugos volt több emittel -> kiszervezni, hogy ne az onconnect-ben emitelgessen, hanem a loopban
				'clear_all': true,
				'global': {'id': socket.id},
				'walls': Wall.list,
				'tanks': Tank.list,
				'bullets': Bullet.list
			});

			//megmondjuk mindenki másnak, hogy hol az új játékos tankja
			let self_id = socket.id;//kényszerűségből... nem akarja kulcsként engedni a socket.id-t vagy a socket['id']-t
			let init = {
				'tanks': {self_id: Tank.list[socket.id]} //itt direkt tömb van, hátha többet akarunk inicializálni TODO: ne küldjük a teljes objectet
			};
			broadcast_simple('init',init,get_world_sockets(SOCKET_LIST,socket.id));
		}
		new_players_emit_stuff = [];
		
		let update_tank = Tank.list; //TODO: ne küldjük a teljes objecteket. és ne 60-at másodpercenként. A fizika lehet 60, csak a networking ne legyen
		for (let t in Bullet.list) {
			Bullet.list[t].updatePosition();
		}
		let update_bullet = Bullet.list;

		for (var i in SOCKET_LIST) {
			SOCKET_LIST[i].emit('update_tank', update_tank);
			SOCKET_LIST[i].emit('update_bullet', update_bullet);
		}
		
		//----- kommunikáció end
	}
	
}, 1000 / 60);
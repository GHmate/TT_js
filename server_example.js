var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(8080);
console.log("Server started.");

var SOCKET_LIST = {};

class Entity {
	constructor() {
		this.x = 250;
		this.y = 250;
		this.spdX = 0;
		this.spdY = 0;
		this.id = "";
	}
	update() {
		this.updatePosition();
	}
	updatePosition() {
		this.x += this.spdX;
		this.y += this.spdY;
	}
	getDistance(pt) {
		return Math.sqrt(Math.pow(this.x - pt.x, 2) + Math.pow(this.y - pt.y, 2));
	}
}

var Player_list = {};
class Player extends Entity {
	constructor(id) {
		super();
		this.id = id;
		this.number = "" + Math.floor(10 * Math.random());
		this.pressingRight = false;
		this.pressingLeft = false;
		this.pressingUp = false;
		this.pressingDown = false;
		this.pressingAttack = false;
		this.mouseAngle = 0;
		this.maxSpd = 10;
		Player_list[id] = this;
	}
	update() {
		this.updateSpd();
		super.update();
		if (this.pressingAttack) {
			this.shootBullet(this.mouseAngle);
		}
	}
	updateSpd() {
		if (this.pressingRight){
			this.spdX = this.maxSpd;
		} else if (this.pressingLeft){
			this.spdX = -this.maxSpd;
		} else{
			this.spdX = 0;
		}

		if (this.pressingUp){
			this.spdY = -this.maxSpd;
		} else if (this.pressingDown){
			this.spdY = this.maxSpd;
		} else {
			this.spdY = 0;
		}
		//TODO: szöget meghatározni, és szinkosz a sebességre.
	};
	shootBullet(angle) {
		var b = new Bullet(this.id, angle);
		b.x = this.x;
		b.y = this.y;
	};
}

Player_update = function () {
	var pack = [];
	for (var i in Player_list) {
		var player = Player_list[i];
		player.update();
		pack.push({
			x: player.x,
			y: player.y,
			number: player.number
		});
	}
	return pack;
};

Player_onConnect = function (socket) {
	var player = new Player(socket.id);
	socket.on('keyPress', function (data) {
		if (data.inputId === 'left')
			player.pressingLeft = data.state;
		else if (data.inputId === 'right')
			player.pressingRight = data.state;
		else if (data.inputId === 'up')
			player.pressingUp = data.state;
		else if (data.inputId === 'down')
			player.pressingDown = data.state;
		else if (data.inputId === 'attack')
			player.pressingAttack = data.state;
		else if (data.inputId === 'mouseAngle')
			player.mouseAngle = data.state;
	});
};
Player_onDisconnect = function (socket) {
	delete Player_list[socket.id];
};

var Bullet_list = {};
class Bullet extends Entity {
	constructor(parent, angle) {
		super();
		this.id = Math.random();
		this.spdX = Math.cos(angle / 180 * Math.PI) * 10;
		this.spdY = Math.sin(angle / 180 * Math.PI) * 10;
		this.parent = parent;
		this.timer = 0;
		this.toRemove = false;
		Bullet_list[this.id] = this;
	}
	update() {
		if (this.timer++ > 100) {
			this.toRemove = true;
		}
		super.update();
		for (var i in Player_list) {
			var p = Player_list[i];
			if (this.getDistance(p) < 32 && this.parent !== p.id) {
				//handle collision. ex: hp--;
				this.toRemove = true;
			}
		}
	}
	updateSpd() {
		if (this.pressingRight)
			this.spdX = this.maxSpd;
		else if (this.pressingLeft)
			this.spdX = -this.maxSpd;
		else
			this.spdX = 0;

		if (this.pressingUp)
			this.spdY = -this.maxSpd;
		else if (this.pressingDown)
			this.spdY = this.maxSpd;
		else
			this.spdY = 0;
	};
	shootBullet(angle) {
		var b = Bullet(this.id, angle);
		b.x = this.x;
		b.y = this.y;
	};
}

Bullet_update = function () {
	var pack = [];
	for (var i in Bullet_list) {
		var bullet = Bullet_list[i];
		bullet.update();
		if (bullet.toRemove)
			delete Bullet_list[i];
		else
			pack.push({
				x: bullet.x,
				y: bullet.y
			});
	}
	return pack;
};

var DEBUG = true;

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	
	Player_onConnect(socket);

	socket.on('disconnect', function () {
		delete SOCKET_LIST[socket.id];
		Player_onDisconnect(socket);
	});
	socket.on('sendMsgToServer', function (data) {
		var playerName = ("" + socket.id).slice(2, 7);
		for (var i in SOCKET_LIST) {
			SOCKET_LIST[i].emit('addToChat', playerName + ': ' + data);
		}
	});

	socket.on('evalServer', function (data) {
		if (!DEBUG)
			return;
		var res = eval(data);
		socket.emit('evalAnswer', res);
	});
});

setInterval(function () {
	var pack = {
		player: Player_update(),
		bullet: Bullet_update()
	};

	for (var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions', pack);
	}
}, 1000 / 25);
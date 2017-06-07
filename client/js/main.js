
//socket dolgai
var socket = io();

//mozgatás
document.onkeydown = function(event){
	if(event.keyCode === 37) { //balra
		socket.emit('keyPress', {inputId: 'left', state: true});
	} else if(event.keyCode === 38) { //fel
		socket.emit('keyPress', {inputId: 'up', state: true});
	} else if(event.keyCode === 39) { //jobbra
		socket.emit('keyPress', {inputId: 'right', state: true});
	} else if(event.keyCode === 40) { //le
		socket.emit('keyPress', {inputId: 'down', state: true});
	} else if(event.keyCode === 32) { //space
		if (g_self_data.shoot_button_up === true) {
			socket.emit('keyPress', {inputId: 'shoot', state: true});
			g_self_data.shoot_button_up = false;
		}
	}
};

document.onkeyup = function(event){
	if(event.keyCode === 37) { //balra
		socket.emit('keyPress', {inputId: 'left', state: false});
	} else if(event.keyCode === 38) { //fel
		socket.emit('keyPress', {inputId: 'up', state: false});
	} else if(event.keyCode === 39) { //jobbra
		socket.emit('keyPress', {inputId: 'right', state: false});
	} else if(event.keyCode === 40) { //le
		socket.emit('keyPress', {inputId: 'down', state: false});
	} else if(event.keyCode === 32) { //space
		g_self_data.shoot_button_up = true;
		socket.emit('keyPress', {inputId: 'shoot', state: false});
	}
};

socket.on('init', function(data){
	if (data.global !== undefined) {
		g_self_data.id = data.global.id;
	}
	
	if (data.clear_all === true) { //teljes reset
		clear_local_map();
	}

	for (let w in data.walls) {
		Wall.list[data.walls[w].id] = new Wall({
			'x': data.walls[w].x,
			'y': data.walls[w].y,
			'id': data.walls[w].id,
			'width': data.walls[w].width,
			'height': data.walls[w].height
		});
	}
	for (let t in data.tanks) {
		Tank.list[data.tanks[t].id] = new Tank({
			'x': data.tanks[t].x,
			'y': data.tanks[t].y,
			'rotation': data.tanks[t].rotation,
			'tint': data.tanks[t].tint,
			'id': data.tanks[t].id
		});
	}
	for (let t in data.bullets) {
		Bullet.list[data.bullets[t].id] = new Bullet({
			'x': data.bullets[t].x,
			'y': data.bullets[t].y,
			'id': data.bullets[t].id,
			'speed': data.bullets[t].speed,
			//'player_id': data.bullets[t].player_id,
			//'rotation': data.bullets[t].rotation,
			'tint': data.bullets[t].tint
		});
	}
});

socket.on('update_tank', function(data){
	for (let t in data) {
		if (Tank.list[data[t].id] !== undefined) {
			Tank.list[data[t].id].server_update(data[t]);
		}
	}
});

socket.on('update_bullet', function(data){
	for (let t in data) {
		if (Bullet.list[data[t].id] !== undefined) {
			Bullet.list[data[t].id].server_update(data[t]);
		}
	}
});

socket.on('destroy', function(data){
	for (let t in data.tanks) {
		if (Tank.list[data.tanks[t]] !== undefined) {
			Tank.list[data.tanks[t]].destroy([Tank.list]);
		}
	}
	for (let t in data.bullets) {
		if (Bullet.list[data.bullets[t]] !== undefined) {
			Bullet.list[data.bullets[t]].destroy([Bullet.list]);
		}
	}
});

//minden frame-n. számokat delta-val szorozva alacsony fps-en is ugyanakkora sebességet kapunk, mint 60-on.
g_app.ticker.add(function(delta) {
	//oldal resize
	let block_width = jQuery("#game_container").width();
	let block_height = jQuery("#game_container").height();

	g_site_orig_width = block_width//window.innerWidth-103;
	g_site_orig_height = g_site_orig_width*WRATIO;
	if (g_site_orig_height > block_height) {
		g_site_orig_height = block_height;
		g_site_orig_width = g_site_orig_height/WRATIO;
	}
	g_app.renderer.view.style.width = g_site_orig_width;
	g_app.renderer.view.style.height = g_site_orig_height;
});

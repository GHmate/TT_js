
//socket dolgai
var socket = io();

//mozgatás
document.onkeydown = function(event){
	if(event.keyCode === 37) { //balra
		//Player.list[0].keypress.left = true;
		socket.emit('keyPress', {inputId: 'left', state: true});
	} else if(event.keyCode === 38) { //fel
		//Player.list[0].keypress.up = true;
		socket.emit('keyPress', {inputId: 'up', state: true});
	} else if(event.keyCode === 39) { //jobbra
		//Player.list[0].keypress.right = true;
		socket.emit('keyPress', {inputId: 'right', state: true});
	} else if(event.keyCode === 40) { //le
		//Player.list[0].keypress.down = true;
		socket.emit('keyPress', {inputId: 'down', state: true});
	} else if(event.keyCode === 32) { //space
		if (classes.Player.list[0].shoot_button_up === true) {
			//Player.list[0].triggerShoot();
			socket.emit('keyPress', {inputId: 'shoot', state: true});
			classes.Player.list[0].shoot_button_up = false;
		}
	}
};

document.onkeyup = function(event){
	if(event.keyCode === 37) { //balra
		socket.emit('keyPress', {inputId: 'left', state: false});
		//Player.list[0].keypress.left = false;
	} else if(event.keyCode === 38) { //fel
		socket.emit('keyPress', {inputId: 'up', state: false});
		//Player.list[0].keypress.up = false;
	} else if(event.keyCode === 39) { //jobbra
		socket.emit('keyPress', {inputId: 'right', state: false});
		//Player.list[0].keypress.right = false;
	} else if(event.keyCode === 40) { //le
		socket.emit('keyPress', {inputId: 'down', state: false});
		//Player.list[0].keypress.down = false;
	} else if(event.keyCode === 32) { //space
		classes.Player.list[0].shoot_button_up = true;
	}
	
};

socket.on('map_init',function(data){
	Wall.list = {};
	for (let w in data.walls) {
		Wall.list[data.walls[w].id] = new Wall({
			'x': data.walls[w].x,
			'y': data.walls[w].y,
			'id': data.walls[w].id,
			'width': data.walls[w].width,
			'height': data.walls[w].height
		});
		//die(data.walls[w]);
	}
});

/*
socket.on('wall_init',function(wall_data){
	classes.Wall.list = {};
	for (let w in wall_data) {
		classes.Wall.list[wall_data[w].id] = new classes.Wall({
			'x': wall_data[w].x,
			'y': wall_data[w].y,
			'x_graph': wall_data[w].x_graph,
			'y_graph': wall_data[w].y_graph,
			'id': wall_data[w].id,
			'width': wall_data[w].sprite.width,
			'height': wall_data[w].sprite.height
		});
		//functions.die(wall_data[w]);
	}
});

socket.on('tank_init',function(tank_data){
	classes.Player.list = {};
	for (let t in tank_data) {
		classes.Player.list[tank_data[t].id] = new classes.Player({
			'x': tank_data[t].x,
			'y': tank_data[t].y,
			'x_graph': tank_data[t].x_graph,
			'y_graph': tank_data[t].y_graph,
			'id': tank_data[t].id
		});
		//functions.die(wall_data[w]);
	}
});
*/

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

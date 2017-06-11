
//mozgatás
document.onkeydown = function(event){
	let tank_control = '';
	if(event.keyCode === 37) { //balra
		tank_control = 'left';
	} else if(event.keyCode === 38) { //fel
		tank_control = 'up';
	} else if(event.keyCode === 39) { //jobbra
		tank_control = 'right';
	} else if(event.keyCode === 40) { //le
		tank_control = 'down';
	} else if(event.keyCode === 32) { //space
		if (g_self_data.shoot_button_up === true) {
			socket.emit('keyPress', {inputId: 'shoot', state: true});
			tank_control = 'shoot';
			g_self_data.shoot_button_up = false;
		}
	}
	if (Tank.list !== undefined) {
		if (tank_control !== '' && Tank.list[g_self_data.id] !== undefined) {
			Tank.list[g_self_data.id].keyevent(tank_control,true);
		}
	}
};

document.onkeyup = function(event){
	let tank_control = '';
	if(event.keyCode === 37) { //balra
		tank_control = 'left';
	} else if(event.keyCode === 38) { //fel
		tank_control = 'up';
	} else if(event.keyCode === 39) { //jobbra
		tank_control = 'right';
	} else if(event.keyCode === 40) { //le
		tank_control = 'down';
	} else if(event.keyCode === 32) { //space
		g_self_data.shoot_button_up = true;
		socket.emit('keyPress', {inputId: 'shoot', state: false});
		tank_control = 'shoot';
	}
	if (tank_control !== '' && Tank.list[g_self_data.id] !== undefined) {
		Tank.list[g_self_data.id].keyevent(tank_control,false);
	}
};

g_collisioner = new CollisionManager({});

socket.on('init', function(data){
	if (data.global !== undefined) {
		g_self_data.id = data.global.id;
	}
	
	if (data.clear_all === true) { //teljes reset
		g_collisioner = new CollisionManager({});
		clear_local_map();
		if (g_ghost) {
			ghosttank = new PIXI.Sprite(g_textures.tank);//teszteléshez
			ghosttank.anchor.set(0.45,0.5);
			g_app.stage.addChild(ghosttank);
		}
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

//TODO: a server_update funkció már nem használandó sehol

socket.on('update_entities', function(data){
	for (let t in data.tank) {
		let s_tank = data.tank[t];
		if (Tank.list[s_tank.id] !== undefined) {
			if (g_ipol_on) {
				Tank.list[s_tank.id].start_ipol(s_tank.x,s_tank.y,s_tank.rotation,s_tank.spd,s_tank.rot_spd,(Tank.list[s_tank.id].id === g_self_data.id));
			} else {
				Tank.list[s_tank.id].server_update({'x': s_tank.x, 'y': s_tank.y, 'rotation': s_tank.rotation});
			}
		}
	}
	for (let t in data.bullet) {
		let s_bullet = data.bullet[t];
		if (Bullet.list[s_bullet.id] !== undefined) {
			if (g_ipol_on) {
				Bullet.list[s_bullet.id].start_ipol(s_bullet.x,s_bullet.y,s_bullet.rotation,s_bullet.spd,s_bullet.rot_spd);
			} else {
				Bullet.list[s_bullet.id].server_update({'x': s_bullet.x, 'y': s_bullet.y, 'rotation': s_bullet.rotation});
			}
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
	
	if (g_self_data.latency_check) {
		g_self_data.latency_counter++;
	}
	g_self_data.tiks_after_input_sent++;
	
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
	
	for (let i in Tank.list) {
		if (Tank.list[i].id !== g_self_data.id) {
			Tank.list[i].ipol();
		} else {
			if (g_ipol_on) {
				Tank.list[i].predict();
			}
		}
	}
	for (let i in Bullet.list) {
		Bullet.list[i].ipol();
	}
});

socket.on('input_response', function(position){
	if (g_self_data.latency_check) {
		g_self_data.latency = g_self_data.latency_counter;
		g_self_data.latency_counter = 0;
		g_self_data.latency_check = false;
	}
	//console.log(g_self_data.tiks_after_input_sent);
	if (Tank.list[g_self_data.id] !== undefined) {
		//az utolsó n daradb inputot újra-szimulálja a szervertől kapott pozícióra (instant), és korrigálja a jelenlegi helyet.
		//(n a ping és pong közt eltelt tik-ek száma) majd törli a szimuláltaknál is régebbi input adatokat.
		
		/*let list_length = Tank.list[g_self_data.id].list_of_inputs.length;
		let index = list_length-g_self_data.tiks_after_input_sent-Math.ceil(g_self_data.latency*2);
		console.log(g_self_data.latency);
		if (index < 0) {
			index = 0;
		}*/
		//console.log('length: '+list_length);
		//console.log('index: '+index);
		Tank.list[g_self_data.id].apply_input_movement_data(position.next_processed,position);
	}
	g_self_data.tiks_after_input_sent = 0;
});

setInterval(function () {
	if (Tank.list !== undefined) {
		if (Tank.list[g_self_data.id] !== undefined) {
			Tank.list[g_self_data.id].send_move_data_to_server();
		}
		if (!g_self_data.latency_check) {
			socket.emit('ping_time');
			g_self_data.latency_check = true;
		}
	}
}, 1000 / g_timing.input_sending);

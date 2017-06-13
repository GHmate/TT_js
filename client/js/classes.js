// minden osztály őse, amik a pályán / gráfon helyezkednek el
class Entity {
	//constructor(x,y,x_graph,y_graph,id,texture,width=false,height=false,speed = 2.2) {
	constructor(data) {
		this.x = (data.x !== undefined ? data.x : 0);
		this.y = (data.y !== undefined ? data.y : 0);
		this.id = (data.id !== undefined ? data.id : null);
		this.speed = (data.speed !== undefined ? data.speed : 2.2); //kell a tank predictionhoz (TODO: nem biztos)
		this.rot_speed = (data.rot_speed !== undefined ? data.rot_speed : 0.07);  //kell a tank predictionhoz (TODO: nem biztos)
		let texture = (data.texture !== undefined ? data.texture : '');
		this.sprite = new PIXI.Sprite(texture);
		this.sprite.x = this.x;
		this.sprite.y = this.y;
		this.rotation = (data.rotation !== undefined ? data.rotation : 0);
		this.tint = (data.tint !== undefined ? data.tint : '0xffffff');
		//this.speed = (data.speed !== undefined ? data.speed : 2.2);
		this.collision_block = []; //kell a tank predictionhoz
		g_app.stage.addChild(this.sprite);
		if (data.width) {
			this.sprite.width = data.width;
		}
		if (data.height) {
			this.sprite.height = data.height;
		}
		
		//interpolációért felelős adatok
		this.ipol_data = {
			'start': {
				'x': -1,
				'y': -1,
				'direction': 0
			},
			'end': {
				'x': -1,
				'y': -1,
				'direction': 0
			},
			'speed': 1, //TODO: hátrafele menetnél a szerver oldalon ténylegesen állítgatni kéne a speed-et, ahelyett, hogy csak a kalkulációnál szorozzuk le. így helyes sebességet küld a klienseknek
			'rotate_speed':0.2 //TODO kéne egy ilyen a szerver oldalra, és pozitív vagy negatív értéket kapjon, amikor erre vagy arra fordul az entity.
		};
		this.init_ipol(this.x,this.y,this.rotation);
	}
	
	//hogy ne a világ végéről interpoláljon a legelső tikben sem
	init_ipol(x,y,dir) {
		this.ipol_data.start.x = this.ipol_data.end.x = x;
		this.ipol_data.start.y = this.ipol_data.end.y = y;
		this.ipol_data.start.direction = this.ipol_data.end.direction = dir;
	}
	//amikor a szerverről jön az utasítás, hogy 'mennyé oda'
	start_ipol(x,y,dir,spd,rot_spd,self = false) {
		if (!self) { //ha nem épp a saját tankunkról van szó
			//első körben oda tesszük az entityt, ahol az előző üzenet szerint kellett lennie (hátha eltért az interpoláció miatt)
			this.ipol_data.start.x = this.ipol_data.end.x;
			this.ipol_data.start.y = this.ipol_data.end.y;
			this.ipol_data.start.direction = this.ipol_data.end.direction;
			//utána megadjuk az új célpontot és a sebességeket
			this.ipol_data.end.x = x;
			this.ipol_data.end.y = y;
			this.ipol_data.end.direction = dir;
			this.ipol_data.speed = spd;
			this.ipol_data.rotate_speed = rot_spd;
		} else {
			//teszteléshez
			if (g_ghost) {
				ghosttank.x = x;
				ghosttank.y = y;
				ghosttank.rotation = dir;
			}
		}
	}
	//maga a mozgatás: 60 fps-sel fusson
	ipol() {
		let difference = false;
		if (this.ipol_data.start.x !== this.ipol_data.end.x || this.ipol_data.start.y !== this.ipol_data.end.y) {
			let dist_x = this.ipol_data.end.x - this.ipol_data.start.x;
			let dist_y = this.ipol_data.end.y - this.ipol_data.start.y;
			let distance = Math.sqrt(Math.pow(dist_x,2) + Math.pow(dist_y,2));
			if (distance <= this.ipol_data.speed) {
				this.ipol_data.start.x = this.ipol_data.end.x;
				this.ipol_data.start.y = this.ipol_data.end.y;
			} else {
				let rotation = Math.atan2(dist_y,dist_x);
				let next = {
					'x': Math.cos(rotation)*this.ipol_data.speed,
					'y': Math.sin(rotation)*this.ipol_data.speed
				};
				this.ipol_data.start.x += next.x;
				this.ipol_data.start.y += next.y;
			}
			difference = true;
		}
		if (this.ipol_data.start.direction !== this.ipol_data.end.direction) {
			let dist_angle = Math.abs(this.ipol_data.start.direction - this.ipol_data.end.direction);
			if (dist_angle <= this.ipol_data.rotate_speed) {
				this.ipol_data.start.direction = this.ipol_data.end.direction;
			} else {
				this.ipol_data.start.direction += this.ipol_data.rotate_speed;
			}
			difference = true;
		}
		if (difference) {
			this.x = this.sprite.x = this.ipol_data.start.x;
			this.y = this.sprite.y = this.ipol_data.start.y;
			this.rotation = this.ipol_data.start.direction; //itt a sprite-t nem állítom, felül van definiálva a tank classban. mert bulletnél pl. nem kell.
		}
	}
	
	//meg kell szüntetni minden referenciát ami rá mutat, akkor törlődik csak! (garbage collector) + a sprite-t is ki kell pucolni
	destroy(lists = []) {//tömb-tömböt vár, nem sima tömböt
		if (lists.length < 1) {
			console.log('warning: destroy funkció nem kapott elem-tömböt');
		}
		for (let list of lists) {
			delete list[this.id]; //kitörli a kapott listákban az objektumra mutató referenciát
		}
		g_app.stage.removeChild(this.sprite); //kiszedi a pixi-s referenciát a sprite-ra
		this.sprite = null; //kiszedi a saját referenciát a sprite-ra (elvileg nem kötelező, mert ha törlődik ő, akkor a sprite-ja is)
	};
}

class Wall extends Entity{
	constructor(data) {
		if (data.texture === undefined) {data.texture = g_textures.wall;}
		super(data);
		this.sprite.anchor.set(0.5,0.5);
		let width = (data.width !== undefined ? data.width : 10);
		let height = (data.height !== undefined ? data.height : 10);
		this.hitbox = { //téglalap 4 sarka
			'x1':this.x-width/2,
			'x2':this.x+width/2,
			'y1':this.y-height/2,
			'y2':this.y+height/2
		};
	}
}

class Tank extends Entity{
	constructor(data) {
		if (data.texture === undefined) {data.texture = g_textures.tank;}
		if (data.width === undefined) {data.width = 41;}
		if (data.height === undefined) {data.height = 26;}
		if (data.rotation === undefined) {data.rotation = Math.random()*2*Math.PI;}
		super(data);
		this.inactive = true;
		this.normal_speed = this.speed;
		this.sprite.rotation = this.rotation;
		this.sprite.anchor.set(0.45,0.5);
		this.sprite.tint = this.tint;
		this.shoot_button_up = true;
		this.movement_timer = 0;
		this.list_of_inputs = []; //az inputok listája, predictionhöz (TODO: talán ki kéne szervezni innen ezeket?)
		this.server_lastpos = {'x':this.x,'y':this.y,'d':this.rotation};
		this.list_of_inputs_temp = []; //csak a szervernek nem elküldött inputokat tárolja
		this.movement_rail = [{ //hozzáadunk egy első elemet
			'id': 0, 'x': this.x, 'y': this.y, 'd': this.rotation, 'x_dist': 0, 'y_dist': 0, 'dist': 0, 'processed':0
		}];
		//this.can_shoot = true;
		//this.shoot_type = "bb"; // mchg --- machinegun , normal--- sima bullet, bb --- BigBoom, 
		//this.bullet_timer = 3;
		this.keypress = {
			'left':false,
			'up':false,
			'right':false,
			'down':false
		};
		this.predict();
	}
	//triggerShoot() {}
	//createBullet() {};	
	//ext_machinegun(){};
	changeColor(color) {
		this.tint = this.sprite.tint = color;
	}
	server_update(s_tank) { //tulajdonképpen csak teszteléshez marad itt
		if (s_tank.x !== undefined) {this.x = s_tank.x; this.sprite.x = s_tank.x;}
		if (s_tank.y !== undefined) {this.y = s_tank.y; this.sprite.y = s_tank.y;}
		if (s_tank.rotation !== undefined) {this.rotation = s_tank.rotation; this.sprite.rotation = s_tank.rotation;}
	}
	
	ipol() {
		super.ipol();
		this.sprite.rotation = this.rotation;
	}
	start_ipol(x,y,dir,spd,rot_spd,self = false) {
		super.start_ipol(x,y,dir,spd,rot_spd,self);
		if (self) {
			//nem interpoláljuk, hanem predicteljük, és ilyenkor, amikor jön a szerverről adat, felülírjuk a predictelt értékeket
			/*let re_calculated_position = {'x': x,'y': y,'d': dir};
			let eldobando_darab = this.predictedmoves.length-g_self_data.latency;
			this.predictedmoves.splice(0, eldobando_darab);
			for (let i in this.predictedmoves) {
				re_calculated_position.x += this.predictedmoves[i].x;
				re_calculated_position.y += this.predictedmoves[i].y;
				re_calculated_position.d += this.predictedmoves[i].d;
			}
			this.x = this.sprite.x = re_calculated_position.x;
			this.y = this.sprite.y = re_calculated_position.y;
			this.rotation = this.sprite.rotation = re_calculated_position.d;*/
		}
	}
	keyevent(name,value) {
		this.keypress[name] = value;
	}
	predict() {
		if (this.inactive) {
			return;
		}
		//logoljuk az inputokat
		let input_data = [
			this.keypress['up']?1:0,
			this.keypress['down']?1:0,
			this.keypress['left']?1:0,
			this.keypress['right']?1:0,
			this.movement_timer
		]; //fel, le, balra, jobbra
		this.movement_timer++;
		if (this.movement_timer > 30000) {
			this.movement_timer = 0;
		}
		this.list_of_inputs.push(input_data); //saját használatra
		this.list_of_inputs_temp.push(input_data); //szervernek küldéshez, mert ezt mindig ürítjük
		
		//forgás:
		let rotate = false;
		if (input_data[3] === 1) { //right
			if (this.rot_speed < 0) {this.rot_speed = -this.rot_speed;}
			rotate = !rotate;
		}
		if (input_data[2] === 1) { //left
			if (this.rot_speed > 0) {this.rot_speed = -this.rot_speed;}
			rotate = !rotate;
		}
		if (rotate) {
			this.rotation += this.rot_speed; //*delta
		}
		
		//hozzáadjuk az inputot a rail-hez
		let last_rail_part = this.movement_rail[this.movement_rail.length - 1];
		if (last_rail_part === undefined) {
			this.movement_rail.push({'id': 0, 'x': this.x, 'y': this.y, 'd': this.rotation, 'x_dist': 0, 'y_dist': 0, 'dist': 0, 'processed':0});
			last_rail_part = this.movement_rail[0];
		}
		
		let self_start_position = {
			'x': last_rail_part.x+last_rail_part.x_dist,
			'y': last_rail_part.y+last_rail_part.y_dist
			//'d': last_rail_part.d
		};
		let simulated_pos = this.simulate_input(self_start_position,input_data);
		let new_rail_part = {
			'id': this.movement_timer,
			'x': last_rail_part.x+last_rail_part.x_dist,
			'y': last_rail_part.y+last_rail_part.y_dist,
			//'d': simulated_pos.d, //d nem baj, ha az új adat, mert a forgás itt nem befolyásolja a mozgást, és így természetesebbnek hat szerintem
			'x_dist': simulated_pos.x-(last_rail_part.x+last_rail_part.x_dist),
			'y_dist': simulated_pos.y-(last_rail_part.y+last_rail_part.y_dist),
			'dist': Math.sqrt(Math.pow(simulated_pos.x-(last_rail_part.x+last_rail_part.x_dist),2)+Math.pow(simulated_pos.y-(last_rail_part.y+last_rail_part.y_dist),2)),
			'processed': 0 //0: nincs processzálva. 1: végig processzáltuk. 0-1 közt: épp processzálva van, részben megtettük a szakasz távolságát (hány százalékban)
		};
		this.movement_rail.push(new_rail_part);
		let rail_distance_left = 0;
		for (let i = 0; i < this.movement_rail.length; i++) {
			rail_distance_left += this.movement_rail[i].dist*(1-this.movement_rail[i].processed);
		}
		let distance_per_tik = rail_distance_left/this.movement_rail.length;
		distance_per_tik += 0.2; //finomhangolás
		/*if (distance_per_tik < 0.2) {
			distance_per_tik = 0.5;
		}*/
		this.move_on_rail(distance_per_tik);


		this.sprite.x = this.x;
		this.sprite.y = this.y;

		//hack-szerűen késleltetem a forgást, hogy valósabbnak tűnjön
		if (this.sprite.rotation > this.rotation+0.02) {
			let rot = (this.sprite.rotation-this.rotation)/7;
			/*if (rot < 0.001) {
				rot = 0.001;
			}*/
			this.sprite.rotation -= rot;
		} else if (this.sprite.rotation < this.rotation-0.02) {
			let rot = (this.rotation-this.sprite.rotation)/7;
			/*if (rot < 0.001) {
				rot = 0.001;
			}*/
			this.sprite.rotation += rot;
		} else {
			this.sprite.rotation = this.rotation;
		}
		if (this.rotation > Math.PI*6 && this.sprite.rotation > Math.PI*6) {
			this.sprite.rotation -= Math.PI*2;
			this.rotation -= Math.PI*2;
		}
		if (this.rotation < -Math.PI*6 && this.sprite.rotation <- Math.PI*6){
			this.sprite.rotation += Math.PI*2;
			this.rotation += Math.PI*2;
		}
	};
	send_move_data_to_server () {
		//elküldjük a szervernek az utolsó néhány tik mozgását.
		socket.emit('input_list', this.list_of_inputs_temp);
		this.list_of_inputs_temp = [];
	};
	simulate_input (start_pos,input_data) {
		let ret = {'x': start_pos.x,'y': start_pos.y, 'd': start_pos.d};
		this.x = ret.x;
		this.y = ret.y;
		this.hitbox = { //téglalap 4 sarka
			'x1':this.x-13,
			'x2':this.x+13,
			'y1':this.y-13,
			'y2':this.y+13
		};
		g_collisioner.update_arrays();

		//let input_data = this.list_of_inputs[loop_index]; //kiolvassuk a tömbből
		if (input_data[4] === undefined) {
			console.log('kapott input: nincs index');
		}

		if (input_data[1] === 1) {
			this.speed = this.normal_speed*0.7;
		} else {
			this.speed = this.normal_speed;
		}

		let x_wannago = 0;
		let y_wannago = 0;
		let cosos = Math.cos(this.rotation)*this.speed;
		let sines =  Math.sin(this.rotation)*this.speed;
		if (input_data[0] === 1) { //up
			x_wannago = cosos; //*delta
			y_wannago = sines; //*delta
		} else if (input_data[1] === 1) { //down
			x_wannago = -1*cosos; //*delta
			y_wannago = -1*sines; //*delta
		}

		//mozgás és fal-ütközés
		if (x_wannago !== 0 || y_wannago !== 0) {
			let x_w_rounded = x_wannago > 0 ? Math.ceil(x_wannago) : Math.floor(x_wannago);
			let y_w_rounded = y_wannago > 0 ? Math.ceil(y_wannago) : Math.floor(y_wannago);
			let collision_data = g_collisioner.check_collision_one_to_n(this,Wall,x_w_rounded,y_w_rounded);
			let colliding = collision_data['collision'];

			if ((x_wannago > 0 && !colliding.right) || (x_wannago < 0 && !colliding.left)) {
				ret.x += x_wannago;
			}
			if ((y_wannago > 0 && !colliding.down) || (y_wannago < 0 && !colliding.up)) {
				ret.y += y_wannago;
			}
		}
		return ret;
	}
	move_on_rail (distance) {
		for (let i = 0; i < this.movement_rail.length; i++) {
			
			let rail_part = this.movement_rail[i];
			if (rail_part.processed >= 1) {
				
				continue;
			}
			
			if (distance > 0 && this.movement_rail[i].processed < 1) {
				let walkable_dist = rail_part.dist*(1-rail_part.processed);
				if (walkable_dist >= distance) {
					let moved_percentage = this.movement_rail[i].processed+(distance/rail_part.dist);
					walkable_dist -= distance;
					distance = 0;
					this.movement_rail[i].processed = (rail_part.dist-walkable_dist)/rail_part.dist;
					this.x = rail_part.x+rail_part.x_dist*moved_percentage;
					this.y = rail_part.y+rail_part.y_dist*moved_percentage;
				} else {
					let moved_percentage = this.movement_rail[i].processed = 1;
					distance -= walkable_dist;
					this.x = rail_part.x+rail_part.x_dist;
					this.y = rail_part.y+rail_part.y_dist;
				}
				
			}
			
		}
	}
	apply_server_info (index,starting_point) { 
		//van starting point, oda állítja a playert és onnan futtatja a cuccot
		this.server_lastpos = {'x':starting_point.x,'y':starting_point.y,'d':starting_point.rotation};
		if (index === false) {
			return; //kihagyott a szerver valamiért. nem csinálunk semmit
		}
		
		let start_doing = false;
		let remove_count = 0;
		
		for (let loop_index = 0; loop_index < this.list_of_inputs.length; loop_index++) {
			let input_data = this.list_of_inputs[loop_index]; //kiolvassuk a tömbből
			if (input_data[4] === undefined) {
				console.log('input: nincs index');
				continue;
			}
			if (input_data[4] === index) {
				start_doing = true;
			}
			if (!start_doing) {
				remove_count++;
				continue;
			}
		}
		if (starting_point) { //korrigáltunk, és akkor a szerver állapot előtti dolgokat kidobhatjuk, mert nem kellenek.
			this.list_of_inputs.splice(0,remove_count);
		}
		
		//valamint kidobáljuk a rail régi elemeit is
		let start_doing_server = false;
		let start_doing_me = false;
		remove_count = 0;
		for (let loop_index = 0; loop_index < this.movement_rail.length; loop_index++) {
			let rail_part = this.movement_rail[loop_index]; //kiolvassuk a tömbből
			if (rail_part.id === undefined) {
				console.log('rail: nincs index');
				continue;
			}
			if (rail_part.id === index) {
				start_doing_server = true;
			}
			if (rail_part.processed < 1) {
				start_doing_me = true;
			}
			if (!start_doing_server && !start_doing_me) {
				remove_count++;
				continue;
			}
		}
		if (starting_point) { //korrigáltunk, és akkor a szerver állapot előtti dolgokat kidobhatjuk, mert nem kellenek.
			this.movement_rail.splice(0,remove_count);
		}
	};
	/*repair_movement (server_pos) { //TODO: ha a saját pozíció nagyon eltér a szervertől kapottól, ne updatelje magát egy darabig, csak várjon a szerver-pozícióra.
		//console.log('reset');
		this.x = server_pos.x;
		this.y = server_pos.y;
		this.rotation = server_pos.d;
		console.log(server_pos.d);
		this.movement_rail = [{ //hozzáadunk egy első elemet
			'id': 0, 'x': server_pos.x, 'y': server_pos.y, 'd': server_pos.d, 'x_dist': 0, 'y_dist': 0, 'dist': 0, 'processed':0
		}];
		this.list_of_inputs = [];
		this.list_of_inputs_temp = [];
	}*/
}

//lövedék
class Bullet extends Entity{
	constructor(data) {
		if (data.texture === undefined) {data.texture = g_textures.bullet;}
		//if (data.speed === undefined) {data.speed = 2.6;}
		if (data.width === undefined) {data.width = 10;}
		if (data.height === undefined) {data.height = 10;}
		super(data);
		this.sprite.tint = this.tint;
		this.sprite.anchor.set(0.5,0.5);
		//this.x_graph = x; //a gráfban elfoglalt hely
		//this.y_graph = y;
		//this.rotation = (data.rotation !== undefined ? data.rotation : 0);
		//this.timer = (data.timer !== undefined ? data.timer : 600);
		//this.player_id = (data.player_id !== undefined ? data.player_id : 0);
		//this.Boom = false;
		//this.updatePosition();
		
	};
	server_update(s_bullet) {
		if (s_bullet.x !== undefined) {this.x = s_bullet.x; this.sprite.x = s_bullet.x;}
		if (s_bullet.y !== undefined) {this.y = s_bullet.y; this.sprite.y = s_bullet.y;}
	}
}

class BigBullet extends Bullet{
		constructor(data) {
		if (data.texture === undefined) {data.texture = g_textures.bullet;}
		if (data.speed === undefined) {data.speed = 2;}
		if (data.width === undefined) {data.width = 10;}
		if (data.height === undefined) {data.height = 10;}
		super(data);
		//this.sprite.x = 2;
		/*this.sprite.anchor.set(0.5,0.5);
		this.x_graph = x; //a gráfban elfoglalt hely
		this.y_graph = y;
		this.rotation = 0;
		this.timer = 600;
		this.player_id = player_id;*/
		this.speed = 2.5;
		//this.updatePosition();
	};
	boom(){
		
	};
	updatePosition() { 
		
	};
	
}; 	
	
class Extra extends Entity{
	constructor(data){
		if (data.texture === undefined) {data.texture = g_textures.extra;}
		if (data.width === undefined) {data.width = 20;}
		if (data.height === undefined) {data.height = 20;}
		super(data);
		this.sprite.anchor.set(0.5,0.5);
		let width = (data.width !== undefined ? data.width : 10);
		let height = (data.height !== undefined ? data.height : 10);
		/*this.hitbox = { //téglalap 4 sarka
			'x1':this.x-width/2,
			'x2':this.x+width/2,
			'y1':this.y-height/2,
			'y2':this.y+height/2
		};*/
		this.type = (data.type !== undefined ? data.type : 0);
	};
};

//csak a játékos és fal ütközését nézi a prediction miatt
CollisionManager = class CollisionManager {
	constructor(data) {
		this.field_size = (data.field_size !== undefined ? data.field_size : 80); //hányszor hányas kockákra ossza fel a teret
	}
	//megnézi melyik dobozba/dobozokba kell tenni az entity-t
	get_placing_boxes (entity) {
		let results = [];
		let border = 3; //ennyi pixellel számol ráhagyást a tényleges hitboxra, hogy elkerüljük az épp blokk szélén lévő falak hiányának problémáját
		let x_start = Math.floor((entity.hitbox.x1-border)/this.field_size);
		let x_end = Math.floor((entity.hitbox.x2+border)/this.field_size);
		let y_start = Math.floor((entity.hitbox.y1-border)/this.field_size);
		let y_end = Math.floor((entity.hitbox.y2+border)/this.field_size);
		for (let i = x_start ; i <= x_end ; i++) {
			for (let j = y_start ; j <= y_end ; j++) {
				results.push([i,j]);
			}
		}
		return results;
	}
	//elhelyezi a kapott entity-t a felosztott táblázatában. több helyre is teheti, ha nem fér pont egybe
	place (entity) {
		let boxes = this.get_placing_boxes(entity);
		for (let box of boxes) {
			if (CollisionManager.map[box[0]] === undefined) {
				CollisionManager.map[box[0]] = [];
			}
			if (CollisionManager.map[box[0]][box[1]] === undefined) {
				CollisionManager.map[box[0]][box[1]] = [];
			}
			CollisionManager.map[box[0]][box[1]].push(entity);
			entity.collision_block.push([box[0],box[1]]);
		}
	}
	//mindent updatel
	update_arrays (){
		CollisionManager.map = [];
		for (let key in Wall.list) {
			Wall.list[key].collision_block = [];
			this.place(Wall.list[key]);
		}
		if (Tank.list !== undefined && Tank.list[g_self_data.id] !== undefined) {
			Tank.list[g_self_data.id].collision_block = [];
			this.place(Tank.list[g_self_data.id]);
		}
	}
	//sima egy az n-hez ütközést ellenőriz, tömbbel tér vissza. (4 irány)
	check_collision_one_to_n (target, c_class, xnext = 0, ynext = 0) {
		let t_width = Math.abs(target.hitbox.x1 - target.hitbox.x2);
		let t_height = Math.abs(target.hitbox.y1 - target.hitbox.y2);
		let collision = {'right':false,'up':false,'left':false,'down':false};
		let collided = [];
		for (let block of target.collision_block) {
			for (let obj of CollisionManager.map[block[0]][block[1]]) {
				if (!(obj instanceof c_class)) {
					continue;
				}
				let c_width = Math.abs(obj.hitbox.x1 - obj.hitbox.x2);
				let c_height = Math.abs(obj.hitbox.y1 - obj.hitbox.y2);
				
				let w = 0.5 * (t_width + c_width);
				let h = 0.5 * (t_height + c_height);
				let dx = target.x - obj.x;
				let dy = target.y - obj.y;
				let dx_m = target.x+xnext - obj.x;
				let dy_m = target.y+ynext - obj.y;

				if (Math.abs(dx_m) <= w && Math.abs(dy_m) <= h)
				{
					collided.push(obj);

					let wy = w * dy_m;
					let hx = h * dx_m;
					if (wy > hx) {
						if (wy > -hx) {
							if (Math.abs(dx) <= w && Math.abs(dy_m) <= h) { //téves ütközés elkerülésére
								collision.up = true;
							}
						} else {
							if (Math.abs(dx_m) <= w && Math.abs(dy) <= h) {
								collision.right = true;
							}
						}
					} else {
						if (wy > -hx) {
							if (Math.abs(dx_m) <= w && Math.abs(dy) <= h) {
								collision.left = true;
							}
						} else {
							if (Math.abs(dx) <= w && Math.abs(dy_m) <= h) {
								collision.down = true;
							}
						}
					}
				}
			}
		}
		return {'collision':collision, 'collided':collided};
	}
}
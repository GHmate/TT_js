// minden osztály őse, amik a pályán / gráfon helyezkednek el
Entity = class Entity {
	constructor(data) {
		this.x = (data.x !== undefined ? data.x : 0);
		this.y = (data.y !== undefined ? data.y : 0);
		this.x_graph = (data.x_graph !== undefined ? data.x_graph : 0); //a gráfban elfoglalt hely
		this.y_graph = (data.y_graph !== undefined ? data.y_graph : 0);
		this.id = (data.id !== undefined ? data.id : null);
		this.speed = (data.speed !== undefined ? data.speed : 2.2);
		this.collision_block = []; //collisionManager melyik dobozkájában van éppen. több is lehet, ha átlóg
		this.width = (data.width !== undefined ? data.width : 10);
		this.height = (data.height !== undefined ? data.height : 10);
		this.rotation = (data.rotation !== undefined ? data.rotation : 0);
		this.tint = (data.tint !== undefined ? data.tint : '0xffffff');
	}
	//meg kell szüntetni minden referenciát ami rá mutat, akkor törlődik csak! (garbage collector)
	destroy(lists = []) {//tömb-tömböt vár, nem sima tömböt
		if (lists.length < 1) {
			console.log('warning: destroy funkció nem kapott elem-tömböt');
		}
		for (let list of lists) {
			delete list[this.id]; //kitörli a kapott listákban az objektumra mutató referenciát
		}
	};
}

Wall = class Wall extends Entity{
	constructor(data) {
		super(data);
		this.hitbox = { //téglalap 4 sarka
			'x1':this.x-this.width/2,
			'x2':this.x+this.width/2,
			'y1':this.y-this.height/2,
			'y2':this.y+this.height/2
		};
	}
}

Tank = class Tank extends Entity{
	constructor(data) {
		if (data.rotation === undefined) {data.rotation = Math.random()*2*Math.PI;}
		if (data.tint === undefined) {data.tint = g_tank_colors[0];}
		super(data);
		this.can_shoot = true;
		this.shoot_type = "normal"; // mchg --- machinegun , normal--- sima bullet, bb --- BigBoom, 
		this.bullet_timer = 3;
		this.keypress = {
			'left':false,
			'up':false,
			'right':false,
			'down':false
		};
		this.bullet_count = 50;
		this.updatePosition();
	}
	updatePosition() {
		//fegyver összeszedési kapcsolók 
		//mchg
		if (this.shoot_type === "mchg") {
			this.can_shoot = false;
			if (!this.shoot_button_up) {this.shoot_type = "mchg_s"};
		};

		//machine gun
		if (this.shoot_type === "mchg_s") {
			if (this.shoot_button_up){
				this.can_shoot = true;
				this.shoot_type = "normal";
			};
			if (!this.shoot_button_up) {
				if (this.bullet_timer < 0){
					this.ext_machinegun();
					this.bullet_timer = 3;
				};
			};
			this.bullet_timer -= 0.75;	
		}
		
		if (this.keypress.right)
			this.rotation += 0.07; //*delta
		if (this.keypress.left)
			this.rotation -= 0.07; //*delta
		
		this.hitbox = { //téglalap 4 sarka
			'x1':this.x-13,
			'x2':this.x+13,
			'y1':this.y-13,
			'y2':this.y+13
		};

		let x_wannago = 0;
		let y_wannago = 0;
		let cosos = Math.cos(this.rotation)*this.speed;
		let sines =  Math.sin(this.rotation)*this.speed;
		if (this.keypress.up) {
			x_wannago = cosos; //*delta
			y_wannago = sines; //*delta
		} else if (this.keypress.down) {
			x_wannago = -1*cosos*0.7; //*delta
			y_wannago = -1*sines*0.7; //*delta
		}
		
		//mozgás és fal-ütközés
		let x_w_rounded = x_wannago >= 0 ? Math.ceil(x_wannago) : Math.floor(x_wannago);
		let y_w_rounded = y_wannago >= 0 ? Math.ceil(y_wannago) : Math.floor(y_wannago);
		let collision_data = g_collisioner.check_collision_one_to_n(this,Wall,x_w_rounded,y_w_rounded);
		let colliding = collision_data['collision'];
		
		if ((x_wannago > 0 && !colliding.right) || (x_wannago < 0 && !colliding.left)) {
			this.x += x_wannago;
		}
		if ((y_wannago > 0 && !colliding.down) || (y_wannago < 0 && !colliding.up)) {
			this.y += y_wannago;
		}
		
		//ha player ütközik bullettel
		collision_data = g_collisioner.check_collision_one_to_n(this,Bullet);
		let colliding_bullet = collision_data['collision'];
		if (colliding_bullet.right || colliding_bullet.left || colliding_bullet.up || colliding_bullet.down){
			for (let b of collision_data['collided']) {
				if (b.player_id !== this.id) {
					this.destroy([Player.list]);
					b.destroy([Bullet.list]);
					g_playerdata.tanks--;
					if (g_playerdata.tanks < 2) {
						for (let t of Player.list) {
							if (t !== undefined) {
								g_playerdata.scores[t.id]++;
								regenerate_map();
							}
						}
					}
				}
			}
		};
	};
	triggerShoot() {
		if (this.can_shoot){
			//bb
			if (this.shoot_type === "bb") {
				this.can_shoot = false;
				//console.log("átállít");
				
				this.shoot_type = "bb_s";
				//Bullet.list[Bullet.list_id_count] = new BigBullet(this.x, this.y, this.x_graph, this.y_graph, Bullet.list_id_count, g_textures.bullet, 10, 10, this.id);
				Bullet.list[Bullet.list_id_count] = new BigBullet({
					'x': this.x,
					'y': this.y,
					'x_graph': this.x_graph,
					'y_graph': this.y_graph,
					'id': Bullet.list_id_count,
					'player_id': this.id,
					'rotation': this.rotation,
					'tint': this.tint
				});
				Bullet.list_id_count++;


			} else if (this.shoot_type === "normal") {
				this.createBullet();
			}
		};
	}
	createBullet() {
		if (this.bullet_count > 0){ 
			Bullet.list[Bullet.list_id_count] = new Bullet({
				'x': this.x,
				'y': this.y,
				'x_graph': this.x_graph,
				'y_graph': this.y_graph,
				'id': Bullet.list_id_count,
				'player_id': this.id,
				'rotation': this.rotation,
				'tint': this.tint
			});
			Bullet.list_id_count ++;
			this.bullet_count --;
		};
	};	
	//lövésváltoztatós extrák ide:
	ext_machinegun(){
		Bullet.list[Bullet.list_id_count] = new Bullet({
			'x': this.x,
			'y': this.y,
			'x_graph': this.x_graph,
			'y_graph': this.y_graph,
			'id': Bullet.list_id_count,
			'player_id': this.id,
			'rotation': this.rotation + Math.PI/8 * Math.random() - Math.PI/8 *Math.random(),
			'tint': this.tint
		});
		Bullet.list_id_count ++;
	};

	changeColor(color) {
		this.tint = color;
	}
}

//lövedék
Bullet = class Bullet extends Entity{
	constructor(data) {
		if (data.texture === undefined) {data.texture = g_textures.bullet;}
		if (data.speed === undefined) {data.speed = 3;}
		if (data.width === undefined) {data.width = 10;}
		if (data.height === undefined) {data.height = 10;}
		super(data);
		this.timer = (data.timer !== undefined ? data.timer : 600);
		this.player_id = (data.player_id !== undefined ? data.player_id : 0);
		this.Boom = false;
		this.updatePosition();
		
	};
	updatePosition() { //TODO: a szögfüggvényes számolást nem kell minden tikben elvégezni, csak ha változás történik
		
		this.rotation = normalize_rad(this.rotation);
		
		this.hitbox = {
			'x1':this.x-5,
			'x2':this.x+5,
			'y1':this.y-5,
			'y2':this.y+5
		};
		
		let x_wannago = 0;
		let y_wannago = 0;
		let cosos = Math.cos(this.rotation)*this.speed;
		let sines = Math.sin(this.rotation)*this.speed;

		x_wannago = cosos; //*delta
		y_wannago = sines; //*delta

		let x_w_rounded = x_wannago >= 0 ? Math.ceil(x_wannago) : Math.floor(x_wannago);
		let y_w_rounded = y_wannago >= 0 ? Math.ceil(y_wannago) : Math.floor(y_wannago);
		let collision_data = g_collisioner.check_collision_one_to_n(this,Wall,x_w_rounded,y_w_rounded);
		let colliding = collision_data['collision'];
		//console.log(colliding);
		if ((x_wannago > 0 && colliding.right) || (x_wannago < 0 && colliding.left)) {
			this.rotation = Math.PI-this.rotation; //vízszintesen tükrözöm az irányát
			x_wannago = -x_wannago; //és a mostani célzott helyet is felülírom
			this.x += x_wannago;
		}
		if ((y_wannago > 0 && colliding.down) || (y_wannago < 0 && colliding.up)) {
			this.rotation = 2*Math.PI-this.rotation; //függőlegesen tükrözöm az irányát
			y_wannago = -y_wannago; //és a mostani célzott helyet is felülírom
			this.y += y_wannago;
		}
		this.x += x_wannago;
		this.y += y_wannago;
		
		this.timer --;

		if (this.timer < 1) {
			Player.list[this.player_id].bullet_count ++;
			this.destroy([Bullet.list]);
		}
	};
}

BigBullet = class BigBullet extends Bullet{
		constructor(data) {
		if (data.texture === undefined) {data.texture = g_textures.bullet;}
		if (data.speed === undefined) {data.speed = 2;}
		if (data.width === undefined) {data.width = 10;}
		if (data.height === undefined) {data.height = 10;}
		super(data);
		this.speed = 2.5;
		this.updatePosition();
	};
	boom(){
		if (Player.list[this.player_id].shoot_type === "bb_s" && !this.shoot_button_up){
			for (let i = 0; i < 12; i++) {
				Bullet.list[Bullet.list_id_count] = new Bullet({
						'x': this.x,
						'y': this.y,
						'x_graph': this.x_graph,
						'y_graph': this.y_graph,
						'id': Bullet.list_id_count,
						'player_id': this.id,
						'rotation': this.rotation + i*Math.PI/6,
						'speed': 1 + 2 * Math.random()
					});
				Bullet.list_id_count ++;
			};
			Player.list[this.player_id].can_shoot = true;
			this.destroy([Bullet.list]);
		};
	};
	updatePosition() { 
		super.updatePosition();
		
		if (this.timer < 550){
			this.boom();
		};
		

	};
	
}; 	
	

Extra = class Extra extends Entity{
	constructor(data){
		if (data.texture === undefined) {data.texture = g_textures.extra;}
		if (data.width === undefined) {data.width = 20;}
		if (data.height === undefined) {data.height = 20;}
		super(data);
		let width = (data.width !== undefined ? data.width : 10);
		let height = (data.height !== undefined ? data.height : 10);
		this.hitbox = { //téglalap 4 sarka
			'x1':this.x-width/2,
			'x2':this.x+width/2,
			'y1':this.y-height/2,
			'y2':this.y+height/2
		};
		this.type = (data.type !== undefined ? data.type : 0);
	};
};

//labirintus egy mezője
Node = class Node {
	constructor(data) {
		this.x_graph = (data.x !== undefined ? data.x : 0); //0 -> n ig a gráfban elfoglalt x, y pozíció
		this.y_graph = (data.y !== undefined ? data.y : 0);
		this.x = border.x+this.x_graph*g_field_size; //a pályán ténylegesen elfoglalt x, y pozíció
		this.y = border.x+this.y_graph*g_field_size;
		this.block_id = -1; //melyik összefüggő blokkba tartozik. -1=egyikbe sem.
		this.unused_paths = 2; //mennyi utat tudna még létrehozni
		this.path = [0,0]; // 0 vagy 1: nincs/van út jobbra / lefele. így azokra csak ő tehet utat, nincs ütközés. -1 akkor lesz, ha mellette/alatta vége a pályának
		if (this.x_graph == g_dimensions.x-1) {
			this.path[0] = -1;
			this.unused_paths--;
		}
		if (this.y_graph == g_dimensions.y-1) {
			this.path[1] = -1;
			this.unused_paths--;
		}
		
	}
	//csinál utakat magának
	generate_paths() {
		for (var i = 0 ; i < 2 ; i++) {
			if (this.path[i] == 0 && Math.random() < g_path_gen_chance) {
				this.path[i] = 1;
				this.unused_paths--;
			}
		}
	}
	//rekurzív funkció: besorolja egy blokkba magát és az összes hozzá kapcsolódó node-ot. visszatér a blokk tőle indult darabszámával
	besorol(actual_block,graph) {
		if (this.block_id !== -1) {
			//ha már be volt sorolva, nem folytatja
			return 0;
		} else {
			this.block_id = actual_block;
			var children_size = 1; //1 mert önmaga is hozzáadódik a blokkhoz.
			//először a balra és felette lévőket kérdezzük le
			if (graph[this.x_graph-1] !== undefined && graph[this.x_graph-1][this.y_graph].path[0] == 1) {
				children_size += graph[this.x_graph-1][this.y_graph].besorol(actual_block,graph);
			}
			if (graph[this.x_graph][this.y_graph-1] !== undefined && graph[this.x_graph][this.y_graph-1].path[1] == 1) {
				children_size += graph[this.x_graph][this.y_graph-1].besorol(actual_block,graph);
			}
			//majd a jobbra és alatta lévőket
			if (this.path[0] == 1) {
				children_size += graph[this.x_graph+1][this.y_graph].besorol(actual_block,graph);
			}
			if (this.path[1] == 1) {
				children_size += graph[this.x_graph][this.y_graph+1].besorol(actual_block,graph);
			}
			return children_size;
		}
	}
}

//ütközések vizsgálatáért felelős osztály (pálya-felosztósdival optimalizálva)
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
		for (let key in Player.list) {
			Player.list[key].collision_block = [];
			this.place(Player.list[key]);
		}
		for (let key in Wall.list) {
			Wall.list[key].collision_block = [];
			this.place(Wall.list[key]);
		}
		for (let key in Bullet.list) {
			Bullet.list[key].collision_block = [];
			this.place(Bullet.list[key]);
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
					
					if (target instanceof Player) {
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
					} else {
						let wy = w * dy;
						let hx = h * dx;
						if (wy > hx) {
							if (wy > -hx) {
								if (Math.abs(dx) <= w) { //téves ütközés elkerülésére
									collision.up = true;
								}
							} else {
								if (Math.abs(dy) <= h) {
									collision.right = true;
								}
							}
						} else {
							if (wy > -hx) {
								if (Math.abs(dy) <= h) {
									collision.left = true;
								}
							} else {
								if (Math.abs(dx) <= w) {
									collision.down = true;
								}
							}
						}
					}
				}
			}
		}
		return {'collision':collision, 'collided':collided};
	}
}

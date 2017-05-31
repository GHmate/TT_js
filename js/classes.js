// minden osztály őse, amik a pályán / gráfon helyezkednek el
class Entity {
	constructor(x,y,x_graph,y_graph,id,texture,width=false,height=false,speed = 2.2) {
		this.x = x;
		this.y = y;
		this.x_graph = x_graph; //a gráfban elfoglalt hely
		this.y_graph = y_graph;
		this.id = id;
		this.sprite = new PIXI.Sprite(texture);
		this.sprite.x = this.x;
		this.sprite.y = this.y;
		this.speed = speed;
		this.collision_block = []; //collisionManager melyik dobozkájában van éppen. több is lehet, ha átlóg
		g_app.stage.addChild(this.sprite);
		if (width !== false) {
			this.sprite.width = width;
		}
		if (height !== false) {
			this.sprite.height = height;
		}
	}
	//meg kell szüntetni minden referenciát ami rá mutat, akkor törlődik csak! (garbage collector) + a sprite-t is ki kell pucolni
	destroy(lists = []) {//tömb-tömböt vár, nem sima tömböt
		for (let list of lists) {
			delete list[this.id]; //kitörli a kapott listákban az objektumra mutató referenciát
		}
		g_app.stage.removeChild(this.sprite); //kiszedi a pixi-s referenciát a sprite-ra
		this.sprite = null; //kiszedi a saját referenciát a sprite-ra (elvileg nem kötelező, mert ha törlődik ő, akkor a sprite-ja is)
	};
}

class Wall extends Entity{
	constructor(x,y,x_graph,y_graph,id,texture,width,height) {
		super(x,y,x_graph,y_graph,id,texture,width,height);
		this.sprite.anchor.set(0.5,0.5);
		this.hitbox = { //téglalap 4 sarka
			'x1':this.x-width/2,
			'x2':this.x+width/2,
			'y1':this.y-height/2,
			'y2':this.y+height/2
		};
	}
}

class Player extends Entity{
	constructor(x,y,x_graph,y_graph,id,texture,width,height) {
		super(x,y,x_graph,y_graph,id,texture,width,height);
		this.sprite.anchor.set(0.45,0.5);
		this.sprite.tint = g_tank_colors[id];
		this.enableshoot = true;
		this.shoot_type = "mchg";
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
		//this.createBullet(); //ha esetleg tesztelni kéne a memory-ra
		if (this.keypress.space) {
			if (this.shoot_type == "mchg"){
				this.ext_machinegun();
				this.shoot_type = "normal";
				
			console.log("x");	
			};
			this.createBullet();
		}
		
		this.sprite.rotation = normalize_rad(this.sprite.rotation);
		
		if (this.keypress.right)
			this.sprite.rotation += 0.07; //*delta
		if (this.keypress.left)
			this.sprite.rotation -= 0.07; //*delta
		
		this.hitbox = { //téglalap 4 sarka
			'x1':this.x-13,
			'x2':this.x+13,
			'y1':this.y-13,
			'y2':this.y+13
		};

		let x_wannago = 0;
		let y_wannago = 0;
		let cosos = Math.cos(this.sprite.rotation)*this.speed;
		let sines =  Math.sin(this.sprite.rotation)*this.speed;
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
			this.sprite.x += x_wannago;
			this.x = this.sprite.x;
		}
		if ((y_wannago > 0 && !colliding.down) || (y_wannago < 0 && !colliding.up)) {
			this.sprite.y += y_wannago;
			this.y = this.sprite.y;
		}
		
		/*if (utk.right == true || utk.left == true || utk.up == true || utk.down == true){
			console.log("Ütközés"); //Extrás ütközések ide:   (kell egy függvény, ami átállítja erre this.shoot = "mchg", ha machinegun cucc kell)
		};*/
		
		collision_data = g_collisioner.check_collision_one_to_n(this,Bullet);
		let colliding_bullet = collision_data['collision'];
		if (colliding_bullet.right || colliding_bullet.left || colliding_bullet.up || colliding_bullet.down){
			for (let b of collision_data['collided']) {
				if (b.player_id !== this.id) {
					this.destroy([Player.list]);
					b.destroy([Bullet.list]);
					g_playerdata.scores[b.player_id]++;
				}
			}
		};
		
	};
	createBullet() {
		if (false) { //TODO: test cucc, kiszedni, ha nem kell
			for(let i=0;i<50;i++) {
				if (this.bullet_count > 0){ 
					Bullet.list[Bullet.list_id_count] = new Bullet(this.x, this.y, this.x_graph, this.y_graph, Bullet.list_id_count, g_textures.bullet, 10, 10, this.id);
					Bullet.list[Bullet.list_id_count].rotation = this.sprite.rotation +(Math.random()-0.5)*1.3; //helyette maga a bullet forog
					Bullet.list[Bullet.list_id_count].sprite.tint = this.sprite.tint;
					Bullet.list_id_count ++;
					this.bullet_count --;
				};
			}
		} else {
			if (this.bullet_count > 0){ 
				Bullet.list[Bullet.list_id_count] = new Bullet(this.x, this.y, this.x_graph, this.y_graph, Bullet.list_id_count, g_textures.bullet, 10, 10, this.id);
				Bullet.list[Bullet.list_id_count].rotation = this.sprite.rotation; //helyette maga a bullet forog
				Bullet.list[Bullet.list_id_count].sprite.tint = this.sprite.tint;
				Bullet.list_id_count ++;
				this.bullet_count --;
			};
		}
	};
	changeColor(color) {
		this.sprite.tint = color;
	}
}

//lövedék
class Bullet extends Entity{
	constructor(x,y,x_graph,y_graph,id,texture,width,height, player_id) {
		super(x,y,x_graph,y_graph,id,texture,width,height,3);
		this.sprite.anchor.set(0.5,0.5);
		this.x_graph = x; //a gráfban elfoglalt hely
		this.y_graph = y;
		this.rotation = 0;
		this.timer = 600;
		this.player_id = player_id;
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
			this.sprite.x += x_wannago;
		}
		if ((y_wannago > 0 && colliding.down) || (y_wannago < 0 && colliding.up)) {
			this.rotation = 2*Math.PI-this.rotation; //függőlegesen tükrözöm az irányát
			y_wannago = -y_wannago; //és a mostani célzott helyet is felülírom
			this.sprite.y += y_wannago;
		}
		//if (!colliding.up && !colliding.down && !colliding.left && !colliding.right) {
			this.sprite.x += x_wannago;
			this.sprite.y += y_wannago;
		//}
		this.x = this.sprite.x;
		this.y = this.sprite.y;
		
		
		this.timer --;

		if (this.timer < 1) {
			Player.list[this.player_id].bullet_count ++;
			this.destroy([Bullet.list]);
		}
		
		

	};
}

class Extra extends Entity{
	constructor(x,y,x_graph,y_graph,id,texture,width,height,type){
		super(x,y,x_graph,y_graph,id,texture,width,height);
		this.sprite.anchor.set(0.5,0.5);
		this.hitbox = { //téglalap 4 sarka
			'x1':this.x-width/2,
			'x2':this.x+width/2,
			'y1':this.y-height/2,
			'y2':this.y+height/2
		};
		this.type = type;
		
		
	};
	
	
	
	
};

//labirintus egy mezője
class Node {
	constructor(x,y) {
		this.x_graph = x; //0 -> n ig a gráfban elfoglalt x, y pozíció
		this.y_graph = y;
		this.x = border.x+x*g_field_size; //a pályán ténylegesen elfoglalt x, y pozíció
		this.y = border.x+y*g_field_size;
		this.block_id = -1; //melyik összefüggő blokkba tartozik. -1=egyikbe sem.
		this.unused_paths = 2; //mennyi utat tudna még létrehozni
		this.path = [0,0]; // 0 vagy 1: nincs/van út jobbra / lefele. így azokra csak ő tehet utat, nincs ütközés. -1 akkor lesz, ha mellette/alatta vége a pályának
		if (x == g_dimensions.x-1) {
			this.path[0] = -1;
			this.unused_paths--;
		}
		if (y == g_dimensions.y-1) {
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
class CollisionManager {
	constructor(field_size = 80) {
		this.field_size = field_size; //hányszor hányas kockákra ossza fel a teret
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

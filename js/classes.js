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
		this.collision_block = []; //collisionManager melyik dobozkájában van éppen
		g_app.stage.addChild(this.sprite);
		if (width !== false) {
			this.sprite.width = width;
		}
		if (height !== false) {
			this.sprite.height = height;
		}
	}
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
Wall.list = {}; //obj kell, hátha egyszer remove-oljuk az elemeket. tömbben összekavarodna az id-zés olyankor
Wall.list_id_counter = 0; //új id-ket kapnak a falak, csak növekszik

//TODO: csak tesztelésig
/*var player_hit = new PIXI.Graphics();
g_app.stage.addChild(player_hit);*/

class Player extends Entity{
	constructor(x,y,x_graph,y_graph,id,texture,width,height) {
		super(x,y,x_graph,y_graph,id,texture,width,height);
		this.sprite.anchor.set(0.45,0.5);
		this.sprite.tint = g_tank_colors[id];
		//console.log(id+': '+g_tank_colors[id]);
		
		this.keypress = {
			'left':false,
			'up':false,
			'right':false,
			'down':false
		};
		this.updatePosition();
	}
	updatePosition() {
		if (this.keypress.space)
			this.createBullet();
		
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
		
		let x_w_rounded = x_wannago >= 0 ? Math.ceil(x_wannago) : Math.floor(x_wannago);
		let y_w_rounded = y_wannago >= 0 ? Math.ceil(y_wannago) : Math.floor(y_wannago);
		let colliding = g_collisioner.check_collision_one_to_n(this,Wall,x_w_rounded,y_w_rounded);
		
		if ((x_wannago > 0 && !colliding.right) || (x_wannago < 0 && !colliding.left)) {
			this.sprite.x += x_wannago;
			this.x = this.sprite.x;
		}
		if ((y_wannago > 0 && !colliding.down) || (y_wannago < 0 && !colliding.up)) {
			this.sprite.y += y_wannago;
			this.y = this.sprite.y;
		}
	
		
		
		
	};
	createBullet() {
		Bullet.list[Bullet.list_id_count] = new Bullet(this.x, this.y, this.x_graph, this.y_graph, Bullet.list_count, g_textures.bullet, Bullet.width, Bullet.height);
		Bullet.list[Bullet.list_id_count].setSpriteRotation(this.sprite.rotation);
		
		Bullet.list_id_count ++;
		
		//TODO: csak tesztelésig
		/*player_hit.clear();
		player_hit.moveTo (this.x-13,this.y-13);
		player_hit.beginFill(0xFFFF00);
		player_hit.lineStyle(1, 0xFF0000);
		player_hit.drawRect(this.x-13, this.y-13, 26, 26);
		player_hit.endFill();*/
	};
}
Player.list = []; //statikus osztály-változó
Player.list_count = 0;
//l�ved�k
class Bullet extends Entity{
	constructor(x,y,x_graph,y_graph,id,texture,width,height) {
		super(x,y,x_graph,y_graph,id,texture,width,height,3);
		this.sprite.anchor.set(0.5,0.5);
		this.x_graph = x; //a gr�fban elfoglalt hely
		this.y_graph = y;
		this.hitbox = {
			'width':Math.min(width,height),
			'height':Math.min(width,height)
		};
		this.timer = 100;
		
	};
	setSpriteRotation(asd){
		this.sprite.rotation = asd;
		
	};
	updatePosition(){
		let cosos = Math.cos(this.sprite.rotation)*this.speed;
		let sines =  Math.sin(this.sprite.rotation)*this.speed;
		this.speed_x = cosos;
		this.speed_y = sines;
		this.sprite.x += cosos;
		this.sprite.y += sines;
		this.x = this.sprite.x;
		this.y = this.sprite.y;
		this.timer --;
		console.log(this.timer);
		if (this.timer < 1) {
			Bullet.list[this.id] = null;
			delete Bullet.list[this.id];
			console.log(Bullet.list[this.id]);
		};
		
	};
}
Bullet.list = {}; 
Bullet.list_id_count = 0;
//labirintus egy mez�je
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
	constructor(field_size = 150) {
		this.field_size = field_size; //hányszor hányas kockákra ossza fel a teret
	}
	//megnézi melyik dobozba/dobozokba kell tenni az entity-t
	get_placing_boxes (entity) {
		let results = [];
		let x_start = Math.floor(entity.hitbox.x1/this.field_size);
		let x_end = Math.floor(entity.hitbox.x2/this.field_size);
		let y_start = Math.floor(entity.hitbox.y1/this.field_size);
		let y_end = Math.floor(entity.hitbox.y2/this.field_size);
		for (let i = x_start ; i <= x_end ; i++) {
			for (let j = y_start ; j <= y_end ; j++) {
				results.push([i,j]);
			}
		}
		return results;
	}
	//elhelyezi a kapott entity-t a felosztott táblázatában. több helyre is teheti, ha nem fér pont egybe
	place (entity) {
		let boxes = this.get_placing_boxes (entity);
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
	//osztály kivételekkel pucol mindent. visszatér a kipucolt objektumok tömbjével, ez kell az update funkcióhoz
	clear_except (classtypes = []) {
		let cleared_obj = [];
		for (let i = 0 ; i < CollisionManager.map.length ; i++) {
			if (CollisionManager.map[i] === undefined) {continue;}
			for (let j = 0 ; j < CollisionManager.map[i].length ; j++) {
				if (CollisionManager.map[i][j] === undefined) {continue;}
				for (let key in CollisionManager.map[i][j]) {
					let toremove = true;
					for (let classtype of classtypes) {
						if (CollisionManager.map[i][j][key] instanceof classtype) {
							toremove = false;
						}
					}
					if (toremove) {
						if (CollisionManager.map[i][j][key].collision_block.length > 0) {
							cleared_obj.push(CollisionManager.map[i][j][key]);
							CollisionManager.map[i][j][key].collision_block = [];
						}
						delete (CollisionManager.map[i][j][key]);
					}
				}
			}
		}
		return cleared_obj;
	}
	//frissíti minden objektum blokk-pozícióját ami benne van, kivéve a kivétel-osztályok tagjait
	update_arrays_except (classtypes = []){
		let removed_objs = this.clear_except(classtypes);
		for (let obj of removed_objs) {
			this.place(obj);
		}
	}
	//sima egy az n-hez ütközést ellenőriz, tömbbel tér vissza. (4 irány)
	check_collision_one_to_n (target, c_class, xnext = 0, ynext = 0) {
		let t_width = Math.abs(target.hitbox.x1 - target.hitbox.x2);
		let t_height = Math.abs(target.hitbox.y1 - target.hitbox.y2);
		let collision = {'right':false,'up':false,'left':false,'down':false};
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
					let wy = w * dy_m;
					let hx = h * dx_m;
					if (wy > hx) {
						if (wy > -hx) {
							if (Math.abs(dx) <= w && Math.abs(dy_m) <= h) { //téves ütközés elkerülésére
								collision.up = true;
							}
						} else {
							if (Math.abs(dx_m) <= w && Math.abs(dy) <= h) { //téves ütközés elkerülésére
								collision.right = true;
							}
						}
					} else {
						if (wy > -hx) {
							if (Math.abs(dx_m) <= w && Math.abs(dy) <= h) { //téves ütközés elkerülésére
								collision.left = true;
							}
						} else {
							if (Math.abs(dx) <= w && Math.abs(dy_m) <= h) { //téves ütközés elkerülésére
								collision.down = true;
							}
						}
					}
				}
			}
		}
		return collision;
	}
}
CollisionManager.map = []; //egy mátrix, ami alapján nézi, hogy egyáltalán mi ütközhet mivel

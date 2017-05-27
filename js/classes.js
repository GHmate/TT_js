class Entity {
	constructor(x,y,x_graph,y_graph,id,texture,width=false,height=false,speed = 1.8) {
		this.x = x;
		this.y = y;
		this.id = id;
		this.sprite = new PIXI.Sprite(texture);
		this.sprite.x = this.x;
		this.sprite.y = this.y;
		this.speed = speed;
		app.stage.addChild(this.sprite);
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
		this.hitbox = {
			'width':width,
			'height':height
		};
	}
}
Wall.list = {}; //obj kell, hátha egyszer remove-oljuk az elemeket. tömbben összekavarodna az id-zés olyankor
Wall.list_id_counter = 0; //új id-ket kapnak a falak, csak növekszik

class Player extends Entity{
	constructor(x,y,x_graph,y_graph,id,texture,width,height) {
		super(x,y,x_graph,y_graph,id,texture,width,height);
		this.sprite.anchor.set(0.4,0.5);
		this.x_graph = x; //a gráfban elfoglalt hely
		this.y_graph = y;
		this.hitbox = {
			'width':Math.min(width,height),
			'height':Math.min(width,height)
		};
		this.keypress = {
			'left':false,
			'up':false,
			'right':false,
			'down':false,
		};
	}
	updatePosition() {
		if(this.keypress.right)
			this.sprite.rotation += 0.05 //* delta;
		if(this.keypress.left)
			this.sprite.rotation -= 0.05 //* delta;
		
		
		if(this.keypress.up){
			
			this.sprite.x += Math.cos(this.sprite.rotation)*this.speed;
			this.x += Math.cos(this.sprite.rotation)*this.speed;
			this.sprite.y += Math.sin(this.sprite.rotation)*this.speed;
			this.y += Math.cos(this.sprite.rotation)*this.speed;
		
		}
		
		if(this.keypress.down){
			this.sprite.x -= Math.cos(this.sprite.rotation)*this.speed*0.7;
			this.x -= Math.cos(this.sprite.rotation)*this.speed*0.7;
			this.sprite.y -= Math.sin(this.sprite.rotation)*this.speed*0.7;
			this.y -= Math.cos(this.sprite.rotation)*this.speed*0.7;
		}
	};
}
Player.list = []; //statikus osztály-változó
Player.list_count = 0;
//lövedék
class Bullet extends Entity{
	constructor(x,y,x_graph,y_graph,id,texture,width,height) {
		super(x,y,x_graph,y_graph,id,texture,width,height,speed=10);
		this.sprite.anchor.set(0.5,0.5);
		this.x_graph = x; //a gráfban elfoglalt hely
		this.y_graph = y;
		this.hitbox = {
			'width':Math.min(width,height),
			'height':Math.min(width,height)
		};
		
	};
	updatePosition(){};
}
//labirintus egy mezõje
class Node {
	constructor(x,y) {
		this.x_graph = x; //0 -> n ig a gráfban elfoglalt x, y pozíció
		this.y_graph = y;
		this.x = border.x+x*field_size; //a pályán ténylegesen elfoglalt x, y pozíció
		this.y = border.x+y*field_size;
		this.block_id = -1; //melyik összefüggõ blokkba tartozik. -1=egyikbe sem.
		this.unused_paths = 2; //mennyi utat tudna még létrehozni
		this.path = [0,0]; // 0 vagy 1: nincs/van út jobbra / lefele. így azokra csak õ tehet utat, nincs ütközés. -1 akkor lesz, ha mellette/alatta vége a pályának
		if (x == dimensions.x-1) {
			this.path[0] = -1;
			this.unused_paths--;
		}
		if (y == dimensions.y-1) {
			this.path[1] = -1;
			this.unused_paths--;
		}
		
	}
	//csinál utakat magának
	generate_paths() {
		for (var i = 0 ; i < 2 ; i++) {
			if (this.path[i] == 0 && Math.random() < path_gen_chance) {
				this.path[i] = 1;
				this.unused_paths--;
			}
		}
	}
	//rekurzív funkció: besorolja egy blokkba magát és az összes hozzá kapcsolódó node-ot. visszatér a blokk tõle indult darabszámával
	besorol(actual_block,graph) {
		if (this.block_id !== -1) {
			//ha már be volt sorolva, nem folytatja
			return 0;
		} else {
			this.block_id = actual_block;
			var children_size = 1; //1 mert önmaga is hozzáadódik a blokkhoz.
			//elõször a balra és felette lévõket kérdezzük le
			if (graph[this.x_graph-1] !== undefined && graph[this.x_graph-1][this.y_graph].path[0] == 1) {
				children_size += graph[this.x_graph-1][this.y_graph].besorol(actual_block,graph);
			}
			if (graph[this.x_graph][this.y_graph-1] !== undefined && graph[this.x_graph][this.y_graph-1].path[1] == 1) {
				children_size += graph[this.x_graph][this.y_graph-1].besorol(actual_block,graph);
			}
			//majd a jobbra és alatta lévõket
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
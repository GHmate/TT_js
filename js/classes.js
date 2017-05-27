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
Wall.list = {}; //obj kell, h�tha egyszer remove-oljuk az elemeket. t�mbben �sszekavarodna az id-z�s olyankor
Wall.list_id_counter = 0; //�j id-ket kapnak a falak, csak n�vekszik

class Player extends Entity{
	constructor(x,y,x_graph,y_graph,id,texture,width,height) {
		super(x,y,x_graph,y_graph,id,texture,width,height);
		this.sprite.anchor.set(0.4,0.5);
		this.x_graph = x; //a gr�fban elfoglalt hely
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
Player.list = []; //statikus oszt�ly-v�ltoz�
Player.list_count = 0;
//l�ved�k
class Bullet extends Entity{
	constructor(x,y,x_graph,y_graph,id,texture,width,height) {
		super(x,y,x_graph,y_graph,id,texture,width,height,speed=10);
		this.sprite.anchor.set(0.5,0.5);
		this.x_graph = x; //a gr�fban elfoglalt hely
		this.y_graph = y;
		this.hitbox = {
			'width':Math.min(width,height),
			'height':Math.min(width,height)
		};
		
	};
	updatePosition(){};
}
//labirintus egy mez�je
class Node {
	constructor(x,y) {
		this.x_graph = x; //0 -> n ig a gr�fban elfoglalt x, y poz�ci�
		this.y_graph = y;
		this.x = border.x+x*field_size; //a p�ly�n t�nylegesen elfoglalt x, y poz�ci�
		this.y = border.x+y*field_size;
		this.block_id = -1; //melyik �sszef�gg� blokkba tartozik. -1=egyikbe sem.
		this.unused_paths = 2; //mennyi utat tudna m�g l�trehozni
		this.path = [0,0]; // 0 vagy 1: nincs/van �t jobbra / lefele. �gy azokra csak � tehet utat, nincs �tk�z�s. -1 akkor lesz, ha mellette/alatta v�ge a p�ly�nak
		if (x == dimensions.x-1) {
			this.path[0] = -1;
			this.unused_paths--;
		}
		if (y == dimensions.y-1) {
			this.path[1] = -1;
			this.unused_paths--;
		}
		
	}
	//csin�l utakat mag�nak
	generate_paths() {
		for (var i = 0 ; i < 2 ; i++) {
			if (this.path[i] == 0 && Math.random() < path_gen_chance) {
				this.path[i] = 1;
				this.unused_paths--;
			}
		}
	}
	//rekurz�v funkci�: besorolja egy blokkba mag�t �s az �sszes hozz� kapcsol�d� node-ot. visszat�r a blokk t�le indult darabsz�m�val
	besorol(actual_block,graph) {
		if (this.block_id !== -1) {
			//ha m�r be volt sorolva, nem folytatja
			return 0;
		} else {
			this.block_id = actual_block;
			var children_size = 1; //1 mert �nmaga is hozz�ad�dik a blokkhoz.
			//el�sz�r a balra �s felette l�v�ket k�rdezz�k le
			if (graph[this.x_graph-1] !== undefined && graph[this.x_graph-1][this.y_graph].path[0] == 1) {
				children_size += graph[this.x_graph-1][this.y_graph].besorol(actual_block,graph);
			}
			if (graph[this.x_graph][this.y_graph-1] !== undefined && graph[this.x_graph][this.y_graph-1].path[1] == 1) {
				children_size += graph[this.x_graph][this.y_graph-1].besorol(actual_block,graph);
			}
			//majd a jobbra �s alatta l�v�ket
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
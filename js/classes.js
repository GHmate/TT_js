class Player {
	constructor(x,y,id) {
		this.id = id;
		this.x_orig = x;
		this.y_orig = y;
		this.width = 0;
		this.height = 0;
		this.keypress = {
			'left':false,
			'up':false,
			'right':false,
			'down':false,
		};
	}
	updatePosition() {
		if(this.keypress.right)
			this.x += 10
		if(this.keypress.left)
			this.x -= 10;
		if(this.keypress.down)
			this.y += 10;
		if(this.keypress.up)
			this.y -= 10;
	};
}

//labirintus egy mezõje
class Node {
	constructor(x,y) {
		this.x_orig = x; //0 -> n ig a gráfban elfoglalt x, y pozíció
		this.y_orig = y;
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
			if (graph[this.x_orig-1] !== undefined && graph[this.x_orig-1][this.y_orig].path[0] == 1) {
				children_size += graph[this.x_orig-1][this.y_orig].besorol(actual_block,graph);
			}
			if (graph[this.x_orig][this.y_orig-1] !== undefined && graph[this.x_orig][this.y_orig-1].path[1] == 1) {
				children_size += graph[this.x_orig][this.y_orig-1].besorol(actual_block,graph);
			}
			//majd a jobbra és alatta lévõket
			if (this.path[0] == 1) {
				children_size += graph[this.x_orig+1][this.y_orig].besorol(actual_block,graph);
			}
			if (this.path[1] == 1) {
				children_size += graph[this.x_orig][this.y_orig+1].besorol(actual_block,graph);
			}
			return children_size;
		}
	}
}
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

//labirintus egy mez�je
class Node {
	constructor(x,y) {
		this.x_orig = x; //0 -> n ig a gr�fban elfoglalt x, y poz�ci�
		this.y_orig = y;
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
			if (graph[this.x_orig-1] !== undefined && graph[this.x_orig-1][this.y_orig].path[0] == 1) {
				children_size += graph[this.x_orig-1][this.y_orig].besorol(actual_block,graph);
			}
			if (graph[this.x_orig][this.y_orig-1] !== undefined && graph[this.x_orig][this.y_orig-1].path[1] == 1) {
				children_size += graph[this.x_orig][this.y_orig-1].besorol(actual_block,graph);
			}
			//majd a jobbra �s alatta l�v�ket
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
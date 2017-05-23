
//gener�lunk �s am�g nem tal�lunk megfelel� m�ret� blokkot, �jragener�ljuk a p�ly�t
function generate_map(dimensions) {
	var max_block_num = 0; //legnagyobb tal�lt darabsz�m
	var actual_block = 0; //jelenleg kalkul�land� blokk id
	var selected_block = 0; //eddig v�lasztott blokk id
	do {
		max_block_num = 0; //null�zunk minden gener�l�s el�tt
		actual_block = 0;
		selected_block = 0;
		//console.log('generalas');
		var graph =[]; //2 dimenzi�s m�trix, elemei node-ok
		for (var x = 0; x < dimensions.x; x++) {
			graph[x] = [];
			for (var y = 0; y < dimensions.y; y++) {
				graph[x][y] = new Node(x,y);
				//legener�lunk random utakat
				graph[x][y].generate_paths();
			}
		}
		
		//megn�zz�k az �sszef�gg� blokkokat
		for (var x = 0; x < dimensions.x; x++) {
			for (var y = 0; y < dimensions.y; y++) {
				//rekurz�v funkci�
				result_darab = graph[x][y].besorol(actual_block,graph);
				if (max_block_num < result_darab) {
					max_block_num = result_darab;
					selected_block = actual_block;
				}
				actual_block++;
			}
		}
	} while(max_block_num < player_num*player_distance_fields); //ha a legnagyobb blokk elegend� m�ret�, r�tessz�k a tankokat, ha nem, �jragener�l�s
	return {
		'graph':graph,
		'selected_block':selected_block
	};
}

//lek�rdezi, hogy adott node-ra tehet-e tankot
function free_pos(node) {
	var free = true;
	for (id in Player.list) {
		if (Math.abs(Player.list[id].x_graph - node.x_graph)+Math.abs(Player.list[id].y_graph - node.y_graph) < 4) {
			free = false;
		}
	}
	return free;
}

//draw walls
function create_walls (graph,dimensions,tex_wall,app) {
	for (let x = 0; x < dimensions.x; x++) {
		for (let y = 0; y < dimensions.y; y++) {
			let node = graph[x][y];
			
			for (let dir in node.path) {
				if (node.path[dir] !== 1) {
					
					let wall = {};
					let x_self = border.x+x*field_size;
					let y_self = border.y+y*field_size;
					
					switch (dir) {
						case '0': //jobbra kell a fal
							wall.height = field_size+5;
							wall.width = 5;
							wall.x = x_self+field_size/2;
							wall.y = y_self;
							break;
						case '1': //lefele kell a fal
							wall.height = 5;
							wall.width = field_size+5;
							wall.x = x_self;
							wall.y = y_self+field_size/2
							break;
					}
					Wall.list[Wall.list_id_counter] = new Wall(wall.x,wall.y,x,y,Wall.list_id_counter,textures.wall,wall.width,wall.height);
					Wall.list_id_counter++;
				}
			}
		}
	}
}

//t�mb sorrend kever�s
function shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
}
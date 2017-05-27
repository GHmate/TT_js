/**
 * generálunk és amég nem találunk megfelelő méretű blokkot, újrageneráljuk a pályát
 * 
 * @param obj dimensions, a gráf szélessége és hosszúsága (node-ok száma)
 * @returns obj: {obj: gráf, int: választott blokk azonosítója}
 */
function generate_map(dimensions) {
	var max_block_num = 0; //legnagyobb talált darabszám
	var actual_block = 0; //jelenleg kalkulálandó blokk id
	var selected_block = 0; //eddig választott blokk id
	do {
		max_block_num = 0; //nullázunk minden generálás előtt
		actual_block = 0;
		selected_block = 0;
		//console.log('generalas');
		var graph =[]; //2 dimenziós mátrix, elemei node-ok
		for (var x = 0; x < dimensions.x; x++) {
			graph[x] = [];
			for (var y = 0; y < dimensions.y; y++) {
				graph[x][y] = new Node(x,y);
				//legenerálunk random utakat
				graph[x][y].generate_paths();
			}
		}
		
		//megnézzük az összefüggő blokkokat
		for (var x = 0; x < dimensions.x; x++) {
			for (var y = 0; y < dimensions.y; y++) {
				//rekurzív funkció
				result_darab = graph[x][y].besorol(actual_block,graph);
				if (max_block_num < result_darab) {
					max_block_num = result_darab;
					selected_block = actual_block;
				}
				actual_block++;
			}
		}
	} while(max_block_num < g_player_num*g_player_distance_fields); //ha a legnagyobb blokk elegendő méretű, rátesszük a tankokat, ha nem, újragenerálás
	return {
		'graph':graph,
		'selected_block':selected_block
	};
}

//lekérdezi, hogy adott node-ra tehet-e tankot
function free_pos(node) {
	var free = true;
	for (id in Player.list) {
		if (Math.abs(Player.list[id].x_graph - node.x_graph)+Math.abs(Player.list[id].y_graph - node.y_graph) < g_player_min_distance) {
			free = false;
		}
	}
	return free;
}

//draw walls
function create_walls (graph,dimensions) {
	for (let x = 0; x < dimensions.x; x++) {
		for (let y = 0; y < dimensions.y; y++) {
			let node = graph[x][y];
			
			//fal adatok, amik csak a konstruktorokhoz kellenek
			let wall = {};
			let x_self = border.x+x*g_field_size;
			let y_self = border.y+y*g_field_size;
			let longer_side = g_field_size + g_field_size/10;
			let shorter_side = Math.ceil(g_field_size/10);
			
			//jobb oldali és lenti falak
			for (let dir in node.path) {
				if (node.path[dir] !== 1) {
					switch (dir) {
						case '0': //jobbra kell a fal
							wall.height = longer_side;
							wall.width = shorter_side;
							wall.x = x_self+g_field_size/2;
							wall.y = y_self;
							break;
						case '1': //lefele kell a fal
							wall.height = shorter_side;
							wall.width = longer_side;
							wall.x = x_self;
							wall.y = y_self+g_field_size/2
							break;
					}
					Wall.list[Wall.list_id_counter] = new Wall(wall.x,wall.y,x,y,Wall.list_id_counter,g_textures.wall,wall.width,wall.height);
					g_collisioner.place(Wall.list[Wall.list_id_counter]);
					Wall.list_id_counter++;
				}
			}
			//bal szélére, tetejére plusz falak
			if (x === 0) {
				wall.height = longer_side;
				wall.width = shorter_side;
				wall.x = x_self-g_field_size/2;
				wall.y = y_self;
				Wall.list[Wall.list_id_counter] = new Wall(wall.x,wall.y,x,y,Wall.list_id_counter,g_textures.wall,wall.width,wall.height);
				g_collisioner.place(Wall.list[Wall.list_id_counter]);
				Wall.list_id_counter++;
			}
			if (y === 0) {
				wall.height = shorter_side;
				wall.width = longer_side;
				wall.x = x_self;
				wall.y = y_self-g_field_size/2;
				Wall.list[Wall.list_id_counter] = new Wall(wall.x,wall.y,x,y,Wall.list_id_counter,g_textures.wall,wall.width,wall.height);
				g_collisioner.place(Wall.list[Wall.list_id_counter]);
				Wall.list_id_counter++;
			}
		}
	}
}

//tömb sorrend keverés
function shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
}

//futás megállítása
function die(data) {
	console.log('die:');
	console.log(data);
	throw new Error('run_stopped');
}
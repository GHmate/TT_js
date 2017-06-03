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
				graph[x][y] = new Node({
					'x': x,
					'y': y
				});
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
					//Wall.list[Wall.list_id_counter] = new Wall(wall.x,wall.y,x,y,Wall.list_id_counter,g_textures.wall,wall.width,wall.height);
					Wall.list[Wall.list_id_counter] = new Wall({
						'x': wall.x,
						'y': wall.y,
						'x_graph': x,
						'y_graph': y,
						'id': Wall.list_id_counter,
						'width': wall.width,
						'height': wall.height
					});
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
				Wall.list[Wall.list_id_counter] = new Wall({
						'x': wall.x,
						'y': wall.y,
						'x_graph': x,
						'y_graph': y,
						'id': Wall.list_id_counter,
						'width': wall.width,
						'height': wall.height
					});
				g_collisioner.place(Wall.list[Wall.list_id_counter]);
				Wall.list_id_counter++;
			}
			if (y === 0) {
				wall.height = shorter_side;
				wall.width = longer_side;
				wall.x = x_self;
				wall.y = y_self-g_field_size/2;
				Wall.list[Wall.list_id_counter] = new Wall({
						'x': wall.x,
						'y': wall.y,
						'x_graph': x,
						'y_graph': y,
						'id': Wall.list_id_counter,
						'width': wall.width,
						'height': wall.height
					});
				g_collisioner.place(Wall.list[Wall.list_id_counter]);
				Wall.list_id_counter++;
			}
		}
	}
}

function regenerate_map () { //játék elején vagy egy pálya végén az új pályakezdésért felelő funkció
	
	for (let i = g_app.stage.children.length - 1; i >= 0; i--) {
		g_app.stage.removeChild(g_app.stage.children[i]);
	};
	
	Wall.list = {}; //obj kell, hátha egyszer remove-oljuk az elemeket. tömbben összekavarodna az id-zés olyankor
	Wall.list_id_counter = 0; //új id-ket kapnak a falak, csak növekszik
	Player.list = []; //statikus osztály-változó
	Player.list_count = 0;
	Bullet.list = {}; 
	Bullet.list_id_count = 0;
	CollisionManager.map = []; //egy mátrix, ami alapján nézi, hogy egyáltalán mi ütközhet mivel
	
	Extra.type_list = ['1','2','3'];
	Extra.list = {};
	Extra.list_id_count = 0;
	Extra.creator_timer = 600;
	
	g_collisioner = new CollisionManager({});
	gen_result = generate_map(g_dimensions);
	graph = gen_result.graph;
	selected_block = gen_result.selected_block;

	leteheto_nodes = []; //hova lehet tankot tenni
	for (var x = 0; x < g_dimensions.x; x++) {
		for (var y = 0; y < g_dimensions.y; y++) {
			if (graph[x][y].block_id == selected_block) {
				leteheto_nodes.push([x,y]);
			}
		}
	}

	//legyártjuk a falakat
	create_walls(graph,g_dimensions);

	//legyártjuk a tankokat
	shuffle(g_tank_colors);
	shuffle(leteheto_nodes);
	for (k in leteheto_nodes) {
		var node = graph[leteheto_nodes[k][0]][leteheto_nodes[k][1]];
		//console.log(node);
		if (Player.list_count >= g_player_num) {
			break;
		}
		if (free_pos(node)) {
			//Player.list[Player.list_count] = new Player(node.x,node.y,node.x_graph,node.y_graph,Player.list_count,g_textures.tank,41,26);
			Player.list[Player.list_count] = new Player({
				'x': node.x,
				'y': node.y,
				'x_graph': node.x_graph,
				'y_graph': node.y_graph,
				'id': Player.list_count
			});
			Player.list_count++;
		}
	}

	if (Player.list_count < g_player_num) {
		alert('baj van, nem elég nagy a pálya!');
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
//extra spawn
function createExtra(){
	let koordinata= leteheto_nodes[getRandomInt(0,leteheto_nodes.length-1)];
	let customnode = graph[koordinata[0]][koordinata[1]];
	//Extra.list[Extra.list_id_count] = new Extra(customnode.x, customnode.y, customnode.x_graph, customnode.y_graph, Extra.list_id_count, g_textures.extra, 20, 20, Extra.type_list[getRandomInt(0,Extra.type_list.length-1)]);
	Extra.list[Extra.list_id_count] = new Extra({
		'x': customnode.x,
		'y': customnode.y,
		'x_graph': customnode.x_graph,
		'y_graph': customnode.y_graph,
		'id': Extra.list_id_count,
		'type': Extra.type_list[getRandomInt(0,Extra.type_list.length-1)]
	});
//console.log(Extra.list[Extra.list_id_count].type);
	Extra.list_id_count ++;
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//visszateszi a szöget 0 és 2pi közé, biztos ami biztos
function normalize_rad(rad) {
	while (rad < 0) {
		rad += 2*Math.PI;
	}
	while (rad > 2*Math.PI) {
		rad -= 2*Math.PI;
	}
	return rad;
}

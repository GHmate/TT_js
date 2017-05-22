
//generálunk és amég nem találunk megfelelõ méretû blokkot, újrageneráljuk a pályát
function generate_map(dimensions) {
	var max_block_num = 0; //legnagyobb talált darabszám
	var actual_block = 0; //jelenleg kalkulálandó blokk id
	var selected_block = 0; //eddig választott blokk id
	do {
		max_block_num = 0; //nullázunk minden generálás elõtt
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
		
		//megnézzük az összefüggõ blokkokat
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
	} while(max_block_num < player_num*player_distance_fields); //ha a legnagyobb blokk elegendõ méretû, rátesszük a tankokat, ha nem, újragenerálás
	return {
		'graph':graph,
		'selected_block':selected_block
	};
}

//lekérdezi, hogy adott node-ra tehet-e tankot
function free_pos(node) {
	var free = true;
	for (id in players) {
		if (Math.abs(players[id].x_orig - node.x_orig)+Math.abs(players[id].y_orig - node.y_orig) < 4) {
			free = false;
		}
	}
	return free;
}

//draw walls
function draw_walls (graph,dimensions,tex_wall,app) {

	//TODO: kiszervezni wall osztályba, és annak lenne egy draw metódusa, ami ezt csinálja. a szélén lehet
	//hosszú fal is, amég azt eltároljuk nála, hogy mekkora, és azalapján figyeli az ütközést.

	/*var wall = new PIXI.Sprite(tex_wall);
	wall.anchor.set(0,0.5);
	
	wall.height = 5;
	wall.width = dimensions.x*field_size;
	wall.x = border.x-field_size/2;
	wall.y = border.y-field_size/2;
			
	app.stage.addChild(wall);
	
	var wall = new PIXI.Sprite(tex_wall);
	wall.anchor.set(0.5,0);
	
	wall.height = dimensions.x*field_size;
	wall.width = 5;
	wall.x = border.x-field_size/2;
	wall.y = border.y-field_size/2;
			
	app.stage.addChild(wall);*/

	for (var x = 0; x < dimensions.x; x++) {
		for (var y = 0; y < dimensions.y; y++) {
			var node = graph[x][y];
			
			for (var dir in node.path) {
				if (node.path[dir] !== 1) {
					
					var wall = new PIXI.Sprite(tex_wall);
					// center the anchor point
					wall.anchor.set(0.5,0.5);
					
					var x_self = border.x+x*field_size;
					var y_self = border.y+y*field_size;
					
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
					app.stage.addChild(wall);
					
				}
			}
			
		}
	}
	//app.stage.addChild(lines);
}

//tömb sorrend keverés
function shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
}
//változók kezdeti létrehozása
var window_sizes = {'x':800,'y':600};
var field_size = 37;
var border = {'x':30,'y':30}; //pálya ennyivel beljebb kezdõdjön a saroktól
var dimensions = {'x': 20,'y': 15}
var players = {};
var player_num = 3;
var tank_colors = ['4ec0ff','7ec500','760000'];
var player_min_distance = 4; //milyen távolságra lehetnek playerek
var player_distance_fields = 25; //mennyi blokkot foglal max egy player emiatt
var path_gen_chance = 0.55;


var gen_result = generate_map(dimensions);
var graph = gen_result.graph;
var selected_block = gen_result.selected_block;

var leteheto_nodes = []; //hova lehet tankot tenni
for (var x = 0; x < dimensions.x; x++) {
	for (var y = 0; y < dimensions.y; y++) {
		if (graph[x][y].block_id == selected_block) {
			leteheto_nodes.push([x,y]);
		}
	}
}
shuffle(leteheto_nodes);
placed_player_count = 0;
for (k in leteheto_nodes) {
	var node = graph[leteheto_nodes[k][0]][leteheto_nodes[k][1]];
	//console.log(node);
	if (placed_player_count >= player_num) {
		break;
	}
	if (free_pos(node)) {
		players[placed_player_count] = new Player(node.x_orig,node.y_orig,placed_player_count);
		placed_player_count++;
	}
}
if (placed_player_count < player_num) {
	alert('baj van, nem elég nagy a pálya!');
}

//mozgatás
document.onkeydown = function(event){
	if(event.keyCode === 37) //balra
		players[0].keypress.left = true;
	else if(event.keyCode === 38) //fel
		players[0].keypress.up = true;
	else if(event.keyCode === 39) //jobbra
		players[0].keypress.right = true;
	else if(event.keyCode === 40) //le
		players[0].keypress.down = true;
}

document.onkeyup = function(event){
	if(event.keyCode === 37) //balra
		players[0].keypress.left = false;
	else if(event.keyCode === 38) //fel
		players[0].keypress.up = false;
	else if(event.keyCode === 39) //jobbra
		players[0].keypress.right = false;
	else if(event.keyCode === 40) //le
		players[0].keypress.down = false;
}

var app = new PIXI.Application(window_sizes.x, window_sizes.y, { backgroundColor: 0xdddddd });
document.body.appendChild(app.view);
// Scale mode for all textures, will retain pixelation
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

var tex_wall = PIXI.Texture.fromImage('images/wall.png');
var tex_tank = PIXI.Texture.fromImage('images/tank.png');


draw_walls(graph,dimensions,tex_wall,app);

//minden frame-n. számokat delta-val szorozva alacsony fps-en is ugyanakkora sebességet kapunk, mint 60-on.
app.ticker.add(function(delta) {
    /*for (var key in players) {
		players[key].draw();
	}*/
});

/*
//app.stage.addChild(circles);
	
	for (id in players) {
		var x = border.x+players[id].x_orig*field_size;
		var y = border.y+players[id].y_orig*field_size;
		lines.beginFill('0x'+tank_colors[id], 1);
		lines.drawCircle(x, y, 7);
		lines.endFill();
	}
	
*/





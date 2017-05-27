
var g_collisioner = new CollisionManager();
var gen_result = generate_map(g_dimensions);
var graph = gen_result.graph;
var selected_block = gen_result.selected_block;

var leteheto_nodes = []; //hova lehet tankot tenni
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
		Player.list[Player.list_count] = new Player(node.x,node.y,node.x_graph,node.y_graph,Player.list_count,g_textures.tank,41,26);
		g_collisioner.place(Player.list[Player.list_count]);
		Player.list_count++;
	}
}

if (Player.list_count < g_player_num) {
	alert('baj van, nem elég nagy a pálya!');
}

//mozgatás
document.onkeydown = function(event){
	if(event.keyCode === 37) //balra
		Player.list[0].keypress.left = true;
	else if(event.keyCode === 38) //fel
		Player.list[0].keypress.up = true;
	else if(event.keyCode === 39) //jobbra
		Player.list[0].keypress.right = true;
	else if(event.keyCode === 40) //le
		Player.list[0].keypress.down = true;
	else if(event.keyCode === 32) //space
		Player.list[0].createBullet();
}

document.onkeyup = function(event){
	if(event.keyCode === 37) //balra
		Player.list[0].keypress.left = false;
	else if(event.keyCode === 38) //fel
		Player.list[0].keypress.up = false;
	else if(event.keyCode === 39) //jobbra
		Player.list[0].keypress.right = false;
	else if(event.keyCode === 40) //le
		Player.list[0].keypress.down = false;
	
		
}

//minden frame-n. számokat delta-val szorozva alacsony fps-en is ugyanakkora sebességet kapunk, mint 60-on.
g_app.ticker.add(function(delta) {

	Player.list[0].updatePosition();
	console.log(Bullet.list);
	for (let n in Bullet.list) {
		console.log(n);
		Bullet.list[n].updatePosition();
		
		
	};
	
	//oldal resize
	
	let block_width = jQuery("#game_container").width();
	let block_height = jQuery("#game_container").height();
	
	
	g_site_orig_width = block_width//window.innerWidth-103;
	g_site_orig_height = g_site_orig_width*WRATIO;
	if (g_site_orig_height > block_height) {
		g_site_orig_height = block_height;
		g_site_orig_width = g_site_orig_height/WRATIO;
	}
	g_app.renderer.view.style.width = g_site_orig_width;
	g_app.renderer.view.style.height = g_site_orig_height;

	g_collisioner.update_arrays_except([Wall]);
	//console.log(Player.list[0].collision_block);

});
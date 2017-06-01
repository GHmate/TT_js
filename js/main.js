
//csak deklaráljuk a globál dolgokat
var g_collisioner;
var gen_result;
var graph;
var selected_block;

var leteheto_nodes = []; //hova lehet tankot tenni

regenerate_map();

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
	else if(event.keyCode === 32) { //space
			if (Player.list[0].enableshoot === true) {
				if (Player.list[0].can_shoot){Player.list[0].createBullet()};
				Player.list[0].enableshoot = false;
			}
		}
};

document.onkeyup = function(event){
	if(event.keyCode === 37) //balra
		Player.list[0].keypress.left = false;
	else if(event.keyCode === 38) //fel
		Player.list[0].keypress.up = false;
	else if(event.keyCode === 39) //jobbra
		Player.list[0].keypress.right = false;
	else if(event.keyCode === 40) //le
		Player.list[0].keypress.down = false;
	else if(event.keyCode === 32) { //space
			Player.list[0].enableshoot = true;
		}
	
};

//minden frame-n. számokat delta-val szorozva alacsony fps-en is ugyanakkora sebességet kapunk, mint 60-on.
g_app.ticker.add(function(delta) {
	for (let n in Player.list) {
		if (Player.list[n] !== null) { //mert a tömbben benen marad az index
			Player.list[n].updatePosition();
		}
	}
	for (let n in Bullet.list) {
		Bullet.list[n].updatePosition();
	};
	//extra készítés
	Extra.creator_timer --;
	if(Extra.creator_timer < 1){
		createExtra();
		Extra.creator_timer = 600;
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

	g_collisioner.update_arrays();
	//console.log(Player.list[0].collision_block);
});

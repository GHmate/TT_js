//ide szedek ki mindent amit a játék legelején kell beállítani

//size things
var g_dimensions = {'x': 20,'y': 13};

const WRATIO = 0.6666; //magasság aránya a szélességhez
var g_site_orig_width = 1300; //ebben a méretben fog futni az app, és a végeredmény felbontást átméretezgetéssel oldom meg
var g_site_orig_height = g_site_orig_width*WRATIO;

var g_window_size = {'x':g_site_orig_width,'y':g_site_orig_height}; 
var g_field_size = (g_site_orig_width)/(g_dimensions.x+1); //mezők mérete. ez lesz a mérvadó adat minden méretezésnél. ha változik ez alapján frissül minden
var border = {'x':g_field_size,'y':g_field_size}; //falak ennyivel beljebb kezdődjenek a saroktól

//game things
var g_player_num = 2;
var g_playerdata = {'tanks': g_player_num, 'scores':[]}; //játékosok (és nem tankok) adatai
for (let i=0 ; i<g_player_num ; i++) {
	g_playerdata['scores'][i] = 0;
}
var g_tank_colors = ['0x333333','0x999999','0xffffff','0xff4d4d','0xffa64d','0xffff4d','0x79ff4d','0x4dffa6','0x4dd2ff','0x4d4dff','0xd24dff','0xff4da6'];
var g_player_min_distance = 4; //milyen távolságra lehetnek playerek
var g_player_distance_fields = 25; //maximum mennyi node-ot foglal egy player a minimális táv miatt
var g_path_gen_chance = 0.55; //útvonal generálási esély. célszerű 0.4 és 0.7 között tartani.

//pixi setup
var g_app = new PIXI.Application(g_window_size.x, g_window_size.y, { backgroundColor: 0xdddddd });
jQuery("#game_container").append(g_app.view);
//g_app.renderer = PIXI.autoDetectRenderer(320, 480, null, false, true);
//g_app.renderer.antialias = false;

// Scale mode for all textures, will retain pixelation
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;

var g_textures = { //textúrákat egyszer kell csak betölteni
	'wall':PIXI.Texture.fromImage('images/wall.png'),
	'tank':PIXI.Texture.fromImage('images/tank_white.png'),
	'bullet':PIXI.Texture.fromImage('images/bullet.png'), //TODO: változtasd meg
	'extra':PIXI.Texture.fromImage('images/tank_white.png') //TODO: változtasd meg
};
g_textures.tank.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
//ide szedek ki mindent amit a játék legelején kell beállítani

//size things
var g_dimensions = {'x': 20,'y': 13}

const WRATIO = 0.6666; //magasság aránya a szélességhez
var g_site_orig_width = 1300; //ebben a méretben fog futni az app, és a végeredmény felbontást átméretezgetéssel oldom meg
var g_site_orig_height = g_site_orig_width*WRATIO;

var g_window_size = {'x':g_site_orig_width,'y':g_site_orig_height}; 
var g_field_size = (g_site_orig_width)/(g_dimensions.x+1); //mezők mérete. ez lesz a mérvadó adat minden méretezésnél. ha változik ez alapján frissül minden
var border = {'x':g_field_size,'y':g_field_size}; //falak ennyivel beljebb kezdődjenek a saroktól

//game things
var g_player_num = 3;
//var g_tank_colors = ['4ec0ff','7ec500','760000'];
var g_player_min_distance = 4; //milyen távolságra lehetnek playerek
var g_player_distance_fields = 25; //maximum mennyi node-ot foglal egy player a minimális táv miatt
var g_path_gen_chance = 0.55; //útvonal generálási esély. célszerű 0.4 és 0.7 között tartani.

//pixi setup
var g_app = new PIXI.Application(g_window_size.x, g_window_size.y, { backgroundColor: 0xdddddd });
//g_app.renderer = PIXI.autoDetectRenderer(320, 480, null, false, true);
g_app.renderer.antialias = false;
document.body.appendChild(g_app.view);
// Scale mode for all textures, will retain pixelation
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;

var g_textures = { //textúrákat egyszer kell csak betölteni
	'wall':PIXI.Texture.fromImage('images/wall.png'),
	'tank':PIXI.Texture.fromImage('images/tank_41_26_alpha.png')
};
g_textures.tank.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
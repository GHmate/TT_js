//ide szedek ki mindent amit a játék legelején kell beállítani

//változók kezdeti létrehozása
var dimensions = {'x': 20,'y': 13}
var window_sizes = {'x':window.innerWidth-16,'y':window.innerHeight-16};
var field_size = (window.innerWidth-16)/(dimensions.x+2);
var border = {'x':field_size*1.5,'y':field_size*1.5}; //pálya ennyivel beljebb kezdõdjön a saroktól
var player_num = 3;
var tank_colors = ['4ec0ff','7ec500','760000'];
var player_min_distance = 4; //milyen távolságra lehetnek playerek
var player_distance_fields = 25; //mennyi blokkot foglal max egy player emiatt
var path_gen_chance = 0.55;

var app = new PIXI.Application(window_sizes.x, window_sizes.y, { backgroundColor: 0xdddddd });
document.body.appendChild(app.view);
// Scale mode for all textures, will retain pixelation
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

var textures = {
	'wall':PIXI.Texture.fromImage('images/wall.png'),
	'tank':PIXI.Texture.fromImage('images/tank.png')
};
textures.tank.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR; //ezek amúgy mûkszenek?
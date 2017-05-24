//ide szedek ki mindent amit a j�t�k legelej�n kell be�ll�tani

//size things
var dimensions = {'x': 20,'y': 13}

const WRATIO = 0.6666;
var site_orig_width = 1300; //ebben a m�retben fog futni az app, �s a v�geredm�ny felbont�st �tm�retezget�ssel oldom meg
var site_orig_height = site_orig_width*WRATIO;

var window_size = {'x':site_orig_width,'y':site_orig_height}; 
var field_size = (site_orig_width)/(dimensions.x+1); //mez�k m�rete. ez lesz a m�rvad� adat minden m�retez�sn�l. ha v�ltozik ez alapj�n friss�l minden
var border = {'x':field_size,'y':field_size}; //falak ennyivel beljebb kezd�djenek a sarokt�l

//game things
var player_num = 3;
var tank_colors = ['4ec0ff','7ec500','760000'];
var player_min_distance = 4; //milyen t�vols�gra lehetnek playerek
var player_distance_fields = 25; //mennyi node-ot foglal max egy player emiatt
var path_gen_chance = 0.55; //�tvonal gener�l�si es�ly. c�lszer� 0.4 �s 0.7 k�z�tt tartani.

//pixi setup
var app = new PIXI.Application(window_size.x, window_size.y, { backgroundColor: 0xdddddd });
document.body.appendChild(app.view);
// Scale mode for all textures, will retain pixelation
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

var textures = {
	'wall':PIXI.Texture.fromImage('images/wall.png'),
	'tank':PIXI.Texture.fromImage('images/tank_35.png')
};
//textures.tank.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR; //ezek am�gy m�kszenek?
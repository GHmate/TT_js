const WRATIO = 0.6666; //magasság aránya a szélességhez
g_site_orig_width = 1300; //ebben a méretben fog futni az app, és a végeredmény felbontást átméretezgetéssel oldom meg
g_site_orig_height = g_site_orig_width*WRATIO;

g_window_size = {'x':g_site_orig_width,'y':g_site_orig_height}; 

g_tank_colors = ['0x333333','0x999999','0xffffff','0xff4d4d','0xffa64d','0xffff4d','0x79ff4d','0x4dffa6','0x4dd2ff','0x4d4dff','0xd24dff','0xff4da6'];

//tesztelős cuccok
g_ipol_on = true;
g_ghost = false;
function t_ipol(data) {
	g_ipol_on = data;
}
function t_ghost(data) {
	if (data) {
		if (g_ghost === false) {
			ghosttank = new PIXI.Sprite(g_textures.tank);//teszteléshez
			ghosttank.anchor.set(0.45,0.5);
			g_app.stage.addChild(ghosttank);
		}
		g_ghost = true;
	} else {
		if (g_ghost === true) {
			g_app.stage.removeChild(ghosttank);
		}
		g_ghost = false;
	}
}
//timing
g_timing = { //amennyi a szám, annyi tik/sec (vagy fps)
	'input_sending': 20
};

//pixi setup
g_app = new PIXI.Application(g_window_size.x, g_window_size.y, { backgroundColor: 0xdddddd });
jQuery("#game_container").append(g_app.view);
//g_app.renderer = PIXI.autoDetectRenderer(320, 480, null, false, true);
//g_app.renderer.antialias = false;

// Scale mode for all textures, will retain pixelation
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;

g_textures = { //textúrákat egyszer kell csak betölteni
	'wall':PIXI.Texture.fromImage('images/wall.png'),
	'tank':PIXI.Texture.fromImage('images/tank_white.png'),
	'bullet':PIXI.Texture.fromImage('images/bullet.png'), //TODO: változtasd meg
	'extra':PIXI.Texture.fromImage('images/tank_white.png') //TODO: változtasd meg
};
g_textures.tank.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;

g_self_data = {
	'shoot_button_up': true,
	'id': 0,
	'latency_check': false,
	'latency_counter': 0,
	'latency': 0,
	'tiks_after_input_sent': 0
};

focus_circle_data = {
	'phase': -1,
	'countdown': 0
};

//spritesheets
PIXI.loader
    .add('images/spritesheets/focus_circle.json')
    .load(onAssetsLoaded);

function onAssetsLoaded()
{
    var frames = [];
    for (var i = 0; i < 29; i++) {
        frames.push(PIXI.Texture.fromFrame('circle_frame_' + i + '.png'));
    }
    focus_circle = new PIXI.extras.AnimatedSprite(frames);
    focus_circle.anchor.set(0.5);
	
	if (Tank.list !== undefined && Tank.list[g_self_data.id] !== undefined) { //TODO: ez a pár sor csak addig kell, amég betöltéskor egyből bedobja a tankot
		start_circle_focus({'x': Tank.list[g_self_data.id].x, 'y': Tank.list[g_self_data.id].y});
	}
}

//socket dolgai
socket = io();
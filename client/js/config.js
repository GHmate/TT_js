const WRATIO = 0.6666; //magasság aránya a szélességhez
g_site_orig_width = 1300; //ebben a méretben fog futni az app, és a végeredmény felbontást átméretezgetéssel oldom meg
g_site_orig_height = g_site_orig_width * WRATIO;

g_window_size = {'x': g_site_orig_width, 'y': g_site_orig_height};

g_tank_colors = ['0x333333', '0x999999', '0xffffff', '0xff4d4d', '0xffa64d', '0xffff4d', '0x79ff4d', '0x4dffa6', '0x4dd2ff', '0x4d4dff', '0xd24dff', '0xff4da6'];
vue_app.colors = [];
for (let color of g_tank_colors) {
    let trans_color = color.replace('0x', '#');
    vue_app.colors.push(trans_color);
}

//tesztelős cuccok
g_ghost = false;
// call ghost in console: t_ghost(true);

function t_ghost(data) {
    if (data) {
        if (g_ghost === false) {
            ghosttank = new PIXI.Sprite(g_textures.tank);//teszteléshez
            ghosttank.anchor.set(0.45, 0.5);
            g_pixi_containers.game_container.addChild(ghosttank);
            
        }
        g_ghost = true;
    } else {
        if (g_ghost === true) {
            g_pixi_containers.game_container.removeChild(ghosttank);
        }
        g_ghost = false;
    }
}
//timing
g_timing = {//amennyi a szám, annyi tik/sec (vagy fps)
    'input_sending': 20,
};

//pixi setup
g_app = new PIXI.Application(g_window_size.x, g_window_size.y, {backgroundColor: 0xdddddd});
document.querySelector('#game_container').append(g_app.view);

//g_app.renderer = PIXI.autoDetectRenderer(320, 480, null, false, true);
//g_app.renderer.antialias = false;

// az első szám a z-index, minél nagyobb, annál feljebb van a réteg.
var g_pixi_layers = {
    'effect_0': new PIXI.display.Group(0, false),
    'effect_10': new PIXI.display.Group(10, false)
};
g_app.stage = new PIXI.display.Stage();
g_app.stage.group.enableSort = true;
g_app.stage.addChild(new PIXI.display.Layer(g_pixi_layers.effect_0));
g_app.stage.addChild(new PIXI.display.Layer(g_pixi_layers.effect_10));

g_pixi_containers = {
    'game_container': new PIXI.Container()
};
g_app.stage.addChild(g_pixi_containers.game_container);

// Scale mode for all textures, will retain pixelation
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;

g_textures = {//textúrákat egyszer kell csak betölteni
    'wall': PIXI.Texture.fromImage('images/wall.png'),
    'tank': PIXI.Texture.fromImage('images/tank_white.png'),
    'bullet': PIXI.Texture.fromImage('images/bullet.png'),
    'plus1': PIXI.Texture.fromImage('images/p1.png'),
    'minus1': PIXI.Texture.fromImage('images/m1.png'),
    'redzone': PIXI.Texture.fromImage('images/redzone.png'),
    'fog': PIXI.Texture.fromImage('images/fog.png'),
    'extras': {
        'nu': PIXI.Texture.fromImage('images/ex_boom.png'),
        'fr': PIXI.Texture.fromImage('images/ex_frag.png'),
        'gh': PIXI.Texture.fromImage('images/ex_ghost.png'),
        'be': PIXI.Texture.fromImage('images/ex_beam.png'),
        'bl': PIXI.Texture.fromImage('images/ex_blade.png')
    }
};
g_textures.tank.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;

g_self_data = {
    'shoot_button_up': true,
    'id': 0,
    'latency_check': false,
    'latency_counter': 0,
    'latency': 0,
    'tiks_after_input_sent': 0,
    'actual_rail_pos': {'id': 0, 'pc': 0},
    'display_name': 'unnamed',
    'missed_packets': 0 //a saját fps alapján számolódik. egy tikben megmondja, hogy mennyi tikkel több futott a szerveren
};

g_world_scores = [];
vue_app.highscores = g_world_scores;

focus_circle_data = {
    'phase': -1,
    'countdown': 0
};
g_redzone = false;
g_redzone_mask = false;
g_redzone_pos = {'x': 0, 'y': 0, 'xend': g_site_orig_width, 'yend': g_site_orig_height};
g_redzone_target = false;

//spritesheets
PIXI.loader
    .add('images/spritesheets/focus_circle.json')
    .add('images/spritesheets/blade.json')
    .load(onAssetsLoaded);
focus_circle = undefined;

g_animation_frames = {
    'focus_circle': [],
    'tank_blade': []
};

function onAssetsLoaded()
{
    let sheet = PIXI.loader.resources["images/spritesheets/focus_circle.json"].spritesheet;
    for (let key in sheet.textures) {
        g_animation_frames['focus_circle'].push(PIXI.Texture.fromFrame(key));
    }
    
    
    sheet = PIXI.loader.resources["images/spritesheets/blade.json"].spritesheet;
    for (let key in sheet.textures) {
        g_animation_frames['tank_blade'].push(PIXI.Texture.fromFrame(key));
    }

    focus_circle = new PIXI.extras.AnimatedSprite(g_animation_frames['focus_circle']);
    focus_circle.anchor.set(0.5);

    if (Tank.list !== undefined && Tank.list[g_self_data.id] !== undefined) { //TODO: ez a pár sor csak addig kell, amég betöltéskor egyből bedobja a tankot
        start_circle_focus({'x': Tank.list[g_self_data.id].x, 'y': Tank.list[g_self_data.id].y});
    }
}

//socket dolgai
socket = io();

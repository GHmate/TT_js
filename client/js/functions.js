//tömb sorrend keverés
function shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
}
//futás megállítása
function die(data) {
    console.log('die:');
    console.log(data);
    throw new Error('run_stopped');
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//visszateszi a szöget 0 és 2pi közé, biztos ami biztos
function normalize_rad(rad) {
    while (rad < 0) {
        rad += 2 * Math.PI;
    }
    while (rad > 2 * Math.PI) {
        rad -= 2 * Math.PI;
    }
    return rad;
}

function clear_local_map() {
    Wall.list = {};
    Tank.list = {};
    Bullet.list = {};
    Extra.list = {};
    for (let i = g_pixi_containers.game_container.children.length - 1; i >= 0; i--) {
        g_pixi_containers.game_container.removeChild(g_pixi_containers.game_container.children[i]);
    };
}

function draw_blade (tank) {
    tank_blade = new PIXI.extras.AnimatedSprite(g_animation_frames['tank_blade']);
    tank_blade.anchor.set(-0.17,0.5);
    tank_blade.x = tank.x;
    tank_blade.y = tank.y;
    tank_blade.rotation = tank.sprite.rotation;
    tank.active_blade = tank_blade;
    tank_blade.animationSpeed = 1;
    tank_blade.loop = false;
    tank_blade.play();
    g_pixi_containers.game_container.addChild(tank_blade);
}

function start_circle_focus(data) {
    focus_circle.x = data.x;
    focus_circle.y = data.y;
    focus_circle.animationSpeed = 1;
    focus_circle.loop = false;
    focus_circle.play();
    g_pixi_containers.game_container.addChild(focus_circle);
    focus_circle_data.phase = 0;
    focus_circle_data.countdown = focus_circle.totalFrames;
}

function circle_focus_steps() {
    focus_circle.rotation += 0.02;
    switch (focus_circle_data.phase) {
        case 0:
            focus_circle_data.countdown--;
            if (focus_circle_data.countdown < 1) {
                focus_circle.gotoAndStop(focus_circle.totalFrames - 1);
                focus_circle_data.phase = 1;
                setTimeout(function () {
                    focus_circle_data.phase = 2;
                }, 1000);
            }
            break;
        case 2:
            let nextframe = focus_circle.currentFrame - 1;
            if (nextframe < 0) {
                focus_circle_data.phase = -1;
                g_pixi_containers.game_container.removeChild(focus_circle);
            } else {
                focus_circle.gotoAndStop(nextframe);
            }
            break;
    }
}

function menu_join_world(world_id, name) {
    let data = {'w_id': world_id};
    socket.emit('request_modify_user_data', {'display_name': name});
    socket.emit('request_world_join', data);
    jQuery('#c_menu').css('display', 'none');
    jQuery('#c_game').css('display', 'flex');
}

function update_world_scores(scores) { //{id, name, score}
    g_world_scores = [];
    let pos = 1;
    let self_showed = false;
    for (let score of scores) {
        let pos_s = pos + "";
        while (pos_s.length < 2) {
            pos_s = "0" + pos_s
        }
        ;
        let name = (score.name !== '' ? score.name : 'unnamed');
        if (name.length > 8) {
            name = name.substring(0, 6) + '...';
        }
        let b_color = '';
        if (score.id == g_self_data.id) {
            self_showed = true;
            b_color = '#feffe9';
        }
        g_world_scores.push({'position': pos_s, 'name': name, 'score': score.score, 'back_color': b_color});
        pos++;
        if (pos == 12) {
            if (!self_showed) {
                for (let i = pos - 1; i < scores.length; i++) {
                    if (scores[i].id == g_self_data.id) {
                        let name2 = (scores[i].name !== '' ? scores[i].name : 'unnamed');
                        if (name2.length > 8) {
                            name2 = name2.substring(0, 6) + '...';
                        }
                        g_world_scores[10] = {'position': i + 1, 'name': name2, 'score': scores[i].score, 'back_color': '#ffbfbf'};
                    }
                }
            }
            break;
        }
    }
    vue_app.highscores = g_world_scores;
}

function set_ipol_redzone(to_data) {
    if (g_redzone_target !== false) {
        g_redzone_pos = to_data;
    }
    g_redzone_target = to_data;
    g_redzone_target.speedx = Math.abs(g_redzone_pos.x - to_data.x) / 3;
    g_redzone_target.speedy = Math.abs(g_redzone_pos.y - to_data.y) / 3;
    g_redzone_target.speedx2 = Math.abs(g_redzone_pos.xend - to_data.xend) / 3;
    g_redzone_target.speedy2 = Math.abs(g_redzone_pos.yend - to_data.yend) / 3;
}

function ipol_redzone() {
    if (g_redzone_target === false) {
        return;
    }
    draw_redzone(g_redzone_pos);
    g_redzone_pos.x += g_redzone_target.speedx;
    g_redzone_pos.y += g_redzone_target.speedy;
    g_redzone_pos.xend -= g_redzone_target.speedx2;
    g_redzone_pos.yend -= g_redzone_target.speedy2;
}

function draw_redzone(pos = false, del = false) {
    if (del) {
        g_pixi_containers.game_container.removeChild(g_redzone);
        g_pixi_containers.game_container.removeChild(g_redzone_mask);
        g_redzone = false;
        g_redzone_mask = false;
        return;
    }
    if (g_redzone === false) {
        g_redzone = new PIXI.extras.TilingSprite(g_textures.redzone, 1400, 900);
        g_redzone.x = g_redzone.y = -10;
        g_redzone.alpha = 0.5;
        g_pixi_containers.game_container.addChild(g_redzone);
    }
    if (pos !== false) {
        if (g_redzone_mask === false) {
            g_redzone_mask = new PIXI.Graphics();
            g_pixi_containers.game_container.addChild(g_redzone_mask);
            g_redzone_mask.lineStyle(0);
            g_redzone.mask = g_redzone_mask;
        }
        //pixiben nincs inverz maszk, így 4 külön téglalappal kell megoldanom a maszkolást.
        g_redzone_mask.clear();
        g_redzone_mask.beginFill(0x000000, 1);
        g_redzone_mask.drawRect(0, 0, pos.x, 900); //bal oldali
        g_redzone_mask.drawRect(pos.xend, 0, 1400, 900); //jobb oldali
        g_redzone_mask.drawRect(pos.x, 0, pos.xend - pos.x, pos.y); //felső
        g_redzone_mask.drawRect(pos.x, pos.yend, pos.xend - pos.x, 900); //alsó
        g_redzone_mask.endFill();
    }
}

function draw_tank_explosion(tank) {
    for (let n = 0; n < 20; n++) {
        Particle.list[Particle.list_counter] = new Particle({
            'x': tank.x,
            'y': tank.y,
            'id': Particle.list_counter,
            'texture': g_textures.fog,
            'rotation': Math.random() * 2 * Math.PI,
            'speed': 0 + Math.random(),
            'timer': 10 + getRandomInt(0, 20),
            'alpha': 0.6,
            'e_layer': '0',
        });
        Particle.list_counter++;
    }
}
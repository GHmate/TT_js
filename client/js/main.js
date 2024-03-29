clear_local_map(); //inicializálunk, ürítünk mindent induláskor

//mozgatás
document.onkeydown = function (event) {
    let tank_control = '';
    if (event.code === 'ArrowLeft') {
        tank_control = 'left';
    } else if (event.code === 'ArrowUp') {
        tank_control = 'up';
    } else if (event.code === 'ArrowRight') {
        tank_control = 'right';
    } else if (event.code === 'ArrowDown') {
        tank_control = 'down';
    } else if (event.code === 'KeyV' || event.code === 'KeyW') {
        if (g_self_data.shoot_button_up === true) {
            if (Tank.list[g_self_data.id] !== undefined) {
                //Tank.list[g_self_data.id].keyevent(tank_control,false);
                g_self_data.shoot_button_up = false;
                socket.emit('keyPress', {inputId: 'shoot', state: true, 'turning': Tank.list[g_self_data.id].keypress});
                tank_control = 'shoot';
            }
        }
    } else if (event.code === 'KeyT') {
        //no testing yet
    }
    if (Tank.list !== undefined) {
        if (tank_control !== '' && Tank.list[g_self_data.id] !== undefined) {
            Tank.list[g_self_data.id].keyevent(tank_control, true);
        }
    }
};

document.onkeyup = function (event) {
    let tank_control = '';
    if (event.code === 'ArrowLeft') {
        tank_control = 'left';
    } else if (event.code === 'ArrowUp') {
        tank_control = 'up';
    } else if (event.code === 'ArrowRight') {
        tank_control = 'right';
    } else if (event.code === 'ArrowDown') {
        tank_control = 'down';
    } else if (event.code === 'KeyV' || event.code === 'KeyW') {
        if (Tank.list[g_self_data.id] !== undefined) {
            //Tank.list[g_self_data.id].keyevent(tank_control,false);
            g_self_data.shoot_button_up = true;
            socket.emit('keyPress', {inputId: 'shoot', state: false});
            tank_control = 'shoot';
        }
    }
    if (tank_control !== '' && Tank.list[g_self_data.id] !== undefined) {
        Tank.list[g_self_data.id].keyevent(tank_control, false);
    }
};

g_collisioner = new CollisionManager({});

socket.on('init', function (data) {
    if (data.global !== undefined) {
        g_self_data.id = data.global.id;
    }
    if (data.g_broadcasted_constants !== undefined) {
        g_broadcasted_constants = data.g_broadcasted_constants;
    }
    if (data.clear_all === true) { //teljes reset
        g_collisioner = new CollisionManager({});
        clear_local_map();
        if (g_ghost) {
            ghosttank = new PIXI.Sprite(g_textures.tank);//teszteléshez
            ghosttank.anchor.set(0.45, 0.5);
            g_pixi_containers.game_container.addChild(ghosttank);
        }
        g_redzone = false;
        g_redzone_mask = false;
        g_redzone_pos = {'x': 0, 'y': 0, 'xend': g_site_orig_width, 'yend': g_site_orig_height};
        g_redzone_target = false;
        if (data.playarea !== false) {
            g_redzone_pos = data.playarea;
            g_redzone_ticker = 4;
        }
    }

    for (let w in data.walls) {
        Wall.list[data.walls[w].id] = new Wall({
            'x': data.walls[w].x,
            'y': data.walls[w].y,
            'id': data.walls[w].id,
            'width': data.walls[w].width,
            'height': data.walls[w].height
        });
    }
    for (let t in data.tanks) {
        Tank.list[data.tanks[t].id] = new Tank({
            'x': data.tanks[t].x,
            'y': data.tanks[t].y,
            'rotation': data.tanks[t].rotation,
            'tint': data.tanks[t].tint,
            'nametag': data.tanks[t].nametag,
            'id': data.tanks[t].id
        });
    }
    for (let t in data.bullets) {
        switch (data.bullets[t].type) {
            case 'GhostBullet':
                Bullet.list[data.bullets[t].id] = new GhostBullet({
                    'x': data.bullets[t].x,
                    'y': data.bullets[t].y,
                    'id': data.bullets[t].id,
                    'speed': data.bullets[t].speed,
                    'tint': data.bullets[t].tint
                });
                break;
            case 'FragBullet':
                Bullet.list[data.bullets[t].id] = new FragBullet({
                    'x': data.bullets[t].x,
                    'y': data.bullets[t].y,
                    'id': data.bullets[t].id,
                    'speed': data.bullets[t].speed,
                    'tint': data.bullets[t].tint
                });
                break;
            default:
                Bullet.list[data.bullets[t].id] = new Bullet({
                    'x': data.bullets[t].x,
                    'y': data.bullets[t].y,
                    'id': data.bullets[t].id,
                    'speed': data.bullets[t].speed,
                    'tint': data.bullets[t].tint
                });
        }

    }
    for (let t in data.extras) {
        Extra.list[data.extras[t].id] = new Extra({
            'x': data.extras[t].x,
            'y': data.extras[t].y,
            'id': data.extras[t].id,
            'type': data.extras[t].type
        });
    }
    if (data.clear_all === true && focus_circle !== undefined && focus_circle_data.phase === -1) {
        start_circle_focus({'x': Tank.list[g_self_data.id].x, 'y': Tank.list[g_self_data.id].y});
    }
});

socket.on('update_entities', function (data) {
    for (let t in data.tank) {
        let s_tank = data.tank[t];
        if (Tank.list[s_tank.id] !== undefined) {
            if (s_tank.id === g_self_data.id) {
                Tank.list[g_self_data.id].mods = s_tank.mods;
                Tank.list[g_self_data.id].events = s_tank.events;
                
                //teszteléshez
                if (g_ghost && ghosttank !== undefined) {
                    ghosttank.x = s_tank.x;
                    ghosttank.y = s_tank.y;
                    ghosttank.rotation = s_tank.rotation;
                }
                
            } else {
                Tank.list[s_tank.id].start_ipol(s_tank.x, s_tank.y, s_tank.rotation);
                Tank.list[s_tank.id].events = s_tank.events;
            }
        }
    }
    for (let t in data.bullet) {
        let s_bullet = data.bullet[t];
        if (Bullet.list[s_bullet.id] !== undefined) {
            Bullet.list[s_bullet.id].start_ipol(s_bullet.x, s_bullet.y, s_bullet.rotation);
        }
    }
});

socket.on('update_tint', function (data) {
    for (let t in data.tank) {
        let s_tank = data.tank[t];
        if (Tank.list[s_tank.id] !== undefined) {
            if (s_tank.tint !== undefined) {
                Tank.list[s_tank.id].changeColor(s_tank.tint);
            }
        }
    }
});

socket.on('update_world_scores', function (data) {
    update_world_scores(data);
});

socket.on('effect', function (data) {
    switch (data) {
        case 'p1':
            if (Tank.list[g_self_data.id] !== undefined) {
                Particle.list[Particle.list_counter] = new Particle({
                    'x': Tank.list[g_self_data.id].x,
                    'y': Tank.list[g_self_data.id].y,
                    'id': Particle.list_counter,
                    'texture': g_textures.plus1,
                    'z_index': '10',
                });
                Particle.list_counter++;
            }
            break;
        case 'm1':
            if (Tank.list[g_self_data.id] !== undefined) {
                Particle.list[Particle.list_counter] = new Particle({
                    'x': Tank.list[g_self_data.id].x,
                    'y': Tank.list[g_self_data.id].y,
                    'id': Particle.list_counter,
                    'texture': g_textures.minus1,
                    'z_index': '10',
                });
                Particle.list_counter++;
            }
            break;
    }
});

/*socket.on('update_nametag', function(data){ //nem kell, ameddig pálya közben nem akarunk nevet váltani
 if (Tank.list[data.id] !== undefined) {
 Tank.list[data.id].nametag.text = data.val;
 }
 });*/

socket.on('destroy', function (data) {
    for (let t in data.tanks) {
        if (Tank.list[data.tanks[t]] !== undefined) {
            Tank.list[data.tanks[t]].inactive = true;
            Tank.list[data.tanks[t]].destroy([Tank.list]);
        }
    }
    for (let t in data.bullets) {
        if (Bullet.list[data.bullets[t]] !== undefined) {
            Bullet.list[data.bullets[t]].destroy([Bullet.list]);
        }
    }
    for (let t in data.extras) {
        if (Extra.list[data.extras[t]] !== undefined) {
            Extra.list[data.extras[t]].destroy([Extra.list]);
        }
    }
});

socket.on('world_active', function (data) {
    if (data) {
        if (Tank.list !== undefined && Tank.list[g_self_data.id] !== undefined) {
            Tank.list[g_self_data.id].inactive = false;
        }
    }
});

socket.on('time_is_up', function (data) {
    set_ipol_redzone(data);
});

//minden frame-n. számokat delta-val szorozva alacsony fps-en is ugyanakkora sebességet kapunk, mint 60-on.
g_app.ticker.add(function (delta) {
    if (delta < 1) {
        delta = 1;
    }

    ipol_redzone();

    if (g_self_data.latency_check) {
        g_self_data.latency_counter++;
    }
    g_self_data.tiks_after_input_sent++;

    //oldal resize
    let block_width = document.querySelector("#game_container").clientWidth;
    let block_height = document.querySelector("#game_container").clientHeight;

    let actual_width = block_width//window.innerWidth-103;
    let actual_height = actual_width * WRATIO;
    if (actual_height > block_height) {
        actual_height = block_height;
        actual_width = actual_height / WRATIO;
    }
    g_app.renderer.view.style.width = actual_width;
    g_app.renderer.view.style.height = actual_height;

    for (let i in Tank.list) {
        Tank.list[i].update_cycle();
        if (Tank.list[i].id !== g_self_data.id) {
            Tank.list[i].ipol();
        }
    }
    for (let i in Bullet.list) {
        Bullet.list[i].ipol();
    }
    if (focus_circle_data.phase !== -1) {
        circle_focus_steps();
    }

    if (Particle.list !== undefined) {
        for (let i in Particle.list) {
            Particle.list[i].update();
        }
    }
    //meter.tick();
});

socket.on('input_response', function (position) {
    if (g_self_data.latency_check) {
        g_self_data.latency = g_self_data.latency_counter;
        g_self_data.latency_counter = 0;
        g_self_data.latency_check = false;
    }
    if (Tank.list[g_self_data.id] !== undefined) {
        position.d = position.rotation; //multi használt funkció "d" néven várja a forgás értéket.
        Tank.list[g_self_data.id].apply_server_info(position.next_processed, position);
    }
    g_self_data.tiks_after_input_sent = 0;
});

setInterval(function () {
    if (Tank.list === undefined || Tank.list[g_self_data.id] === undefined) {
        return;
    }
    let mainTank = Tank.list[g_self_data.id];
    mainTank.predict();
    if (mainTank.inputsForServer.length === 3) {
        mainTank.send_move_data_to_server();
    }
}, 1000 / g_broadcasted_constants.gameTick);

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
		rad += 2*Math.PI;
	}
	while (rad > 2*Math.PI) {
		rad -= 2*Math.PI;
	}
	return rad;
}

function clear_local_map () {
	Wall.list = {};
	Tank.list = {};
	Bullet.list = {}; 
	Extra.list = {};
	for (let i = g_app.stage.children.length - 1; i >= 0; i--) {
		g_app.stage.removeChild(g_app.stage.children[i]);
	};
}

function start_circle_focus (data) {
	focus_circle.x = data.x;
    focus_circle.y = data.y;
    focus_circle.animationSpeed = 1;
	focus_circle.loop = false;
	focus_circle.play();
	g_app.stage.addChild(focus_circle);
	focus_circle_data.phase = 0;
	focus_circle_data.countdown = focus_circle.totalFrames;
}

function circle_focus_steps () {
	focus_circle.rotation += 0.02;
	switch (focus_circle_data.phase) {
		case 0:
			focus_circle_data.countdown--;
			if (focus_circle_data.countdown < 1) {
				focus_circle.gotoAndStop(focus_circle.totalFrames-1);
				focus_circle_data.phase = 1;
				setTimeout(function() {
					focus_circle_data.phase = 2;
				},1000);
			}
			break;
		case 2:
			let nextframe = focus_circle.currentFrame-1;
			if (nextframe < 0) {
				focus_circle_data.phase = -1;
				g_app.stage.removeChild(focus_circle);
			} else {
				focus_circle.gotoAndStop(nextframe);
			}
			break;
	}
}
function menu_join_world (world_id, name) {
	let data = {'w_id': world_id};
	socket.emit('request_modify_user_data', {'display_name': name});
	socket.emit('request_world_join', data);
	jQuery('#c_menu').css('display','none');
	jQuery('#c_game').css('display','flex');
}

function update_world_scores (scores) { //{id, name, score}
	g_world_scores = [];
	let pos = 1;
	let self_showed = false;
	for (let score of scores) {
		let pos_s = pos+"";
		while (pos_s.length < 2) {pos_s = "0" + pos_s};
		let name = score.name;
		if (name.length > 8) {
			name = name.substring(0, 6)+'...';
		}
		let b_color = '';
		if (score.id == g_self_data.id) {
			self_showed = true;
			b_color = '#feffe9';
		}
		g_world_scores.push({'position': pos_s, 'name': name, 'score': score.score, 'back_color': b_color});
		pos ++;
		if (pos == 12) {
			if (!self_showed) {
				for (let i = pos-1; i < scores.length ; i++) {
					if (scores[i].id == g_self_data.id) {
						let name2 = scores[i].name;
						if (name2.length > 8) {
							name2 = name2.substring(0, 6)+'...';
						}
						g_world_scores[10] = {'position': i+1, 'name': name2, 'score': scores[i].score, 'back_color': '#ffbfbf'};
					}
				}
			}
			break;
		}
	}
	vue_app.highscores = g_world_scores;
}
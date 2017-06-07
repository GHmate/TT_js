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
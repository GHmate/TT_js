// minden osztály őse, amik a pályán / gráfon helyezkednek el
class Entity {
	//constructor(x,y,x_graph,y_graph,id,texture,width=false,height=false,speed = 2.2) {
	constructor(data) {
		this.x = (data.x !== undefined ? data.x : 0);
		this.y = (data.y !== undefined ? data.y : 0);
		this.id = (data.id !== undefined ? data.id : null);
		let texture = (data.texture !== undefined ? data.texture : '');
		this.sprite = new PIXI.Sprite(texture);
		this.sprite.x = this.x;
		this.sprite.y = this.y;
		this.rotation = (data.rotation !== undefined ? data.rotation : 0);
		this.tint = (data.tint !== undefined ? data.tint : '0xffffff');
		//this.speed = (data.speed !== undefined ? data.speed : 2.2);
		//this.collision_block = []; //collisionManager melyik dobozkájában van éppen. több is lehet, ha átlóg
		g_app.stage.addChild(this.sprite);
		if (data.width) {
			this.sprite.width = data.width;
		}
		if (data.height) {
			this.sprite.height = data.height;
		}
	}
	//meg kell szüntetni minden referenciát ami rá mutat, akkor törlődik csak! (garbage collector) + a sprite-t is ki kell pucolni
	destroy(lists = []) {//tömb-tömböt vár, nem sima tömböt
		if (lists.length < 1) {
			console.log('warning: destroy funkció nem kapott elem-tömböt');
		}
		for (let list of lists) {
			delete list[this.id]; //kitörli a kapott listákban az objektumra mutató referenciát
		}
		g_app.stage.removeChild(this.sprite); //kiszedi a pixi-s referenciát a sprite-ra
		this.sprite = null; //kiszedi a saját referenciát a sprite-ra (elvileg nem kötelező, mert ha törlődik ő, akkor a sprite-ja is)
	};
}

class Wall extends Entity{
	constructor(data) {
		if (data.texture === undefined) {data.texture = g_textures.wall;}
		super(data);
		this.sprite.anchor.set(0.5,0.5);
		let width = (data.width !== undefined ? data.width : 10);
		let height = (data.height !== undefined ? data.height : 10);
		/*this.hitbox = { //téglalap 4 sarka
			'x1':this.x-width/2,
			'x2':this.x+width/2,
			'y1':this.y-height/2,
			'y2':this.y+height/2
		};*/
	}
}

class Tank extends Entity{
	constructor(data) {
		if (data.texture === undefined) {data.texture = g_textures.tank;}
		if (data.width === undefined) {data.width = 41;}
		if (data.height === undefined) {data.height = 26;}
		if (data.rotation === undefined) {data.rotation = Math.random()*2*Math.PI;}
		super(data);
		this.sprite.rotation = this.rotation;
		this.sprite.anchor.set(0.45,0.5);
		this.sprite.tint = this.tint;
		this.shoot_button_up = true;
		//this.can_shoot = true;
		//this.shoot_type = "bb"; // mchg --- machinegun , normal--- sima bullet, bb --- BigBoom, 
		//this.bullet_timer = 3;
		/*this.keypress = {
			'left':false,
			'up':false,
			'right':false,
			'down':false
		};*/
		//this.bullet_count = 50;
		//this.updatePosition();
	}
	//updatePosition() {};
	//triggerShoot() {}
	//createBullet() {};	
	//ext_machinegun(){};
	//changeColor(color) {//this.sprite.tint = color;}
	server_update(s_tank) {
		if (s_tank.x !== undefined) {this.x = s_tank.x; this.sprite.x = s_tank.x;}
		if (s_tank.y !== undefined) {this.y = s_tank.y; this.sprite.y = s_tank.y;}
		if (s_tank.rotation !== undefined) {this.rotation = s_tank.rotation; this.sprite.rotation = s_tank.rotation;}
		if (s_tank.width !== undefined) {this.width = s_tank.width;}
		if (s_tank.height !== undefined) {this.height = s_tank.height;}
		if (s_tank.tint !== undefined) {this.sprite.tint = s_tank.tint;}
	}
}

//lövedék
class Bullet extends Entity{
	constructor(data) {
		if (data.texture === undefined) {data.texture = g_textures.bullet;}
		//if (data.speed === undefined) {data.speed = 3;}
		if (data.width === undefined) {data.width = 10;}
		if (data.height === undefined) {data.height = 10;}
		super(data);
		this.sprite.tint = this.tint;
		this.sprite.anchor.set(0.5,0.5);
		//this.x_graph = x; //a gráfban elfoglalt hely
		//this.y_graph = y;
		//this.rotation = (data.rotation !== undefined ? data.rotation : 0);
		//this.timer = (data.timer !== undefined ? data.timer : 600);
		//this.player_id = (data.player_id !== undefined ? data.player_id : 0);
		//this.Boom = false;
		//this.updatePosition();
		
	};
	server_update(s_bullet) {
		if (s_bullet.x !== undefined) {this.x = s_bullet.x; this.sprite.x = s_bullet.x;}
		if (s_bullet.y !== undefined) {this.y = s_bullet.y; this.sprite.y = s_bullet.y;}
		if (s_bullet.width !== undefined) {this.width = s_bullet.width;}
		if (s_bullet.height !== undefined) {this.height = s_bullet.height;}
	}
}

class BigBullet extends Bullet{
		constructor(data) {
		if (data.texture === undefined) {data.texture = g_textures.bullet;}
		if (data.speed === undefined) {data.speed = 2;}
		if (data.width === undefined) {data.width = 10;}
		if (data.height === undefined) {data.height = 10;}
		super(data);
		//console.log(this.sprite);
		//this.sprite.x = 2;
		/*this.sprite.anchor.set(0.5,0.5);
		this.x_graph = x; //a gráfban elfoglalt hely
		this.y_graph = y;
		this.rotation = 0;
		this.timer = 600;
		this.player_id = player_id;*/
		this.speed = 2.5;
		//this.updatePosition();
	};
	boom(){
		
	};
	updatePosition() { 
		
	};
	
}; 	
	

class Extra extends Entity{
	constructor(data){
		if (data.texture === undefined) {data.texture = g_textures.extra;}
		if (data.width === undefined) {data.width = 20;}
		if (data.height === undefined) {data.height = 20;}
		super(data);
		this.sprite.anchor.set(0.5,0.5);
		let width = (data.width !== undefined ? data.width : 10);
		let height = (data.height !== undefined ? data.height : 10);
		/*this.hitbox = { //téglalap 4 sarka
			'x1':this.x-width/2,
			'x2':this.x+width/2,
			'y1':this.y-height/2,
			'y2':this.y+height/2
		};*/
		this.type = (data.type !== undefined ? data.type : 0);
	};
};

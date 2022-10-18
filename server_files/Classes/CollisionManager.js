const Tank = require("./Tank");
const Wall = require("./Wall");
const Bullet = require("./Bullet");
const Extra = require("./Extra");
const boardFunctions = require("../Functions/boardFunctions.js");

const classByName = {
    'Wall': Wall,
    'Bullet': Bullet,
    'Extra': Extra
}

//ütközések vizsgálatáért felelős osztály (pálya-felosztósdival optimalizálva)
module.exports = class CollisionManager {
    constructor(data) {
        this.field_size = (data.field_size !== undefined ? data.field_size : 80); //hányszor hányas kockákra ossza fel a teret
    }
    //megnézi melyik dobozba/dobozokba kell tenni az entity-t
    get_placing_boxes(entity) {
        let results = [];
        let border = 5; //ennyi pixellel számol ráhagyást a tényleges hitboxra, hogy elkerüljük az épp blokk szélén lévő falak hiányának problémáját
        let x_start = Math.floor((entity.hitbox.x1 - border) / this.field_size);
        let x_end = Math.floor((entity.hitbox.x2 + border) / this.field_size);
        let y_start = Math.floor((entity.hitbox.y1 - border) / this.field_size);
        let y_end = Math.floor((entity.hitbox.y2 + border) / this.field_size);
        for (let i = x_start; i <= x_end; i++) {
            for (let j = y_start; j <= y_end; j++) {
                results.push([i, j]);
            }
        }
        return results;
    }
    //elhelyezi a kapott entity-t a felosztott táblázatában. több helyre is teheti, ha nem fér pont egybe
    place(entity) {
        let boxes = this.get_placing_boxes(entity);
        for (let box of boxes) {
            if (CollisionManager.map[box[0]] === undefined) {
                CollisionManager.map[box[0]] = [];
            }
            if (CollisionManager.map[box[0]][box[1]] === undefined) {
                CollisionManager.map[box[0]][box[1]] = [];
            }
            CollisionManager.map[box[0]][box[1]].push(entity);
            entity.collision_block.push([box[0], box[1]]);
        }
    }
    //mindent updatel
    update_arrays() {
        CollisionManager.map = [];
        for (let key in g_worlds[0].lists.tank) {
            g_worlds[0].lists.tank[key].collision_block = [];
            this.place(g_worlds[0].lists.tank[key]);
        }
        for (let key in g_worlds[0].lists.wall) {
            g_worlds[0].lists.wall[key].collision_block = [];
            this.place(g_worlds[0].lists.wall[key]);
        }
        for (let key in g_worlds[0].lists.bullet) {
            g_worlds[0].lists.bullet[key].collision_block = [];
            this.place(g_worlds[0].lists.bullet[key]);
        }
        for (let key in g_worlds[0].lists.extra) {
            g_worlds[0].lists.extra[key].collision_block = [];
            this.place(g_worlds[0].lists.extra[key]);
        }
    }
    //sima egy az n-hez ütközést ellenőriz, tömbbel tér vissza. (4 irány)
    check_collision_one_to_n (target, c_class, xnext = 0, ynext = 0, obj_id = false) {
        c_class = classByName[c_class];
        let t_width = Math.abs(target.hitbox.x1 - target.hitbox.x2);
        let t_height = Math.abs(target.hitbox.y1 - target.hitbox.y2);
        let collision = {'right': false, 'up': false, 'left': false, 'down': false};
        let collided = [];
        for (let block of target.collision_block) {
            if (CollisionManager.map === undefined || CollisionManager.map[block[0]] === undefined) {
                return {'collision': collision, 'collided': collided};
            }
            for (let obj of CollisionManager.map[block[0]][block[1]]) {
                if (!(obj instanceof c_class)) {
                    continue;
                }
                if (obj_id !== false && obj.id !== obj_id) {
                    continue;
                }

                let c_width = Math.abs(obj.hitbox.x1 - obj.hitbox.x2);
                let c_height = Math.abs(obj.hitbox.y1 - obj.hitbox.y2);
                let w = 0.5 * (t_width + c_width);
                let h = 0.5 * (t_height + c_height);
                let dx = target.x - obj.x;
                let dy = target.y - obj.y;
                let dx_m = target.x + xnext - obj.x;
                let dy_m = target.y + ynext - obj.y;

                if (Math.abs(dx_m) <= w && Math.abs(dy_m) <= h)
                {
                    collided.push(obj);

                    if (target instanceof Tank) {
                        let wy = w * dy_m;
                        let hx = h * dx_m;
                        if (wy > hx) {
                            if (wy > -hx) {
                                if (Math.abs(dx) <= w && Math.abs(dy_m) <= h) { //téves ütközés elkerülésére
                                    collision.up = true;
                                }
                            } else {
                                if (Math.abs(dx_m) <= w && Math.abs(dy) <= h) {
                                    collision.right = true;
                                }
                            }
                        } else {
                            if (wy > -hx) {
                                if (Math.abs(dx_m) <= w && Math.abs(dy) <= h) {
                                    collision.left = true;
                                }
                            } else {
                                if (Math.abs(dx) <= w && Math.abs(dy_m) <= h) {
                                    collision.down = true;
                                }
                            }
                        }
                    } else {
                        let wy = w * dy;
                        let hx = h * dx;
                        if (wy > hx) {
                            if (wy > -hx) {
                                if (Math.abs(dx) <= w) { //téves ütközés elkerülésére
                                    collision.up = true;
                                }
                            } else {
                                if (Math.abs(dy) <= h) {
                                    collision.right = true;
                                }
                            }
                        } else {
                            if (wy > -hx) {
                                if (Math.abs(dy) <= h) {
                                    collision.left = true;
                                }
                            } else {
                                if (Math.abs(dx) <= w) {
                                    collision.down = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return {'collision': collision, 'collided': collided};
    }
    //eltalál-e valakit egy blade az adott pozíción. lefuttatja a tank(ok) killelését, ha igen
    blade_collision(blade_pos, parent_player_id) {
        for (let id in g_worlds[0].lists.tank) {
            if (id == parent_player_id) { //ugye amikor teszt közben magát öli meg...
                //ráadásul a === szétbassza
                continue;
            }
            // a tank hitboxának 4 vonala (kicsit csalok, mert az egy vonalas ütközés nem elég érzékeny)
            let new_hitbox = {'x1': g_worlds[0].lists.tank[id].hitbox.x1-5,'x2': g_worlds[0].lists.tank[id].hitbox.x2+5,'y1': g_worlds[0].lists.tank[id].hitbox.y1-5,'y2': g_worlds[0].lists.tank[id].hitbox.y2+5};

            let tank_hit_line1 = {'x1': new_hitbox.x1,'x2': new_hitbox.x2,'y1': new_hitbox.y1,'y2': new_hitbox.y1};
            let tank_hit_line2 = {'x1': new_hitbox.x1,'x2': new_hitbox.x2,'y1': new_hitbox.y2,'y2': new_hitbox.y2};
            let tank_hit_line3 = {'x1': new_hitbox.x1,'x2': new_hitbox.x1,'y1': new_hitbox.y1,'y2': new_hitbox.y2};
            let tank_hit_line4 = {'x1': new_hitbox.x2,'x2': new_hitbox.x2,'y1': new_hitbox.y1,'y2': new_hitbox.y2};
            if (this.sline_intersect(blade_pos,tank_hit_line1) || this.sline_intersect(blade_pos,tank_hit_line2) || this.sline_intersect(blade_pos,tank_hit_line3) || this.sline_intersect(blade_pos,tank_hit_line4)) {
                g_worlds[0].lists.tank[id].inactive = true;
                boardFunctions.kill_one_tank(g_worlds[0].lists.tank[id], false, parent_player_id);
            }
        }
    }
    // szakasz ütközés figyelés, true, ha metszik egymást. 2 objectet vár
    sline_intersect(line1, line2) {
        let a = line1.x1;
        let b = line1.y1;
        let c = line1.x2;
        let d = line1.y2;
        let p = line2.x1;
        let q = line2.y1;
        let r = line2.x2;
        let s = line2.y2;

        let det, gamma, lambda;
        det = (c - a) * (s - q) - (r - p) * (d - b);
        if (det === 0) {
            return false;
        } else {
            lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
            gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
            return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
        }
    };
    //funkció: kap: 2 vonalat, x,y koord (pont, amin áthalad) + szög.
    line_intersection(line1, line2) {
        if (line1.angle === line2.angle) {
            return false;
        }
        /*konvertáljuk normál alakra, tehát majd kell egy d. (y = m1*x + d1)
        m = bármely természetes szám és false. beállítjuk tangens(szög) segítségével. gáz, ha 90 vagy 270 fok.
        d = y-m*x*/
        let m1 = -1 * Math.tan(line1.angle * Math.PI/180);
        let m2 = -1 * Math.tan(line2.angle * Math.PI/180);

        let x_intersect, y_intersect;
        let d1 = 0;
        let d2 = 0;

        if (line1.angle === 90 || line1.angle === 270) {
            x_intersect = line1.x;
            d2 = line2.y - (m2*line2.x);
        } else if (line2.angle === 90 || line2.angle === 270) {
            x_intersect = line2.x;
            d1 = line1.y - (m1*line1.x);
        } else {
            //normál alakra hozva az egyenesek függvényét
            d1 = line1.y - (m1*line1.x);
            d2 = line2.y - (m2*line2.x);
            /*közös pont:
            m1*x + d1 = m2*x + d2
            m1*x - m2*x = d2 - d1
            x = (d2 - d1) / (m1 - m2)*/
            x_intersect = (d2 - d1) / (m1 - m2);
        }
        //és y = m1*(x-behely.) + d1
        if (d1 !== 0) {
            y_intersect = m1*x_intersect + d1;
        } else if (d2 !== 0) {
            y_intersect = m2*x_intersect + d2;
        } else {
            console.log('WTF vonal metszés bug')
        }
        let ret = {
            'x': x_intersect,
            'y': y_intersect
        };
        //console.log(ret);
        return ret;
    }
}

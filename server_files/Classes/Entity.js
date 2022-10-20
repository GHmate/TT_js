// minden osztály őse, amik a pályán / gráfon helyezkednek el
module.exports = class Entity {
    constructor(data) {
        this.x = (data.x !== undefined ? data.x : 0);
        this.y = (data.y !== undefined ? data.y : 0);
        this.x_graph = (data.x_graph !== undefined ? data.x_graph : 0); //a gráfban elfoglalt hely
        this.y_graph = (data.y_graph !== undefined ? data.y_graph : 0);
        this.id = (data.id !== undefined ? data.id : null);
        this.speed = (data.speed !== undefined ? data.speed : g_broadcasted_constants.entity.speed);
        this.rot_speed = (data.rot_speed !== undefined ? data.rot_speed : g_broadcasted_constants.entity.rspeed);
        this.collision_block = []; //collisionManager melyik dobozkájában van éppen. több is lehet, ha átlóg
        this.width = (data.width !== undefined ? data.width : 10);
        this.height = (data.height !== undefined ? data.height : 10);
        this.rotation = (data.rotation !== undefined ? data.rotation : 0);
        this.tint = (data.tint !== undefined ? data.tint : '0xffffff');
        this.inactive = false;
    }
    //meg kell szüntetni minden referenciát ami rá mutat, akkor törlődik csak! (garbage collector)
    destroy(lists = []) {//dupla-tömböt [[]] vár, nem sima tömböt
        if (lists.length < 1) {
            console.log('warning: destroy funkció nem kapott elem-tömböt');
        }
        for (let list of lists) {
            delete list[this.id]; //kitörli a kapott listákban az objektumra mutató referenciát
        }
    }
}

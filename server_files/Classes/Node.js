module.exports = class Node {
    constructor(data) {
        this.x_graph = (data.x !== undefined ? data.x : 0); //0 -> n ig a gráfban elfoglalt x, y pozíció
        this.y_graph = (data.y !== undefined ? data.y : 0);
        this.x = border.x + this.x_graph * g_field_size; //a pályán ténylegesen elfoglalt x, y pozíció
        this.y = border.x + this.y_graph * g_field_size;
        this.block_id = -1; //melyik összefüggő blokkba tartozik. -1=egyikbe sem.
        this.unused_paths = 2; //mennyi utat tudna még létrehozni
        this.path = [0, 0]; // 0 vagy 1: nincs/van út jobbra / lefele. így azokra csak ő tehet utat, nincs ütközés. -1 akkor lesz, ha mellette/alatta vége a pályának
        if (this.x_graph == g_dimensions.x - 1) {
            this.path[0] = -1;
            this.unused_paths--;
        }
        if (this.y_graph == g_dimensions.y - 1) {
            this.path[1] = -1;
            this.unused_paths--;
        }

    }
    //csinál utakat magának
    generate_paths() {
        for (var i = 0; i < 2; i++) {
            if (this.path[i] == 0 && Math.random() < g_path_gen_chance) {
                this.path[i] = 1;
                this.unused_paths--;
            }
        }
    }
    //rekurzív funkció: besorolja egy blokkba magát és az összes hozzá kapcsolódó node-ot. visszatér a blokk tőle indult darabszámával
    besorol(actual_block, graph) {
        if (this.block_id !== -1) {
            //ha már be volt sorolva, nem folytatja
            return 0;
        } else {
            this.block_id = actual_block;
            var children_size = 1; //1 mert önmaga is hozzáadódik a blokkhoz.
            //először a balra és felette lévőket kérdezzük le
            if (graph[this.x_graph - 1] !== undefined && graph[this.x_graph - 1][this.y_graph].path[0] === 1) {
                children_size += graph[this.x_graph - 1][this.y_graph].besorol(actual_block, graph);
            }
            if (graph[this.x_graph][this.y_graph - 1] !== undefined && graph[this.x_graph][this.y_graph - 1].path[1] === 1) {
                children_size += graph[this.x_graph][this.y_graph - 1].besorol(actual_block, graph);
            }
            //majd a jobbra és alatta lévőket
            if (this.path[0] === 1) {
                children_size += graph[this.x_graph + 1][this.y_graph].besorol(actual_block, graph);
            }
            if (this.path[1] === 1) {
                children_size += graph[this.x_graph][this.y_graph + 1].besorol(actual_block, graph);
            }
            return children_size;
        }
    }
}

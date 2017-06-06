//ide szedek ki mindent amit a játék legelején kell beállítani

//size things
g_dimensions = {'x': 20,'y': 13};

const WRATIO = 0.6666; //magasság aránya a szélességhez
g_site_orig_width = 1300; //ebben a méretben fog futni az app, és a végeredmény felbontást átméretezgetéssel oldom meg
g_site_orig_height = g_site_orig_width*WRATIO;

g_window_size = {'x':g_site_orig_width,'y':g_site_orig_height}; 
g_field_size = (g_site_orig_width)/(g_dimensions.x+1); //mezők mérete. ez lesz a mérvadó adat minden méretezésnél. ha változik ez alapján frissül minden
border = {'x':g_field_size,'y':g_field_size}; //falak ennyivel beljebb kezdődjenek a saroktól

//game things
g_max_player_num = 5;
g_playerdata = {}; //játékosok (és nem tankok) adatai

g_tank_colors = ['0x333333','0x999999','0xffffff','0xff4d4d','0xffa64d','0xffff4d','0x79ff4d','0x4dffa6','0x4dd2ff','0x4d4dff','0xd24dff','0xff4da6'];
g_player_min_distance = 4; //milyen távolságra lehetnek playerek
g_player_distance_fields = 25; //maximum mennyi node-ot foglal egy player a minimális táv miatt
g_path_gen_chance = 0.55; //útvonal generálási esély. célszerű 0.4 és 0.7 között tartani.

g_worlds_number = 0;
g_worlds = {};
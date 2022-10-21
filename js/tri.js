/*  --------------------------------------------------------------------------
	  Récupère la couleur de fond du tv
        @param {string} tv	    - "AB1"
        @param {string} zone    - "est"
		@returns {string} color 
	-------------------------------------------------------------------------- */
function get_group_color(tv, zone) {
    const bloc_zone = zone === "est" ? bloc_est : bloc_west;
    let bloc_tv;
    for (const [bloc, value] of Object.entries(bloc_zone)) {
       if (value.includes(tv)) {
            bloc_tv = bloc; 
            break;
       }
    }
    switch (bloc_tv) {
        case "bloc1": 
            return "#E06F6F";
        case "bloc2":
            return "#98BA6C";
        case "bloc3":
            return "#4E8E99";
        default:
            return "#CFC188";
    }
}

/*  --------------------------------------------------------------------------
	  trie tv par groupe pour l'est
	 	@param {array}  - array non trié [[tv, n°position],...] ou [tv, ...]
		@returns {array} - array trié [[tv, n°position],...] ou [tv, ...]
	-------------------------------------------------------------------------- */
    function tri_salto(arr_tv, zone) {
        const bloc_zone = zone === "est" ? salto_est : salto_west;
        let arr = [];
        for (const [bloc, value] of Object.entries(bloc_zone)) {
            let bloc_tv_array = arr_tv.filter(tv => { 
                if (Array.isArray(tv) === true) return value.includes(tv[0]); else return value.includes(tv);
            })
            arr = [...arr, ...bloc_tv_array];
        }
        return arr;
    }

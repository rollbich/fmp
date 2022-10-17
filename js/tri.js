const bloc_est = {
    "bloc1": ["RAE", "RAEM", "RAES", "RAEE", "RAEE1", "SBAM", "MNST", "BTAJ", "SAB", "BAM", "SBM", "MN", "ST", "AJ", "BT"],
    "bloc2": ["EK", "EK1", "EK2", "EK3", "EK12", "EK3", "EK23", "E12", "E3", "E23", "KK", "K12", "K3", "K23", "EE", "KK", "E1", "E2", "K1", "K2"],
    "bloc3": ["AB", "AB1", "AB2", "AB3", "AB4", "AB12", "AB34", "B12", "B34", "B1", "B2", "B3", "B4", "AA", "BB", "A12", "A34", "A1", "A2", "A3", "A4", "A123", "A234", "B123", "B234"],
    "bloc4": ["GY", "GY1", "GY2", "GY3", "GY4", "GY12", "GY34", "GG", "YY", "Y12", "Y34", "Y1", "Y2", "Y3", "Y4", "G12", "G34", "G1", "G2", "G3", "G123", "G4", "G234", "Y123", "Y234"]
}

const bloc_west = {
    "bloc1": ["RAW", "RAWM", "RAWN", "RAWS", "WLMO", "MALY", "LYO", "MOLYO", "MML", "LE", "LOLS", "LELS", "LOLE", "LS", "LO", "MO", "ML", "MOML"],
    "bloc2": ["W1", "W23", "W12", "W2", "W3", "WM", "WW", "WMF"],
    "bloc3": ["MF", "MF1", "MF2", "MF3", "MF4", "MM", "M12", "M1", "M123", "M34", "M234", "M2", "M3", "M4", "FF", "F12", "F1", "F2", "MF12", "F123", "MF34", "F234", "F34", "F3", "F4"],
    "bloc4": ["DZ", "DD", "ZZ", "DH", "ZH", "DL", "DZL", "DZH"]
}

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

const salto_est = {
    "bloc01": ["RAE", "AIET", "GYAB", "GYA", "GY", "GG", "GY34", "GY4", "G34"],
    "bloc02": ["G123", "RAEM", "ABEK", "BEK"],
    "bloc03": ["G12"],
    "bloc04": ["Y4"],
    "bloc05": ["GY3", "Y3"],
    "bloc06": ["GY12"],
    "bloc07": ["Y34"],
    "bloc08": ["GY2", "Y2"],
    "bloc09": ["GY1", "Y1"],
    "bloc10": ["YY", "YA"],
    "bloc11": ["Y12"],
    "bloc12": ["AB", "AA", "AB34", "AB4", "A34", "AB234"],
    "bloc13": ["B34", "B4"],
    "bloc14": ["AB3", "B3"],
    "bloc15": ["AB2", "B2"],
    "bloc16": ["AB1", "B1"],
    "bloc17": ["A12", "AB12"],
    "bloc18": ["BB", "B12"],
    "bloc19": ["EK", "EE", "EK3", "E3"],
    "bloc20": ["RAEE12", "E12"],
    "bloc21": ["E23", "E2"],
    "bloc22": ["EK2", "EK23"],
    "bloc23": ["EK1"],
    "bloc24": ["EK12", "E1"],
    "bloc25": ["K3"],
    "bloc26": ["K2"],
    "bloc27": ["K1"],
    "bloc28": ["KK"],
    "bloc29": ["K12", "RAEE1", "RAE12"],
    "bloc30": ["RAEE", "RAES", "SBAM", "BAM"],
    "bloc31": ["BAM", "MNST", "MN"],
    "bloc32": ["BTAJ", "SAB", "BT"],
    "bloc33": ["SBM", "ST"],
    "bloc34": ["AJ"]
}

const salto_west = {
    "bloc01": ["RAW", "RAWM", "RAWN"],
    "bloc02": ["MALY", "MOML"],
    "bloc03": ["MOLYO", "LYO", "LO", "LOLS"],
    "bloc04": ["LELS", "LE"],
    "bloc05": ["LOLE", "LS"],
    "bloc06": ["MO", "ML"],
    "bloc07": ["WW", "WM", "WMO", "WLMO", "WMF"],
    "bloc08": ["RAWS", "MFML"],
    "bloc09": ["MML"],
    "bloc10": ["WMFDZ", "MFDZ"],
    "bloc11": ["WMOML"],
    "bloc12": ["W23", "W3"],
    "bloc13": ["W12", "W2"],
    "bloc14": ["W1"],
    "bloc15": ["MM", "M34", "M234", "M4", "MF", "MF34", "MF4"],
    "bloc16": ["MF3"],
    "bloc17": ["MF12", "MF2"],
    "bloc19": ["M3"],
    "bloc20": ["M2"],
    "bloc21": ["M12", "M1", "M123"],
    "bloc22": ["FF", "F34", "F234", "F4"],
    "bloc23": ["F3"],
    "bloc24": ["F2"],
    "bloc25": ["MF1"],
    "bloc26": ["F12", "F1", "F123"],
    "bloc27": ["FDZ", "DZ"],
    "bloc28": ["DD", "DH", "DZH", "FDZH", "MFDZH"],
    "bloc29": ["ZH"],
    "bloc30": ["DL", "DZL", "FDZL", "MFDZL"],
    "bloc31": ["ZZ"],
    "bloc32": ["ZL"]
}

/*  --------------------------------------------------------------------------
	  trie tv par groupe pour l'est
	 	@param {array}  - array non trié [[tv, n°position],...] ou [tv, ...]
		@returns {array} - array trié [[tv, n°position],...] ou [tv, ...]
	-------------------------------------------------------------------------- */
    function tri_salto(arr_tv, zone) {
        // on met dans un tableau les tv du groupe 1, puis du groupe 2, etc...
        const bloc_zone = zone === "est" ? salto_est : salto_west;
        let arr = [];
        // on place les tv appartenant au groupe 1 dans un tableau, idem pour le groupe 2, etc...
        for (const [bloc, value] of Object.entries(bloc_zone)) {
            let bloc_tv_array = arr_tv.filter(tv => { 
                if (Array.isArray(tv) === true) return value.includes(tv[0]); else return value.includes(tv);
            })
            arr = [...arr, ...bloc_tv_array];
        }
        return arr;
    }

const bloc_est = {
    "bloc1": ["RAE", "RAEE", "RAEM", "RAES", "RAEE1", "SBAM", "MNST", "BTAJ", "SAB", "BAM", "MN", "ST", "AJ", "BT"],
    "bloc2": ["AIET", "ABEK", "BEK", "EK", "EK1", "EK2", "EK3", "EK12", "EK3", "EK23", "E12", "E3", "E23", "KK", "K12", "K3", "K23", "EE", "KK", "E1", "E2", "K1", "K2"],
    "bloc3": ["AB", "AB1", "AB2", "AB3", "AB4", "AB12", "AB34", "B12", "B34", "B1", "B2", "B3", "B4", "AA", "BB", "A12", "A34", "A1", "A2", "A3", "A4"],
    "bloc4": ["GYAB", "GYA", "GY", "GY1", "GY2", "GY3", "GY4", "GY12", "GY34", "GG", "YY", "Y12", "Y34", "Y1", "Y2", "Y3", "Y4", "G12", "G34", "G1", "G2", "G3", "G123", "G4"]
}

const bloc_west = {
    "bloc1": ["RAW", "RAWM", "RAWN", "RAWS", "MALY", "LYO", "MOLYO", "OLYO", "MML", "LE", "LOLS", "LELS", "LOLE", "LS", "LO", "MO", "ML"],
    "bloc2": ["MOML", "WMO", "WMOML", "MFML", "WLMO"],
    "bloc3": ["WMFDZ", "MFDZ", "W1", "W23", "W12", "W2", "W3", "WM", "WW"],
    "bloc4": ["MM", "MF", "M12", "M1", "M123", "MF1", "MF2", "F1", "F2"],
    "bloc5": ["M34", "M234", "M2", "M3", "M4", "FF", "F12", "MF12", "MF3", "MF4", "F123", "MF34", "F234", "F34", "F3", "F4"],
    "bloc6": ["FDZ", "DZ", "DD", "ZZ", "DH", "ZH", "DL", "DZL", "DZH", "FDZL", "MFDZL", "FDZH", "MFDZH"]
}

/*  --------------------------------------------------------------------------
	  trie tv par groupe pour l'est
	 	@param {array}  - array non trié [[tv, n°position],...] ou [tv, ...]
		@returns {array} - array trié [[tv, n°position],...] ou [tv, ...]
	-------------------------------------------------------------------------- */
function tri(arr_tv, zone) {
    // on met dans un tableau les tv du groupe 1, puis du groupe 2, etc...
    const bloc_zone = zone === "est" ? bloc_est : bloc_west;
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
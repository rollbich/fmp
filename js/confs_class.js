class conf {
	/*  ---------------------------------------------
			@param {string} day - "yyyy-mm-dd"
			@param {string} zone - "est" ou "ouest"
		--------------------------------------------- */
	constructor(day, zone) {
		this.day = day;
		this.zone = zone;
	}

	async init() {
		this.confs = await this.get_conf();
	}

	async init_b2b() {
		this.b2b_confs = await this.get_b2b_confs();
		this.b2b_sorted_confs = this.sort_b2b_confs();
	}

	/*  ---------------------------------------------
			Lit le fichier json de confs declarées
		--------------------------------------------- */
	async get_conf() {
		const date = this.day.replace(/-/g, ''); // yyyymmdd
		const url = `../b2b/json/${date}-confs.json`;	
		const resp = await loadJson(url);
		return resp;
	}

	/*  ---------------------------------------------------------------------------------------
			Récupère les confs du jour et existantes en B2B

			Attention pour les confs à un secteur, "item" n'est pas un array mais une valeur

			@return {
				"known_confs": {
					"est": [{
						"key": "E10A2B",
						"value": {
							"item": ["LFMMG12", "LFMMG34", "LFMMB12", "LFMMB34", "LFMMY12", "LFMMY34", "LFMMMNST", "LFMMAA", "LFMMBTAJ", "LFMMEK1", "LFMMEK3", "LFMMEK2" ]
						}
					},
					...(ne pr
					{...}],
					"west" : []
				},
				"est": [{}, ..., {}],       // conf du jour
				"ouest": [{}, ..., {}],      // conf du jour
			}
		--------------------------------------------------------------------------------------- */

	async get_b2b_confs() { 
		try {
			let response = await fetch("../b2b/known_confs.php", {
				method: 'POST',
				headers: { "Content-Type": "application/json" }
			})
			.then(rep_status); 
			let json = await response.json(); 
			return json;
		}
		
		catch (err) {
			alert('Get confs existantes Load json error: '+err.message);
		}
	}

	/*  -----------------------------------------------------------
			Formatte les confs B2B pour les classer
			par nombre de secteurs
			@return {
				"1": {"E1A": ["RAE"]},
				"2":{"E2A":["GYA","RAEM"],"E2B":["GY","RAES"],"E2C":["GYAB","RAEE"],"E1A1A":["AIET","SBAM"]},
				"3": ...
			}
		------------------------------------------------------------------ */
	
	sort_b2b_confs() {
		const s = {"est": {}, "ouest": {}};
		for(let i=1;i<=15;i++) {
			this.b2b_confs["known_confs"]["est"].forEach(elem => {
				let nbr_tv = null;
				if (Array.isArray(elem.value.item)) {
					nbr_tv = elem.value.item.length;
				} else {
					nbr_tv = 1;
				}
				if (nbr_tv === i) {
					if (!s["est"].hasOwnProperty(i)) { s["est"][i] = {} };
					if (i === 1) {
						s["est"][i][elem.key] = [elem.value.item.substr(4)];
					} else {
						s["est"][i][elem.key] = elem.value.item.map(el => el.substr(4)); 
					}
					
				}
			})
			this.b2b_confs["known_confs"]["ouest"].forEach(elem => {
				let nbr_tv = null;
				if (Array.isArray(elem.value.item)) {
					nbr_tv = elem.value.item.length;
				} else {
					nbr_tv = 1;
				}
				if (nbr_tv === i) {
					if (!s["ouest"].hasOwnProperty(i)) { s["ouest"][i] = {} };
					if (i === 1) {
						s["ouest"][i][elem.key] = [elem.value.item.substr(4)];
					} else {
						s["ouest"][i][elem.key] = elem.value.item.map(el => el.substr(4)); 
					}
				}
			})
		}
		return s;
	}

	/*  -----------------------------------------------------------
			Affiche les confs
			@param {string} containerId - Id de l'HTML Element container	
			@param {string} day - "yyyy-mm-dd"
		------------------------------------------------------------------ */
	async show_result_confs(containerId) {
		if (typeof this.confs === 'undefined') return;
		try {
			let res = "<div class='conf'>";
			res += `
			<table class="regulation sortable">
				<caption>LFMM-${this.zone.toUpperCase()} : ${reverse_date(this.day)}</caption>
				<thead><tr class="titre"><th>Début</th><th>Fin</th><th>Conf</th><th colspan="15"></th></tr></thead>
				<tbody>`;
			this.confs[this.zone].forEach( value => {
				let deb = extract_time(value.applicabilityPeriod.wef);
				let fin = extract_time(value.applicabilityPeriod.unt);
				let regr = this.get_tvs_confs(value.sectorConfigurationId);
				res += '<tr>'; 
				res +=`<td>${deb} TU</td><td>${fin} TU</td><td>${value.sectorConfigurationId}</td>`;
				const arr = this.zone === "est" ? this.tri_est(regr) : this.tri_west(regr);
				arr.forEach(tv => {
					res += `<td>${tv}</td>`;
				})
				res += '</tr>';	
			});
			res += '</tbody></table>';
			res += '</div>';
			
			$(containerId).innerHTML = res;
		}
		catch(err) {
			alert(`Erreur : ${err.message}`);
		}
		
	}

	get_nb_tv(conf) {
		const p = conf.substring(1,3);
		let sup = null;
		//console.log("3è digit");
		//console.log(p[1]);
		if (!isNaN(p[1])) sup = p; else	sup = p.substring(0,1);
		let inf = null;
		if (conf.length === 3) inf = 0; else inf = conf.slice(-2,-1);
		console.log("nb_tv : "+conf);
		console.log("sup : "+sup+"  inf: "+inf);
		return parseInt(sup)+parseInt(inf);
	}

/*  ------------------------------------------------------------------------------
	  Cherche les tvs correspondants à la conf
        @param {string} "conf" - "E3C"
        @return [array] tvs - ["RAEE", "GY", "AB"]
	------------------------------------------------------------------------------ */
    get_tvs_confs(conf) {
        let regroupements = null;
		let nb_tvs = this.get_nb_tv(conf);
		console.log("nb_tvs de la conf: "+conf);
		console.log(nb_tvs);
		console.log("this.sorted_confs[nb_tvs]");
		console.log(this.b2b_sorted_confs);
        for(let cf in this.b2b_sorted_confs[this.zone][nb_tvs]) {
			console.log("Conf : "+conf);
			console.log("Cf : "+cf);
            if (conf == cf) {
                regroupements = this.b2b_sorted_confs[this.zone][nb_tvs][cf];
                break;
            }
        }
		console.log(regroupements);
        return regroupements;
    }

	/*  -----------------------------------------------------------
			Affiche les confs existantes
			@param {string} containerId - Id de l'HTML Element container	
			@param {string} day - "yyyy-mm-dd"
		------------------------------------------------------------------ */
	async show_existing_confs(zone, containerId) {
		if (typeof this.b2b_sorted_confs === 'undefined') return;
		const max_secteur = 15;
		let res = "<div>";
		res += `
		<table class="sortable conf">
			<caption>Confs existantes - Zone ${this.zone}</caption>
			<thead><tr class="titre"><th class="space">Nb sect</th><th>Conf</th><th>TVs</th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th></tr></thead>
			<tbody>`.trimStart();
		
		// confs_list : { "E2A": ["LFMMRAEM","LFMMGYA"], "E2B": [...]}
		console.log("GG: "+this.b2b_sorted_confs[this.zone]);
        for (const [nbr_sect, confs_list] of Object.entries(this.b2b_sorted_confs[this.zone])) { // on itère sur le nombre de regroupements 
			Object.keys(confs_list).forEach (conf => { // on itère sur les différentes confs
				if (nbr_sect%2) {res += '<tr class="one">'; } else {res += '<tr class="two">'; }
				let tvs = zone === "est" ? this.tri_est(confs_list[conf]) : this.tri_west(confs_list[conf]);
				res +=`<td>${nbr_sect}</td><td>${conf}</td>`;
				const l = max_secteur - tvs.length + 1;
				tvs.forEach (tv => {
					//if (tv == "OLYO") tv = "MOLYO"; // patch erreur nom airspace NM
					res += `<td>${tv}</td>`;
				})
				for(let i=1;i<l;i++) {
					res += `<td></td>`;
				}
				res += '</tr>';	
			})
		}
		res += '</tbody></table>';
        res += '</div>';
		$(containerId).innerHTML = res;
			
	}

	/*  ----------------------------------------------------
	  trie tv par groupe pour l'est
	 	@param {array}  - array non trié ["tv1", "tv2",...]
		@returns {array} - array trié
	-------------------------------------------------------- */
    tri_est(arr_tv) {
        // on met dans un tableau les tv du groupe 1, puis du groupe 2, etc...
        const bloc1 = ["RAE", "RAEE", "RAEM", "RAES", "RAEE1", "SBAM", "MNST", "BTAJ", "SAB", "BAM", "MN", "ST", "AJ", "BT"];
        const bloc2 = ["AIET", "ABEK", "BEK", "EK", "EK1", "EK2", "EK3", "EK12", "EK3", "EK23", "E12", "E3", "E23", "KK", "K12", "K3", "K23", "EE", "KK", "E1", "E2", "K1", "K2"];
        const bloc3 = ["AB", "AB1", "AB2", "AB3", "AB4", "AB12", "AB34", "B12", "B34", "B1", "B2", "B3", "B4", "AA", "BB", "A12", "A34", "A1", "A2", "A3", "A4"];
        const bloc4 = ["GYAB", "GYA", "GY", "GY1", "GY2", "GY3", "GY4", "GY12", "GY34", "GG", "YY", "Y12", "Y34", "Y1", "Y2", "Y3", "Y4", "G12", "G34", "G1", "G2", "G3", "G123", "G4"];
        // on place les tv appartenant au groupe 1 dans un tableau, idem pour le groupe 2, etc...
        let bloc1_tv_array = arr_tv.filter(tv => bloc1.includes(tv));
        let bloc2_tv_array = arr_tv.filter(tv => bloc2.includes(tv));
        let bloc3_tv_array = arr_tv.filter(tv => bloc3.includes(tv));
        let bloc4_tv_array = arr_tv.filter(tv => bloc4.includes(tv));
        // on concatène les 4 tableaux en 1
        arr_tv = [...bloc1_tv_array, ...bloc2_tv_array, ...bloc3_tv_array, ...bloc4_tv_array];
        return arr_tv;	
    }

/*  --------------------------------------------------------
	  trie tv par groupe pour l'ouest
	 	@param {array}  - array non trié ["tv1", "tv2",...]
		@returns {array} - array trié
	-------------------------------------------------------- */
    tri_west(arr_tv) {
        const bloc1 = ["RAW", "RAWM", "RAWN", "RAWS", "MALY", "LYO", "MOLYO", "OLYO", "MML", "LE", "LOLS", "LELS", "LOLE", "LS", "LO", "MO", "ML"];
        const bloc2 = ["MOML", "WMO", "WMOML", "MFML", "WLMO", "WMFDZ", "MFDZ", "W1", "W23", "W12", "W2", "W3", "WM", "WW"];
        const bloc3 = ["MM", "MF", "M12", "M1", "M123", "MF1", "MF2", "F1", "F2"];
        const bloc4 = ["M34", "M234", "M2", "M3", "M4", "FDZ", "FF", "F12", "MF12", "MF3", "MF4", "F123", "FDZL", "MFDZL"];
        const bloc5 = ["MF34", "F234", "F34", "F3", "F4", "DZ", "DD", "ZZ", "DH", "ZH", "DL", "DZL", "DZH", "FDZH", "MFDZH"];
        let bloc1_tv_array = arr_tv.filter(tv => bloc1.includes(tv));
        let bloc2_tv_array = arr_tv.filter(tv => bloc2.includes(tv));
        let bloc3_tv_array = arr_tv.filter(tv => bloc3.includes(tv));
        let bloc4_tv_array = arr_tv.filter(tv => bloc4.includes(tv));
        let bloc5_tv_array = arr_tv.filter(tv => bloc5.includes(tv));
        // on concatène les 4 tableaux en 1
        arr_tv = [...bloc1_tv_array, ...bloc2_tv_array, ...bloc3_tv_array, ...bloc4_tv_array, ...bloc5_tv_array];
        return arr_tv;	
    }

}
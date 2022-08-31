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
		if (this.day !== null) this.confs_prep = await this.get_conf();
		this.confs_supp_est = await this.get_fichier_confs("est");
		this.confs_supp_west = await this.get_fichier_confs("ouest");
	}

	async init_b2b() {
		this.b2b_confs = await this.get_b2b_confs();
		this.b2b_sorted_confs = this.sort_b2b_confs();
	}

	/*  ---------------------------------------------
			Lit le fichier json de confs declarées
		--------------------------------------------- */
	async get_conf() {
		if (typeof this.day === 'undefined') return {};
		const date = this.day.replace(/-/g, ''); // yyyymmdd
		const year = this.day.substr(0,4);
		const month = date.substr(4,2);
		const url = `../b2b/json/${year}/${month}/${date}-confs.json`;	
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
			show_popup("Erreur", "Chargement des Confs impossible<br>Vérifiez la connexion internet");
			console.log('Get confs existantes Load json error: '+err.message);
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

	/*  --------------------------------------------------------------------------------------------- 
	  Lit le fichier de correspondance confs-regroupements
	--------------------------------------------------------------------------------------------- */
    async get_fichier_confs(zone) {
		const url_est =  `../confs-est-supp.json`;	
        const url_west =  `../confs-west-supp.json`;	
        const url = zone === "est" ? url_est : url_west;
        console.log("load confs supp OK");
        return await loadJson(url);
	}

	/*  --------------------------------------------------------------------------------------------- 
	        Détecte les confs déjà existantes dans le fichier confs supplémentaire
			@params {string} "est" ou "ouest"
	    --------------------------------------------------------------------------------------------- */
	get_conf_to_clean(zone) {
		const cf = zone === "est" ? this.confs_supp_est : this.confs_supp_west;
		const conf_supprime = [];
		Object.keys(this.b2b_sorted_confs[zone]).forEach( numero => {
			Object.keys(this.b2b_sorted_confs[zone][numero]).forEach( conf => {
				const s = this.get_conf_name(this.b2b_sorted_confs[zone][numero][conf], cf);
				if (s !== "-") {
					conf_supprime.push([s, conf]);
					console.log(s+" = "+conf);
					delete cf[numero][s];
				}
			})
		})
		console.log(cf);
		return conf_supprime;
	}

	/*  --------------------------------------------------------------------------------------------- 
	        affiche les doublons de confs
			@params {string} "est" ou "ouest"
	    --------------------------------------------------------------------------------------------- */
	affiche_doublon_confs(containerId) {
		const cf_est = this.get_conf_to_clean("est");
		const cf_west = this.get_conf_to_clean("ouest");
		if (cf_est.length === 0 && cf_west.length === 0) {
			$(containerId).innerHTML = "";
			show_popup("Doublons confs", "La bdd est déjà clean");
		} else {
		let res = "<div class='conf'>";
		res += `
		<table class="sortable">
			<caption>Doublon de confs</caption>
			<thead><tr class="titre"><th>Conf NM</th><th></th><th>Conf bdd</th></tr></thead>
			<tbody>`;
			cf_est.forEach( value => {
				res += '<tr>'; 
				res += `<td>${value[1]}</td><td> = </td><td>${value[0]}</td>`;
				res += '</tr>';	
			});
			cf_west.forEach( value => {
				res += '<tr>'; 
				res += `<td>${value[1]}</td><td> = </td><td>${value[0]}</td>`;
				res += '</tr>';	
			});
		res += '</tbody></table>';
		res += '<div class="center"><button id="bouton_clean">Clean local BDD</button></div>';
		res += '</div>';
		$(containerId).innerHTML = res;

		$('bouton_clean').addEventListener('click', async e => {
			await this.clean_conf_file();
			$(containerId).innerHTML = "";
			show_popup("Doublons confs", "Nettoyage effectué");
		})
		}

	}

	/*  --------------------------------------------------------------------------------------------- 
	        Supprime les confs déjà existantes du fichier confs supplémentaire
			@params {string} "est" ou "ouest"
	    --------------------------------------------------------------------------------------------- */
	async clean_conf_file() {
		const cf = {};
		cf["est"] = this.confs_supp_est;
		cf["ouest"] = this.confs_supp_west;
		const data = {
			method: "post",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(cf)
		};
		fetch("export_confs_to_json.php", data);
	}

	/*  --------------------------------------------------------------------------------------------- 
	        Update les confs du fichier confs supplémentaire
			@params {string} "est" ou "ouest"
	    --------------------------------------------------------------------------------------------- */
	async update_conf_file(zone) {
		const url = zone === "est" ? "export_confsEst_to_json.php" : "export_confsWest_to_json.php";
		const cf = zone === "est" ? this.confs_supp_est : this.confs_supp_west;
		const data = {
			method: "post",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(cf)
		};
		fetch(url, data);
	}
	
/*  ------------------------------------------------------------------------------
	  Cherche la conf correspondante
        @param {array} [array de regroupements] - ["SBAM","GY","EK","AB"]
        @param {object} this.confs / this.confs_exist / this.confs_supp
        @return {string} conf - "E5W2B" ou "-" si non trouvé
	------------------------------------------------------------------------------ */
    get_conf_name(regroupements, confs) {
        let cf = "-";
        const nb_regroupements = regroupements.length;
        for(let conf in confs[nb_regroupements]) {
            const arr_tv = confs[nb_regroupements][conf];
            if (regroupements.sort().toString() == arr_tv.sort().toString()) {
                cf = conf;
                break;
            }
        }
        return cf;
    }

	/*  ------------------------------------------------------------------
			Affiche les confs déclarées au NM à la prep
			@param {string} containerId - Id de l'HTML Element container	
			@param {string} day - "yyyy-mm-dd"
		------------------------------------------------------------------ */
	async show_result_confs(containerId) {
		if (typeof this.confs_prep === 'undefined') return;
		try {
			let res = "<div class='conf'>";
			res += `
			<table class="sortable">
				<caption>LFMM-${this.zone.toUpperCase()} : ${reverse_date(this.day)}</caption>
				<thead><tr class="titre"><th>Début</th><th>Fin</th><th>Conf</th><th colspan="15"></th></tr></thead>
				<tbody>`;
			this.confs_prep[this.zone].forEach( value => {
				let deb = extract_time(value.applicabilityPeriod.wef);
				let fin = extract_time(value.applicabilityPeriod.unt);
				let regr = this.get_tvs_confs(value.sectorConfigurationId);
				res += '<tr>'; 
				res +=`<td>${deb} TU</td><td>${fin} TU</td><td>${value.sectorConfigurationId}</td>`;
				const arr = tri_salto(regr, this.zone);
				arr.forEach(tv => {
					const color = get_group_color(tv, this.zone);
					res += `<td style='background: ${color}'>${tv}</td>`;
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
	  Cherche les tvs correspondants à la conf déclaré à la prep
        @param {string} "conf" - "E3C"
        @return [array] tvs - ["RAEE", "GY", "AB"]
	------------------------------------------------------------------------------ */
    get_tvs_confs(conf) {
        let regroupements = null;
		let nb_tvs = this.get_nb_tv(conf);
        for(let cf in this.b2b_sorted_confs[this.zone][nb_tvs]) {
            if (conf == cf) {
                regroupements = this.b2b_sorted_confs[this.zone][nb_tvs][cf];
                break;
            }
        }
        return regroupements;
    }

	/*  -----------------------------------------------------------
			Affiche les confs existantes
			@param {string} containerId - Id de l'HTML Element container	
		------------------------------------------------------------------ */
	async show_existing_confs(containerId) {
		if (typeof this.b2b_sorted_confs === 'undefined') return;
		const max_secteur = 15;
		let res = "<div>";
		res += `
		<table class="sortable conf">
			<caption>Confs existantes - Zone ${this.zone}</caption>
			<thead><tr class="titre"><th class="space">Nb sect</th><th>Conf</th><th>TVs</th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th></tr></thead>
			<tbody>`.trimStart();
		
		// confs_list : { "E2A": ["LFMMRAEM","LFMMGYA"], "E2B": [...]}
        for (const [nbr_sect, confs_list] of Object.entries(this.b2b_sorted_confs[this.zone])) { // on itère sur le nombre de regroupements 
			Object.keys(confs_list).forEach (conf => { // on itère sur les différentes confs
				if (nbr_sect%2) {res += '<tr class="one">'; } else {res += '<tr class="two">'; }
				let tvs = tri_salto(confs_list[conf], this.zone);
				res +=`<td>${nbr_sect}</td><td>${conf}</td>`;
				const l = max_secteur - tvs.length + 1;
				tvs.forEach (tv => {
					const color = get_group_color(tv, this.zone);
					res += `<td style='background: ${color}'>${tv}</td>`;
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

/*  ------------------------------------------------------------------
		Affiche les confs de la bdd
		@param {string} containerId - Id de l'HTML Element container	
	------------------------------------------------------------------ */
	async show_bdd_confs(containerId) {
		const max_secteur = 15;
		const zc = this.zone === "AE" ? this.confs_supp_est : this.confs_supp_west;
		const zone = this.zone === "AE" ? "est" : "west";
		let res = "<div>";
		res += `
		<table class="sortable conf">
			<caption>Confs supplémentaires bdd - Zone ${zone}</caption>
			<thead><tr class="titre"><th class="space">Nb sect</th><th>Conf</th><th>Supprime</th><th>TVs</th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th></tr></thead>
			<tbody>`.trimStart();
		
		// confs_list : { "E2A": ["LFMMRAEM","LFMMGYA"], "E2B": [...]}
		for (const [nbr_sect, confs_list] of Object.entries(zc)) { // on itère sur le nombre de regroupements 
			// le fichier de conf supp contient une clé "zone" qu'il faut exclure
			if (Object.keys(confs_list).length !== 0 && nbr_sect !== "zone") {
				console.log(nbr_sect+" : ");
				console.log(confs_list);
				Object.keys(confs_list).forEach (conf => { // on itère sur les différentes confs
					if (nbr_sect%2) {res += '<tr class="one">'; } else {res += '<tr class="two">'; }
					let tvs = this.zone === "AE" ? tri_salto(confs_list[conf], "est") : tri_salto(confs_list[conf], "west");
					//let tvs = confs_list[conf];
					console.log("TVS");
					console.log(tvs);
					res +=`<td>${nbr_sect}</td><td>${conf}</td><td data-nbrsect="${nbr_sect}" data-conf="${conf}" data-zone="${zone}" class="supprime">x</td>`;
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
		}
		res += '</tbody></table>';
		res += '</div>';
		$(containerId).innerHTML = res;
		
		const supp = document.querySelectorAll('.supprime');
		for (const elem of supp) {
			elem.addEventListener('click', async (e) => {
				const nbr_sect = elem.dataset.nbrsect;
				const conf_name = elem.dataset.conf;
				const zone = elem.dataset.zone.toLowerCase();
				delete zc[nbr_sect][conf_name];
				await this.update_conf_file(zone);
				show_popup('Delete Confs', `Conf ${conf_name} supprimée`);
			});
		}
	}
}

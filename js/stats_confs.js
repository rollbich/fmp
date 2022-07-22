class stat_confs {
	/*  ------------------------------------------------------------------	
			@param {integer} year
			@param {string} zone - "AE" ou "AW"
		------------------------------------------------------------------ */
        
	constructor(containerId, start, end, zone) {
        this.container = $(containerId);
        this.start = start;
        this.end = end;
		this.zone = zone;
		this.dates_arr = get_dates_array(new Date(start), new Date(end));
        this.stats = {};
		this.init();
	}
	
    async init() {
        const zon = this.zone === "AE" ? "est" : "ouest";
        const cf = new conf(new Date(), zon);
        await cf.init_b2b();
        this.sch_rea = await this.get_sch_rea();
        this.confs_exist = cf.b2b_sorted_confs;
		this.confs_supp = await this.get_fichier_confs();
        this.confs = this.merge_conf();
        console.log("Confs existantes");
        console.log(this.confs_exist);
        console.log("Confs supp");
        console.log(this.confs_supp);
		console.log("Confs totale mergée");
        console.log(this.confs);
        this.add_stat();
        this.show_result_stat();
	}

	/*  -------------------------------------------------------------
		Lit le fichier json des confs
			@param {string} day - "yyyy-mm-dd"
			@param {string} zone - "AE" ou "AW"
			@returns {date1: objet_conf, date2: objet_conf,...}
	----------------------------------------------------------------- */
	async get_sch_rea() {
		const schemas = {};
		for (const day of this.dates_arr) {
				const sch = new schema_rea(day, this.zone);
				schemas[day] = await sch.read_schema_realise();
		}
        console.log("Read schemas OK");
		return schemas;
	}

    /*  --------------------------------------------------------------------------------------------- 
	  Lit le fichier de correspondance confs-regroupements
	--------------------------------------------------------------------------------------------- */
    async get_fichier_confs() {
		const url_est =  `../confs-est-supp.json`;	
        const url_west =  `../confs-west-supp.json`;	
        const url = this.zone === "AE" ? url_est : url_west;
        console.log("load confs supp OK");
        return await loadJson(url);
	}

    /*  --------------------------------------------------------------------------------------------- 
	        Fusion confs existantes avec le fichier confs supplémentaire
	--------------------------------------------------------------------------------------------- */
    merge_conf() {
        const conf_tot = {};
        const zon = this.zone === "AE" ? "est" : "ouest";
        Object.assign(conf_tot, this.confs_exist[zon]);
        Object.keys(this.confs_supp).forEach( elem => {
            conf_tot[elem] = {...conf_tot[elem], ...this.confs_supp[elem]}
        })
        return conf_tot;
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

/*  ------------------------------------------------------------------------------
	  remplit l'objet this.stats
      {
          "1": {
            "E1A": {
              "occur": nbre_occurence,
              "tps" : durée en minutes,
              "tv": ["RAE"]},
              "conf": "E1A"
            },
            "conf_name": {
                ...
            }
          "nbr_sect": {
              "conf1": { },
              ...
      }
	------------------------------------------------------------------------------ */
    add_stat() {   
        for (const day of this.dates_arr) {  
            if (typeof this.sch_rea[day] != 'undefined') {     
                this.sch_rea[day].ouverture.forEach(row => {
                    const deb = time_to_min(row[1]);
                    const fin = time_to_min(row[2]);
                    const elapsed = fin - deb;
                    const regroupements = [];
                    row[4].forEach(tv => {
                        regroupements.push(tv[0]);
                    });
                    const nb_regr = regroupements.length;
                    const cn = this.get_conf_name(regroupements, this.confs);				                          
                    if (typeof this.stats[nb_regr] === 'undefined') this.stats[nb_regr] = {};
                    if (typeof this.stats[nb_regr][cn] === 'undefined') { 
                        this.stats[nb_regr][cn] = {}; 
                        this.stats[nb_regr][cn]["occur"] = 0;
                        this.stats[nb_regr][cn]["tps"] = 0;
                        this.stats[nb_regr][cn]["tv"] = regroupements;
                        this.stats[nb_regr][cn]["conf"] = cn;
                    }
                    this.stats[nb_regr][cn]["occur"]++;
                    this.stats[nb_regr][cn]["tps"] += elapsed;
                });
            }
        }
        console.log("Stats");
        console.log(this.stats);
    }

	/*  ------------------------------------------------------------------	
			@param {string} containerId - Id de l'HTML Element container 
		------------------------------------------------------------------ */	 
		
	async show_result_stat() {
        const zon = this.zone === "AE" ? "Est" : "West";
		let res = "<div>";
		res += `
		<table class="sortable conf">
			<caption>STATS Confs : Zone ${zon}<br>${reverse_date(this.start)} / ${reverse_date(this.end)}</caption>
			<thead><tr class="titre"><th class="space">Nb sect</th><th>Conf</th><th>Occ</th><th>Durée</th><th>% occ</th><th>% tps</th><th>TVs</th></tr></thead>
			<tbody>`.trimStart();
		// -----------------------------------
        //    fonction de tri
        // -----------------------------------
        function tri_obj(a,b) {
            return b["occur"] - a["occur"];
        }
        for (const [nbr_sect, confs_list] of Object.entries(this.stats)) { // on itère sur le nombre de regroupements 
            console.log("nbr regr: "+nbr_sect);
            // nbre occurence total pour un regroupement à n secteurs
            let count_occur = 0;
            // nbre minutes total pour un regroupement à n secteurs
            let count_min = 0;
            for (const conf of Object.entries(confs_list)) { // on itère sur les différentes confs
                count_occur += parseInt(conf[1]["occur"]);
                count_min += parseInt(conf[1]["tps"]);
            }
            // ------------------------------------------------------------------------------------------------------
            //      Tri suivant nbre_occur
            // arr = [{"occur": nbre_occurence,"tps" : durée en minutes,"tv": ["RAEM","GYA"],"conf": "E2A"}, {...} ] 
            // ------------------------------------------------------------------------------------------------------
            let arr = [];
            for (const conf of Object.entries(confs_list)) { // on itère sur les différentes confs (conf = [ "nom_conf", { object conf} ])
                arr.push(this.stats[nbr_sect][conf[0]]);
            }
            arr.sort(tri_obj);
            arr.forEach(el => {
				if (nbr_sect%2) {res += '<tr class="one">'; } else {res += '<tr class="two">'; }
                const p_occur = Math.round(el.occur*1000/count_occur)/10;
                const p_tps = Math.round(el.tps*1000/count_min)/10;
                if (p_occur > 4.99 && el.conf.substring(0,1) === "N") {
                    res +=`<td>${nbr_sect}</td>`;
                    res +=`<td class="red">${el.conf}</td><td class="red">${el.occur}</td>`;
                    res +=`<td>${el.tps}</td>`;
                    res += `<td class="red">${p_occur}</td><td>${p_tps}</td></td>`;
                } else {
                    res +=`<td>${nbr_sect}</td>`;
                    res +=`<td>${el.conf}</td><td>${el.occur}</td>`;
                    res +=`<td>${el.tps}</td>`;
                    res += `<td>${p_occur}</td><td>${p_tps}</td></td>`;
                }
                if (el.conf === "-") { res += '<td>---</td>';} else { res += `<td>${el["tv"].join("  ")}</td>`;}
				res += '</tr>';	
            })
		}
		
		res += '</tbody></table>';
        res += '</div>';
		this.container.innerHTML = res;
		
	}
}
class stat_confs {
	/*  ------------------------------------------------------------------	
			@param {integer} year
			@param {string} zone - "AE" ou "AW"
		------------------------------------------------------------------ */
        
	constructor(containerId, year, zone) {
        this.container = $(containerId);
		this.year = year;
		this.zone = zone;
		this.dates_arr = get_dates_array(new Date(this.year,0,1), new Date(this.year,11,31)); // 1er janvier au 31 décembre
        this.stats = {};
		this.init();
	}
	
    async init() {
        this.sch_rea = await this.get_sch_rea();
		this.confs = await this.get_fichier_confs();
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
		const url_est =  `../confs-est-test.json`;	
        const url_west =  `../confs-west.json`;	
        const url = this.zone === "AE" ? url_est : url_west;
        console.log("load confs OK");
        return await loadJson(url);
	}

/*  ------------------------------------------------------------------------------
	  Cherche la conf correspondante
        @param {array} [array de regroupements] - ["SBAM","GY","EK","AB"]
        @return {string} conf - "E5W2B" ou "-" si non trouvé
	------------------------------------------------------------------------------ */
    get_conf_name(regroupements) {
        let cf = "-";
        const nb_regroupements = regroupements.length;
        for(let conf in this.confs[nb_regroupements]) {
            const arr_tv = this.confs[nb_regroupements][conf];
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
              "tv": ["RAE"]}
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
                    const cn = this.get_conf_name(regroupements);				                          
                    if (typeof this.stats[nb_regr] === 'undefined') this.stats[nb_regr] = {};
                    if (typeof this.stats[nb_regr][cn] === 'undefined') { 
                        this.stats[nb_regr][cn] = {}; 
                        this.stats[nb_regr][cn]["occur"] = 0;
                        this.stats[nb_regr][cn]["tps"] = 0;
                        this.stats[nb_regr][cn]["tv"] = regroupements;
                    }
                    this.stats[nb_regr][cn]["occur"]++;
                    this.stats[nb_regr][cn]["tps"] += elapsed;
                });
            }
        }
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
			<caption>STATS Confs : Zone ${zon} - Année ${this.year}</caption>
			<thead><tr class="titre"><th class="space">Nb sect</th><th>Conf</th><th>Occ</th><th>Durée</th><th>% occ</th><th>% tps</th><th>TVs</th></tr></thead>
			<tbody>`.trimStart();
		
        for (const [nbr_sect, confs_list] of Object.entries(this.stats)) { // on itère sur le nombre de regroupements
            console.log("nbr regr: "+nbr_sect);
            // nbre occurence total pour un regroupement à n secteurs
            let count_occur = 0;
            let count_min = 0;
            for (const conf of Object.entries(confs_list)) { // on itère sur les différentes confs
                count_occur += parseInt(conf[1]["occur"]);
                count_min += parseInt(conf[1]["tps"]);
            }
            for (const conf of Object.entries(confs_list)) { // on itère sur les différentes confs
                //console.log(conf);
				if (nbr_sect%2) {res += '<tr class="one">'; } else {res += '<tr class="two">'; }
				res +=`<td>${nbr_sect}</td><td>${conf[0]}</td><td>${conf[1].occur}</td><td>${conf[1].tps}</td>`;
                res += `<td>${Math.round(conf[1].occur*1000/count_occur)/10}</td><td>${Math.round(conf[1].tps*1000/count_min)/10}</td></td>`;
                if (conf[0] === "-") { res += '<td>---</td>';} else { res += `<td>${conf[1]["tv"].join("  ")}</td>`;}
				res += '</tr>';	
			}
		}
		
		res += '</tbody></table>';
        res += '</div>';
		this.container.innerHTML = res;
		
	}
}
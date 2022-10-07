class stat_regroup {
	/*  ------------------------------------------------------------------	
			@param {integer} year
			@param {string} zone - "AE" ou "AW"
		------------------------------------------------------------------ */
        
	constructor(containerId, start, end, zone) {
        this.container = $(containerId);
        this.start = start;
        this.end = end;
		this.zone = zone;
        this.zon = this.zone === "AE" ? "est" : "ouest";
		this.dates_arr = get_dates_array(new Date(start), new Date(end));
        this.stats = {};
		this.init();
	}
	
    async init() { 
        show_popup("Chargement en cours...", "Cela prend 15s pour 6 mois");
        this.sch_rea = await this.get_sch_rea();
        document.querySelector('.popup-close').click();
        this.regroupements = this.add_stat();
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

/*  ------------------------------------------------------------------------------
	  remplit l'objet this.regroupement
      {
        "tv": {
            "occurences": nbre_occurence,
            "elapsed" : durée en minutes
        },
        ...
      }
	------------------------------------------------------------------------------ */
    add_stat() {  
        let regroupements = {}; 
        for (const day of this.dates_arr) {  
            if (typeof this.sch_rea[day] != 'undefined') {     
                this.sch_rea[day].ouverture.forEach(row => {
                    const deb = time_to_min(row[1]);
                    const fin = time_to_min(row[2]);
                    const elapsed = fin - deb;
                    row[4].forEach(tv => {
                        if (typeof regroupements[tv[0]] === 'undefined') regroupements[tv[0]] = {"occurences": 0, "elapsed": 0};
                        regroupements[tv[0]]["occurences"]++;
                        regroupements[tv[0]]["elapsed"] += parseInt(elapsed);
                    });
                });
            }
        }
        //console.log(regroupements);
        return regroupements;
    }

	/*  ------------------------------------------------------------------	
			@param {string} containerId - Id de l'HTML Element container 
		------------------------------------------------------------------ */	 
		
	async show_result_stat() {
		let res = "<div>";
		res += `
		<table class="sortable regroup">
			<caption>STATS Regroupements : Zone ${this.zon}<br>${reverse_date(this.start)} / ${reverse_date(this.end)}</caption>
			<thead><tr class="titre"><th class="space">TV</th><th>Occurrences</th><th>Elapsed time</th></tr></thead>
			<tbody>`.trimStart();
		
            for (const [tv, obj] of Object.entries(this.regroupements)) {	
                res += '<tr>';
                res += `<td>${tv}</td><td>${obj.occurences}</td><td>${obj.elapsed}</td>`;
                res += '</tr>';
            }
		
		res += '</tbody></table>';
        res += '</div>';
		this.container.innerHTML = res;
		
	}
}
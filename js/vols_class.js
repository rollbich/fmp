class vols {
	constructor(day) {
		this.day = day;
	}

	async init() {
		this.daily_vols = await this.get_data_daily_vols();
		this.nbre_vols = this.get_daily_vols();
	}

	/*  ----------------------------------------------------------------------------------
		Lit le fichier json de regul
			@param {string} day - "yyyy-mm-dd"
            @returns {	"LFMMCTA":["LFMMCTA", day, nb_vol]
						"LFMMFMPE":[ [TV, day, nb_vol], []...],
						"LFMMFMPW":[ [TV, day, nb_vol], []...],
						"requestReceptionTime":"2022-01-02 22:42:17",
						"status":"OK",
						"VOLS_RAE":[{"flight":{...}},{}]
						"VOLS_RAW":[{"flight":{...}},{}]
					}
	-------------------------------------------------------------------------------------*/
	async get_data_daily_vols() {
		const date = this.day.replace(/-/g, ''); // yyyymmdd
		const url = `../b2b/json/${date}-vols.json`;	
		const resp = await loadJson(url);
		return resp;
	}

	get_daily_vols() {
		const vols = {};
		this.daily_vols["LFMMFMPE"].forEach( value => {
			if (value[0] === "LFMRAE") vols["LFMRAE"] = value[2];
		});
		this.daily_vols["LFMMFMPW"].forEach( value => {
			if (value[0] === "LFMRAW") vols["LFMRAW"] = value[2];
		});
		vols["LFMMCTA"] = this.daily_vols["LFMMCTA"][2];
		return vols;
	}
	
	show_result_daily_vols(containerId) {
		let delays = "<div class='delay'>";
		delays += `<span class="reg-tot">Day : ${reverse_date(this.day)}</span><span class="reg-tot">LFMM Est : ${this.nbre_vols["LFMRAE"]}</span><span class="reg-tot">LFMM West : ${this.nbre_vols["LFMRAW"]}</span><span class="reg-tot">LFMM : ${this.nbre_vols["LFMMCTA"]}</span>`;
		delays += "</div>";
		$(containerId).innerHTML = delays;	
	}

}

class period_vols {
	/*  ------------------------------------------------------------------	
			@param {string} start_day - "yyyy-mm-dd"
			@param {string} end_day - "yyyy-mm-dd"
			@param {string} zone - "AE" ou "AW"
		------------------------------------------------------------------ */
        
	constructor(start_day, end_day, zone) {
		this.start_day = start_day;
		this.end_day = end_day;
		this.zone = zone;
        this.dates_arr = get_dates_array(new Date(start_day), new Date(end_day));
	}
	
    /*  -------------------------------------------------------------
		Lit le fichier json des vols
			@param {string} day - "yyyy-mm-dd"
			@param {string} zone - "AE" ou "AW"
            @returns {date1: objet_vol, date2: objet_vol,...}
	----------------------------------------------------------------- */
    async init() {
		this.vols = await this.get_vols();
		console.log(this.vols);
	}

	async get_vols() {
        const plage_vols = {};
        for (const date of this.dates_arr) {
             const v = new vols(date);
			 await v.init();
             plage_vols[date] = v.get_daily_vols();
        }
		return plage_vols;
	}

	get_period_vols() {
		const vols = {};
		let total_vols_est = 0, total_vols_west = 0, total_vols_cta = 0; 
		for (const date of this.dates_arr) {
			total_vols_est += parseInt(this.vols[date]['LFMRAE']);
			total_vols_west += parseInt(this.vols[date]['LFMRAW']);
			total_vols_cta += parseInt(this.vols[date]['LFMMCTA']);
		}
		vols['est'] = total_vols_est;
		vols['west'] = total_vols_west;
		vols['cta'] = total_vols_cta;
		return vols;
	}

	/*  ------------------------------------------------------------------	
		 @param {string} containerId - Id de l'HTML Element container 
		------------------------------------------------------------------ */	 
        
	async show_result_vols(containerId) {
		let result_vols = `<h2>Nombre de vols : ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</h2><br>`;
		result_vols += "<div class='delay'>";
		let res = `
		<table class="regulation sortable">
			<thead><tr class="titre"><th class="space">Date</th><th>Jour</th><th>CTA</th><th>Est</th><th>West</th></tr></thead>
			<tbody>`;
		let total_vols_est = 0, total_vols_west = 0, total_vols_cta = 0; 
        for (const date of this.dates_arr) {
                res += '<tr>'; 
                res +=`<td>${reverse_date(date)}</td><td>${jour_sem(date)}</td><td>${this.vols[date]['LFMMCTA']}</td><td>${this.vols[date]['LFMRAE']}</td><td>${this.vols[date]['LFMRAW']}</td>`;
                res += '</tr>';	
				total_vols_est += parseInt(this.vols[date]['LFMRAE']);
				total_vols_west += parseInt(this.vols[date]['LFMRAW']);
				total_vols_cta += parseInt(this.vols[date]['LFMMCTA']);
        }
        res += '</tbody></table>';
		
		result_vols += `<span class="reg-tot">LFMM Est : ${total_vols_est} vols</span><span class="reg-tot">LFMM West : ${total_vols_west} vols</span><span class="reg-tot">LFMM CTA : ${total_vols_cta} vols</span>`;
		result_vols += "</div>";
		result_vols += res;
		$(containerId).innerHTML = result_vols;
		
	}
}

class weekly_vols {
	constructor(year) {
		this.year = year;
	}

	async init() {
		this.weekly_vols = await this.get_data_weekly_vols();
		this.nbre_vols = this.get_weekly_vols();
	}

	/*  ----------------------------------------------------------------------------------
		Lit le fichier json de regul
			@param {string} day - "yyyy-mm-dd"
            @returns {	"LFMMCTA":["LFMMCTA", day, nb_vol]
						"LFMMFMPE":[ [TV, day, nb_vol], []...],
						"LFMMFMPW":[ [TV, day, nb_vol], []...],
						"requestReceptionTime":"2022-01-02 22:42:17",
						"status":"OK",
						"VOLS_RAE":[{"flight":{...}},{}]
						"VOLS_RAW":[{"flight":{...}},{}]
					}
	-------------------------------------------------------------------------------------*/
	async get_data_weekly_vols() {
		const url = `../b2b/json/${this.year}-weekly-flights.json`;	
		const resp = await loadJson(url);
		return resp;
	}

	get_weekly_vols() {
		const vols = {};
		vols['year'] = parseInt(this.weekly_vols['year']);
		vols['est'] = [];
		vols['west'] = [];
		vols['cta'] = [];
		for(let i=1;i<53;i++) {
			if (typeof this.weekly_vols['est'][i] !== 'undefined') vols['est'].push(this.weekly_vols['est'][i]);
			if (typeof this.weekly_vols['west'][i] !== 'undefined') vols['west'].push(this.weekly_vols['west'][i]);
			if (typeof this.weekly_vols['cta'][i] !== 'undefined') vols['cta'].push(this.weekly_vols['cta'][i]);
		}
		return vols;
	}
}






class vols {
	constructor(day) {
		this.day = day;
	}

	async init() {
		this.daily_vols = await this.get_data_daily_vols();
	}

	/*  ----------------------------------------------------------------------------------
		Lit le fichier json des vols
			@param {string} day - "yyyy-mm-dd"
            @returns {	"LFMMCTA":["LFMMCTA", day, nb_vol],
						"LFMMCTAE":["LFMMCTAE", day, nb_vol],
						"LFMMCTAW":["LFMMCTAW", day, nb_vol],
						"LFMMFMPE":[ [TV, day, nb_vol], []...],
						"LFMMFMPW":[ [TV, day, nb_vol], []...],
						"LFMMAPP":{ "flights": total_app,
									"LFKJ": [day, nb_vol],
									 "AD": []...], ... }
						"requestReceptionTime":"2022-01-02 22:42:17",
						"status":"OK",
						"VOLS_RAE":[{"flight":{...}},{}]
						"VOLS_RAW":[{"flight":{...}},{}]
					}
	-------------------------------------------------------------------------------------*/
	async get_data_daily_vols() {
		const date = this.day.replace(/-/g, ''); // yyyymmdd
		const year = this.day.substr(0,4);
		const month = date.substr(4,2);
		const url = `${year}/${month}/${date}-vols.json`;	
		const resp = await get_data(url);
		if (resp !== 404) {
			return resp;
		}
		else {
			console.error(`Le fichier du ${date} n'existe pas`);
			show_popup(`Erreur`, `Le fichier du ${date} n'existe pas<br>Il ne sera pas compté dans la stat`);
			//await wait(1000);
		    //document.querySelector('.popup-close').click();
		}
	}

	get_daily_vols() {
		const vols = {};
		vols["LFMCTAE"] = this.daily_vols["LFMMCTAE"][2];
		vols["LFMCTAW"] = this.daily_vols["LFMMCTAW"][2];
		vols["LFMMCTA"] = this.daily_vols["LFMMCTA"][2];
		vols["LFMMAPP"] = this.daily_vols["LFMMAPP"]["flights"];
		return vols;
	}
	
	show_result_daily_vols(containerId) {
		let delays = "<div class='delay'>";
		delays += `<span class="reg-tot">Day : ${reverse_date(this.day)}</span><span class="reg-tot">LFMM Est : ${this.daily_vols["LFMMCTAE"][2]}</span><span class="reg-tot">LFMM West : ${this.daily_vols["LFMMCTAW"][2]}</span><span class="reg-tot">LFMM : ${this.daily_vols["LFMMCTA"][2]}</span><span class="reg-tot">APP : ${this.daily_vols["LFMMAPP"]["flights"]}</span>`;
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
	}

	async get_vols() {
        const plage_vols = {};
        for (const date of this.dates_arr) {
             const v = new vols(date);
			 await v.init();
			 if (v.daily_vols !== 404) {
             	plage_vols[date] = v.daily_vols;
			 }
        }
		return plage_vols;
	}

	get_period_vols() { 
		const vols = {};
		let total_vols_est = 0, total_vols_west = 0, total_vols_cta = 0, total_vols_app = 0; 
		for (const date of this.dates_arr) {
			if (this.vols[date] !== 404) {
				console.log(this.vols[date]);
				total_vols_est += parseInt(this.vols[date]['LFMMCTAE'][2]);
				total_vols_west += parseInt(this.vols[date]['LFMMCTAW'][2]);
				total_vols_cta += parseInt(this.vols[date]['LFMMCTA'][2]);
				total_vols_app += parseInt(this.vols[date]['LFMMAPP']['flights']);
			}
		}
		vols['est'] = total_vols_est;
		vols['west'] = total_vols_west;
		vols['cta'] = total_vols_cta;
		vols['app'] = total_vols_app;
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
			<thead><tr class="titre"><th class="space">Date</th><th>Jour</th><th>CTA</th><th>Est</th><th>West</th><th>App</th></tr></thead>
			<tbody>`;
		let total_vols_est = 0, total_vols_west = 0, total_vols_cta = 0, total_vols_app = 0; 
        for (const date of this.dates_arr) {
			if (typeof this.vols[date] !== 'undefined') {
                res += '<tr>'; 
                res +=`<td>${reverse_date(date)}</td><td>${jour_sem(date)}</td><td>${this.vols[date]['LFMMCTA'][2]}</td><td>${this.vols[date]['LFMMCTAE'][2]}</td><td>${this.vols[date]['LFMMCTAW'][2]}</td><td>${this.vols[date]['LFMMAPP']['flights']}</td>`;
                res += '</tr>';	
				total_vols_est += parseInt(this.vols[date]['LFMMCTAE'][2]);
				total_vols_west += parseInt(this.vols[date]['LFMMCTAW'][2]);
				total_vols_cta += parseInt(this.vols[date]['LFMMCTA'][2]);
				total_vols_app += parseInt(this.vols[date]['LFMMAPP']['flights']);
			}
        }
        res += '</tbody></table>';
		
		result_vols += `<span class="rect">LFMM Est : ${total_vols_est} vols</span><span class="rect">LFMM West : ${total_vols_west} vols</span><span class="rect">LFMM CTA : ${total_vols_cta} vols</span><span class="rect">LFMM APP : ${total_vols_app} vols</span>`;
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
		Lit le fichier json des vols weekly
			@param {string} day - "yyyy-mm-dd"
            @returns {
				"year":2022,
				"cta":{"1":0,"2":142,...},
				"est":{"1":0,"2":0,...},
				"west":{"1":0,"2":142,...},
			} = this.nbre_vols
	-------------------------------------------------------------------------------------*/
	async get_data_weekly_vols() {
		const url = `${this.year}/${this.year}-weekly-flights.json`;	
		const resp = await get_data(url);
		return resp;
	}

	get_weekly_vols() {
		const vols = {};
		vols['year'] = parseInt(this.weekly_vols['year']);
		vols['cta'] = [];
		vols['est'] = [];
		vols['west'] = [];
		vols['app'] = [];
		//console.log("weekly vols");
		//console.log(this.weekly_vols);
		for(let i=1;i<54;i++) { //53 semaines max
			if (typeof this.weekly_vols['cta'][i] !== 'undefined') vols['cta'].push(this.weekly_vols['cta'][i]);
			if (typeof this.weekly_vols['est'][i] !== 'undefined') vols['est'].push(this.weekly_vols['est'][i]);
			if (typeof this.weekly_vols['west'][i] !== 'undefined') vols['west'].push(this.weekly_vols['west'][i]);
			if (typeof this.weekly_vols['app'] !== 'undefined') {
				if (typeof this.weekly_vols['app'][i] !== 'undefined') vols['app'].push(this.weekly_vols['app'][i]);
			}
		}
		return vols;
	}
}




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
		Lit le fichier json de regul
			@param {string} day - "yyyy-mm-dd"
			@param {string} zone - "AE" ou "AW"
            @returns {"LFMMFMPE":[],"LFMMFMPW":[],"LFMMAPP":[],...}
	----------------------------------------------------------------- */
    async init() {
		this.vols = await this.get_vols();
		console.log(this.reguls);
	}

	async get_vols() {
        const vols = {};
        for (const date of this.dates_arr) {
             const v = new vols(date);
			 await v.init();
             vols[date] = v.get_daily_vols();
        }
		return vols;
	}

	/*  ------------------------------------------------------------------	
		 @param {string} containerId - Id de l'HTML Element container 
		------------------------------------------------------------------ */	 
        
	async show_result_vols(containerId) {
		let delays = "<div class='delay'>";
		let res = `
		<table class="regulation sortable">
			<caption>LFMM-EST : ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</caption>
			<thead><tr class="titre"><th class="space">Date</th><th>Regul Id</th><th>TV</th><th>Début</th><th>Fin</th><th>Délai</th><th>Raison</th><th>vols</th></tr></thead>
			<tbody>`;
		let total_delay_est = 0, total_delay_west = 0, total_delay_app = 0; 
        for (const date of this.dates_arr) {
            this.reguls[date]["LFMMFMPE"].forEach( value => {
                let deb = extract_time(value.applicability.wef);
                let fin = extract_time(value.applicability.unt);
                res += '<tr>'; 
                res +=`<td>${reverse_date(date)}</td><td>${value.regId}</td><td>${value.tv}</td><td>${deb} TU</td><td>${fin} TU</td><td>${value.delay}</td><td>${value.reason}</td><td>${value.impactedFlights}</td>`;
                res += '</tr>';	
                total_delay_est += value.delay;
            });
        }
        res += '</tbody></table>';
		res += `
		<table class="regulation sortable">
			<caption>LFMM-OUEST : ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</caption>
			<thead><tr class="titre"><th class="space">Date</th><th>Regul Id</th><th>TV</th><th>Début</th><th>Fin</th><th>Délai</th><th>Raison</th><th>vols</th></tr></thead>
			<tbody>`;
        for (const date of this.dates_arr) {
            this.reguls[date]["LFMMFMPW"].forEach( value => {
                let deb = extract_time(value.applicability.wef);
                let fin = extract_time(value.applicability.unt);
                res += '<tr>'; 
                res +=`<td>${reverse_date(date)}</td><td>${value.regId}</td><td>${value.tv}</td><td>${deb} TU</td><td>${fin} TU</td><td>${value.delay}</td><td>${value.reason}</td><td>${value.impactedFlights}</td>`;
                res += '</tr>';	
                total_delay_west += value.delay;
            });
        }
        res += '</tbody></table>';
		res += `
		<table class="regulation sortable">
			<caption>LFMM-APP : ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</caption>
			<thead><tr class="titre"><th class="space">Date</th><th>Regul Id</th><th>TV</th><th>Début</th><th>Fin</th><th>Délai</th><th>Raison</th><th>vols</th></tr></thead>
			<tbody>`;
        for (const date of this.dates_arr) {
            this.reguls[date]["LFMMAPP"].forEach( value => {
                let deb = extract_time(value.applicability.wef);
                let fin = extract_time(value.applicability.unt);
                res += '<tr>'; 
                res +=`<td>${reverse_date(date)}</td><td>${value.regId}</td><td>${value.tv}</td><td>${deb} TU</td><td>${fin} TU</td><td>${value.delay}</td><td>${value.reason}</td><td>${value.impactedFlights}</td>`;
                res += '</tr>';	
                total_delay_app += value.delay;
            });
        }
		res += '</tbody></table>';
		delays += `<span class="reg-tot">LFMM Est : ${total_delay_est} mn</span><span class="reg-tot">LFMM West : ${total_delay_west} mn</span><span class="reg-tot">LFMM App : ${total_delay_app} mn</span>`;
		delays += "</div>";
		delays += res;
		$(containerId).innerHTML = delays;
		
	}
}








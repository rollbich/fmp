class regul {
	constructor(day, zone) {
		this.day = day;
		this.zone = zone;
	}

	async init() {
		this.regul = await this.get_regul();
		/* 
		---------------------
		tableau des TVset
		--------------------- 
		*/
        
		this.lfmm_tvset = ["LFMMFMPE", "LFMMFMPW", "LFMMAPP"];
		this.lfbb_tvset = ["LFBBFMP", "LFBBAPP"];
		this.lfee_tvset = ["LFEEFMP", "LFEEAPP"];
		this.lfff_tvset = ["LFFFFMPE", "LFFFFMPW", "LFFFAD"];
		this.lfrr_tvset = ["LFRRFMP", "LFRRAPP"];
		this.dsna_tvset = ["LFDSNA"];
	}

	/*  -------------------------------------------------------------
		Lit le fichier json de regul
			@param {string} day - "yyyy-mm-dd"
			@param {string} zone - "AE" ou "AW"
            @returns {"LFMMFMPE":[],"LFMMFMPW":[],"LFMMAPP":[],...}
	----------------------------------------------------------------- */
	async get_regul() {
		const date = this.day.replace(/-/g, ''); // yyyymmdd
		const url = `../b2b/json/${date}-reg.json`;	
		const resp = await loadJson(url);
		return resp;
	}

	async get_total_delay() {
		let total_delay_est = 0, total_delay_west = 0, total_delay_app = 0; 
		this.regul["LFMMFMPE"].forEach( value => {
			total_delay_est += value.delay;
		});
		this.regul["LFMMFMPW"].forEach( value => {
			total_delay_west += value.delay;
		});
		this.regul["LFMMAPP"].forEach( value => {
			total_delay_app += value.delay;
		});
		return {"est": total_delay_est, "west": total_delay_west, "app": total_delay_app}
	}

}


class period_regul {
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
	
    /*  ----------------------------------------------------------------------
		Lit le fichier json de regul
			@param {string} day - "yyyy-mm-dd"
			@param {string} zone - "AE" ou "AW"
            @returns {date1:objet regul, date2:objet regul,...}
	-------------------------------------------------------------------------- */
    async init() {
		this.reguls = await this.get_reguls();
		console.log(this.reguls);
	}

	async get_reguls() {
        const reguls = {};
        for (const date of this.dates_arr) {
             const r = new regul(date, this.zone);
			 await r.init();
             reguls[date] = r.regul;
        }
		return reguls;
	}

	/*  ------------------------------------------------------------------	
		 @param {string} containerId - Id de l'HTML Element container 
		------------------------------------------------------------------ */	 
        
	async show_result_reg(containerId) {
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








/*  ---------------------
	  tableau des TVset
	--------------------- */
const lfmm_tvset = ["LFMMFMPE", "LFMMFMPW", "LFMMAPP"];
const lfbb_tvset = ["LFBBFMP", "LFBBAPP"];
const lfee_tvset = ["LFEEFMP", "LFEEAPP"];
const lfff_tvset = ["LFFFFMPE", "LFFFFMPW", "LFFFAD"];
const lfrr_tvset = ["LFRRFMP", "LFRRAPP"];
const dsna_tvset = ["LFDSNA"];


class regul {
	constructor(day, zone) {
		this.day = day;
		this.zone = zone;
	}

	async init() {
		this.regul = await this.get_regul();
	
		lfmm_tvset.forEach(tvset => {
			this[tvset] = {};
		})

		lfmm_tvset.forEach(tvset => {
			this[tvset].tot_delay = this.get_total_delay(tvset);
			this[tvset].delay_by_cause = this.get_reg_by_causes(tvset);
		})
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

	get_total_delay(tvset) {
		let total_delay = 0;
		this.regul[tvset].forEach( value => {
			total_delay += value.delay;
		});
		return total_delay;
	}

	/*  --------------------------
		  {
			  "ATC_STAFFING": 318,
			  "WEATHER": 728
		  }
		-------------------------- */
	get_reg_by_causes(tvset) {
		const reg = {};
		let causes = [];
		this.regul[tvset].forEach( value => {
			causes.push(value.reason);
		});
		// enlève les doublons
		causes = [...new Set(causes)];
		causes.forEach(value => {
			reg[value] = 0;
		})
		this.regul[tvset].forEach( value => {
			reg[value] += value.delay;
		});
		console.log(reg);
		return reg;
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
		this.tot_delays = this.get_total_period_delay();
		console.log(this.reguls);
	}

	async get_reguls() {
        const reguls = {};
        for (const date of this.dates_arr) {
             const r = new regul(date, this.zone);
			 await r.init();
             reguls[date] = {
				 "reguls": r.regul,
				 "LFMMFMPE": r["LFMMFMPE"],
				 "LFMMFMPW": r["LFMMFMPW"],
				 "LFMMAPP": r["LFMMAPP"]
			 }
        }
		return reguls;
	}

	get_total_period_delay() {
		const delay = {"LFMMFMPE": 0, "LFMMFMPW": 0, "LFMMAPP": 0}
		for (const date of this.dates_arr) {
			delay["LFMMFMPE"] += this.reguls[date]["LFMMFMPE"]["tot_delay"];
			delay["LFMMFMPW"] += this.reguls[date]["LFMMFMPW"]["tot_delay"];
			delay["LFMMAPP"] += this.reguls[date]["LFMMAPP"]["tot_delay"];
		}
		return delay;
	}
	/*  ------------------------------------------
			delay = {
				"LFMMFMPE": {
					"cause1": 41,
					"cause2": 1400
				}, 
				...
			}
		------------------------------------------ */
	get_total_period_delay_by_cause() {
		let delay = {"LFMMFMPE": {}, "LFMMFMPW": {}, "LFMMAPP": {}};
		let tab_FMPE = [];
		let tab_FMPW = [];
		let tab_APP = [];
		for (const date of this.dates_arr) {
			tab_FMPE = [...tab, ...Object.keys(this.reguls[date]["LFMMFMPE"]["delay_by_cause"])];
			tab_FMPW = [...tab, ...Object.keys(this.reguls[date]["LFMMFMPW"]["delay_by_cause"])];
			tab_APP = [...tab, ...Object.keys(this.reguls[date]["LFMMAPP"]["delay_by_cause"])];
		}
		tab_FMPE.forEach(cause => {
			delay["LFMMFMPE"][cause] = 0;
		})
		tab_FMPW.forEach(cause => {
			delay["LFMMFMPW"][cause] = 0;
		})
		tab_APP.forEach(cause => {
			delay["LFMMAPP"][cause] = 0;
		})
		for (const date of this.dates_arr) {
			Object.keys(this.reguls[date]["LFMMFMPE"]["delay_by_cause"]).forEach(cause => {
				delay["LFMMFMPE"][cause] += this.reguls[date]["LFMMFMPE"]["delay_by_cause"][cause];
			})
			Object.keys(this.reguls[date]["LFMMFMPE"]["delay_by_cause"]).forEach(cause => {
				delay["LFMMFMPW"][cause] += this.reguls[date]["LFMMFMPW"]["delay_by_cause"][cause];
			})
			Object.keys(this.reguls[date]["LFMMAPP"]["delay_by_cause"]).forEach(cause => {
				delay["LFMMAPP"][cause] += this.reguls[date]["LFMMAPP"]["delay_by_cause"][cause];
			})
		}
		return delay;
	}

	/*  ------------------------------------------------------------------	
		 @param {string} containerId - Id de l'HTML Element container 
		------------------------------------------------------------------ */	 
        
	show_result_reg(containerId) {
		let delays = `<h2>Delay : ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</h2><br>`;
		delays += "<div class='delay'>";
		let res = `
		<table class="sortable">
			<caption>LFMM-EST : ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</caption>
			<thead><tr class="titre"><th class="space">Date</th><th>Regul Id</th><th>TV</th><th>Début</th><th>Fin</th><th>Délai</th><th>Raison</th><th>vols</th></tr></thead>
			<tbody>`;
		
        for (const date of this.dates_arr) {
            this.reguls[date]["reguls"]["LFMMFMPE"].forEach( value => {
                let deb = extract_time(value.applicability.wef);
                let fin = extract_time(value.applicability.unt);
                res += '<tr>'; 
                res +=`<td>${reverse_date(date)}</td><td>${value.regId}</td><td>${value.tv}</td><td>${deb} TU</td><td>${fin} TU</td><td>${value.delay}</td><td>${value.reason}</td><td>${value.impactedFlights}</td>`;
                res += '</tr>';	
            });
        }
        res += '</tbody></table>';
		res += `
		<table class="sortable">
			<caption>LFMM-OUEST : ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</caption>
			<thead><tr class="titre"><th class="space">Date</th><th>Regul Id</th><th>TV</th><th>Début</th><th>Fin</th><th>Délai</th><th>Raison</th><th>vols</th></tr></thead>
			<tbody>`;
        for (const date of this.dates_arr) {
            this.reguls[date]["reguls"]["LFMMFMPW"].forEach( value => {
                let deb = extract_time(value.applicability.wef);
                let fin = extract_time(value.applicability.unt);
                res += '<tr>'; 
                res +=`<td>${reverse_date(date)}</td><td>${value.regId}</td><td>${value.tv}</td><td>${deb} TU</td><td>${fin} TU</td><td>${value.delay}</td><td>${value.reason}</td><td>${value.impactedFlights}</td>`;
                res += '</tr>';	
            });
        }
        res += '</tbody></table>';
		res += `
		<table class="sortable">
			<caption>LFMM-APP : ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</caption>
			<thead><tr class="titre"><th class="space">Date</th><th>Regul Id</th><th>TV</th><th>Début</th><th>Fin</th><th>Délai</th><th>Raison</th><th>vols</th></tr></thead>
			<tbody>`;
        for (const date of this.dates_arr) {
            this.reguls[date]["reguls"]["LFMMAPP"].forEach( value => {
                let deb = extract_time(value.applicability.wef);
                let fin = extract_time(value.applicability.unt);
                res += '<tr>'; 
                res +=`<td>${reverse_date(date)}</td><td>${value.regId}</td><td>${value.tv}</td><td>${deb} TU</td><td>${fin} TU</td><td>${value.delay}</td><td>${value.reason}</td><td>${value.impactedFlights}</td>`;
                res += '</tr>';	
            });
        }
		res += '</tbody></table>';
		delays += `<span class="rect">LFMM CTA : ${this.tot_delays["LFMMFMPE"]+this.tot_delays["LFMMFMPW"]} mn</span><span class="rect">LFMM Est : ${this.tot_delays["LFMMFMPE"]} mn</span><span class="rect">LFMM West : ${this.tot_delays["LFMMFMPW"]} mn</span><span class="rect">LFMM App : ${this.tot_delays["LFMMAPP"]} mn</span>`;
		delays += "</div>";
		delays += res;
		$(containerId).innerHTML = delays;
		
	}
}

class weekly_regs {
	constructor(year) {
		this.year = year;
	}

	async init() {
		this.weekly_regs = await this.get_data_weekly_regs();
		this.delay = this.get_weekly_delay();
	}

	/*  ----------------------------------------------------------------------------------
		Lit le fichier json des delay weekly
			@param {string} day - "yyyy-mm-dd"
            @returns {
				"year":2022,
				"cta":{"1":0,"2":142,...},
				"est":{"1":0,"2":0,...},
				"west":{"1":0,"2":142,...},
			} = this.delay
	-------------------------------------------------------------------------------------*/
	async get_data_weekly_regs() {
		const url = `../b2b/json/${this.year}-weekly-reg.json`;	
		const resp = await loadJson(url);
		return resp;
	}

	get_weekly_delay() {
		const regs = {};
		regs['year'] = parseInt(this.weekly_regs['year']);
		regs['cta'] = [];
		regs['est'] = [];
		regs['west'] = [];
		regs['app'] = [];
		for(let i=1;i<54;i++) { //53 semaines max
			if (typeof this.weekly_regs['cta'][i] !== 'undefined') regs['cta'].push(this.weekly_regs['cta'][i]);
			if (typeof this.weekly_regs['est'][i] !== 'undefined') regs['est'].push(this.weekly_regs['est'][i]);
			if (typeof this.weekly_regs['west'][i] !== 'undefined') regs['west'].push(this.weekly_regs['west'][i]);
			if (typeof this.weekly_regs['app'][i] !== 'undefined') regs['app'].push(this.weekly_regs['app'][i]);
		}
		return regs;
	}
}







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
		await this.add_earlier_data();
		console.log("UPDATE");
		console.log(this.regul);
	
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
			@param {string} type - "" ou "0320" ou "0420" ou "0620"
            @returns {"LFMMFMPE":[],"LFMMFMPW":[],"LFMMAPP":[],...}
	----------------------------------------------------------------- */
	async get_regul(heure = "") {
		const date = this.day.replace(/-/g, ''); // yyyymmdd
		const year = this.day.substr(0,4);
		const url = `../b2b/json/${year}/${date}-reg${heure}.json`;	
		const resp = await loadJson(url);
		return resp;
	}

	/*  -----------------------------------------------------------------------
		Ajoute les propriétés "CREATION" et/ou "UPDATE" et/ou "DELETION"
		pour chaque regulation
			@param {string} type - "" ou "0320" ou "0420" ou "0620"
            @returns {"LFMMFMPE":[],"LFMMFMPW":[],"LFMMAPP":[],...}
	--------------------------------------------------------------------------- */
	async add_earlier_data() {
		lfmm_tvset.forEach(tvset => {
			this.regul[tvset].forEach(obj => {
				const type = obj["lastUpdate"]["userUpdateType"];
				obj[type] = obj["lastUpdate"]["userUpdateEventTime"];
			})
		})
		const update0320 = await this.get_regul("0320");
		const update0420 = await this.get_regul("0420");
		const update0620 = await this.get_regul("0620");
		if (typeof update0320 !== 'undefined') {
			lfmm_tvset.forEach(tvset => {
				this.regul[tvset].forEach(obj => {
					update0320[tvset].forEach(obj0320 => {
						if (typeof obj0320["regId"] !== 'undefined' && obj0320["regId"] === obj["regId"]) {
							const type = obj0320["lastUpdate"]["userUpdateType"];
							obj[type] = obj0320["lastUpdate"]["userUpdateEventTime"];
						}
					})
				})
			})
		}
		if (typeof update0420 !== 'undefined') {
			lfmm_tvset.forEach(tvset => {
				this.regul[tvset].forEach(obj => {
					update0420[tvset].forEach(obj0420 => {
						if (typeof obj0420["regId"] !== 'undefined' && obj0420["regId"] === obj["regId"]) {
							const type = obj0420["lastUpdate"]["userUpdateType"];
							obj[type] = obj0420["lastUpdate"]["userUpdateEventTime"];
						}
					})
				})
			})
		}
		if (typeof update0620 !== 'undefined') {
			lfmm_tvset.forEach(tvset => {
				this.regul[tvset].forEach(obj => {
					update0620[tvset].forEach(obj0620 => {
						if (typeof obj0620["regId"] !== 'undefined' && obj0620["regId"] === obj["regId"]) {
							const type = obj0620["lastUpdate"]["userUpdateType"];
							obj[type] = obj0620["lastUpdate"]["userUpdateEventTime"];
						}
					})
				})
			})
		}
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
		//console.log(reg);
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
		this.rates = {};
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
		//console.log(this.reguls);
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
				const id = value.regId;
				this.rates[id] = {};
				this.rates[id]["limites"]  = value["constraints"];
				this.rates[id]["CREATION"] = (typeof value["CREATION"] !== 'undefined') ? value["CREATION"] : null;
				this.rates[id]["UPDATE"] = (typeof value["UPDATE"] !== 'undefined') ? value["UPDATE"] : null;
				this.rates[id]["DELETION"] = (typeof value["DELETION"] !== 'undefined') ? value["DELETION"] : null;
                res += '<tr>'; 
                res +=`<td>${reverse_date(date)}</td><td id='${id}' class='hover_reg_id'>${value.regId}</td><td>${value.tv}</td><td>${deb} TU</td><td>${fin} TU</td><td>${value.delay}</td><td>${value.reason}</td><td>${value.impactedFlights}</td>`;
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
				const id = value.regId;
				this.rates[id] = {};
				this.rates[id]["limites"]  = value["constraints"];
				this.rates[id]["CREATION"] = (typeof value["CREATION"] !== 'undefined') ? value["CREATION"] : null;
				this.rates[id]["UPDATE"] = (typeof value["UPDATE"] !== 'undefined') ? value["UPDATE"] : null;
				this.rates[id]["DELETION"] = (typeof value["DELETION"] !== 'undefined') ? value["DELETION"] : null;
                res += '<tr>'; 
                res +=`<td>${reverse_date(date)}</td><td id='${id}' class='hover_reg_id'>${id}</td><td>${value.tv}</td><td>${deb} TU</td><td>${fin} TU</td><td>${value.delay}</td><td>${value.reason}</td><td>${value.impactedFlights}</td>`;
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
				const id = value.regId;
				this.rates[id] = {};
				this.rates[id]["limites"]  = value["constraints"];
				this.rates[id]["CREATION"] = (typeof value["CREATION"] !== 'undefined') ? value["CREATION"] : null;
				this.rates[id]["UPDATE"] = (typeof value["UPDATE"] !== 'undefined') ? value["UPDATE"] : null;
				this.rates[id]["DELETION"] = (typeof value["DELETION"] !== 'undefined') ? value["DELETION"] : null;
                res += '<tr>'; 
                res +=`<td>${reverse_date(date)}</td><td id='${id}' class='hover_reg_id'>${id}</td><td>${value.tv}</td><td>${deb} TU</td><td>${fin} TU</td><td>${value.delay}</td><td>${value.reason}</td><td>${value.impactedFlights}</td>`;
                res += '</tr>';	
            });
        }
		res += '</tbody></table>';
		delays += `<span class="rect">LFMM CTA : ${this.tot_delays["LFMMFMPE"]+this.tot_delays["LFMMFMPW"]} mn</span><span class="rect">LFMM Est : ${this.tot_delays["LFMMFMPE"]} mn</span><span class="rect">LFMM West : ${this.tot_delays["LFMMFMPW"]} mn</span><span class="rect">LFMM App : ${this.tot_delays["LFMMAPP"]} mn</span>`;
		delays += "</div>";
		delays += res;
		$(containerId).innerHTML = delays;
		//console.log("this.rates");
		//console.log(this.rates);
		const td_reg_id = document.querySelectorAll('.hover_reg_id');
		td_reg_id.forEach(td_el => {
			td_el.addEventListener('mouseover', (event) => {
				const reg_id = td_el.id;
				const el = document.createElement('div');
				el.setAttribute('id', 'popratereg');
				let contenu = reg_id+"<br>";
				let data = this.rates[reg_id];
				console.log("data");
				console.log(data);
				if (data["CREATION"] !== null) {
					contenu += "CREATION" + " on " + data["CREATION"] + "<br>";
				}
				if (data["UPDATE"] !== null) {
					contenu += "UPDATE" + " on " + data["UPDATE"] + "<br>";
				}
				if (data["DELETION"] !== null) {
					contenu += "DELETION" + " on " + data["DELETION"] + "<br>";
				}
				contenu += "<br>";
				data.limites.forEach( con => {
					let rate = parseInt(con.normalRate) + parseInt(con.pendingRate);
					contenu += extract_time(con.constraintPeriod.wef) + " - " + extract_time(con.constraintPeriod.unt) + "  : Rate " + rate + "<br>";
				})
				// const pos = td_el.parentNode.parentNode.parentNode.getBoundingClientRect();   element Table
				const pos = td_el.getBoundingClientRect();
				const tabl = td_el.parentNode.parentNode.parentNode.getBoundingClientRect();
				el.style.position = 'absolute';
				el.style.left = tabl.right + 30 + 'px';
				el.style.top = pos.top - 50 + window.scrollY + 'px';
				el.style.backgroundColor = '#d99';
				el.style.padding = '10px';
				el.style.width = '250px';
				let parentDiv = td_el.parentNode;
				parentDiv.insertBefore(el, $('globalcontainer'));
				el.innerHTML = contenu;
			})
			td_el.addEventListener('mouseleave', (event) => {
				$('popratereg').remove();
			})
		})
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
		const url = `../b2b/json/${this.year}/${this.year}-weekly-reg.json`;	
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
			if (typeof this.weekly_regs[i] !== 'undefined') {
				const reg_est = parseInt(this.weekly_regs[i]['LFMMFMPE']['delay']);
				const reg_west = parseInt(this.weekly_regs[i]['LFMMFMPW']['delay']);
				const reg_cta = reg_est+reg_west;
				const reg_app = parseInt(this.weekly_regs[i]['LFMMAPP']['delay']);
				regs['cta'].push(reg_cta);
				regs['est'].push(reg_est);
				regs['west'].push(reg_west);
				regs['app'].push(reg_app);
			} 
		}
		return regs;
	}

	/* 	----------------------------------------------------
		@returns : {
			"cta": {
				"ATC_STAFFING":1953,
				"SPECIAL_EVENT":311,
				"cause": delai
				...
			},
			"est" : {...},
			"west" : {...},
			"app": { ...} 
		}
	---------------------------------------------------- */

	get_weekly_reg_by_cause() {
		const regs = {};
		regs['year'] = parseInt(this.weekly_regs['year']);
		regs['cta'] = [];
		regs['est'] = [];
		regs['west'] = [];
		regs['app'] = [];
		for(let i=1;i<54;i++) { 
			if (typeof this.weekly_regs[i] !== 'undefined') {
				const reg_est = this.weekly_regs[i]['LFMMFMPE']['causes'];
				const reg_west = this.weekly_regs[i]['LFMMFMPW']['causes'];
				const reg_app = this.weekly_regs[i]['LFMMAPP']['causes'];
				// Fusion des objets reg_est et reg_west
				const reg_cta = {};
				Object.assign(reg_cta, this.weekly_regs[i]['LFMMFMPE']['causes']);
				const key_est = Object.keys(reg_est);
				const key_west = Object.keys(reg_west);
				key_west.forEach( elem => {
					if (!key_est.includes(elem)) {
						reg_cta[elem] = reg_west[elem];
					} else {
						reg_cta[elem] += reg_west[elem];
					}
				})
				regs['cta'].push(reg_cta);
				regs['est'].push(reg_est);
				regs['west'].push(reg_west);
				regs['app'].push(reg_app);
			} 
		}
		return regs;
	}
}

class monthly_regs {
	constructor(year) {
		this.year = year;
	}

	async init() {
		this.monthly_regs = await this.get_data_monthly_regs();
		this.delay = this.get_monthly_delay();
		this.delay_par_cause = this.get_monthly_reg_by_cause();
		this.delay_par_tvs = this.get_monthly_reg_by_tvs();
	}

	/*  ----------------------------------------------------------------------------------
		Lit le fichier json des delay monthly
			@param {string} day - "yyyy-mm-dd"
            @returns {
				"year":2022,
				"N°sem":{
					"LFMMFMPE":{
						"delay":2264,
						"causes":{"ATC_STAFFING":1953,"SPECIAL_EVENT":311}},
					"LFMMFMPW":{"delay":142,"causes":{"SPECIAL_EVENT":142}},
					"LFMMAPP":{"delay":15042,"causes":{"ATC_CAPACITY":6577,"ATC_STAFFING":6162,"WEATHER":874,"AERODROME_CAPACITY":347,"AIRSPACE_MANAGEMENT":11,		 			"ATC_EQUIPMENT":349,"ATC_INDUSTRIAL_ACTION":722}},
					"LFBBFMP":{
						...
					}	
				},
				...
			} = this.delay
	-------------------------------------------------------------------------------------*/
	async get_data_monthly_regs() {
		const url = `../b2b/json/${this.year}/${this.year}-monthly-reg.json`;	
		const resp = await loadJson(url);
		return resp;
	}

	/*  ----------------------------------------------------------------------------------
			Calcul des délais totaux
            @returns {
				"year":2022,
				"cta":[délai sem 1, délai sem 2, ...],
				"est":[délai sem 1, délai sem 2, ...],
				"west":[délai sem 1, délai sem 2, ...],
				"app":[délai sem 1, délai sem 2, ...],		
			} 
	-------------------------------------------------------------------------------------*/

	get_monthly_delay() {
		const regs = {};
		regs['year'] = parseInt(this.monthly_regs['year']);
		regs['cta'] = [];
		regs['est'] = [];
		regs['west'] = [];
		regs['app'] = [];
		for(let i=1;i<13;i++) { 
			if (typeof this.monthly_regs[i] !== 'undefined') {
				const reg_est = parseInt(this.monthly_regs[i]['LFMMFMPE']['delay']);
				const reg_west = parseInt(this.monthly_regs[i]['LFMMFMPW']['delay']);
				const reg_cta = reg_est+reg_west;
				const reg_app = parseInt(this.monthly_regs[i]['LFMMAPP']['delay']);
				regs['cta'].push(reg_cta);
				regs['est'].push(reg_est);
				regs['west'].push(reg_west);
				regs['app'].push(reg_app);
			} 
		}
		return regs;
	}

/* 	-----------------------------------------------------------------
		@input "causes": {"ATC_STAFFING":1953,"SPECIAL_EVENT":311}
		@returns : {
			"cta": [ [ array du mois janvier
				{"ATC_STAFFING":1953},  
				{"SPECIAL_EVENT":311},
				{"cause": delai}
				...
				], [ array du mois février
				...
				]... ]
			"est" : [[...]],
			"west" : [[...]],
			"app": [[...]] 
		}
	----------------------------------------------------------------- */

	get_monthly_reg_by_cause() {
		const regs = {};
		regs['year'] = parseInt(this.monthly_regs['year']);
		regs['cta'] = [];
		regs['est'] = [];
		regs['west'] = [];
		regs['app'] = [];
		for(let i=1;i<13;i++) { 
			if (typeof this.monthly_regs[i] !== 'undefined') {
				const reg_est = this.monthly_regs[i]['LFMMFMPE']['causes'];
				const reg_west = this.monthly_regs[i]['LFMMFMPW']['causes'];
				const reg_app = this.monthly_regs[i]['LFMMAPP']['causes'];
				const key_est = Object.keys(reg_est);
				const r_est = [];
				key_est.forEach (elem => {
					if (elem === 'ATC_STAFFING') r_est.push({ [elem]: reg_est[elem] });
				})
				key_est.forEach (elem => {
					if (elem === 'ATC_CAPACITY') r_est.push({ [elem]: reg_est[elem] });
				})
				key_est.forEach (elem => {
					if (elem === 'WEATHER') r_est.push({ [elem]: reg_est[elem] });
				})
				key_est.forEach (elem => {
					if (elem === 'AIRSPACE_MANAGEMENT') r_est.push({ [elem]: reg_est[elem] });
				})
				key_est.forEach (elem => {
					if (elem === 'ATC_EQUIPMENT') r_est.push({ [elem]: reg_est[elem] });
				})
				key_est.forEach (elem => {
					if (elem === 'ATC_INDUSTRIAL_ACTION') r_est.push({ [elem]: reg_est[elem] });
				})
				key_est.forEach (elem => {
					if (elem !== 'ATC_STAFFING' && elem !== 'ATC_CAPACITY' && elem !== 'WEATHER' && elem !== 'AIRSPACE_MANAGEMENT' && elem !== 'ATC_EQUIPMENT' && elem !== 'ATC_INDUSTRIAL_ACTION') r_est.push({ [elem]: reg_est[elem] });
				})
				const key_west = Object.keys(reg_west);
				const r_west = [];
				key_west.forEach (elem => {
					if (elem === 'ATC_STAFFING') r_west.push({ [elem]: reg_west[elem] });
				})
				key_west.forEach (elem => {
					if (elem === 'ATC_CAPACITY') r_west.push({ [elem]: reg_west[elem] });
				})
				key_west.forEach (elem => {
					if (elem === 'WEATHER') r_west.push({ [elem]: reg_west[elem] });
				})
				key_west.forEach (elem => {
					if (elem === 'AIRSPACE_MANAGEMENT') r_west.push({ [elem]: reg_west[elem] });
				})
				key_west.forEach (elem => {
					if (elem === 'ATC_EQUIPMENT') r_west.push({ [elem]: reg_west[elem] });
				})
				key_west.forEach (elem => {
					if (elem === 'ATC_INDUSTRIAL_ACTION') r_west.push({ [elem]: reg_west[elem] });
				})
				key_west.forEach (elem => {
					if (elem !== 'ATC_STAFFING' && elem !== 'ATC_CAPACITY' && elem !== 'WEATHER' && elem !== 'AIRSPACE_MANAGEMENT' && elem !== 'ATC_EQUIPMENT' && elem !== 'ATC_INDUSTRIAL_ACTION') r_west.push({ [elem]: reg_west[elem] });
				})
				// Fusion des objets reg_est et reg_west
				const reg_cta = {};
				Object.assign(reg_cta, this.monthly_regs[i]['LFMMFMPE']['causes']);
				key_west.forEach( elem => {
					if (!key_est.includes(elem)) {
						reg_cta[elem] = reg_west[elem];
					} else {
						reg_cta[elem] += reg_west[elem];
					}
				})
				const key_cta = Object.keys(reg_cta);
				const r_cta = [];
				key_cta.forEach (elem => {
					if (elem === 'ATC_STAFFING') r_cta.push({ [elem]: reg_cta[elem] });
				})
				key_cta.forEach (elem => {
					if (elem === 'ATC_CAPACITY') r_cta.push({ [elem]: reg_cta[elem] });
				})
				key_cta.forEach (elem => {
					if (elem === 'WEATHER') r_cta.push({ [elem]: reg_cta[elem] });
				})
				key_cta.forEach (elem => {
					if (elem === 'AIRSPACE_MANAGEMENT') r_cta.push({ [elem]: reg_cta[elem] });
				})
				key_cta.forEach (elem => {
					if (elem === 'ATC_EQUIPMENT') r_cta.push({ [elem]: reg_cta[elem] });
				})
				key_cta.forEach (elem => {
					if (elem === 'ATC_INDUSTRIAL_ACTION') r_cta.push({ [elem]: reg_cta[elem] });
				})
				key_cta.forEach (elem => {
					if (elem !== 'ATC_STAFFING' && elem !== 'ATC_CAPACITY' && elem !== 'WEATHER' && elem !== 'AIRSPACE_MANAGEMENT' && elem !== 'ATC_EQUIPMENT' && elem !== 'ATC_INDUSTRIAL_ACTION') r_cta.push({ [elem]: reg_cta[elem] });
				})
				const key_app = Object.keys(reg_app);
				const r_app = [];
				key_app.forEach (elem => {
					if (elem === 'ATC_STAFFING') r_app.push({ [elem]: reg_app[elem] });
				})
				key_app.forEach (elem => {
					if (elem === 'ATC_CAPACITY') r_app.push({ [elem]: reg_app[elem] });
				})
				key_app.forEach (elem => {
					if (elem === 'WEATHER') r_app.push({ [elem]: reg_app[elem] });
				})
				key_app.forEach (elem => {
					if (elem === 'AIRSPACE_MANAGEMENT') r_app.push({ [elem]: reg_app[elem] });
				})
				key_app.forEach (elem => {
					if (elem === 'ATC_EQUIPMENT') r_app.push({ [elem]: reg_app[elem] });
				})
				key_app.forEach (elem => {
					if (elem === 'ATC_INDUSTRIAL_ACTION') r_app.push({ [elem]: reg_app[elem] });
				})
				key_app.forEach (elem => {
					if (elem === 'AERODROME_CAPACITY') r_app.push({ [elem]: reg_app[elem] });
				})
				key_app.forEach (elem => {
					if (elem !== 'ATC_STAFFING' && elem !== 'ATC_CAPACITY' && elem !== 'WEATHER' && elem !== 'AIRSPACE_MANAGEMENT' && elem !== 'ATC_EQUIPMENT' && elem !== 'ATC_INDUSTRIAL_ACTION' && elem !=='AERODROME_CAPACITY') r_app.push({ [elem]: reg_app[elem] });
				})
				regs['cta'].push(r_cta);
				regs['est'].push(r_est);
				regs['west'].push(r_west);
				regs['app'].push(r_app);
			} 
		}
		return regs;
	}

	/* 	-----------------------------------------------------------------
		@input "causes": {"ATC_STAFFING":1953,"SPECIAL_EVENT":311}
		@returns : {
			"cta": [ [ array du mois janvier
				{"ATC_STAFFING":1953},  
				{"SPECIAL_EVENT":311},
				{"cause": delai}
				...
				], [ array du mois février
				...
				]... ]
			"est" : [[...]],
			"west" : [[...]],
			"app": [[...]] 
		}
	----------------------------------------------------------------- */

	get_monthly_reg_by_tvs() {
		const regs = {};
		regs['year'] = parseInt(this.monthly_regs['year']);
		regs['cta'] = [];
		regs['est'] = [];
		regs['west'] = [];
		regs['app'] = [];
		for(let i=1;i<13;i++) { 
			if (typeof this.monthly_regs[i] !== 'undefined') {
			  if (typeof this.monthly_regs[i]['LFMMFMPE']['tvs'] !== 'undefined') {
				const reg_est = this.monthly_regs[i]['LFMMFMPE']['tvs'];
				const reg_west = this.monthly_regs[i]['LFMMFMPW']['tvs'];
				const reg_app = this.monthly_regs[i]['LFMMAPP']['tvs'];
				const key_est = Object.keys(reg_est);
				const r_est = [];
				key_est.forEach (elem => {
					r_est.push({ [elem]: reg_est[elem] });
				})
				const key_west = Object.keys(reg_west);
				const r_west = [];
				key_west.forEach (elem => {
					r_west.push({ [elem]: reg_west[elem] });
				})
				// Fusion des objets reg_est et reg_west
				const reg_cta = {};
				Object.assign(reg_cta, this.monthly_regs[i]['LFMMFMPE']['tvs']);
				key_west.forEach( elem => {
					if (!key_est.includes(elem)) {
						reg_cta[elem] = reg_west[elem];
					} else {
						reg_cta[elem] += reg_west[elem];
					}
				})
				const key_cta = Object.keys(reg_cta);
				const r_cta = [];
				key_cta.forEach (elem => {
					r_cta.push({ [elem]: reg_cta[elem] });
				})
				const key_app = Object.keys(reg_app);
				const r_app = [];
				key_app.forEach (elem => {
					r_app.push({ [elem]: reg_app[elem] });
				})

				// tri
				function tri_obj(a,b) {
					return b[Object.keys(b)[0]] - a[Object.keys(a)[0]];
				}
				const max_tv = 15;
				r_cta.sort(tri_obj);
				if (r_cta.length > max_tv) r_cta.length = max_tv;
				r_est.sort(tri_obj);
				if (r_est.length > max_tv) r_est.length = max_tv;
				r_west.sort(tri_obj);
				if (r_west.length > max_tv) r_west.length = max_tv;
				r_app.sort(tri_obj);
				if (r_app.length > max_tv) r_app.length = max_tv;
				regs['cta'].push(r_cta);
				regs['est'].push(r_est);
				regs['west'].push(r_west);
				regs['app'].push(r_app);
		      }
			} 
		}
		console.log("REGS");
		console.log(regs);
		return regs;
	}
}






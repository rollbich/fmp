/*  ----------------------------------------------------
	  		tableau des TVset
	---------------------------------------------------- */
const lfmm_tvset = ["LFMMFMPE", "LFMMFMPW", "LFMMAPP"];
const lfbb_tvset = ["LFBBFMP", "LFBBAPP"];
const lfee_tvset = ["LFEEFMP", "LFEEAPP"];
const lfff_tvset = ["LFFFFMPE", "LFFFFMPW", "LFFFAD"];
const lfrr_tvset = ["LFRRFMP", "LFRRAPP"];
const dsna_tvset = ["LFDSNA"];

/*  -----------------------------------------------------------------------------------------------------------------
		Class regul
			@param {string} day	- "yyyy-mm-dd"
			@param {string} zone - "AE" ou "AW" : ne sert que pour savoir dans quelle zone on travaille
				car toutes les zones sont récupérées
			@param {boolean} details : true pour récupérer les données reg de la journéee (fichier reg0320.json ....)
	----------------------------------------------------------------------------------------------------------------- */

class regul {
	constructor(day, zone, details = true) {
		this.day = day;
		this.zone = zone;
		this.details = details;
	}

	async init() {
		this.regul = await this.get_regul();
		if (this.details === true) await this.add_earlier_data();
	
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
            @returns {
				"LFMMFMPE":[
					{
					"regId": "MAB3431",
					"tv": "LFMAB34",
					"lastUpdate": {
						"eventTime": "2022-08-31 14:02:00",
						"userUpdateEventTime": "2022-08-31 14:02:00",
						"userUpdateType": "DELETION",
						"userId": "F3BBT"
					},
					"applicability": { "wef": "2022-08-31 14:00", "unt": "2022-08-31 16:00" },
					"constraints": [
						{
						"constraintPeriod": {
							"wef": "2022-08-31 14:00",
							"unt": "2022-08-31 14:16"
						},
						"normalRate": 38,
						"pendingRate": 0,
						"equipmentRate": 0
						},
						{
						"constraintPeriod": {
							"wef": "2022-08-31 14:16",
							"unt": "2022-08-31 14:28"
						},
						"normalRate": 42,
						"pendingRate": 0,
						"equipmentRate": 0
						},
						{
						"constraintPeriod": {
							"wef": "2022-08-31 14:28",
							"unt": "2022-08-31 16:00"
						},
						"normalRate": 46,
						"pendingRate": 0,
						"equipmentRate": 0
						}
					],
					"reason": "WEATHER",
					"delay": 78,
					"impactedFlights": 55,
					"TVSet": "LFMMFMPE"
					},
					{...}
				],
				"LFMMFMPW":[],
				"LFMMAPP":[],...
			}
	----------------------------------------------------------------- */
	async get_regul() {
		const date = this.day.replace(/-/g, ''); // yyyymmdd
		const year = this.day.substr(0,4);
		const month = date.substr(4,2);
		const url = `${year}/${month}/${date}-reg.json`;	
		const resp = await get_data(url);
		if (typeof resp !== 'undefined') {
			return resp;
		}
		else {
			show_popup(`Erreur`, `Le fichier Reg du ${date} n'existe pas`);
			await wait(800);
		    document.querySelector('.popup-close').click();
		}
	}

	async get_regul_update(heure = "") {
		const date = this.day.replace(/-/g, ''); // yyyymmdd
		const year = this.day.substr(0,4);
		const month = date.substr(4,2);
		const url = `${year}/${month}/${date}-reg${heure}.json`;	
		let resp = await get_data(url);
		// return 404 si le fichier n'existe pas
		// dans ce cas on retourne {"LFMMFMPE":[],"LFMMFMPW":[],"LFMMAPP":[], ...}
		if (resp === 404) {
			resp = {};
			lfmm_tvset.forEach(tvset => {
				resp[tvset] = [];
			})
		}
		return resp;
	}

	/*  -----------------------------------------------------------------------
		Ajoute les propriétés "CREATION" et/ou "UPDATE" et/ou "DELETION"
		pour chaque regulation
			@param {string} type - "" ou "0320" ou "0420" ou "0620"
            @returns {"LFMMFMPE":[],"LFMMFMPW":[],"LFMMAPP":[],...}
	--------------------------------------------------------------------------- */
	async add_earlier_data() {
		if (typeof this.regul !== 'undefined') {
			lfmm_tvset.forEach(tvset => {
				
					this.regul[tvset].forEach(obj => {
							// sur les anciens fichier, la clé "lastUpdate" n'existe pas
							if (typeof obj["lastUpdate"] != 'undefined') {
								const type = obj["lastUpdate"]["userUpdateType"];
								obj[type] = obj["lastUpdate"]["userUpdateEventTime"];
							}
					})
				
			})
			const time_array = ["0320","0420","0620","0820","1020","1220","1420","1620"];
			const update = {};
			for(const temps of time_array) {
				update[temps] = await this.get_regul_update(temps);
			}
			for(const temps of time_array) {
				if (typeof update[temps] !== 'undefined') {
					lfmm_tvset.forEach(tvset => {
						this.regul[tvset].forEach(obj => {
							update[temps][tvset].forEach(el => {
								if (typeof el["regId"] !== 'undefined' && el["regId"] === obj["regId"]) {
									const type = el["lastUpdate"]["userUpdateType"];
									obj[type] = el["lastUpdate"]["userUpdateEventTime"];
								}
							})
						})
					})
				}
			}
		}
	}

	get_regbytv() {
        const regbytv = {};
		const tvset = this.zone === "AE" ? "LFMMFMPE" : "LFMMFMPW";
		this.regul[tvset].forEach( value => {
			let tv = value.tv.substring(3);
			if (typeof regbytv[tv] === 'undefined') { regbytv[tv] = [] }
			value["constraints"].forEach(obj => {
				let rate = obj["normalRate"] + obj["equipmentRate"] + obj["pendingRate"];
				regbytv[tv].push([extract_time(obj["constraintPeriod"]["wef"]), extract_time(obj["constraintPeriod"]["unt"]), rate, value["reason"], value["delay"]]);
			});
		});
		return regbytv;
	}
	
	get_total_delay(tvset) {
		if (typeof this.regul !== 'undefined') {
			let total_delay = 0;
			this.regul[tvset].forEach( value => {
				total_delay += value.delay;
			});
			return total_delay;
		}
	}

	/*  -------------------------------------------------------------------------
		  {
			  "ATC_STAFFING": 318,
			  "WEATHER": 728
		  }
		  CRSTMP causes : ATC capacity (C), Routeing (R), Staffing (S), 
		  Equipment (T), Airspace management (M) and Special events (P)
		------------------------------------------------------------------------- */
	get_reg_by_causes(tvset) {
		if (typeof this.regul !== 'undefined') {
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
			return reg;
		}
	}

}

class period_regul {
	/*  -------------------------------------------------------------------------------------------------	
			@param {string} start_day - "yyyy-mm-dd"
			@param {string} end_day - "yyyy-mm-dd"
			@param {string} zone - "AE" ou "AW" : ne sert que pour savoir dans quelle zone on travaille
				car toutes les zones sont récupérées
			@param {boolean} details : true pour fichiers reg journée
		------------------------------------------------------------------------------------------------- */
        
	constructor(start_day, end_day, zone, details = true) {
		this.start_day = start_day;
		this.end_day = end_day;
		this.zone = zone;
		this.details = details;
        this.dates_arr = get_dates_array(new Date(start_day), new Date(end_day));
		this.rates = {};
	}
	
    async init() {
		this.reguls = await this.get_reguls();
		this.tot_delays = this.get_total_period_delay();
		//console.log(this.reguls);
	}

	/* ----------------------------------------------------------------------
		@return {
			"date": {
				"reguls": { 
					"LFMMFMPE":[ {obj regul }, ... ],
					"LFMMFMPW":[],
					"LFMMAPP":[]
				},
				"LFMMFMPE": {
					"tot_delay": integer, 
					"delay_by_cause": {
						"ATC_STAFFING": 318,
						"WEATHER": 728
					}
				}, 
				"LFMMFMPW": {...},
				"LFMMAPP": {...}
			},
			...
			"date": {
				...
			}
		}
	------------------------------------------------------------------------- */
	async get_reguls() {
        const reguls = {};
        for (const date of this.dates_arr) {
             const r = new regul(date, this.zone, this.details);
			 await r.init();
			 if (typeof r.regul !== 'undefined') {
				reguls[date] = {
					"reguls": r.regul,
					"LFMMFMPE": r["LFMMFMPE"],
					"LFMMFMPW": r["LFMMFMPW"],
					"LFMMAPP": r["LFMMAPP"]
				}
			 }
        }
		return reguls;
	}

	get_total_period_delay() {
		const delay = {"cta": 0, "est": 0, "west": 0, "app": 0}
		for (const date of this.dates_arr) {
			if (typeof this.reguls[date] !== 'undefined') {
				delay["est"] += this.reguls[date]["LFMMFMPE"]["tot_delay"];
				delay["west"] += this.reguls[date]["LFMMFMPW"]["tot_delay"];
				delay["app"] += this.reguls[date]["LFMMAPP"]["tot_delay"];
				delay["cta"] += this.reguls[date]["LFMMFMPE"]["tot_delay"] + this.reguls[date]["LFMMFMPW"]["tot_delay"];
			}
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
			if (typeof this.reguls[date] !== 'undefined') {
				tab_FMPE = [...tab, ...Object.keys(this.reguls[date]["LFMMFMPE"]["delay_by_cause"])];
				tab_FMPW = [...tab, ...Object.keys(this.reguls[date]["LFMMFMPW"]["delay_by_cause"])];
				tab_APP = [...tab, ...Object.keys(this.reguls[date]["LFMMAPP"]["delay_by_cause"])];
			}
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
			if (typeof this.reguls[date] !== 'undefined') {
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
			if (typeof this.reguls[date] !== 'undefined') {
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
        }
        res += '</tbody></table>';
		res += `
		<table class="sortable">
			<caption>LFMM-OUEST : ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</caption>
			<thead><tr class="titre"><th class="space">Date</th><th>Regul Id</th><th>TV</th><th>Début</th><th>Fin</th><th>Délai</th><th>Raison</th><th>vols</th></tr></thead>
			<tbody>`;
        for (const date of this.dates_arr) {
			if (typeof this.reguls[date] !== 'undefined') {
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
        }
        res += '</tbody></table>';
		res += `
		<table class="sortable">
			<caption>LFMM-APP : ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</caption>
			<thead><tr class="titre"><th class="space">Date</th><th>Regul Id</th><th>TV</th><th>Début</th><th>Fin</th><th>Délai</th><th>Raison</th><th>vols</th></tr></thead>
			<tbody>`;
        for (const date of this.dates_arr) {
			if (typeof this.reguls[date] !== 'undefined') {
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
        }
		res += '</tbody></table>';
		delays += `<span class="rect">LFMM CTA : ${this.tot_delays["cta"]} mn</span><span class="rect">LFMM Est : ${this.tot_delays["est"]} mn</span><span class="rect">LFMM West : ${this.tot_delays["west"]} mn</span><span class="rect">LFMM App : ${this.tot_delays["app"]} mn</span>`;
		delays += "</div>";
		delays += res;
		$(containerId).innerHTML = delays;
		const td_reg_id = document.querySelectorAll('.hover_reg_id');
		td_reg_id.forEach(td_el => {
			td_el.addEventListener('mouseover', (event) => {
				const reg_id = td_el.id;
				const el = document.createElement('div');
				el.setAttribute('id', 'popratereg');
				let contenu = reg_id+"<br>";
				let data = this.rates[reg_id];
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
		this.cause = this.get_weekly_reg_by_cause();
		this.CRSTMP = this.get_weekly_CRSTMP_reg();
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
		const url = `${this.year}/${this.year}-weekly-reg.json`;	
		const resp = await get_data(url);
		return resp;
	}

	/* 	----------------------------------------------------
		@returns : {
			"cta": [delay semaine 1, delay semaine i, ...],
			"est" : [delay semaine 1, delay semaine i, ...],
			"west" : [delay semaine 1, delay semaine i, ...],
			"app": [delay semaine 1, delay semaine i, ...],
		}
	---------------------------------------------------- */

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
			"cta": [{
				"ATC_STAFFING":1953,
				"SPECIAL_EVENT":311,
				"ATC_INDUSTRIAL_ACTION":2000,
				"cause": delai
				}, 
				{idem semaine i}, ...]
			},
			"est" : [{...}, {semaine i}, ...],
			"west" : [{...}, {semaine i}, ...],
			"app": [{ ...}, {semaine i}, ...] 
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

	/* 	-------------------------------------------------------------------------
			CRSTMP causes : 
            ATC_CAPACITY (C), Routeing (R), ATC_STAFFING (S), 
		    ATC_EQUIPMENT (T), AIRSPACE_MANAGEMENT (M) and SPECIAL_EVENTS (P)
            Grève : ATC_INDUSTRIAL_ACTION

			@returns : {
				"cta": [delay semaine 1, delay semaine i, ...],
				"est" : [delay semaine 1, delay semaine i, ...],
				"west" : [delay semaine 1, delay semaine i, ...],
				"app": [delay semaine 1, delay semaine i, ...],
		}
	---------------------------------------------------------------------------- */

	get_weekly_CRSTMP_reg() {
		const regs = {};
		regs['year'] = parseInt(this.weekly_regs['year']);
		regs['cta'] = [];
		regs['est'] = [];
		regs['west'] = [];
		regs['app'] = [];
		for(let i=1;i<54;i++) { 
			if (typeof this.weekly_regs[i] !== 'undefined') {
				const tab_causes = ["ATC_CAPACITY", "ATC_ROUTINGS", "ATC_STAFFING", "ATC_EQUIPMENT", "AIRSPACE_MANAGEMENT", "SPECIAL_EVENT"];
				const tab_causes_2019 = ["ATC Capacity", "ATC Routings", "ATC Staffing", "ATC Equipment", "Airspace Management", "Special Event"];
				const tab = [...tab_causes, ...tab_causes_2019];
				let reg_cta = 0;
				let reg_est = 0;
				let reg_west = 0;
				let reg_app = 0;
				tab.forEach(cause => {
					if (typeof this.cause["cta"][i-1][cause] != 'undefined') {
						reg_cta += this.cause["cta"][i-1][cause];
					}
					if (typeof this.cause["est"][i-1][cause] != 'undefined') {
						reg_est += this.cause["est"][i-1][cause];
					}
					if (typeof this.cause["west"][i-1][cause] != 'undefined') {
						reg_west += this.cause["west"][i-1][cause];
					}
					if (typeof this.cause["app"][i-1][cause] != 'undefined') {
						reg_app += this.cause["app"][i-1][cause];
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
		const url = `${this.year}/${this.year}-monthly-reg.json`;	
		const resp = await get_data(url);
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
		@return : {
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






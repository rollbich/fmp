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
		vols["LFMCTAE"] = this.daily_vols["LFMMCTAE"][2];
		vols["LFMCTAW"] = this.daily_vols["LFMMCTAE"][2];
		vols["LFMMCTA"] = this.daily_vols["LFMMCTA"][2];
		vols["LFMMAPP"] = this.daily_vols["LFMMAPP"]["flights"];
		return vols;
	}
	
	show_result_daily_vols(containerId) {
		let delays = "<div class='delay'>";
		delays += `<span class="reg-tot">Day : ${reverse_date(this.day)}</span><span class="reg-tot">LFMM Est : ${this.nbre_vols["LFMCTAE"]}</span><span class="reg-tot">LFMM West : ${this.nbre_vols["LFMCTAW"]}</span><span class="reg-tot">LFMM : ${this.nbre_vols["LFMMCTA"]}</span><span class="reg-tot">APP : ${this.nbre_vols["LFMMAPP"]}</span>`;
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
		let total_vols_est = 0, total_vols_west = 0, total_vols_cta = 0, total_vols_app = 0; 
		for (const date of this.dates_arr) {
			total_vols_est += parseInt(this.vols[date]['LFMCTAE']);
			total_vols_west += parseInt(this.vols[date]['LFMCTAW']);
			total_vols_cta += parseInt(this.vols[date]['LFMMCTA']);
			total_vols_app += parseInt(this.vols[date]['LFMMAPP']);
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
                res += '<tr>'; 
                res +=`<td>${reverse_date(date)}</td><td>${jour_sem(date)}</td><td>${this.vols[date]['LFMMCTA']}</td><td>${this.vols[date]['LFMCTAE']}</td><td>${this.vols[date]['LFMCTAW']}</td><td>${this.vols[date]['LFMMAPP']}</td>`;
                res += '</tr>';	
				total_vols_est += parseInt(this.vols[date]['LFMCTAE']);
				total_vols_west += parseInt(this.vols[date]['LFMCTAW']);
				total_vols_cta += parseInt(this.vols[date]['LFMMCTA']);
				total_vols_app += parseInt(this.vols[date]['LFMMAPP']);
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
		const url = `../b2b/json/${this.year}-weekly-flights.json`;	
		const resp = await loadJson(url);
		return resp;
	}

	get_weekly_vols() {
		const vols = {};
		vols['year'] = parseInt(this.weekly_vols['year']);
		vols['cta'] = [];
		vols['est'] = [];
		vols['west'] = [];
		vols['app'] = [];
		console.log("weekly vols");
		console.log(this.weekly_vols);
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

/*  ----------------------------------------------------------------------------------
		Stat weekly : 
			@param {string} year - "yyyy"
			@param {integer} week - numero de la semaine à afficher
	-------------------------------------------------------------------------------------*/

class weekly_briefing {
	constructor(year, week, containerId) {
		this.container = $(containerId);
		this.year = year;
		this.week = week;
		this.lastweek_year = this.get_last_week()[0];
		this.lastweek_week = this.get_last_week()[1];
		console.log("lwy: "+this.lastweek_year+"    lww: "+this.lastweek_week);
		this.init();
	}

	async init() {
		this.flights = new weekly_vols(this.year);
		this.flights_lastyear = new weekly_vols(this.year-1);
		this.flights_2019 = new weekly_vols(2019);
		await this.flights.init();
		await this.flights_lastyear.init();
		await this.flights_2019.init();
		this.reguls = new weekly_regs(this.year);
		this.reguls_lastyear = new weekly_regs(this.year-1);
		this.reguls_2019 = new weekly_regs(2019);
		await this.reguls.init();
		await this.reguls_lastyear.init();
		await this.reguls_2019.init();
	}

	get_last_week() {
		return getPreviousWeekNumber(weekDateToDate(this.year, this.week, 1));
	}

	show_data() {
		let sel =  `<select id="semaine" class="select">`;
		for(let i=1;i<54;i++) {
			if (i === this.week) { sel += `<option selected value="${i}">Sem ${i}</option>`; } else 
			{ sel += `<option value="${i}">Sem ${i}</option>`; }
		}
		sel += `</select><br><br>`;
		let v = this.data_vols();
		let r = this.data_reguls();
		this.container.innerHTML = sel+v+r;
		this.change_week();
	}

	change_week() {
		$('semaine').addEventListener('change', (e) => {
			const val = $('semaine').value;
			this.week = parseInt(val);
			this.lastweek_week = this.get_last_week()[1];
			this.lastweek_year = this.get_last_week()[0];
			console.log("lwy: "+this.lastweek_year+"    lww: "+this.lastweek_week);
			this.show_data();
		})
	}

	data_vols() {
		let result = `<h2 class='h2_bilan'>Nombre de vols : semaine ${this.week} - Année ${this.year}</h2><br>`;
		result += `<span class="rect">LFMM CTA : ${this.flights.nbre_vols['cta'][this.week-1]} vols</span><span class="rect">Est : ${this.flights.nbre_vols['est'][this.week-1]} vols</span><span class="rect">West : ${this.flights.nbre_vols['west'][this.week-1]} vols</span><span class="rect">App : ${this.flights.nbre_vols['app'][this.week-1]} vols</span>`;
		result += "<div class='delay'>";
		const lastweek_flights = this.year === this.lastweek_year ? this.flights : this.flights_lastyear; 
		const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} );
		console.log("lastweek flights");
		console.log(lastweek_flights);
		console.log("week flights");
		console.log(this.flights);
		const a = this.flights.nbre_vols['cta'][this.week-1];
		const b = lastweek_flights.nbre_vols['cta'][this.lastweek_week-1];
		let res = `
		<table class="table_bilan sortable">
			<thead><tr class="titre"><th>Zone</th><th>Vols</th><th>Last Week</th><th>${this.year-1}</th><th>2019</th></tr></thead>
			<tbody>`;
            res += '<tr>'; 
            res +=`<td>CTA</td><td>${this.flights.nbre_vols['cta'][this.week-1]}</td>
			<td>${MyFormat.format((this.flights.nbre_vols['cta'][this.week-1]/lastweek_flights.nbre_vols['cta'][this.lastweek_week-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.flights.nbre_vols['cta'][this.week-1]/this.flights_lastyear.nbre_vols['cta'][this.week-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.flights.nbre_vols['cta'][this.week-1]/this.flights_2019.nbre_vols['cta'][this.week-1] - 1)*100)} %</td></tr><tr>
			<td>Est</td><td>${this.flights.nbre_vols['est'][this.week-1]}</td>
			<td>${MyFormat.format((this.flights.nbre_vols['est'][this.week-1]/lastweek_flights.nbre_vols['est'][this.lastweek_week-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.flights.nbre_vols['est'][this.week-1]/this.flights_lastyear.nbre_vols['est'][this.week-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.flights.nbre_vols['est'][this.week-1]/this.flights_2019.nbre_vols['est'][this.week-1] - 1)*100)} %</td></tr><tr>
			<td>West</td><td>${this.flights.nbre_vols['west'][this.week-1]}</td>
			<td>${MyFormat.format((this.flights.nbre_vols['west'][this.week-1]/lastweek_flights.nbre_vols['west'][this.lastweek_week-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.flights.nbre_vols['west'][this.week-1]/this.flights_lastyear.nbre_vols['west'][this.week-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.flights.nbre_vols['west'][this.week-1]/this.flights_2019.nbre_vols['west'][this.week-1] - 1)*100)} %</td></tr><tr>
			<td>App</td><td>${this.flights.nbre_vols['app'][this.week-1]}</td>
			<td>${MyFormat.format((this.flights.nbre_vols['app'][this.week-1]/lastweek_flights.nbre_vols['app'][this.lastweek_week-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.flights.nbre_vols['app'][this.week-1]/this.flights_lastyear.nbre_vols['app'][this.week-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.flights.nbre_vols['app'][this.week-1]/this.flights_2019.nbre_vols['app'][this.week-1] - 1)*100)} %</td>`;
            res += '</tr>';	
        res += '</tbody></table>';
		
		result += "</div>";
		result += res;
		return result;
	}

	data_reguls() {
		let result = `<h2>Régulations : semaine ${this.week} - Année ${this.year}</h2><br>`;
		result += `<span class="rect">LFMM CTA : ${this.reguls.delay['cta'][this.week-1]} min</span><span class="rect">Est : ${this.reguls.delay['est'][this.week-1]} min</span><span class="rect">West : ${this.reguls.delay['west'][this.week-1]} min</span><span class="rect">App : ${this.reguls.delay['app'][this.week-1]} min</span>`;
		result += "<div class='delay'>";
		const lastweek_reguls = this.year === this.lastweek_year ? this.reguls : this.reguls_lastyear; 
		const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} )
		let res = `
		<table class="table_bilan sortable">
			<thead><tr class="titre"><th>Zone</th><th>Delay</th><th>Last Week</th><th>${this.year-1}</th><th>2019</th></tr></thead>
			<tbody>`;
            res += '<tr>'; 
            res +=`<td>CTA</td><td>${this.reguls.delay['cta'][this.week-1]} min</td>
			<td>${MyFormat.format((this.reguls.delay['cta'][this.week-1]/lastweek_reguls.delay['cta'][this.lastweek_week-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.reguls.delay['cta'][this.week-1]/this.reguls_lastyear.delay['cta'][this.week-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.reguls.delay['cta'][this.week-1]/this.reguls_2019.delay['cta'][this.week-1] - 1)*100)} %</td></tr><tr>
			<td>Est</td><td>${this.reguls.delay['est'][this.week-1]} min</td>
			<td>${MyFormat.format((this.reguls.delay['est'][this.week-1]/lastweek_reguls.delay['est'][this.lastweek_week-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.reguls.delay['est'][this.week-1]/this.reguls_lastyear.delay['est'][this.week-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.reguls.delay['est'][this.week-1]/this.reguls_2019.delay['est'][this.week-1] - 1)*100)} %</td></tr><tr>
			<td>West</td><td>${this.reguls.delay['west'][this.week-1]} min</td>
			<td>${MyFormat.format((this.reguls.delay['west'][this.week-1]/lastweek_reguls.delay['west'][this.lastweek_week-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.reguls.delay['west'][this.week-1]/this.reguls_lastyear.delay['west'][this.week-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.reguls.delay['west'][this.week-1]/this.reguls_2019.delay['west'][this.week-1] - 1)*100)} %</td></tr><tr>
			<td>App</td><td>${this.reguls.delay['app'][this.week-1]} min</td>
			<td>${MyFormat.format((this.reguls.delay['app'][this.week-1]/lastweek_reguls.delay['app'][this.lastweek_week-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.reguls.delay['app'][this.week-1]/this.reguls_lastyear.delay['app'][this.week-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.reguls.delay['app'][this.week-1]/this.reguls_2019.delay['app'][this.week-1] - 1)*100)} %</td>`;
            res += '</tr>';	
        res += '</tbody></table>';
		
		result += "</div>";
		result += res;
		return result;
	}

}



/*  ----------------------------------------------------------------------------------
		Stat monthly : 
			@param {string} year - "yyyy"
			@param {integer} month - numero du mois à afficher
	-------------------------------------------------------------------------------------*/

class monthly_vols {
	constructor(year) {
		this.year = year;
	}

	async init() {
		this.monthly_vols = await this.get_data_monthly_vols();
		this.nbre_vols = this.get_monthly_vols();
	}

	/*  ----------------------------------------------------------------------------------
		Lit le fichier json des vols monthly
			@param {string} day - "yyyy-mm-dd"
			@returns {
				"year":2022,
				"cta":{"1":0,"2":142,...},
				"est":{"1":0,"2":0,...},
				"west":{"1":0,"2":142,...},
				"app":{"1":10,...}
			} = this.nbre_vols
	-------------------------------------------------------------------------------------*/
	async get_data_monthly_vols() {
		const url = `../b2b/json/${this.year}-monthly-flights.json`;	
		const resp = await loadJson(url);
		return resp;
	}

	/*  ----------------------------------------------------------------------------------
		Retourne l'objet des vols mensuels
			@returns {
				"year":2022,
				"cta":[vols_janv, vols fev, ...]
				"est":[vols_janv, vols fev, ...],
				"west":[vols_janv, vols fev, ...],
				"app":[vols_janv, vols fev, ...]
			} 
	-------------------------------------------------------------------------------------*/
	get_monthly_vols() {
		const vols = {};
		vols['year'] = parseInt(this.monthly_vols['year']);
		vols['cta'] = [];
		vols['est'] = [];
		vols['west'] = [];
		vols['app'] = [];
		console.log("monthly vols");
		console.log(this.monthly_vols);
		for(let i=1;i<13;i++) { //53 semaines max
			if (typeof this.monthly_vols['cta'][i] !== 'undefined') vols['cta'].push(this.monthly_vols['cta'][i]);
			if (typeof this.monthly_vols['est'][i] !== 'undefined') vols['est'].push(this.monthly_vols['est'][i]);
			if (typeof this.monthly_vols['west'][i] !== 'undefined') vols['west'].push(this.monthly_vols['west'][i]);
			if (typeof this.monthly_vols['app'] !== 'undefined') if (typeof this.monthly_vols['app'][i] !== 'undefined') vols['app'].push(this.monthly_vols['app'][i]);
		}
		return vols;
	}
}

class monthly_briefing {
	constructor(year, month, containerId) {
		this.container = $(containerId);
		this.nom_mois = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
		this.year = year;
		this.month = month;
		this.lastmonth_year = this.get_last_month()[0];
		this.lastmonth_month = this.get_last_month()[1];
		this.init();
	}

	async init() {
		this.flights = new monthly_vols(this.year);
		this.flights_lastyear = new monthly_vols(this.year-1);
		this.flights_2019 = new monthly_vols(2019);
		await this.flights.init();
		await this.flights_lastyear.init();
		await this.flights_2019.init();
		this.reguls = new monthly_regs(this.year);
		this.reguls_lastyear = new monthly_regs(this.year-1);
		this.reguls_2019 = new monthly_regs(2019);
		await this.reguls.init();
		await this.reguls_lastyear.init();
		await this.reguls_2019.init();
	}

	get_last_month() {
		let m = this.month === 1 ? [this.year-1, 12] : [this.year, this.month-1]; 
		return m;
	}

/*  ----------------------------------------------------------------------------------
		Retourne l'objet des vols mensuels cumulés depuis le début de l'année
			@returns {
				"year":2022,
				"cta":vols_cumulés,
				"est":vols_cumulés,
				"west":vols_cumulés,
				"app":vols_cumulés
			} 
	-------------------------------------------------------------------------------------*/
	get_monthly_cumules() {
		const vols = {};
		vols['year'] = this.year;
		vols['cta'] = 0;
		vols['est'] = 0;
		vols['west'] = 0;
		vols['app'] = 0;
		for(let i=0;i<this.month;i++) { 
			vols['cta'] += this.flights['nbre_vols']['cta'][i];
			vols['est'] += this.flights['nbre_vols']['est'][i];
			vols['west'] += this.flights['nbre_vols']['west'][i];
			vols['app'] += this.flights['nbre_vols']['app'][i];
		}
		return vols;
	}

	get_monthly_reg_cumules() {
		const vols = {};
		vols['year'] = this.year;
		vols['cta'] = 0;
		vols['est'] = 0;
		vols['west'] = 0;
		vols['app'] = 0;
		for(let i=0;i<this.month;i++) { 
			vols['cta'] += this.reguls['delay']['cta'][i];
			vols['est'] += this.reguls['delay']['est'][i];
			vols['west'] += this.reguls['delay']['west'][i];
			vols['app'] += this.reguls['delay']['app'][i];
		}
		return vols;
	}

	get_monthly_cumules_lastyear() {
		const vols = {};
		vols['year'] = this.year-1;
		vols['cta'] = 0;
		vols['est'] = 0;
		vols['west'] = 0;
		vols['app'] = 0;
		for(let i=0;i<this.month;i++) { 
			vols['cta'] += this.flights_lastyear['nbre_vols']['cta'][i];
			vols['est'] += this.flights_lastyear['nbre_vols']['est'][i];
			vols['west'] += this.flights_lastyear['nbre_vols']['west'][i];
			vols['app'] += this.flights_lastyear['nbre_vols']['app'][i];
		}
		return vols;
	}

	get_monthly_reg_cumules_lastyear() {
		const vols = {};
		vols['year'] = this.year-1;
		vols['cta'] = 0;
		vols['est'] = 0;
		vols['west'] = 0;
		vols['app'] = 0;
		for(let i=0;i<this.month;i++) { 
			vols['cta'] += this.reguls_lastyear['delay']['cta'][i];
			vols['est'] += this.reguls_lastyear['delay']['est'][i];
			vols['west'] += this.reguls_lastyear['delay']['west'][i];
			vols['app'] += this.reguls_lastyear['delay']['app'][i];
		}
		return vols;
	}

	get_monthly_cumules_2019() {
		const vols = {};
		vols['year'] = 2019;
		vols['cta'] = 0;
		vols['est'] = 0;
		vols['west'] = 0;
		vols['app'] = 0;
		for(let i=0;i<this.month;i++) { 
			vols['cta'] += this.flights_2019['nbre_vols']['cta'][i];
			vols['est'] += this.flights_2019['nbre_vols']['est'][i];
			vols['west'] += this.flights_2019['nbre_vols']['west'][i];
			vols['app'] += this.flights_2019['nbre_vols']['app'][i];
		}
		return vols;
	}

	get_monthly_reg_cumules_2019() {
		const vols = {};
		vols['year'] = 2019;
		vols['cta'] = 0;
		vols['est'] = 0;
		vols['west'] = 0;
		vols['app'] = 0;
		for(let i=0;i<this.month;i++) { 
			vols['cta'] += this.reguls_2019['delay']['cta'][i];
			vols['est'] += this.reguls_2019['delay']['est'][i];
			vols['west'] += this.reguls_2019['delay']['west'][i];
			vols['app'] += this.reguls_2019['delay']['app'][i];
		}
		return vols;
	}

	show_data() {
		let sel =  `<select id="semaine" class="select">`;
		for(let i=1;i<13;i++) {
			if (i === this.month) { sel += `<option selected value="${i}">${this.nom_mois[i-1]}</option>`; } else 
			{ sel += `<option value="${i}">${this.nom_mois[i-1]}</option>`; }
		}
		sel += `</select><br><br>`;
		let v = this.data_vols();
		let r = this.data_reguls();
		this.container.innerHTML = sel+v+r;
		this.change_month();
	}

	change_month() {
		$('semaine').addEventListener('change', (e) => {
			const val = $('semaine').value;
			this.month = parseInt(val);
			this.lastmonth_month = this.get_last_month()[1];
			this.lastmonth_year = this.get_last_month()[0];
			this.show_data();
		})
	}

	data_vols() {
		let result = `<h2 class='h2_bilan'>Nombre de vols : mois ${this.nom_mois[this.month-1]} - Année ${this.year}</h2><br>`;
		result += `<span class="rect">LFMM CTA : ${this.flights.nbre_vols['cta'][this.month-1]} vols</span><span class="rect">Est : ${this.flights.nbre_vols['est'][this.month-1]} vols</span><span class="rect">West : ${this.flights.nbre_vols['west'][this.month-1]} vols</span><span class="rect">App : ${this.flights.nbre_vols['app'][this.month-1]} vols</span>`;
		result += "<div class='delay'>";
		const lastmonth_flights = this.year === this.lastmonth_year ? this.flights : this.flights_lastyear; 
		const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} );
		let res = `
		<table class="table_bilan sortable">
			<thead><tr class="titre"><th>Zone</th><th>Vols</th><th>Last Month</th><th>Last year</th><th>2019</th><th>Cumuls</th><th>Cumuls Y-1</th><th>Cumuls 2019</th></tr></thead>
			<tbody>`;
			res += '<tr>'; 
			res +=`<td>CTA</td><td>${this.flights.nbre_vols['cta'][this.month-1]}</td>
			<td>${MyFormat.format((this.flights.nbre_vols['cta'][this.month-1]/lastmonth_flights.nbre_vols['cta'][this.lastmonth_month-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.flights.nbre_vols['cta'][this.month-1]/this.flights_lastyear.nbre_vols['cta'][this.month-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.flights.nbre_vols['cta'][this.month-1]/this.flights_2019.nbre_vols['cta'][this.month-1] - 1)*100)} %</td>
			<td>${this.get_monthly_cumules()['cta']}</td>
			<td>${MyFormat.format((this.get_monthly_cumules()['cta']/this.get_monthly_cumules_lastyear()['cta'] - 1)*100)} %</td>
			<td>${MyFormat.format((this.get_monthly_cumules()['cta']/this.get_monthly_cumules_2019()['cta'] - 1)*100)} %</td></tr>
			<tr><td>Est</td><td>${this.flights.nbre_vols['est'][this.month-1]}</td>
			<td>${MyFormat.format((this.flights.nbre_vols['est'][this.month-1]/lastmonth_flights.nbre_vols['est'][this.lastmonth_month-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.flights.nbre_vols['est'][this.month-1]/this.flights_lastyear.nbre_vols['est'][this.month-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.flights.nbre_vols['est'][this.month-1]/this.flights_2019.nbre_vols['est'][this.month-1] - 1)*100)} %</td>
			<td>${this.get_monthly_cumules()['est']}</td>
			<td>${MyFormat.format((this.get_monthly_cumules()['cta']/this.get_monthly_cumules_lastyear()['est'] - 1)*100)} %</td>
			<td>${MyFormat.format((this.get_monthly_cumules()['est']/this.get_monthly_cumules_2019()['est'] - 1)*100)} %</td></tr><tr>
			<td>West</td><td>${this.flights.nbre_vols['west'][this.month-1]}</td>
			<td>${MyFormat.format((this.flights.nbre_vols['west'][this.month-1]/lastmonth_flights.nbre_vols['west'][this.lastmonth_month-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.flights.nbre_vols['west'][this.month-1]/this.flights_lastyear.nbre_vols['west'][this.month-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.flights.nbre_vols['west'][this.month-1]/this.flights_2019.nbre_vols['west'][this.month-1] - 1)*100)} %</td>
			<td>${this.get_monthly_cumules()['west']}</td>
			<td>${MyFormat.format((this.get_monthly_cumules()['cta']/this.get_monthly_cumules_lastyear()['west'] - 1)*100)} %</td>
			<td>${MyFormat.format((this.get_monthly_cumules()['west']/this.get_monthly_cumules_2019()['west'] - 1)*100)} %</td></tr><tr>
			<td>App</td><td>${this.flights.nbre_vols['app'][this.month-1]}</td>
			<td>${MyFormat.format((this.flights.nbre_vols['app'][this.month-1]/lastmonth_flights.nbre_vols['app'][this.lastmonth_month-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.flights.nbre_vols['app'][this.month-1]/this.flights_lastyear.nbre_vols['app'][this.month-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.flights.nbre_vols['app'][this.month-1]/this.flights_2019.nbre_vols['app'][this.month-1] - 1)*100)} %</td>
			<td>${this.get_monthly_cumules()['app']}</td>
			<td>${MyFormat.format((this.get_monthly_cumules()['cta']/this.get_monthly_cumules_lastyear()['app'] - 1)*100)} %</td>
			<td>${MyFormat.format((this.get_monthly_cumules()['app']/this.get_monthly_cumules_2019()['app'] - 1)*100)} %</td>`;
			res += '</tr>';	
		res += '</tbody></table>';
		
		result += "</div>";
		result += res;
		return result;
	}

	data_reguls() {
		let result = `<h2>Régulations : mois ${this.nom_mois[this.month-1]} - Année ${this.year}</h2><br>`;
		result += `<span class="rect">LFMM CTA : ${this.reguls.delay['cta'][this.month-1]} min</span><span class="rect">Est : ${this.reguls.delay['est'][this.month-1]} min</span><span class="rect">West : ${this.reguls.delay['west'][this.month-1]} min</span><span class="rect">App : ${this.reguls.delay['app'][this.month-1]} min</span>`;
		result += "<div class='delay'>";
		const lastmonth_reguls = this.year === this.lastmonth_year ? this.reguls : this.reguls_lastyear; 
		const MyFormat = new SignedFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits:1} )
		let res = `
		<table class="table_bilan sortable">
			<thead><tr class="titre"><th>Zone</th><th>Delay</th><th>Last Month</th><th>Last year</th><th>2019</th><th>Cumuls</th><th>Cumuls Y-1</th><th>Cumuls 2019</th></tr></thead>
			<tbody>`;
			res += '<tr>'; 
			res +=`<td>CTA</td><td>${this.reguls.delay['cta'][this.month-1]} min</td>
			<td>${MyFormat.format((this.reguls.delay['cta'][this.month-1]/lastmonth_reguls.delay['cta'][this.lastmonth_month-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.reguls.delay['cta'][this.month-1]/this.reguls_lastyear.delay['cta'][this.month-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.reguls.delay['cta'][this.month-1]/this.reguls_2019.delay['cta'][this.month-1] - 1)*100)} %</td>
			<td>${this.get_monthly_reg_cumules()['cta']}</td>
			<td>${MyFormat.format((this.get_monthly_reg_cumules()['cta']/this.get_monthly_reg_cumules_lastyear()['cta'] - 1)*100)} %</td>
			<td>${MyFormat.format((this.get_monthly_reg_cumules()['cta']/this.get_monthly_reg_cumules_2019()['cta'] - 1)*100)} %</td></tr><tr>
			<td>Est</td><td>${this.reguls.delay['est'][this.month-1]} min</td>
			<td>${MyFormat.format((this.reguls.delay['est'][this.month-1]/lastmonth_reguls.delay['est'][this.lastmonth_month-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.reguls.delay['est'][this.month-1]/this.reguls_lastyear.delay['est'][this.month-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.reguls.delay['est'][this.month-1]/this.reguls_2019.delay['est'][this.month-1] - 1)*100)} %</td>
			<td>${this.get_monthly_reg_cumules()['est']}</td>
			<td>${MyFormat.format((this.get_monthly_reg_cumules()['cta']/this.get_monthly_reg_cumules_lastyear()['est'] - 1)*100)} %</td>
			<td>${MyFormat.format((this.get_monthly_reg_cumules()['est']/this.get_monthly_reg_cumules_2019()['est'] - 1)*100)} %</td></tr><tr>
			<td>West</td><td>${this.reguls.delay['west'][this.month-1]} min</td>
			<td>${MyFormat.format((this.reguls.delay['west'][this.month-1]/lastmonth_reguls.delay['west'][this.lastmonth_month-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.reguls.delay['west'][this.month-1]/this.reguls_lastyear.delay['west'][this.month-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.reguls.delay['west'][this.month-1]/this.reguls_2019.delay['west'][this.month-1] - 1)*100)} %</td>
			<td>${this.get_monthly_reg_cumules()['west']}</td>
			<td>${MyFormat.format((this.get_monthly_reg_cumules()['cta']/this.get_monthly_reg_cumules_lastyear()['west'] - 1)*100)} %</td>
			<td>${MyFormat.format((this.get_monthly_reg_cumules()['west']/this.get_monthly_reg_cumules_2019()['west'] - 1)*100)} %</td></tr><tr>
			<td>App</td><td>${this.reguls.delay['app'][this.month-1]} min</td>
			<td>${MyFormat.format((this.reguls.delay['app'][this.month-1]/lastmonth_reguls.delay['app'][this.lastmonth_month-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.reguls.delay['app'][this.month-1]/this.reguls_lastyear.delay['app'][this.month-1] - 1)*100)} %</td>
			<td>${MyFormat.format((this.reguls.delay['app'][this.month-1]/this.reguls_2019.delay['app'][this.month-1] - 1)*100)} %</td>
			<td>${this.get_monthly_reg_cumules()['app']}</td>
			<td>${MyFormat.format((this.get_monthly_reg_cumules()['cta']/this.get_monthly_reg_cumules_lastyear()['app'] - 1)*100)} %</td>
			<td>${MyFormat.format((this.get_monthly_reg_cumules()['app']/this.get_monthly_reg_cumules_2019()['app'] - 1)*100)} %</td>`;
			res += '</tr>';	
		res += '</tbody></table>';
		
		result += "</div>";
		result += res;
		return result;
	}

}


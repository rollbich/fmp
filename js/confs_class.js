class conf {
	/*  ---------------------------------------------
			@param {string} day - "yyyy-mm-dd"
			@param {string} zone - "est" ou "ouest"
		--------------------------------------------- */
	constructor(day, zone) {
		this.day = day;
		this.zone = zone;
	}

	async init() {
		this.confs = await this.get_conf();
	}

	/*  ---------------------------------------------
			Lit le fichier json de conf
		--------------------------------------------- */
	async get_conf() {
		const date = this.day.replace(/-/g, ''); // yyyymmdd
		const url = `../b2b/json/${date}-confs.json`;	
		const resp = await loadJson(url);
		return resp;
	}

	/*  ------------------------------------------------------------------
			Affiche les confs
			@param {string} containerId - Id de l'HTML Element container	
			@param {string} day - "yyyy-mm-dd"
		------------------------------------------------------------------ */
	async show_result_confs(containerId) {
		try {
			let res = "<div class='conf'>";
			res += `
			<table class="regulation sortable">
				<caption>LFMM-EST : ${reverse_date(this.day)}</caption>
				<thead><tr class="titre"><th>Début</th><th>Fin</th><th>Conf</th></tr></thead>
				<tbody>`;
			this.confs["est"].forEach( value => {
				let deb = extract_time(value.applicabilityPeriod.wef);
				let fin = extract_time(value.applicabilityPeriod.unt);
				res += '<tr>'; 
				res +=`<td>${deb} TU</td><td>${fin} TU</td><td>${value.sectorConfigurationId}</td>`;
				res += '</tr>';	
			});
			res += '</tbody></table>';
			res += `
			<table class="regulation sortable">
				<caption>LFMM-OUEST : ${reverse_date(this.day)}</caption>
				<thead><tr class="titre"><th>Début</th><th>Fin</th><th>Conf</th></tr></thead>
				<tbody>`;
			this.confs["ouest"].forEach( value => {
				let deb = extract_time(value.applicabilityPeriod.wef);
				let fin = extract_time(value.applicabilityPeriod.unt);
				res += '<tr>'; 
				res +=`<td>${deb} TU</td><td>${fin} TU</td><td>${value.sectorConfigurationId}</td>`;
				res += '</tr>';	
			});
			res += '</tbody></table>';
			res += '</div>';
			
			$(containerId).innerHTML = res;
		}
		catch(err) {
			alert(`Erreur : ${err.message}`);
		}
		
	}

}

class period_confs {
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
		Lit le fichier json des confs
			@param {string} day - "yyyy-mm-dd"
			@param {string} zone - "AE" ou "AW"
			@returns {date1: objet_conf, date2: objet_conf,...}
	----------------------------------------------------------------- */
	async init() {
		this.confs = await this.get_confs();
		console.log(this.confs);
	}

	async get_confs() {
		const confs = {};
		for (const date of this.dates_arr) {
				const r = new conf(date, this.zone);
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
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
		if (typeof this.confs === 'undefined') return;
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
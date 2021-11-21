/*  ---------------------------------------------
		Lit le fichier json de conf
			@param {string} day - "yyyy-mm-dd"
			@param {string} zone - "AE" ou "AW"
	--------------------------------------------- */
async function get_conf(day) {
	const date = day.replace(/-/g, ''); // yyyymmdd
	const url = `../b2b/json/${date}-confs.json`;	
	const resp = await loadJson(url);
	return resp;
}

/*  ------------------------------------------------------------------
		Affiche les confs
		@param {string} containerId - Id de l'HTML Element container	
		@param {string} day - "yyyy-mm-dd"
	------------------------------------------------------------------ */
async function show_result_confs(containerId, day) {
	const confs = await get_conf(day, zone);
	let res = "<div class='conf'>";
	res += `
	<table class="regulation sortable">
		<caption>LFMM-EST : ${reverse_date(day)}</caption>
		<thead><tr class="titre"><th>Début</th><th>Fin</th><th>Conf</th></tr></thead>
		<tbody>`;
	confs["est"].forEach( value => {
		let deb = extract_time(value.applicabilityPeriod.wef);
		let fin = extract_time(value.applicabilityPeriod.unt);
		res += '<tr>'; 
		res +=`<td>${deb} TU</td><td>${fin} TU</td><td>${value.sectorConfigurationId}</td>`;
		res += '</tr>';	
	});
	res += '</tbody></table>';
	res += `
	<table class="regulation sortable">
		<caption>LFMM-OUEST : ${reverse_date(day)}</caption>
		<thead><tr class="titre"><th>Début</th><th>Fin</th><th>Conf</th></tr></thead>
		<tbody>`;
	confs["ouest"].forEach( value => {
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


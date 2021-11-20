/* 
 ---------------------
   tableau des TVset
 --------------------- 
 */
const lfmm_tvset = ["LFMMFMPE", "LFMMFMPW", "LFMMAPP"];
const lfbb_tvset = ["LFBBFMP", "LFBBAPP"];
const lfee_tvset = ["LFEEFMP", "LFEEAPP"];
const lfff_tvset = ["LFFFFMPE", "LFFFFMPW", "LFFFAD"];
const lfrr_tvset = ["LFRRFMP", "LFRRAPP"];
const dsna_tvset = ["LFDSNA"];

/*  ---------------------------------------------
		Lit le fichier json de regul
			@param {string} day - "yyyy-mm-dd"
			@param {string} zone - "AE" ou "AW"
	--------------------------------------------- */
async function get_regul(day, zone) {
	const date = day.replace(/-/g, ''); // yyyymmdd
	const area = zone === "AE" ? "est" : "west";
	const url = `../b2b/json/${date}-reg.json`;	
	const resp = await loadJson(url);
	return resp;
}

/*  ------------------------------------------------------------------
		Affiche les reguls
		@param {string} containerId - Id de l'HTML Element container	
		@param {string} start_day - "yyyy-mm-dd"
		@param {string} end_day - "yyyy-mm-dd"
		@param {string} zone - "AE" ou "AW"
	------------------------------------------------------------------ */
async function show_result_reg(containerId, start_day, end_day, zone) {
	const reg = await get_regul(start_day, zone);
	const z = zone === "AE" ? "EST" : "OUEST";
	let delays = "<div class='delay'>";
	let res = `
	<table class="regulation sortable">
		<caption>LFMM-EST : ${reverse_date(start_day)}</caption>
		<thead><tr class="titre"><th class="space">Date</th><th>Regul Id</th><th>TV</th><th>Début</th><th>Fin</th><th>Délai</th><th>Raison</th><th>vols</th></tr></thead>
		<tbody>`;
	let total_delay_est = 0, total_delay_west = 0, total_delay_app = 0; 
	reg["LFMMFMPE"].forEach( value => {
		let deb = extract_time(value.applicability.wef);
		let fin = extract_time(value.applicability.unt);
		res += '<tr>'; 
		res +=`<td>${reverse_date(start_day)}</td><td>${value.regId}</td><td>${value.tv}</td><td>${deb} TU</td><td>${fin} TU</td><td>${value.delay}</td><td>${value.reason}</td><td>${value.impactedFlights}</td>`;
		res += '</tr>';	
		total_delay_est += value.delay;
	});
	res += '</tbody></table>';
	res += `
	<table class="regulation sortable">
		<caption>LFMM-OUEST : ${reverse_date(start_day)}</caption>
		<thead><tr class="titre"><th class="space">Date</th><th>Regul Id</th><th>TV</th><th>Début</th><th>Fin</th><th>Délai</th><th>Raison</th><th>vols</th></tr></thead>
		<tbody>`;
	reg["LFMMFMPW"].forEach( value => {
		let deb = extract_time(value.applicability.wef);
		let fin = extract_time(value.applicability.unt);
		res += '<tr>'; 
		res +=`<td>${reverse_date(start_day)}</td><td>${value.regId}</td><td>${value.tv}</td><td>${deb} TU</td><td>${fin} TU</td><td>${value.delay}</td><td>${value.reason}</td><td>${value.impactedFlights}</td>`;
		res += '</tr>';	
		total_delay_west += value.delay;
	});
	res += '</tbody></table>';
	res += `
	<table class="regulation sortable">
		<caption>LFMM-APP : ${reverse_date(start_day)}</caption>
		<thead><tr class="titre"><th class="space">Date</th><th>Regul Id</th><th>TV</th><th>Début</th><th>Fin</th><th>Délai</th><th>Raison</th><th>vols</th></tr></thead>
		<tbody>`;
	reg["LFMMAPP"].forEach( value => {
		let deb = extract_time(value.applicability.wef);
		let fin = extract_time(value.applicability.unt);
		res += '<tr>'; 
		res +=`<td>${reverse_date(start_day)}</td><td>${value.regId}</td><td>${value.tv}</td><td>${deb} TU</td><td>${fin} TU</td><td>${value.delay}</td><td>${value.reason}</td><td>${value.impactedFlights}</td>`;
		res += '</tr>';	
		total_delay_app += value.delay;
	});
	res += '</tbody></table>';
	delays += `<span class="reg-tot">LFMM Est : ${total_delay_est} mn</span><span class="reg-tot">LFMM West : ${total_delay_west} mn</span><span class="reg-tot">LFMM App : ${total_delay_app} mn</span>`;
	delays += "</div>";
	delays += res;
	$(containerId).innerHTML = delays;
	
}


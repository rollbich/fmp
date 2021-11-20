// résultat du h20 des secteurs ouverts dans la plage de date sélectionnée
let result_h20 = {};

// Json du dépassement de capa
let result_capa = {};

/*  -------------------------------------------------
	 fonction factory qui affiche les dépassement
		@param {string} type - "H20" ou "H5" 
		Seul le H20 est possible, H5 supprimé
	------------------------------------------------ */
function show_result_capa(containerId, type, start_day, end_day, zone, selected_percent) {
	const fonc_name = "show_capa_"+type;
	window[fonc_name](containerId, zone, start_day, end_day, selected_percent);
}

/*  ----------------------------------------------------------------------------------
	 Calcule le dépassement Capa
		@param {string} zone - "AE" ou "AW"
		@param {string} start_day - "yyyy-mm-dd"
		@param {string} end_day - "yyyy-mm-dd"
		@param {integer} selected_pourcent - pourcentage de dépassement de MV
		@results {object} - {
			"filtre": % du filtre (= selected_pourcent),
			"data" : [ [date, tv, heure, count, mv, pourcentage_mv], ... ]
		}
	---------------------------------------------------------------------------------- */
async function calc_capa_H20(zone, start_day, end_day, selected_percent) {
	const nom_fichier = "../b2b/MV.json";
	const mv_json = await loadJson(nom_fichier);
	const days = get_dates_array(new Date(start_day), new Date(end_day));
	
	for (let day of days) {
		const temp = await get_h20_b2b(day, zone);	
		Object.assign(result_h20, temp);
	}
	const z = zone === "AE" ? "EST" : "OUEST";
	
	result_capa["data"] = [];
	result_capa["filtre"] = selected_percent;
	result_capa["zone"] = z;
	result_capa["range"] = [start_day, end_day];
	
	for (let day in result_h20) {
		for (var tv in result_h20[day]) {
				try {
					let mv = parseInt(mv_json[`TV-${z}`][tv]["MV"]);
					result_h20[day][tv].forEach(value => {
						let count = value[1];
						let pourcentage_mv = Math.round((100 * count) / mv);
						
						if (pourcentage_mv >= selected_percent) {
							let dd = reverse_date(day);	
							result_capa["data"].push([dd, tv, value[0], count, mv, pourcentage_mv]);
						}
					});	
				}
  
			    catch (err) {
					show_popup("Erreur ! ", "Les données du TV: "+tv+" ne sont pas récupérées en B2B ou alors le TV n'est pas défini dans le fichier MV.json");
			    }
		}
		
	}
	return result_capa;
}

/*  ----------------------------------------------------------------------------------
	 Affiche le dépassement Capa
		@param {string} containerId - Id du conteneur
	 	@param {string} zone - "AE" ou "AW"
		@param {string} start_day - "yyyy-mm-dd"
		@param {string} end_day - "yyyy-mm-dd"
		@param {integer} selected_pourcent - pourcentage de dépassement de MV
	---------------------------------------------------------------------------------- */
async function show_capa_H20(containerId, zone, start_day, end_day, selected_percent) {
	const result_capa = await calc_capa_H20(zone, start_day, end_day, selected_percent);
		
	let res = `<table class="depassement">
				 <caption>Journées du ${reverse_date(start_day)} au ${reverse_date(end_day)}</caption>
				 <thead>
					<tr class="titre"><th class="space">Date</th><th>TV</th><th>Heure</th><th>H/20</th><th>MV</th><th>% de la MV</th></tr>
				</thead>
				<tbody>`;
	result_capa["data"].forEach(arr => {
		let r = get_ouv_1h(arr[2]);
		res += '<tr>'; 
		res +=`<td>${arr[0]}</td><td class="capa tv" data-date="${reverse_date(arr[0])}" data-tv="${arr[1]}" data-deb="${r[0]}" data-fin="${r[1]}">${arr[1]}</td><td>${arr[2]}</td><td>${arr[3]}</td><td>${arr[4]}</td><td>${arr[5]} %</td>`;
		res += '</tr>';	
	});
	res += '</tbody></table>';
	
	$(containerId).classList.remove('off');
	$(containerId).innerHTML = res;
	$(containerId).scrollIntoView({ 
		behavior: 'smooth' 
	});
	
	add_capa_listener(zone);

}

/*  ----------------------------------------------------------------
	  récupère un tableau des dates où il y a un dépassement
	  sert à ne charger que ces dates là pour l'affichage H20:Occ
	  	@param {nodeList} td_tv - liste des élément <td>
	---------------------------------------------------------------- */
// 	ex : <td class="capa tv" data-date="2021-06-21" data-tv="RAEE" data-deb="06:19" data-fin="07:19">RAEE</td>

const extract_date = td_tv => {
	let arr = [];
	for (const td of td_tv) {
		arr.push(td.dataset.date);
	}
	// enlève les doublons
	return [...new Set(arr)];
}

/*  ----------------------------------------
	  Ajoute les clicks sur TV
		@param {string} zone - "AE"ou "AW"
	---------------------------------------- */
async function add_capa_listener(zone) {
	const td_tv = document.querySelectorAll('.capa');
	const date_arr = extract_date(td_tv);
	
	let h = {}, o = {}, reg;
	
	for (const d of date_arr) {
		h[d] = await get_h20_b2b(d, zone);
		o[d] = await get_occ_b2b(d, zone);
	}
	
	for (const td of td_tv) {
		let dat = td.dataset.date;
		let deb = td.dataset.deb;
		let fin = td.dataset.fin;
		let tv = td.dataset.tv;
						  
		td.addEventListener('click', function(event) {
			let data = [];
			let dataAxis = [];	
			let data_occ = [];
			let dataAxis_occ = [];
			try {
				h[dat][dat][tv].forEach(value => {
					if (time_to_min(value[0]) > time_to_min(deb)-h20_margin && time_to_min(value[0]) < time_to_min(fin)+h20_margin) {
						dataAxis.push(value[0]);
						data.push(value[1]);
					}
				});	
				o[dat][dat][tv].forEach(value => {
					if (time_to_min(value[0]) > time_to_min(deb)-h20_margin && time_to_min(value[0]) < time_to_min(fin)+h20_margin) {
						dataAxis_occ.push(value[0]);
						data_occ.push(value[1]);
					}
				});	
				
				let peak = o[dat][dat][tv][0][2];
				let sustain = o[dat][dat][tv][0][3];			
				if (data.length === 0) { 
					if (data_occ.length === 0) {
						document.getElementById('graph-container-h20').classList.add('off');
						document.getElementById('graph-container-occ').classList.add('off');
						show_popup("Pas de données","La plage horaire est indisponible");
					} else {
						document.getElementById('graph-container-occ').classList.remove('off');
						show_popup("Le H20 n'est pas calculable","En effet, le TV n'a ouvert assez longtemps et/ou n'est dans la plage disponible 4h-20h40 UTC"); 
						show_occ_graph('graph_occ', dataAxis_occ, data_occ, peak, sustain, tv);
						show_h20_graph('graph_h20', dataAxis, data, 0, "NO DATA");
					}
				} else {
					document.getElementById('graph-container-h20').classList.remove('off');
					document.getElementById('graph-container-occ').classList.remove('off');
					let mv = h[dat][dat][tv][0][2];
					show_h20_graph('graph_h20', dataAxis, data, mv, tv);
					show_occ_graph('graph_occ', dataAxis_occ, data_occ, peak, sustain, tv);
				}
			}
  
			catch (err) {
				show_popup("Attention ! ", "Les données du TV: "+tv+" n'ont pas été récupérées en B2B.");
			}
		})
	}
}




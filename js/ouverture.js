// on ne compte pas les ouvertures techniques < x minutes
const ouv_tech = 4;

/*  --------------------------------------------------------------------------------------------- 
	  Lit le schema réalisé, affiche le tableau des ouvertures et ajoute les 'clicks' sur les TV
	    @param {string} containerId - Id du conteneur
		@param {string} day - "yyyy-mm-dd"
		@param {string} zone - "AE ou "AW"
	--------------------------------------------------------------------------------------------- */
// 
async function show_ouverture(containerId, day, zone) {
	container = $(containerId);
	const schema = await read_schema_realise(day, zone);			
	show_table_ouverture(schema, container);
	add_ouverture_listener(day, zone);
}

/*  ----------------------------------------------------------------------------------------------------------------
	Parse fichier Courage schéma réalisé .rea
 	ouverture en heure UTC, 1440 min = 24h
 	COUR-20210513.AW.sch.rea

	@param {string} day - "yyyy-mm-dd"
	@param {string} zone - "AE" ou "AW"
 	@returns {object} schema
 	  schema = {
		date:  {day: ..., month: ..., year: ... },
		max_secteurs: nbre secteurs max sur la journée,
		ouverture: [ jj/mm/aaaa, heure_début, heure_fin, nbr_secteurs, [noms des TV] ]
		tv: [ liste des tv]
		tv_h: { tv: [ [heure_deb en min, heure_fin en min], [heure_deb, heure_fin] ...] }  = heure ouverture par tv
 	}
	---------------------------------------------------------------------------------------------------------------- */
async function read_schema_realise(day, zone) {
	const fichier_courage = dir+"Realise/"+get_courage_filename(day, zone);
	const schema = {};
	schema.ouverture = [];
	// tableau des TV ouverts
	schema.tv = [];
	schema.date = get_date_from_courage_file(fichier_courage);
	schema.max_secteurs = 0;
	schema.tv_h = {};
	
	try { 
	  const contenu = await fetch(`/${fichier_courage}`).then( (response) => {
		if (response.ok) { // entre 200 et 300
		  return Promise.resolve(response)
		} else {
		  const date = get_date_from_courage_file(fichier_courage);
		  const z = zone === "AE" ? "EST" : "OUEST";
		  if (response.status == 404) { return Promise.reject(new Error(`Le fichier courage ${z} du ${date} n'existe pas`)); }
		  return Promise.reject(new Error('Erreur'+response.statusText))
		}
	  }); 
	  const response = await contenu.text();
	  // un bloc commencant par 10 est une ouverture/fermeture de secteurs
	  const table = response.split("10 ?");
	  // enlève les données d'entête
	  table.shift();
	  
	  // récupère l'heure de début et de fin codés en minutes depuis 00h00
	  table.forEach(row => {
		const ouverture = row.split('\n'); // retour ligne
		let h = ouverture[0].split(' ');
	   // le tableau h contient des valeurs string vides, il faut les supprimer
	   removeItemAll(h, '');
		// sert pour tv_h
		const tv_h_d = Math.max(parseInt(h[1]), 0);
		const tv_h_f = parseInt(h[2]);

		// teste si ouverture > ouv_tech
		//if (parseInt(h[2]) - parseInt(h[1]) > ouv_tech) { 
			
			// si l'heure de fin est une heure ronde, enlève 1 minute
			if (parseInt(h[2]) % 60 === 0) h[2]--;
			let h_debut = parseInt(h[1]) < 0 ? "00:00" : min_to_time(parseInt(h[1]));
			let h_fin = min_to_time(parseInt(h[2])); 
			
			let temp = [schema.date, h_debut, h_fin];
			// enlève le 1er élément du tableau => il ne reste que les ouvertures
			ouverture.shift();
			// enlève le dernier élément vide du tableau s'il existe (à cause des retours ligne)
			ouverture.forEach( el => {
				if (el === '') {
					ouverture.pop();
				}
			});
			// ajoute le nb de secteurs ouverts
			temp.push(ouverture.length);
			
			// calcul du nbre max de secteurs
			schema.max_secteurs = Math.max(schema.max_secteurs, ouverture.length);
			
			// extrait les TVs ouverts
			let sub;
			let ouv = [];
			
			// on peut avoir des tv = ????? dans ce cas on met isok à false pour ne pas ajouter temp dans les ouverture
			let isOk = true;
			
			ouverture.forEach( el => {
				if (el != '') {
					sub_tv = el.substr(7,5).trimStart();
					// Correctif il peut arriver que la position s'apelle P10 et le TV = ????
					// dans ce cas on 10 ???? alors que ce n'est pas une nouvelle ligne et une ouverture et h[1] = '-1'
					if (sub_tv === '?????' || (h[1] === '-1' && parseInt(h[2]) < 27)) { isOk = false; } 
					else { // ajoute dans la liste des tv
					  schema.tv.push(sub_tv);
					  // remplit les heures ouverts pour chaque TV
					  if (!(schema["tv_h"].hasOwnProperty(sub_tv))) { 
						  schema["tv_h"][sub_tv] = [];
					  }
					  if (isOk == true) {
						  schema["tv_h"][sub_tv].push([tv_h_d, tv_h_f]);
					  }
					}
					ouv.push(sub_tv);
				}
			});
			
			// on teste aussi si c'est pas une manip ou erreur (ouverture < 1 minute)
			if (isOk != false) {
				// trier temp par ordre alphabétique
				let arr_ouv = zone === "AE" ? tri(ouv) : tri_west(ouv);
				temp.push(arr_ouv);
				schema.ouverture.push(temp);
			}
		//} 
	  })
	  
	  // parfois on a le même TV 2 fois de suite => concaténer les 2 lignes en 1 en étendant l'heure de la 1ère ligne, à faire 2 fois car parfois il y a 3 fois le même TV
	  
	  doublon(schema);
	  doublon(schema);
	  correct_technical_opening(schema);
	  doublon(schema);
	  // enlève les doublons du tableau des TV
	  schema.tv = [...new Set(schema.tv)];
  
	  return schema;
	}
	
	catch (err) {
	   alert(err.message);
	}
	
}

/*  ------------------------------------------------------------------------------
	  Affiche la table du schema d'ouvertures dans le container
	 	@param {object} schema - objet schéma
		@param {HTMLElement} container - HTML Element du conteneur
	------------------------------------------------------------------------------ */
function show_table_ouverture(schema, container) {
	let res = `<table class="ouverture">
					<caption>Journée du ${schema.date}</caption>
					<thead>
					<tr class="titre"><th>Début</th><th>Fin</th><th>Nb sect.</th><th class="colspan">Confs</th></tr>
				</thead>
				<tbody>`;
						
	schema.ouverture.forEach(row => {
							
		res += '<tr>'; 
		for(let j=1;j<4;j++) { res += `<td>${row[j]}</td>`; }					
		row[4].forEach(tv => {
			let r = get_ouverture_totale(schema, tv, time_to_min(row[1]), time_to_min(row[2]));
			res += `<td class="tv" data-tv="${tv}" data-deb="${r[0]}" data-fin="${r[1]}">${tv}</td>`;
		});
		res += '</tr>';
								
	});
	res += '</tbody></table>';
	res += `<div class="max">Max secteurs : ${schema.max_secteurs}</div>`;
						
	container.innerHTML = res;
}

/*  -------------------------------------------------------------------------------- 
		Ajoute le click event pour afficher H20/Occ sur les cellules possédant :
		- la class "tv"
		- la propriété data-tv
		- la propriété data-deb
		- la propriété data-fin
		@param {string} day - "yyyy-mm-dd"
		@param {string} zone - "AE" ou "AW"
		
	ex : <td class="tv" data-tv="RAEE" data-deb="04:33" data-fin="07:30">RAEE</td>
	-------------------------------------------------------------------------------- */

async function add_ouverture_listener(day, zone) {
	try {	
	const tds = document.querySelectorAll('.tv');
	
	let h, o, reg;
	h = await get_h20_b2b(day, zone); //  {	date: { tv: [ ["heure:min": trafic], ... ] } }
	o = await get_occ_b2b(day, zone);
	
	for (const td of tds) {
		let deb = td.dataset.deb;
		let fin = td.dataset.fin;
		let tv = td.dataset.tv;
							
		td.addEventListener('click', function(event) {
			let data = [];
			let dataAxis = [];	
			let data_occ = [];
			let dataAxis_occ = [];
			//try {
				h[day][tv].forEach(value => {
					if (time_to_min(value[0]) > time_to_min(deb)-graph_margin && time_to_min(value[0]) < time_to_min(fin)+graph_margin) {
						dataAxis.push(value[0]);
						data.push(value[1]);
					}
				});	
				o[day][tv].forEach(value => {
					if (time_to_min(value[0]) > time_to_min(deb)-graph_margin && time_to_min(value[0]) < time_to_min(fin)+graph_margin) {
						dataAxis_occ.push(value[0]);
						data_occ.push(value[1]);
					}
				});	
				
				let peak = o[day][tv][0][2];
				let sustain = o[day][tv][0][3];			
				if (data.length === 0) { 
					if (data_occ.length === 0) {
						document.getElementById('graph-container-h20').classList.add('off');
						document.getElementById('graph-container-occ').classList.add('off');
						show_popup("Pas de données","La plage horaire est indisponible");
					} else {
						document.getElementById('graph-container-occ').classList.remove('off');
						show_popup("Le H20 n'est pas calculable","Le TV n'a ouvert assez longtemps et/ou n'est dans la plage horaire disponible ou n'est pas récupéré"); 
						show_occ_graph('graph_occ', dataAxis_occ, data_occ, peak, sustain, tv);
						show_h20_graph('graph_h20', dataAxis, data, 0, "NO DATA");
					}
				} else {
					document.getElementById('graph-container-h20').classList.remove('off');
					document.getElementById('graph-container-occ').classList.remove('off');
					let mv = h[day][tv][0][2];
					show_h20_graph('graph_h20', dataAxis, data, mv, tv);
					show_occ_graph('graph_occ', dataAxis_occ, data_occ, peak, sustain, tv);
				}
			//}
			/*
			catch (err) {
				show_popup("Attention ! ", "Les données du TV: "+tv+" n'ont pas été récupérées en B2B.");
			}
			*/
		})
	}
	}
	catch (err) {
	const tds = document.querySelectorAll('.tv');
	for (const td of tds) {
		td.classList.remove('tv');
	}
	show_popup("Accès aux graphes impossible", "Les données n'ont pas été récupérées en B2B.");
	}
}

/*  -------------------------------------------------------------
	 construit le nom du fichier courage en fonction de la date
	 example nom_fichier : "COUR-20210516.AE.sch.rea";
	 dd[0] = année, dd[1] = mois
	  @param {string} day - "yyyy-mm-dd"
	  @param {string} zone - "AE" ou "AW"
	------------------------------------------------------------- */
const get_courage_filename = (day, zone) => {
	let d = day.replace(/-/g, '');
	let dd = day.split("-");
	return `${dd[0]}/${dd[1]}/COUR-${d}.${zone}.sch.rea`;
}

/*  -----------------------------------------
	  trie tv par groupe pour l'est
	 	@param {array}  - array non trié
		@returns {array} - array trié
	----------------------------------------- */
const tri = (arr_tv) => {
	// on met dans un tableau les tv du groupe 1, puis du groupe 2, etc...
	const bloc1 = ["RAE", "RAEE", "RAEM", "SBAM", "MNST", "BTAJ", "SAB", "BAM", "MN", "ST", "AJ", "BT"];
	const bloc2 = ["EK", "EK1", "EK2", "EK3", "EK12", "EK3", "E12", "E3", "KK", "K12", "K3", "EE", "KK", "E1", "E2", "K1", "K2"];
	const bloc3 = ["AB", "AB1", "AB2", "AB3", "AB4", "AB12", "AB34", "B12", "B34", "B1", "B2", "B3", "B4", "AA", "BB", "A12", "A34", "A1", "A2", "A3", "A4"];
	const bloc4 = ["GYAB", "GYA", "GY", "GY1", "GY2", "GY3", "GY4", "GY12", "GY34", "GG", "YY", "Y12", "Y34", "Y1", "Y2", "Y3", "Y4", "G12", "G34", "G1", "G2", "G3", "G4"];
	// on place les tv appartenant au groupe 1 dans un tableau, idem pour le groupe 2, etc...
	let bloc1_tv_array = arr_tv.filter(tv => bloc1.includes(tv));
	let bloc2_tv_array = arr_tv.filter(tv => bloc2.includes(tv));
	let bloc3_tv_array = arr_tv.filter(tv => bloc3.includes(tv));
	let bloc4_tv_array = arr_tv.filter(tv => bloc4.includes(tv));
	// on concatène les 4 tableaux en 1
	arr_tv = [...bloc1_tv_array, ...bloc2_tv_array, ...bloc3_tv_array, ...bloc4_tv_array];
	return arr_tv;	
}

/*  -----------------------------------------
	  trie tv par groupe pour l'ouest
	 	@param {array}  - array non trié
		@returns {array} - array trié
	----------------------------------------- */
const tri_west = (arr_tv) => {
	const bloc1 = ["RAW", "RAWM", "RAWN", "RAWS", "MALY", "LYO", "MOLYO", "MML", "LE", "LOLS", "LS", "LO", "MO", "ML"];
	const bloc2 = ["MOML", "WLMO", "MFDZ", "W1", "W23", "W12", "W2", "W3", "WM", "WW"];
	const bloc3 = ["MM", "MF", "M12", "M1"];
	const bloc4 = ["M34", "M2", "M3", "M4", "FDZ", "FF", "F12", "MF12"];
	const bloc5 = ["MF34", "F34", "DZ", "DD", "ZZ", "DH", "DL", "DZL", "DZH"];
	let bloc1_tv_array = arr_tv.filter(tv => bloc1.includes(tv));
	let bloc2_tv_array = arr_tv.filter(tv => bloc2.includes(tv));
	let bloc3_tv_array = arr_tv.filter(tv => bloc3.includes(tv));
	let bloc4_tv_array = arr_tv.filter(tv => bloc4.includes(tv));
	let bloc5_tv_array = arr_tv.filter(tv => bloc5.includes(tv));
	// on concatène les 4 tableaux en 1
	arr_tv = [...bloc1_tv_array, ...bloc2_tv_array, ...bloc3_tv_array, ...bloc4_tv_array, ...bloc5_tv_array];
	return arr_tv;	
}

/*  ---------------------------------------------------
	  teste si 2 ouvertures à la suite sont identiques
	 	@param {object} schema - array non trié
		@returns {array} - array filtré
	--------------------------------------------------- */
const doublon = (schema) => {
	for(let i=0;i<schema.ouverture.length-1;i++) {
		// si le nbr de secteurs est identique 2 fois de suite
		if (schema.ouverture[i][3] == schema.ouverture[i+1][3]) {
			// on vérifie que ce sont les mêmes TV
			// on créé une true copy des 2 tableaux (sinon les données originales sont altérées à cause du passage par référence)
			let tvs1 = [...schema.ouverture[i][4]];
			let tvs2 = [...schema.ouverture[i+1][4]];
			// on trie le tableau et on l'aplatit en strings pour les comparer
			if (tvs1.sort().toString() == tvs2.sort().toString()) {
				const temp_array = [schema.ouverture[i][0], schema.ouverture[i][1], schema.ouverture[i+1][2], schema.ouverture[i][3], schema.ouverture[i][4]];
				// on remplace la ligne i dans le tableau et on supprime la ligne i+1 du tableau
				schema.ouverture.splice(i, 1, temp_array);
				schema.ouverture.splice(i+1, 1);
			}
		}
	}
}

/*  -------------------------------------------------------------------------------
	  corrige les heures de debut lorsque des ouvertures techniques sont détectées
	   ex : ex 15:37 - 15:56	  puis 15:56 - 15:58  (ouverture technique)
	 	@param {object} schema - array non trié
		@returns {array} - array filtré
	------------------------------------------------------------------------------- */
// ne pas l'inclure cette fonction dans doublon pour faire 1 seule boucle car doublon modifie la longueur du tableau => bug
const correct_technical_opening = (schema) => {
	for(let i=0;i<schema.ouverture.length-1;i++) {

		// heures du créneau courant
		let current_deb = schema.ouverture[i][1];
		let current_fin = schema.ouverture[i][2];
		// heure du créneau suivant
		let next_deb = time_to_min(schema.ouverture[i+1][1]);
		let next_fin = time_to_min(schema.ouverture[i+1][2]);
		
		if (next_fin - next_deb < ouv_tech) {
			// [date, heure_deb, heure_fin, nbre_sec, TV]
			const temp_array = [schema.ouverture[i][0], current_deb, min_to_time(next_fin), schema.ouverture[i][3], schema.ouverture[i][4]];
			schema.ouverture.splice(i, 1, temp_array);
			schema.ouverture.splice(i+1, 1);
		}
	}
	
	// tv : [ [heure_deb en min, heure_fin en min], [heure_deb, heure_fin] ...]
	// on joint les secteurs en continu (heure de fin = heure de début du créneau suivant +- ouv_tech minutes)
	for(tv in schema["tv_h"]) {
		const arr = schema["tv_h"][tv];
		// on ne teste que si le tv a été ouvert au - 2 fois
		if (arr.length > 1) {
			for(let i=0;i<arr.length-1;i++) {
				let d1 = arr[i][1];
				let d2 = arr[i+1][0];
				// si moins de ouv_tech minutes, l'ouverture n'est pas pris en compte
				if (d2 - d1 < ouv_tech) {
					const temp_array = [ arr[i][0], arr[i+1][1] ];
					arr.splice(i, 1, temp_array);
					arr.splice(i+1, 1);
					i--;
				}
			}
		}
	}
	
}		

/*  ------------------------------------------------------------------------------
	  Récupère la plage maximale d'ouverture d'un TV
	 	@param {object} schema - objet schéma
		@param {string} tv - nom du TV
		@param {string} deb - heure de début
		@param {string} fin - heure de fin
		@returns {array} - [heure 1ère ouverture du TV, heure de fermeture du TV]
	------------------------------------------------------------------------------ */
// ex : le nbre de secteur vient de passer à 6 et AB était ouvert entre 10:14 (deb) et 10:35 (fin)
// mais AB était déjà ouvert depuis 08:00 et restera ouvert jusqu'à 17:35 => on récupère ["08:00", "17:35"] 
function get_ouverture_totale(schema, tv, deb, fin) {
	let datad = "", dataf =  "";
	for(let j=0;j<schema["tv_h"][tv].length;j++) {
		if (deb >= schema["tv_h"][tv][j][0]-ouv_tech && fin <= schema["tv_h"][tv][j][1]+ouv_tech) {
			datad = min_to_time(schema["tv_h"][tv][j][0]);
			dataf = min_to_time(schema["tv_h"][tv][j][1]);
			break;
		} 																		
	}
	return [datad, dataf];
}
const tour_json = "tour_de_service.json";

/*  ------------------------------------------------
				Feuille de Capa
	------------------------------------------------ */

/* -------------------------------------------------
	Calcule les équipes qui travaillent et leur vac
	Paramètres
	- day : yyyy-mm-jj
	return : { "J1": 5, "vac": eq ... }
   -------------------------------------------------- */
const get_vac_eq = day => {
	const tabvac = ["J2","S1","N","","","","","J1","J3","S2","",""];
	const dep = new Date(2019, 0, 8);  // J2 le 8 janvier 2019 à 12heures pour eq11
	const ecartj = dep.ecartJour(new Date(day));
	const tab = {};
	for (let eq=1;eq<13;eq++) {
		let debvac = (ecartj - parseInt(eq) + 11) % 12;
		if (tabvac[(debvac) % 12] !== "" && tabvac[(debvac) % 12] !== "N") tab[tabvac[(debvac) % 12]] = eq;
		if (tabvac[(debvac) % 12] == "N") {
			tab[tabvac[(debvac) % 12]] = eq;
			const eqN1 = eq == 1 ? 12 : eq - 1; // equipe de nuit de la veille
			tab["N1"] = eqN1; 
		}
	}
	return tab;
}

/* --------------------------------------------------------------
	 Détection du tour de service en vigueur à la date choisie
	 Paramètres
	 - tour : le json du tour de service
	 - day : yyyy-mm-jj
	 Return : un string du nom du tour de service
	 - "ete", "hiver", "mi-saison-basse", "mi-saison-haute"
   -------------------------------------------------------------- */
function get_date_tour(tour, day) {
	const d = day.split("-");
	const annee = parseInt(d[0]);
	const mois = parseInt(d[1]);
	const jour = d[2];
	const dat = new Date(annee, mois-1, jour); // index du mois commence à 0
	
	const d_hiver = tour["hiver"]["plage"][0][0].split("-");
	const f_hiver = tour["hiver"]["plage"][0][1].split("-");
	const d_ete = tour["ete"]["plage"][0][0].split("-");
	const f_ete = tour["ete"]["plage"][0][1].split("-");
	const index = mois < 7 ? 0 : 1;
	const d_msb = tour["mi-saison-basse"]["plage"][index][0].split("-");
	const f_msb = tour["mi-saison-basse"]["plage"][index][1].split("-");
	const d_msh = tour["mi-saison-haute"]["plage"][index][0].split("-");
	const f_msh = tour["mi-saison-haute"]["plage"][index][1].split("-");
	
	const decembre = new Date(annee, 11, 31); // 31 decembre
	const janvier = new Date(annee, 0, 1); // 1er janvier
	const fin_hiver = new Date(annee, f_hiver[1]-1, f_hiver[0]);
	const debut_hiver = new Date(annee, d_hiver[1]-1, d_hiver[0]);
	const debut_msb = new Date(annee, d_msb[1]-1, d_msb[0]);
	const fin_msb = new Date(annee, f_msb[1]-1, f_msb[0]);
	const debut_msh = new Date(annee, d_msh[1]-1, d_msh[0]);
	const fin_msh = new Date(annee, f_msh[1]-1, f_msh[0]);
	const debut_ete = new Date(annee, d_ete[1]-1, d_ete[0]);
	const fin_ete = new Date(annee, f_ete[1]-1, f_ete[0]);
	/*
	console.log("Date: "+dat);
	console.log(fin_hiver);
	console.log(debut_hiver);
	console.log(debut_ete);
	console.log(fin_ete);
	console.log(debut_msb);
	console.log(fin_msb);
	console.log(debut_msh);
	console.log(fin_msh);
	*/
	if (dat >= debut_hiver && dat <= decembre) return "hiver";
	if (dat >= janvier && dat <= fin_hiver) return "hiver";
	if (dat >= debut_ete && dat <= fin_ete) return "ete";
	if (dat >= debut_msb && dat <= fin_msb) return "mi-saison-basse";
	if (dat >= debut_msh && dat <= fin_msh) return "mi-saison-haute";
}

/*	
	fonction de transformation du tour de service (défini en heure locale) en heure UTC
	decalage en h, par défaut 2h
	   return :
		tour_utc : { [ ["00:00", 0, 1, 1], ["hh:mm", cds, A, B], ... ] }
*/
const get_tour_utc = async (tour_local, day) => {
	
	// récupère le décalage utc/local en heure
	const diff = Math.abs(new Date(day).getTimezoneOffset()) / 60;
	
	const saison = get_date_tour(tour_local, day);
	//console.log(saison);
	const tour = tour_local[saison];	
	
	const index_deb = diff*4 - 1;
	const tour_utc = {};
	tour_utc["J1"] = [];
	tour_utc["J3"] = [];
	tour_utc["S2"] = [];
	tour_utc["J2"] = [];
	tour_utc["S1"] = [];
	tour_utc["N"] = [];
		
	function push_utc(vac) {
		tour[vac].forEach( (elem, index) => {
			if (index > index_deb) {
				let h = min_to_time(time_to_min(elem[0]) - diff*60);
				tour_utc[vac].push([h, elem[1], elem[2], elem[3]]);
			}
		});
		if (diff === 2) {
			tour_utc[vac].push(["22:00", tour[vac][0][1], tour[vac][0][2], tour[vac][0][3]]);
			tour_utc[vac].push(["22:15", tour[vac][1][1], tour[vac][1][2], tour[vac][1][3]]);
			tour_utc[vac].push(["22:30", tour[vac][2][1], tour[vac][2][2], tour[vac][2][3]]);
			tour_utc[vac].push(["22:45", tour[vac][3][1], tour[vac][3][2], tour[vac][3][3]]);
		}
		tour_utc[vac].push(["23:00", tour[vac][4][1], tour[vac][4][2], tour[vac][4][3]]);
		tour_utc[vac].push(["23:15", tour[vac][5][1], tour[vac][5][2], tour[vac][5][3]]);
		tour_utc[vac].push(["23:30", tour[vac][6][1], tour[vac][6][2], tour[vac][6][3]]);
		tour_utc[vac].push(["23:45", tour[vac][7][1], tour[vac][7][2], tour[vac][7][3]]);
	}
		
	push_utc("J1");
	push_utc("J3");
	push_utc("S2");
	push_utc("J2");
	push_utc("S1");
	push_utc("N");
		
	return tour_utc;
}

/* ----------------------------------------------------------------------
	 *Calcul du nbre de PC total par vac
	 *Calcul du nbre de PC total dispo par pas de 15mn à la date choisie
	 Paramètres
	 - zone : "AE" ou "AW"
	 - day : yyyy-mm-jj
	 Return : un array
	 - { "pc_tot_vac": pc, "pc_total_dispo_15mn":[ ["hh:mm", nb_pc_dispo], [...], ... ]
   ---------------------------------------------------------------------- */
async function get_nbpc_dispo(day, zone) {
	const zon = zone.substr(1,1); // récupère la 2è lettre de la zone
	const tab_vac_eq = get_vac_eq(day);
	const eff = await get_olaf(zon, day);
	// récupère l'objet contenant les propriétés equipes
	const effectif = eff[Object.keys(eff)[0]]; 
	const effN1 = await get_olaf(zon, jmoins1(day));
	const effectifNmoins1 = effN1[Object.keys(effN1)[0]];
	
	const tour_local = await loadJson(tour_json);
	const tour_utc = await get_tour_utc(tour_local, day);
	
	// Calcul du nombre de pc à afficher 
	// On récupère l'effectif total, donc on doit enlever le cds sur les vacations sauf J2 et S1
	//	pc = {"J1" : nbre_pc, "vac": nbre_pc ... }		
	const pc = {};
	for(vac in tab_vac_eq) {
		let p = tab_vac_eq[vac]+"-"+zon;
		if (vac !== "N1") {
			const cds = (vac == "J2" || vac == "S1") ? 0 : 1; // cds=0 en J2 et S1
			pc[vac] = parseInt(effectif[p]["teamReserve"]["teamQuantity"]) - cds; 
		} else {
			pc[vac] = parseInt(effectifNmoins1[p]["teamReserve"]["teamQuantity"]) - 1; // le cds ne compte pas dans le nb de pc => -1
		}
	}
	
	// array du nombre de pc dispo associé au créneau horaire du tour de service
	// En 24h, il y a 96 créneaux de 15mn.
	// [ ["hh:mm", nb_pc_dispo], [...], ... ]
	let nb_pc = 0;
	let pcs = [];
	for(var i=0;i<96;i++) {
		if (tour_utc["J1"][i][2] === 1) nb_pc += Math.floor(pc["J1"]/2);
		if (tour_utc["J1"][i][3] === 1) nb_pc += ((Math.floor(pc["J1"]/2) + (pc["J1"])%2));
		if (tour_utc["J3"][i][2] === 1) nb_pc += Math.floor(pc["J3"]/2);
		if (tour_utc["J3"][i][3] === 1) nb_pc += ((Math.floor(pc["J3"]/2) + (pc["J3"])%2));
		if (tour_utc["S2"][i][1] === 1) nb_pc += 1; // cds de S2 qui bosse sur secteur
		if (tour_utc["S2"][i][2] === 1) nb_pc += Math.floor(pc["S2"]/2);
		if (tour_utc["S2"][i][3] === 1) nb_pc += ((Math.floor(pc["S2"]/2) + (pc["S2"])%2));
		if (tour_utc["J2"][i][2] === 1) nb_pc += Math.floor(pc["J2"]/2);
		if (tour_utc["J2"][i][3] === 1) nb_pc += ((Math.floor(pc["J2"]/2) + (pc["J2"])%2));
		if (tour_utc["S1"][i][2] === 1) nb_pc += Math.floor(pc["S1"]/2);
		if (tour_utc["S1"][i][3] === 1) nb_pc += ((Math.floor(pc["S1"]/2) + (pc["S1"])%2));
		if (tour_utc["N"][i][2] === 1 && i>48) nb_pc += Math.floor(pc["N"]/2);
		if (tour_utc["N"][i][3] === 1 && i>48) nb_pc += ((Math.floor(pc["N"]/2) + (pc["N"])%2));
		if (tour_utc["N"][i][2] === 1 && i<48) nb_pc += Math.floor(pc["N1"]/2);
		if (tour_utc["N"][i][3] === 1 && i<48) nb_pc += ((Math.floor(pc["N1"]/2) + (pc["N1"])%2));
		//console.log(tour_utc["J1"][i][0]+"  u: "+nb_pc);
		pcs.push([tour_utc["J1"][i][0], nb_pc]);
		nb_pc = 0;
	}	
	return {"pc_vac": pc, "pc_total_dispo_15mn": pcs};
}

/* ---------------------------------------------------------------------
 	Calcul des nombres d'ucesos identiques qui se suivent
	but : Combiner les cases pour un affichage plus lisible
	 ex : 3 3 3 3 => 1 grande case affichant 3
	Params :
	- array de type nbpc_dispo : [ ["hh:mm", nb_pc_dispo], [...], ... ]
	return : [ [index_debut, index_fin, nb_pc_dispo], ... ]
   --------------------------------------------------------------------- */
function compact(pcs) {
	const counts = [];
	let index_ini = 0;
	for(var j=0;j<95;j++) {
		if (pcs[j][1] !== pcs[j+1][1]) {
			//console.log(ouv[j][0]);
			counts.push([index_ini, j, pcs[j][1]]);
			index_ini = j+1;
		}
	}
	counts.push([index_ini, 95, pcs[95][1]]);
	console.log(counts);
	return counts;
}

/* --------------------------------------------------------------------------------------------
 	Calcul des nombres d'ucesos identiques qui se suivent
	but : Combiner les cases pour un affichage plus lisible
	 ex : 3 3 3 3 => 1 grande case affichant 3
	Params :
	- array de type nbpc_dispo : [ ["hh:mm", cds, A, B], [...], ... ], index (1=cds, 2=A, 3=B)
	return : [ [index_debut, index_fin, nb_pc_dispo], ... ]
   -------------------------------------------------------------------------------------------- */
function compact_ligne(pcs, ind) {
	const counts = [];
	let index_ini = 0;
	for(var j=0;j<95;j++) {
		if (pcs[j][ind] !== pcs[j+1][ind]) {
			//console.log(ouv[j][0]);
			counts.push([index_ini, j, pcs[j][ind]]);
			index_ini = j+1;
		}
	}
	counts.push([index_ini, 95, pcs[95][ind]]);
	//console.log(counts);
	return counts;
}

/*	--------------------------------------------------
		fonction d'affichage de la feuille de capa
			Paramètre en entrée :
			* id du container pour le tour
			* id du container pour le socle Uceso
			* day : yyyy-mm-jj
			* zone : AE ou AW
	-------------------------------------------------- */
	
async function show_feuille_capa(containerIdTour, day, zone) {
	
	const pc = await get_nbpc_dispo(day, zone);
	const pc_15mn = pc["pc_total_dispo_15mn"];
	const pc_vac = pc["pc_vac"];
	const tab_vac_eq = get_vac_eq(day);
	
	const tour_local = await loadJson(tour_json);
	const tour_utc = await get_tour_utc(tour_local, day);
	
	// Fabrique la ligne du tour de service
	// on teste si le cds travaille(il est bien compté dans ce cas mais on l'affiche pas sur l'ecran)
	// ex : vac = "J1"
	function affiche_vac(vac) {
		let res1 = "", res2 = "", res3 = "";
		const comp = tour_utc[vac].map( elem => [
			elem[0], 
			parseInt(elem[1]), 
			parseInt(elem[2])*Math.floor(pc_vac[vac]/2), 
			parseInt(elem[3])*(Math.floor(pc_vac[vac]/2)+(pc_vac[vac])%2)
		]);
		/* avec compactage
		compact_ligne(comp,1).forEach( (elem, index) => {
			const nbr_elem = compact_ligne(comp,1).length;
			let cl ="";
			if (elem[2] != 0) {cl = "bg"; }
			let nb_occ = elem[1] - elem[0] + 1;
			if (index != (nbr_elem-1)) {res1 += `<td class='${cl}' colspan="${nb_occ}">${elem[2] || ''}</td>`;} else {res1 += `<td class='${cl} right_2px' colspan="${nb_occ}">${elem[2] || ''}</td>`; }
		});
		compact_ligne(comp,2).forEach( (elem, index) => {
			const nbr_elem = compact_ligne(comp,2).length;
			let cl ="";
			if (elem[2] != 0) {cl = "bg"; }
			let nb_occ = elem[1] - elem[0] + 1;
			if (index != (nbr_elem-1)) {res2 += `<td class='${cl}' colspan="${nb_occ}">${elem[2] || ''}</td>`;} else {res2 += `<td class='${cl} right_2px' colspan="${nb_occ}">${elem[2] || ''}</td>`; }
		});
		compact_ligne(comp,3).forEach( (elem, index) => {
			const nbr_elem = compact_ligne(comp,3).length;
			let cl ="";
			if (elem[2] != 0) {cl = "bg"; }
			let nb_occ = elem[1] - elem[0] + 1;
			if (index != (nbr_elem-1)) {res3 += `<td class='${cl}' colspan="${nb_occ}">${elem[2] || ''}</td>`;} else {res3 += `<td class='${cl} right_2px' colspan="${nb_occ}">${elem[2] || ''}</td>`; }
		});
		*/
		/* Sans compactage */
		comp.forEach( (elem, index) => {
			let r1 = elem[1];
			let r2 = elem[2];
			let r3 = elem[3];
			let cl1 = "", cl2 = "", cl3="";
			if (r1 != 0) cl1 = "bg";
			if (r2 != 0) cl2 = "bg"; 
			if (r3 != 0) cl3 = "bg";
			if (index == 95) { cl1 += " right_2px"; cl2 += " right_2px"; cl3+= " right_2px"; }
			if (index%4 === 0) { cl1 += " left_2px"; cl2 += " left_2px"; cl3+= " left_2px"; }
			res1 += `<td class='${cl1}' data-ligne='1' data-col='${index}'>${r1 || ''}</td>`; // CDS travaille sur position ?
			res2 += `<td class='${cl2}' data-ligne='2' data-col='${index}'>${r2 || ''}</td>`; // partie A
			res3 += `<td class='${cl3} bottom_2px' data-ligne='3' data-col='${index}'>${r3 || ''}</td>`; // partie B
		});
		
		const cds = (vac == "J2" || vac == "S1") ? 0 : 1;
		return `<tr><td class='left_2px right_1px'></td><td class='right_1px'></td><td class='right_1px'>cds</td><td>${cds}</td><td class='pc right_2px'>${pc_vac[vac]}</td>${res1}</tr><tr><td class='left_2px right_1px'>${tab_vac_eq[vac]}</td><td class='right_1px'>${vac}</td><td class='right_1px'>A</td><td class='right_2px' colspan="2"></td>${res2}</tr><tr><td class='left_2px bottom_2px right_1px'></td><td class='bottom_2px right_1px'></td><td class='bottom_2px right_1px'>B</td><td class='bottom_2px right_2px' colspan="2"></td>${res3}</tr>`;
	}
	
	// Fabrique la ligne du tour de service pour la nuit du soir
	function affiche_vac_nuit() {
		let res1 = "", res2 = "", res3 = "";
		const vac = "N";
		const comp = tour_utc[vac].map( elem => [
			elem[0], 
			parseInt(elem[1]), 
			parseInt(elem[2])*Math.floor(pc_vac[vac]/2), 
			parseInt(elem[3])*(Math.floor(pc_vac[vac]/2)+(pc_vac[vac])%2)
		]);
		comp.forEach( (elem, index) => {
			let cl = "";
			let r1 = elem[1];
			let r2 = elem[2];
			let r3 = elem[3];
			let cl1 = "", cl2 = "", cl3="";
			if (r1 != 0 && index > 48) cl1 = "bg";
			if (r2 != 0 && index > 48) cl2 = "bg"; 
			if (r3 != 0 && index > 48) cl3 = "bg"; 
			if (index == 95) { cl1 += " right_2px"; cl2 += " right_2px"; cl3+= " right_2px"; }
			if (index%4 === 0) { cl1 = (cl1+" left_2px").trimLeft(); cl2 = (cl2+" left_2px").trimLeft(); cl3 = (cl3+" left_2px").trimLeft(); }
			if (index > 48) res1 += `<td class='${cl1}'>${r1 || ''}</td>`; else res1 += `<td class='${cl1}'></td>`; // CDS travaille sur position ?
			if (index > 48) res2 += `<td class='${cl2}'>${r2 || ''}</td>`; else res2 += `<td class='${cl2}'></td>`;
			if (index > 48) res3 += `<td class='${cl3} bottom_2px'>${r3 || ''}</td>`; else res3 += `<td class='${cl3} bottom_2px'></td>`;
		});
		return `<tr><td class='left_2px right_1px'></td><td class='right_1px'></td><td class='right_1px'>cds</td><td>1</td><td class='pc right_2px'>${pc_vac[vac]}</td>${res1}</tr><tr><td class='left_2px right_1px'>${tab_vac_eq[vac]}</td><td class='right_1px'>N</td><td class='right_1px'>A</td><td class='right_2px' colspan="2"></td>${res2}</tr><tr><td class='left_2px bottom_2px right_1px'></td><td class='bottom_2px right_1px'></td><td class='bottom_2px right_1px'>B</td><td class='bottom_2px right_2px' colspan="2"></td>${res3}</tr>`;
	}
	
	// Fabrique la ligne du tour de service pour le début de nuit
	function affiche_vac_nuitmoins1() {
		let res1 ="", res2 = "", res3 = "";
		const vac = "N1";
		const comp = tour_utc["N"].map( elem => [
			elem[0], 
			parseInt(elem[1]), 
			parseInt(elem[2])*Math.floor(pc_vac[vac]/2), 
			parseInt(elem[3])*(Math.floor(pc_vac[vac]/2)+(pc_vac[vac])%2)
		]);
		comp.forEach( (elem, index) => {
			let cl = "";
			let r1 = elem[1];
			let r2 = elem[2];
			let r3 = elem[3];
			let cl1 = "", cl2 = "", cl3="";
			if (r1 != 0 && index < 48) cl1 = "bg";
			if (r2 != 0 && index < 48) cl2 = "bg"; 
			if (r3 != 0 && index < 48) cl3 = "bg"; 
			if (index == 95) { cl1 = "right_2px"; cl2 = "right_2px"; cl3 = "right_2px"; }
			if (index%4 === 0) { cl1 += " left_2px"; cl2 += " left_2px"; cl3+= " left_2px"; }
			if (index < 48) res1 += `<td class='${cl1}'>${r1 || ''}</td>`; else res1 += `<td class='${cl1}'></td>`; // CDS travaille sur position ?
			if (index < 48) res2 += `<td class='${cl2}'>${r2 || ''}</td>`; else res2 += `<td class='${cl2}'></td>`;
			if (index < 48) res3 += `<td class='${cl3} bottom_2px'>${r3 || ''}</td>`; else res3 += `<td class='${cl3} bottom_2px'></td>`;
		});
		return `<tr><td class='left_2px right_1px'></td><td class='right_1px'></td><td class='right_1px'>cds</td><td>1</td><td class='pc right_2px'>${pc_vac[vac]}</td>${res1}</tr><tr><td class='left_2px right_1px'>${tab_vac_eq[vac]}</td><td class='right_1px'>N-1</td><td class='right_1px'>A</td><td class='right_2px' colspan="2"></td>${res2}</tr><tr><td class='left_2px bottom_2px right_1px'></td><td class='bottom_2px right_1px'></td><td class='bottom_2px right_1px'>B</td><td class='bottom_2px right_2px' colspan="2"></td>${res3}</tr>`;
	}
	
	// fabrique la ligne du nbre de pc dispo
	function affiche_nbpc() {
		let res2 = "";
		pc_15mn.forEach( (elem, index) => {
			let cl = "left_1px";
			if (index%4 === 0) cl = "left_2px";
			if (index === 95) cl += " right_2px";
			res2 += `<td class='${cl} bottom_2px'>${elem[1]}</td>`;
			//console.log(elem);
		});
		
		let res = `<tr><td class='left_2px bottom_2px right_2px' colspan="5">Nb PC</td>${res2}</tr>`;
		return res;
	}
	
	// fabrique la ligne du nbre d'uceso dispo
	function affiche_uceso() {
		const uc = pc_15mn.map( elem => [elem[0], Math.floor(elem[1]/2)]);
		let res3 = "";
		compact(uc).forEach( elem => {
			let nb_occ = elem[1] - elem[0] + 1;
			res3 += `<td class="bordure_uc" colspan="${nb_occ}">${elem[2]}</td>`;
		});
		
		let res = `<tr><td class='left_2px bottom_2px right_2px' colspan="5">UCESO</td>${res3}</tr>`;
		return res;
	}
	
	// fabrique la ligne des heures du tableau
	function heure() {
		let res = "";
		for(var i=0;i<96;i++) {
			if (i%4 == 0) res += `<td class="left_2px bottom_2px">${i/4}</td>`;
			if (i%4 == 2) res += `<td class="left_1px bottom_2px f8px">30</td>`;
			if (i%4 == 1 || (i%4 == 3 && i != 95)) { res += '<td class="bottom_2px"></td>'; } else if (i === 95) res += '<td class="right_2px bottom_2px"></td>';
		}
		return res;
	}
	
	// Construit le tableau
	let res = `<table class="ouverture">
				 <caption>Journée du ${day}</caption>
				 <thead>
					<tr class="titre"><th class="top_2px left_2px bottom_2px">Eq</th><th class="top_2px bottom_2px">Vac</th><th class="top_2px bottom_2px">Part</th><th class="top_2px bottom_2px">CDS</th><th class="top_2px bottom_2px right_2px">PC</th><th class="top_2px bottom_2px right_2px" colspan="96">...</th></tr>
				</thead>
				<tbody>`;
	res += `${affiche_vac("J1")}`;
	res += `${affiche_vac("J3")}`;
	res += `${affiche_vac("S2")}`;
	res += `${affiche_vac("J2")}`;
	res += `${affiche_vac("S1")}`;
	res += `${affiche_vac_nuit()}`;
	res += `${affiche_vac_nuitmoins1()}`;
	res += `<tr class="titre"><th class='bottom_2px left_2px right_2px' colspan="5">Heures UTC</th>${heure()}`;
	res += `${affiche_nbpc()}`;
	res += `${affiche_uceso()}`;
	res += '</tbody></table>';
	const containerTour = $(containerIdTour);
	containerTour.innerHTML = res;
	
}

/* ------------------------------------------------------------------
		Affiche les graphes :
		- vert de la capa offerte le jour choisi
		- orange : les ouvertures réalisées à J-7
		- bleu	 : les ouvertures réalisées à J-728 (2019)
		
		Paramètre :
		- containerId : id du container d'affichage
		- day : yyyy-mm-jj
		- zone : AE ou AW
		- pc_15mn : array des crénaux horaires associés aux pc dispo
	----------------------------------------------------------------- */
async function show_courage_graph(containerId, day, zone, pc_15mn) {
	const uceso = pc_15mn.map( elem => [elem[0],Math.floor(elem[1]/2)]);
	const day7 = jmoins7(day);
	const day728 = jmoins728(day);
	const schema = await read_schema_realise(day, zone);
	const schema7 = await read_schema_realise(day7, zone);
	const schema728 = await read_schema_realise(day728, zone);
	var chartDom = document.getElementById(containerId);
	var myChart = echarts.init(chartDom);
	
	data_series_uceso = [];
	data_series = [];
	data_series7 = [];
	data_series728 = [];
	let d = day.split("-");
	let d7 = day7.split("-");
	let d728 = day728.split("-");
	
	uceso.forEach(row => {
		let deb = row[0];
		let nb_sect = row[1];
		let f = deb.split(":");
		let time = new Date(d[0], d[1]-1, d[2], f[0], f[1]);
		data_series_uceso.push([time,nb_sect]);
	}); 
	data_series_uceso.push([new Date(d[0], d[1]-1, d[2], 23, 59), uceso[uceso.length-1][1]]);
	
	if (typeof schema !== 'undefined') {
		// schema.ouverture: [ jj/mm/aaaa, heure_début, heure_fin, nbr_secteurs, [noms des TV] ]
		schema.ouverture.forEach(row => {
			let deb = row[1];
			let fin = row[2];
			let nb_sect = row[3];
			let f = deb.split(":");
			let time = new Date(d[0], d[1]-1, d[2], f[0], f[1]); // -1 pour le mois car l'index commence à 0
			data_series.push([time,nb_sect]);
		}); 
		data_series.push([new Date(d[0], d[1]-1, d[2], 23, 59), schema7.ouverture[schema7.ouverture.length-1][3]]);
	}
	
	if (typeof schema7 !== 'undefined' && typeof schema == 'undefined') {
		// schema.ouverture: [ jj/mm/aaaa, heure_début, heure_fin, nbr_secteurs, [noms des TV] ]
		schema7.ouverture.forEach(row => {
			let deb = row[1];
			let fin = row[2];
			let nb_sect = row[3];
			let f = deb.split(":");
			let time = new Date(d[0], d[1]-1, d[2], f[0], f[1]); // -1 pour le mois car l'index commence à 0
			data_series7.push([time,nb_sect]);
		}); 
		data_series7.push([new Date(d[0], d[1]-1, d[2], 23, 59), schema7.ouverture[schema7.ouverture.length-1][3]]);
	}
	
	schema728.ouverture.forEach(row => {
		let deb = row[1];
		let fin = row[2];
		let nb_sect = row[3];
		let f = deb.split(":");
		let time = new Date(d[0], d[1]-1, d[2], f[0], f[1]);
		data_series728.push([time,nb_sect]);
	}); 
	data_series728.push([new Date(d[0], d[1]-1, d[2], 23, 59), schema728.ouverture[schema728.ouverture.length-1][3]]);
	
	
	var option;
	
	option = {
		
	  color: [
		'#ce7777', // rouge
		 '#77ce77', // vert
		 '#ffca00', // orange
		 '#00caff'  // bleu
	  ],
	  
	  tooltip: {
		trigger: 'axis'
	  },
	  
	  xAxis: {
		type: 'time',
		splitNumber:12
	  },
	  
	  yAxis: {
		splitLine:{
		  show:false
		},
		type: 'value'
	  },
	  series: [
		{
		  name: 'UCESO capa',
		  data: data_series_uceso,
		  type: 'line',
		  step: 'end'
		},
		{
		  name: 'Réalisé J',
		  type: 'line',
		  step: 'end',
		  data: data_series
		},
		{
		  name: 'Réalisé J-7',
		  type: 'line',
		  step: 'end',
		  data: data_series7
		},
		{
		  name: 'Réalisé 2019', //2019
		  type: 'line',
		  step: 'end',
		  data: data_series728
		}
	  ]
	};

	if (option && typeof option === 'object') {
		myChart.setOption(option);
	}
	
}
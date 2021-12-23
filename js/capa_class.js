/*  ------------------------------------------------
				Feuille de Capa
	------------------------------------------------ */

class capa {

    constructor(day, zone) {
        this.day = day;
        this.zone_olaf = zone.substr(1,1); // 2è lettre de la zone (E ou W)
		this.zone = this.zone_olaf === "E" ? "est" : "ouest"; 
    }

    /* ---------------------------------------------------------------------------------------
        *Calcul du nbre de PC total par vac
        *Calcul du nbre de PC total dispo par pas de 15mn à la date choisie
            @param {string} day 	- "yyyy-mm-jj"
            @param {string} zone	- "AE" ou "AW"
            @param {object} update	- {"J1":0, "J3":0, "S2":0, "J2":0, "S1":0, "N":0, "N-1":0}
                                    - Nombre de pc à retrancher à l'effectif OLAF
            @returns {object} 
                { "pc_vac": {"vac": {"nbpc": nbre_pc, "BV", "RO"}, ...}, 
                "pc_total_dispo_15mn":[ ["hh:mm", nb_pc_dispo], [...], ... ] }
    --------------------------------------------------------------------------------------- */
    async get_nbpc_dispo(update = {"J1":0, "J3":0, "S2":0, "J2":0, "S1":0, "N":0, "N-1":0}) {
        
        const tab_vac_eq = this.get_vac_eq();
        const instr = await loadJson("../instruction.json");
        const yesterday = jmoins1(this.day);
        // récupère l'objet contenant les propriétés equipes
        const effectif = await get_olaf(this.zone_olaf, this.day, yesterday);
        
        const tour_local = await loadJson(tour_json);
        const tour_utc = await this.get_tour_utc(tour_local);
        
        // Calcul du nombre de pc à afficher 
        // On récupère l'effectif total, donc on doit enlever le cds sur les vacations sauf J2 et S1	
        const pc = {"J1":{}, "J3":{}, "S2":{}, "J2":{}, "S1":{}, "N":{}, "N-1":{}};
        for(const vac in tab_vac_eq) {
            let p = tab_vac_eq[vac]+"-"+this.zone_olaf;
            if (vac !== "N-1") {
                const cds = (vac == "J2" || vac == "S1") ? 0 : 1; // cds=0 en J2 et S1
                pc[vac]["nbpc"] = parseInt(effectif[this.day][p]["teamReserve"]["teamQuantity"]) - cds + update[vac]; 
                pc[vac]["BV"] = parseInt(effectif[this.day][p]["teamReserve"]["BV"]);
                pc[vac]["RO"] = parseInt(effectif[this.day][p]["teamReserve"]["roQuantity"]);
                pc[vac]["userList"] = effectif[this.day][p]["userList"];
                pc[vac]["teamData"] = effectif[this.day][p]["teamData"];
                pc[vac]["html"] = effectif[this.day][p]["html"][this.day][p];
            } else {
                pc[vac]["nbpc"] = parseInt(effectif[yesterday][p]["teamReserve"]["teamQuantity"]) - 1 + update[vac]; // le cds ne compte pas dans le nb de pc => -1
                pc[vac]["BV"] = parseInt(effectif[yesterday][p]["teamReserve"]["BV"]);
                pc[vac]["RO"] = parseInt(effectif[yesterday][p]["teamReserve"]["roQuantity"]);
                pc[vac]["userList"] = effectif[yesterday][p]["userList"];
                pc[vac]["teamData"] = effectif[yesterday][p]["teamData"];
                pc[vac]["html"] = effectif[yesterday][p]["html"][yesterday][p];
            }
        } 
        
        // array du nombre de pc dispo associé au créneau horaire du tour de service
        // En 24h, il y a 96 créneaux de 15mn.
        // [ ["hh:mm", nb_pc_dispo], [...], ... ]
        let nb_pc = 0;
        let pcs = [];
        const in15mn = []; // nbre de pc instruction par 15 mn
        const vacs = ["J1", "J3", "S2", "J2", "S1"];
        const cds = 1;
        for(var i=0;i<96;i++) {
            vacs.forEach(vacation => {
                const cds = (vacation == "J2" || vacation == "S1") ? 0 : 1;
                if (tour_utc[vacation][i][1] === 1) nb_pc += cds; // cds qui bosse sur secteur
                if (tour_utc[vacation][i][2] === 1) nb_pc += Math.min(Math.floor(pc[vacation]["nbpc"]/2), Math.floor((pc[vacation]["BV"]-cds)/2));
                if (tour_utc[vacation][i][3] === 1) nb_pc += Math.min(Math.floor(pc[vacation]["nbpc"]/2)+(pc[vacation]["nbpc"])%2, Math.floor((pc[vacation]["BV"]-cds)/2)+(pc[vacation]["BV"]-cds)%2);
            })
            if (tour_utc["N"][i][1] === 1 && i>48) nb_pc += cds; // cds qui bosse sur secteur
            if (tour_utc["N"][i][2] === 1 && i>48) nb_pc += Math.min(Math.floor(pc["N"]["nbpc"]/2), Math.floor((pc["N"]["BV"]-cds)/2));
            if (tour_utc["N"][i][3] === 1 && i>48) nb_pc += Math.min(Math.floor(pc["N"]["nbpc"]/2)+(pc["N"]["nbpc"])%2, Math.floor((pc["N"]["BV"]-cds)/2)+(pc["N"]["BV"]-cds)%2);
            if (tour_utc["N"][i][1] === 1 && i<48) nb_pc += cds; // cds qui bosse sur secteur
            if (tour_utc["N"][i][2] === 1 && i<48) nb_pc += Math.min(Math.floor(pc["N-1"]["nbpc"]/2), Math.floor((pc["N-1"]["BV"]-cds)/2));
            if (tour_utc["N"][i][3] === 1 && i<48) nb_pc += Math.min(Math.floor(pc["N-1"]["nbpc"]/2)+(pc["N-1"]["nbpc"])%2, Math.floor((pc["N-1"]["BV"]-cds)/2)+(pc["N-1"]["BV"]-cds)%2);
            pcs.push([tour_utc["J1"][i][0], nb_pc]);
            nb_pc = 0;

            in15mn[i] = [0, ""];
            instr.forEach( (elem, index) => {
                const debut = elem["debut"];
                const fin = elem["fin"];
                const d = elem["date"];
                const zone = elem["zone"];
                const type = elem["type"];
                let t = get_time(i);
                if (d === this.day && zone.toLowerCase() === this.zone) {
                    if (t >= debut && t< fin) {
                        if (type === "Inst") { in15mn[i][0] += 2; in15mn[i][1] = "Inst"; }
                        if (type === "Eleve") { in15mn[i][1] = "Eleve"; }
                        if (type === "Asa") { in15mn[i][0] -= 1; in15mn[i][1] = "Asa"; }
                    } 
                }
            });
        }

        return {"pc_vac": pc, "pc_total_dispo_15mn": pcs, "pc_instr_15mn": in15mn};
    }

    /* ---------------------------------------------------
        Calcule les équipes qui travaillent et leur vac
        Paramètres
            @param {string} day - yyyy-mm-jj
            @returns {object} { "J1": 5, "vac": n°eq ... }
    ---------------------------------------------------- */
    get_vac_eq () {
        const tabvac = ["J2","S1","N","","","","","J1","J3","S2","",""];
        const dep = new Date(2019, 0, 8);  // J2 le 8 janvier 2019 à 12heures pour eq11
        const ecartj = dep.ecartJour(new Date(this.day));
        const tab = {};
        for (let eq=1;eq<13;eq++) {
            let debvac = (ecartj - parseInt(eq) + 11) % 12;
            if (tabvac[(debvac) % 12] !== "" && tabvac[(debvac) % 12] !== "N") tab[tabvac[(debvac) % 12]] = eq;
            if (tabvac[(debvac) % 12] === "N") {
                tab[tabvac[(debvac) % 12]] = eq;
                const eqN1 = eq == 1 ? 12 : eq - 1; // equipe de nuit de la veille
                tab["N-1"] = eqN1; 
            }
        }
        return tab;
    }

    /* --------------------------------------------------------------------------------------
        Détection du tour de service en vigueur à la date choisie
        @param {object} tour 	- le json du tour de service
        @param {string} day 	- "yyyy-mm-jj"
        @param {string} zone 	- "est" ou "ouest"
        @returns {string}  - saison : "ete", "hiver", "mi-saison-basse", "mi-saison-haute"
    -------------------------------------------------------------------------------------- */
    get_date_tour(tour) {
        const d = this.day.split("-");
        const annee = parseInt(d[0]);
        const mois = parseInt(d[1]);
        const jour = d[2];
        const dat = new Date(annee, mois-1, jour); // index du mois commence à 0
        
        const d_hiver = tour[this.zone]["hiver"]["plage"][0][0].split("-");
        const f_hiver = tour[this.zone]["hiver"]["plage"][0][1].split("-");
        const d_ete = tour[this.zone]["ete"]["plage"][0][0].split("-");
        const f_ete = tour[this.zone]["ete"]["plage"][0][1].split("-");
        const index = mois < 7 ? 0 : 1;
        const d_msb = tour[this.zone]["mi-saison-basse"]["plage"][index][0].split("-");
        const f_msb = tour[this.zone]["mi-saison-basse"]["plage"][index][1].split("-");
        const d_msh = tour[this.zone]["mi-saison-haute"]["plage"][index][0].split("-");
        const f_msh = tour[this.zone]["mi-saison-haute"]["plage"][index][1].split("-");
        
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

        if (dat >= debut_hiver && dat <= decembre) return "hiver";
        if (dat >= janvier && dat <= fin_hiver) return "hiver";
        if (dat >= debut_ete && dat <= fin_ete) return "ete";
        if (dat >= debut_msb && dat <= fin_msb) return "mi-saison-basse";
        if (dat >= debut_msh && dat <= fin_msh) return "mi-saison-haute";
    }

    /* -----------------------------------------------------------------------------------------
        Transformation du tour de service (défini en heure locale) en heure UTC
        @param {object} tour_local 	- le json du tour de service
        @param {string} day 			- "yyyy-mm-jj"
        @param {string} zone 			- "est" ou "ouest"
        @returns {object}  - tour_utc : { [ ["00:00", 0, 1, 1], ["hh:mm", cds, A, B], ... ] }
    ----------------------------------------------------------------------------------------- */	
    async get_tour_utc(tour_local) {
        
        // récupère le décalage utc/local en heure
        const diff = Math.abs(new Date(this.day).getTimezoneOffset()) / 60;
        const saison = this.get_date_tour(tour_local);
        const tour = tour_local[this.zone][saison];	
        
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

}

class feuille_capa extends capa {

	constructor(containerIdTour, day, zone) {
		super(day, zone);
		this.containerTour = $(containerIdTour);
	}

	/*	-----------------------------------------------------------------------------------------
			Affichage de la feuille de capa
				@param {string} containerIdTour - id du container pour le tour
				@param {string} day  - "yyyy-mm-jj"
				@param {string} zone - "AE" ou "AW"
				@param {object} update - {"J1":0, "J3":0, "S2":0, "J2":0, "S1":0, "N":0, "N-1":0}
		----------------------------------------------------------------------------------------- */
		
	async show_feuille_capa() {
		show_popup("Patientez !", "Chargement en cours...");
		const update = await loadJson("../update.json");
		if (typeof update[this.zone][this.day] === 'undefined') update[this.zone][this.day] = {"update_count": {"J1":0, "J3":0, "S2":0, "J2":0, "S1":0, "N":0, "N-1":0}, "update_name": {"J1":[], "J3":[], "S2":[], "J2":[], "S1":[], "N":[], "N-1":[]}};
		const pc = await this.get_nbpc_dispo(update[this.zone][this.day]['update_count']);
		document.querySelector('.popup-close').click();
		const pc_15mn = pc["pc_total_dispo_15mn"];
		const pc_instr_15mn = pc["pc_instr_15mn"];
		const pc_vac = pc["pc_vac"];
		const tab_vac_eq = this.get_vac_eq(this.day);
		const tour_local = await loadJson(tour_json);
		const tour_utc = await this.get_tour_utc(tour_local);

		// Construit le tableau
		let res = `<table class="ouverture">
					<caption>Journée du ${this.day} - Zone ${this.zone}</caption>
					<thead>
						<tr class="titre"><th class="top_2px left_2px bottom_2px right_1px">Eq</th><th class="top_2px bottom_2px right_1px">Vac</th><th class="top_2px bottom_2px right_1px">Part</th><th class="top_2px bottom_2px">CDS</th><th class="top_2px bottom_2px right_1px">PC</th><th class="top_2px bottom_2px right_2px">BV</th><th class="top_2px bottom_2px right_2px" colspan="96">...</th></tr>
					</thead>
					<tbody>`;
		res += `${affiche_vac("J1")}`;
		res += `${affiche_vac("J3")}`;
		res += `${affiche_vac("S2")}`;
		res += `${affiche_vac("J2")}`;
		res += `${affiche_vac("S1")}`;
		res += `${affiche_vac("N")}`;
		res += `${affiche_vac("N-1")}`;
		res += `${affiche_inst()}`;
		res += `<tr class="titre"><th class='bottom_2px left_2px right_2px' colspan="6">Heures UTC</th>${heure()}`;
		res += `${affiche_nbpc()}`;
		res += `${affiche_demi_uc()}`;
		res += `${affiche_uceso()}`;
		res += '</tbody></table>';
		this.containerTour.innerHTML = res;
		
		// ajoute les clicks sur la case du nbre de pc de la vac
		const td_pc = document.querySelectorAll('.pc');

		td_pc.forEach(td_el => {
			let vac = td_el.dataset.vac;
			if (update[this.zone][this.day]['update_count'][vac] !== 0) $$(`td[data-vac=${vac}].pc`).classList.add('bg_red');	
			td_el.addEventListener('click', (event) => {
				$('popup-wrap').classList.add('popup-modif');
				$$('.popup-box').classList.add('popup-modif');
				for (const user in pc_vac[vac]["userList"]) {
					let ih = `
					<div id="modif_eq">
					${add_pers("J1")}
					${add_pers("J3")}
					${add_pers("S2")}
					${add_pers("J2")}
					${add_pers("S1")}
					${add_pers("N")}
					${add_pers("N-1")}
					<button id="ch">Changer</button>
					</div>`;
				show_popup("Modification", ih);
				}
				const type = document.querySelectorAll('.typePC,.typedetache');
				type.forEach(type_el => {
					type_el.addEventListener('click', (event) => {
						const vac = type_el.dataset.vac;
						if (type_el.classList.contains('barre')) { 
							update[this.zone][this.day]['update_count'][vac]++;
							const n = update[this.zone][this.day]['update_name'][vac].indexOf(type_el.dataset.nom);
							update[this.zone][this.day]['update_name'][vac].splice(n,1);
						} else {
							update[this.zone][this.day]['update_count'][vac]--;
							update[this.zone][this.day]['update_name'][vac].push(type_el.dataset.nom);
						}
						type_el.classList.toggle('barre');
						type_el.parentNode.firstChild.classList.toggle('surligne');
						$$(`span[data-vac='${vac}']`).innerHTML = update[this.zone][this.day]['update_count'][vac];
					});
				});
				// click sur le bouton "Changer"
				$('ch').addEventListener('click', (event) => {
					var data = {
						method: "post",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(update)
					};
					show_popup("Patientez !", "Sauvegarde des maj effectif en cours...");
					fetch( 'export_update_to_json.php', data)
					.then((response) => {
						document.querySelector('.popup-close').click();
						this.containerTour.innerHTML = '';
						this.show_feuille_capa();
					});
				})
			});
		});

		// Fabrique la ligne du tour de service
		function affiche_vac(vac) {
			let res1 = "", res2 = "", res3 = "";
			// A = effectif/2
			// B = effectif/2 (+1)
			const cds = (vac == "J2" || vac == "S1") ? 0 : 1
			const dispoA = Math.min(Math.floor(pc_vac[vac]["nbpc"]/2), Math.floor((pc_vac[vac]["BV"]-cds)/2));
			const dispoB = Math.min(Math.floor(pc_vac[vac]["nbpc"]/2)+(pc_vac[vac]["nbpc"])%2, Math.floor((pc_vac[vac]["BV"]-cds)/2)+(pc_vac[vac]["BV"]-cds)%2);
			
			// comp : { [ ["00:00", 0, 3, 4], ["hh:mm", cds, A, B], ... ] }
			const vacation = (vac === "N-1") ? "N" : vac;
			const comp = tour_utc[vacation].map( elem => [elem[0], parseInt(elem[1]), parseInt(elem[2])*dispoA, parseInt(elem[3])*dispoB]);
			
			// array d'index 0 à 95
			comp.forEach( (elem, index) => {
				let nb_cds = elem[1], nb_A = elem[2], nb_B = elem[3];
				let cl1 = "", cl2 = "", cl3="";
				if (vac != "N" && vac != "N-1") {
					if (nb_cds != 0) cl1 = "bg";
					if (nb_A != 0) cl2 = "bg"; 
					if (nb_B != 0) cl3 = "bg";
					if (index === 95) { cl1 += " right_2px"; cl2 += " right_2px"; cl3+= " right_2px"; }
					if (index%4 === 0) { cl1 = (cl1+" left_2px").trimStart(); cl2 = (cl2+" left_2px").trimStart(); cl3 = (cl3+" left_2px").trimStart(); }
					res1 += `<td class='${cl1}'>${nb_cds || ''}</td>`; 				// CDS travaille sur position ?
					res2 += `<td class='${cl2}'>${nb_A || ''}</td>`; 				// partie A
					res3 += `<td class='${cl3} bottom_2px'>${nb_B || ''}</td>`; 	// partie B
				}
				if (vac === "N") {
					if (nb_cds != 0 && index >= 48) cl1 = "bg";
					if (nb_A != 0 && index >= 48) cl2 = "bg"; 
					if (nb_B != 0 && index >= 48) cl3 = "bg"; 
					if (index == 95) { cl1 += " right_2px"; cl2 += " right_2px"; cl3+= " right_2px"; }
					if (index%4 === 0) { cl1 = (cl1+" left_2px").trimStart(); cl2 = (cl2+" left_2px").trimStart(); cl3 = (cl3+" left_2px").trimStart(); }
					// index 48 = midi donc >48 est le tour de nuit de soirée
					if (index > 48) res1 += `<td class='${cl1}'>${nb_cds || ''}</td>`; else res1 += `<td class='${cl1}'></td>`; // CDS travaille sur position ?
					if (index > 48) res2 += `<td class='${cl2}'>${nb_A || ''}</td>`; else res2 += `<td class='${cl2}'></td>`;
					if (index > 48) res3 += `<td class='${cl3} bottom_2px'>${nb_B || ''}</td>`; else res3 += `<td class='${cl3} bottom_2px'></td>`;
				} 
				if (vac === "N-1") {
					if (nb_cds != 0 && index < 48) cl1 = "bg";
					if (nb_A != 0 && index < 48) cl2 = "bg"; 
					if (nb_B != 0 && index < 48) cl3 = "bg"; 
					if (index == 95) { cl1 += " right_2px"; cl2 += " right_2px"; cl3+= " right_2px"; }
					if (index%4 === 0) { cl1 = (cl1+" left_2px").trimStart(); cl2 = (cl2+" left_2px").trimStart(); cl3 = (cl3+" left_2px").trimStart(); }
					// index 48 = midi donc <48 est le tour de nuit de la matinée
					if (index < 48) res1 += `<td class='${cl1}'>${nb_cds || ''}</td>`; else res1 += `<td class='${cl1}'></td>`; // CDS travaille sur position ?
					if (index < 48) res2 += `<td class='${cl2}'>${nb_A || ''}</td>`; else res2 += `<td class='${cl2}'></td>`;
					if (index < 48) res3 += `<td class='${cl3} bottom_2px'>${nb_B || ''}</td>`; else res3 += `<td class='${cl3} bottom_2px'></td>`;
				}
			});	
			return `
			<tr data-vac='${vac}'>
				<td class='left_2px right_1px'></td><td class='right_1px'></td>
				<td class='right_1px'>cds</td><td>${cds}</td>
				<td class='pc right_1px' data-vac='${vac}'>${pc_vac[vac]["nbpc"]}</td><td class='right_2px'>${pc_vac[vac]["BV"]}</td>${res1}</tr>
			<tr data-vac='${vac}'>
				<td class='eq left_2px right_1px' data-vac='${vac}'>${tab_vac_eq[vac]}</td>
				<td class='right_1px'>${vac}</td><td class='right_1px'>A</td><td class='right_1px' colspan="2"></td><td class='right_2px'></td>${res2}</tr>
			<tr data-vac='${vac}'>
				<td class='left_2px bottom_2px right_1px'></td><td class='bottom_2px right_1px'></td>
				<td class='bottom_2px right_1px'>B</td><td class='bottom_2px right_1px' colspan="2"></td>
				<td class='bottom_2px right_2px'></td>${res3}</tr>`;
		}
		
		// fabrique la ligne du supplément instruction
		function affiche_inst() {
			let res2 = "";
			for(let i=0;i<95;i++) {	
				//console.log("Time: "+get_time(i)+"  "+in15mn[i]);
				if (pc_instr_15mn[i][1] != "") res2 += `<td class='bg bottom_2px'>${pc_instr_15mn[i][0]}</td>`;
				else res2 += `<td class='bottom_2px'></td>`;
			} 
			res2 += `<td class='bottom_2px right_2px'></td>`;
			let res = `<tr><td class='left_2px bottom_2px right_2px' colspan="6">Instru/Asa</td>${res2}</tr>`;
			return res;
		}

		// fabrique la ligne du nbre de pc dispo
		function affiche_nbpc() {
			let res2 = "";
			pc_15mn.forEach( (elem, index) => {
				let cl = "left_1px";
				if (index%4 === 0) cl = "left_2px";
				if (index === 95) cl += " right_2px";
				res2 += `<td class='${cl} bottom_2px'>${elem[1]+pc_instr_15mn[index][0]}</td>`;
			});
			let res = `<tr><td class='left_2px bottom_2px right_2px' colspan="6">Nb PC</td>${res2}</tr>`;
			return res;
		}

		// fabrique la ligne du nbre de 1/2 pc
		function affiche_demi_uc() {
			let res2 = "";
			pc_15mn.forEach( (elem, index) => {
				let cl = "left_1px";
				if (index%4 === 0) cl = "left_2px";
				if (index === 95) cl += " right_2px";
				const demi = ((elem[1]+pc_instr_15mn[index][0])%2 === 0) ? "" : "\u00bd";
				res2 += `<td class='${cl} bottom_2px'>${demi}</td>`;
			});
			let res = `<tr><td class='left_2px bottom_2px right_2px' colspan="6">Demi UC</td>${res2}</tr>`;
			return res;
		}
		
		// fabrique la ligne du nbre d'uceso dispo
		//	uceso = partie entière nbr_pc/2
		function affiche_uceso() {
			const uc = pc_15mn.map( (elem, index) => [elem[0], Math.floor((elem[1] + pc_instr_15mn[index][0]) / 2) ]);
			let res3 = "";
			compact(uc).forEach( elem => {
				let nb_occ = elem[1] - elem[0] + 1;
				res3 += `<td class="bordure_uc" colspan="${nb_occ}">${elem[2]}</td>`;
			});
			
			let res = `<tr><td class='left_2px bottom_2px right_2px' colspan="6">UCESO</td>${res3}</tr>`;
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
		
		function add_RO_det(vac, present) {
			const values = Object.values(pc_vac[vac]["html"]);
			for (const obj of values) {
				//console.log(values[obj]);
				for (const user in obj) {
					if (obj[user].search(/<sup>RO/) != -1) present.push([user, "RO"]);
					if (obj[user].search(/detache/) != -1) present.push([user, "detache"]);
				}
			}
		}
		
		function add_stage_conge(vac, present) {
			const cles = Object.keys(pc_vac[vac]["teamData"]);
			for (const k of cles) {
				for (const user in pc_vac[vac]["teamData"][k]) {
						present.push([user, k]);
				}
			}
		}

		const add_pers = (vac) => {
			let res = `<table><caption>${vac} : <span data-vac='${vac}'>${update[this.zone][this.day]['update_count'][vac]}</span></caption><thead><tr><th>Nom</th><th>Type</th></tr></thead><tbody>`;
			const pres = [];
			const present = [];
			add_RO_det(vac, present);
			add_stage_conge(vac, present);
			present.forEach(elem => {
				pres.push(elem[0]);
			})
			for (const user in pc_vac[vac]["userList"]) {
				const name = pc_vac[vac]["userList"][user].screen_unique_name || pc_vac[vac]["userList"][user].nom;
				const stagiaire = pc_vac[vac]["userList"][user].details;
				if (pres.includes(name) === false && stagiaire != "Stagiaire") present.push([name, "PC"]);
				if (pres.includes(name) === false && stagiaire === "Stagiaire") present.push([name, "Mod"]);
			}

			for (const p of present) {
				let cl = `type${p[1]}`, cl_previous;
				if (update[this.zone][this.day]['update_name'][vac].includes(p[0])) { cl += ' barre'; cl_previous = 'surligne'; }
				res += `<tr><td class='${cl_previous}'>${p[0]}</td><td class='${cl}' data-vac='${vac}' data-nom='${p[0]}'>${p[1]}</td><tr>`;
			}
			res += `</tbody></table>`;
			return res;
		}

		/* ----------------------------------------------------------------------------
		Combiner les cases pour un affichage plus lisible
		Calcul des nombres d'ucesos identiques qui se suivent
		but :  3 3 3 3 => 1 grande case affichant 3
			@param {array} 	 - nbpc_dispo : [ ["hh:mm", nb_pc_dispo], [...], ... ]
			@returns {array} - [ [index_debut, index_fin, nb_pc_dispo], ... ]
		---------------------------------------------------------------------------- */
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
		
	}


	/* --------------------------------------------------------------------------------------------------
		Combiner les cases pour un affichage plus lisible
		Calcul des nombres de pc identiques qui se suivent
		but : 3 3 3 3 => 1 grande case affichant 3
			@param {array}	 - nbpc_dispo : [ ["hh:mm", cds, A, B], [...], ... ], index (1=cds, 2=A, 3=B)
			@returns {array} - [ [index_debut, index_fin, nb_pc_dispo], ... ]
	-------------------------------------------------------------------------------------------------- */
	compact_ligne(pcs, ind) { // non utilisé
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
}

/* ---------------------------------------------------------------------------------
		Affiche les graphes :
		- vert de la capa offerte le jour choisi
		- orange : les ouvertures réalisées à J-7
		- bleu	 : les ouvertures réalisées à J-728 (2019)
		
		Paramètre :
		 @param {string} containerId - id du container d'affichage
		 @param {string} day - "yyyy-mm-jj"
		 @param {string} zone - "AE" ou "AW"
		 @param {array} pc - objet d'array des crénaux horaires associés aux pc dispo
	-------------------------------------------------------------------------------- */
async function show_courage_graph(containerId, day, zone, pc) {
	const pc_15mn = pc["pc_total_dispo_15mn"];
	const pc_instr_15mn = pc["pc_instr_15mn"];
	const uceso = pc_15mn.map( (elem, index) => [elem[0], Math.floor((elem[1] + pc_instr_15mn[index][0]) / 2) ]);
	//const uceso = pc_15mn.map( elem => [elem[0],Math.floor(elem[1]/2)]);
	const day7 = jmoins7(day);
	const day728 = jmoins728(day);
	/*
	const schema = await read_schema_realise(day, zone);
	const schema7 = await read_schema_realise(day7, zone);
	const schema728 = await read_schema_realise(day728, zone);
	*/
	const sch = new schema_rea(day, zone);
    const schema = await sch.read_schema_realise();
	const sch7 = new schema_rea(day7, zone);
    const schema7 = await sch7.read_schema_realise();
	const sch728 = new schema_rea(day728, zone);
    const schema728 = await sch728.read_schema_realise();
	var chartDom = $(containerId);
	chartDom.style.height = "400px";
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
/*  ------------------------------------------------
				Feuille de Capa
	------------------------------------------------ */

class capa {

	/* ------------------------------------------------------
			@param {string} day 	- "yyyy-mm-jj"
            @param {string} zone	- "AE" ou "AW"
	   ------------------------------------------------------ */
    constructor(day, zone) {
        this.day = day;
		this.zone_schema = zone;
        this.zone_olaf = zone.substr(1,1); // 2è lettre de la zone (E ou W)
		this.zone = this.zone_olaf === "E" ? "est" : "ouest"; 
    }

    /* ----------------------------------------------------------------------------------------------------------------
        *Calcul du nbre de PC total par vac
        *Calcul du nbre de PC total dispo par pas de 15mn à la date choisie
            @param {object} update	- {"J1":0, "J3":0, "S2":0, "J2":0, "S1":0, "N":0, "N-1":0, "J1BV":0, "J3BV":0,...}
                                    - Nombre de pc à retrancher à l'effectif OLAF ou au BV
			@param {boolean} noBV	- false pour ne pas prendre en compte les BV
            @returns {object} 
                { "pc_vac": {"vac": {"nbpc": nbre_pc, "BV", "RO"}, ...}, 
                "pc_total_dispo_15mn":[ ["hh:mm", nb_pc_dispo], [...], ... ] }
    ------------------------------------------------------------------------------------------------------------------- */
    async get_nbpc_dispo(update = {"J1":0, "J3":0, "S2":0, "J2":0, "S1":0, "N":0, "N-1":0, "J1BV":0, "J3BV":0, "S2BV":0, "J2BV":0, "S1BV":0, "NBV":0, "N-1BV":0}, noBV = false) {
        if (this.day === null) throw new Error("Le jour est indéfini");
        //try {
			const tab_vac_eq = this.get_vac_eq();
			const instr = await loadJson("../instruction.json");
			const Jx_date = await loadJson(date_supp_json);
			
			const yesterday = jmoins1(this.day);
			// récupère l'objet contenant les propriétés equipes
			this.effectif = this.effectif || await get_olaf(this.zone_olaf, this.day, yesterday);
			console.log(this.effectif);
			// si pas de donnée on retourne 0
			if (this.effectif == 0) return 0;
			
			const tour_local = await loadJson(tour_json);
			const tour_utc = await this.get_tour_utc(tour_local);
			const tds_supp_local = await loadJson(tour_supp_json);
			const tds_supp_utc = await this.get_tds_supp_utc(tds_supp_local);
			
			// Calcul du nombre de pc à afficher 
			// On récupère l'effectif total, donc on doit enlever le cds sur les vacations sauf J2 et S1	
			const pc = {"J1":{}, "J3":{}, "S2":{}, "J2":{}, "S1":{}, "N":{}, "N-1":{}};
			for(const vac in tab_vac_eq) {
				let p = tab_vac_eq[vac]+"-"+this.zone_olaf;
				const upBV = vac+"BV";
				if (vac !== "N-1") {
					const cds = (vac == "J2" || vac == "S1") ? 0 : 1; // cds=0 en J2 et S1
					// Le RO induit apparait si detachés > 1 et plus que 1 n'est pas Expert Ops, ACDS ou Assistant sub
					pc[vac]["ROinduit"] = parseInt(this.effectif[this.day][p]["teamReserve"]["roInduction"]);
					pc[vac]["nbpc"] = parseInt(this.effectif[this.day][p]["teamReserve"]["teamQuantity"]) - cds + update[vac]; 
					pc[vac]["BV"] = parseInt(this.effectif[this.day][p]["teamReserve"]["BV"]) + update[upBV];
					pc[vac]["RO"] = parseInt(this.effectif[this.day][p]["teamReserve"]["roQuantity"]);
					pc[vac]["userList"] = this.effectif[this.day][p]["userList"];
					pc[vac]["teamData"] = this.effectif[this.day][p]["teamData"];
					pc[vac]["html"] = this.effectif[this.day][p]["html"][this.day][p];
					if (typeof pc[vac]["html"]["lesrenforts"] === 'undefined') {
						pc[vac]["renfort"] = 0;
					} else {
						pc[vac]["renfort"] = Object.keys(pc[vac]["html"]["lesrenforts"]).length;
					}
					//pc[vac]["detache"] = parseInt(this.effectif[this.day][p]["teamReserve"]["detacheQuantity"]);
				} else {
					pc[vac]["ROinduit"] = parseInt(this.effectif[yesterday][p]["teamReserve"]["roInduction"]);
					pc[vac]["nbpc"] = parseInt(this.effectif[yesterday][p]["teamReserve"]["teamQuantity"]) - 1 + update[vac]; // le cds ne compte pas dans le nb de pc => -1
					pc[vac]["BV"] = parseInt(this.effectif[yesterday][p]["teamReserve"]["BV"]) + update[upBV];
					pc[vac]["RO"] = parseInt(this.effectif[yesterday][p]["teamReserve"]["roQuantity"]);
					pc[vac]["userList"] = this.effectif[yesterday][p]["userList"];
					pc[vac]["teamData"] = this.effectif[yesterday][p]["teamData"];
					pc[vac]["html"] = this.effectif[yesterday][p]["html"][yesterday][p];
					if (typeof pc[vac]["html"]["lesrenforts"] === 'undefined') {
						pc[vac]["renfort"] = 0;
					} else {
						pc[vac]["renfort"] = Object.keys(pc[vac]["html"]["lesrenforts"]).length;
					}
					//pc[vac]["detache"] = parseInt(this.effectif[yesterday][p]["teamReserve"]["detacheQuantity"]);
				}
			} 
			
			// array du nombre de pc dispo associé au créneau horaire du tour de service
			// En 24h, il y a 96 créneaux de 15mn.
			// [ ["hh:mm", nb_pc_dispo], [...], ... ]
			let nb_pc = 0;
			let pcs = [];
			const in15mn = []; // nbre de pc instruction par 15 mn
			const effectif_Jx_15mn = [];
			const vacs = ["J1", "J3", "S2", "J2", "S1"];
			const cds = 1;
			for(var i=0;i<96;i++) {
				vacs.forEach(vacation => {
					const cds = (vacation == "J2" || vacation == "S1") ? 0 : 1;
					if (tour_utc[vacation][i][1] === 1) nb_pc += cds; // cds qui bosse sur secteur
					if (tour_utc[vacation][i][2] === 1) {
						if (noBV === false) {
							nb_pc += Math.min(Math.floor(pc[vacation]["nbpc"]/2), (Math.floor((pc[vacation]["BV"]+pc[vacation]["renfort"]-cds-pc[vacation]["ROinduit"])/2)));	
						} else {
							nb_pc += Math.floor(pc[vacation]["nbpc"]/2);
						}
					}
					if (tour_utc[vacation][i][3] === 1) {
						if (noBV === false) {
							nb_pc += Math.min(Math.floor(pc[vacation]["nbpc"]/2)+(pc[vacation]["nbpc"])%2, Math.floor((pc[vacation]["BV"]+pc[vacation]["renfort"]-cds-pc[vacation]["ROinduit"])/2)+(pc[vacation]["BV"]+pc[vacation]["renfort"]-cds-pc[vacation]["ROinduit"])%2);
						} else {
							nb_pc += Math.floor(pc[vacation]["nbpc"]/2)+(pc[vacation]["nbpc"])%2;
						}
					}
				})
				if (tour_utc["N"][i][1] === 1 && i>48) nb_pc += cds; // cds qui bosse sur secteur
				if (tour_utc["N"][i][2] === 1 && i>48) {
					if (noBV === false) {
						nb_pc += Math.min(Math.floor(pc["N"]["nbpc"]/2), Math.floor((pc["N"]["BV"]+pc["N"]["renfort"]-cds-pc["N"]["ROinduit"])/2));
					} else {
						nb_pc += Math.floor(pc["N"]["nbpc"]/2);
					}
				}
				if (tour_utc["N"][i][3] === 1 && i>48) {
					if (noBV === false) {
						nb_pc += Math.min(Math.floor(pc["N"]["nbpc"]/2)+(pc["N"]["nbpc"])%2, Math.floor((pc["N"]["BV"]+pc["N"]["renfort"]-cds-pc["N"]["ROinduit"])/2)+(pc["N"]["BV"]+pc["N"]["renfort"]-cds-pc["N"]["ROinduit"])%2);
					} else {
						nb_pc += Math.floor(pc["N"]["nbpc"]/2)+(pc["N"]["nbpc"])%2;
					}
				}
				if (tour_utc["N"][i][1] === 1 && i<48) nb_pc += cds; // cds qui bosse sur secteur
				if (tour_utc["N"][i][2] === 1 && i<48) {
					if (noBV === false) {
						nb_pc += Math.min(Math.floor(pc["N-1"]["nbpc"]/2), Math.floor((pc["N-1"]["BV"]+pc["N-1"]["renfort"]-cds-pc["N-1"]["ROinduit"])/2));
					} else {
						nb_pc += Math.floor(pc["N-1"]["nbpc"]/2);
					}
				}
				if (tour_utc["N"][i][3] === 1 && i<48) {
					if (noBV === false) {
						nb_pc += Math.min(Math.floor(pc["N-1"]["nbpc"]/2)+(pc["N-1"]["nbpc"])%2, Math.floor((pc["N-1"]["BV"]+pc["N-1"]["renfort"]-cds-pc["N-1"]["ROinduit"])/2)+(pc["N-1"]["BV"]+pc["N-1"]["renfort"]-cds-pc["N-1"]["ROinduit"])%2);
					} else {
						nb_pc += Math.floor(pc["N-1"]["nbpc"]/2)+(pc["N-1"]["nbpc"])%2;
					}
				}
				pcs.push([tour_utc["J1"][i][0], nb_pc]);
				nb_pc = 0;

				in15mn[i] = [0, []];
				if (typeof instr[this.zone][this.day] !== 'undefined') {
					instr[this.zone][this.day].forEach( (elem, index) => {
						const debut = elem["debut"];
						const fin = elem["fin"];
						const d = elem["date"];
						const zone = elem["zone"];
						const type = elem["type"];
						const comm = elem["comm"];
						let t = get_time(i);
						if (d === this.day && zone.toLowerCase() === this.zone) {
							if (t >= debut && t< fin) {
								if (type === "Inst") { in15mn[i][0] += 2; in15mn[i][1].push({type: type, comm: comm}); }
								if (type === "Eleve") { in15mn[i][1].push({type: type, comm: comm}); }
								if (type === "Asa") { in15mn[i][0] -= 1; in15mn[i][1].push({type: type, comm: comm}); }
								if (type === "Simu1PC") { in15mn[i][0] -= 1; in15mn[i][1].push({type: type, comm: comm}); }
								if (type === "Simu2PC") { in15mn[i][0] -= 2; in15mn[i][1].push({type: type, comm: comm}); }
							} 
						}
					});
				}

				effectif_Jx_15mn[i] = 0;
				if (typeof Jx_date[this.zone][this.day] !== 'undefined') {
					Object.keys(Jx_date[this.zone][this.day]).forEach( (vac_jx, index) => {
						const nb = Jx_date[this.zone][this.day][vac_jx];
						if (tds_supp_utc[vac_jx][i][1] === 1) {
							effectif_Jx_15mn[i] += nb;
						}
						console.log(vac_jx+" "+get_time(i)+"   tds: "+tds_supp_utc[vac_jx][i][1]+"  nb_tds: "+nb);
					});
				}
			}
			return {"pc_vac": pc, "pc_total_dispo_15mn": pcs, "pc_instr_15mn": in15mn, "pc_jx_15mn": effectif_Jx_15mn};
		//}
		//catch (err) {
        //    alert(err);
        //}
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
        @returns {object}  - tour_utc : { [ ["00:00", 0, 1, 1], ["hh:mm", cds, A, B], ... ] }
    ----------------------------------------------------------------------------------------- */	
    async get_tour_utc(tour_local) {
        
        // récupère le décalage utc/local en heure
		const d = new Date(this.day);
		d.setHours(6);
        const diff = Math.abs(d.getTimezoneOffset()) / 60;
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
        console.log("tour utc");
		console.log(tour_utc);    
        return tour_utc;
    }
	/* -----------------------------------------------------------------------------------------
        Transformation du tour de service (défini en heure locale) en heure UTC
        @param {object} tour_local 	- le json du tour de service
        @returns {object}  - tour_utc : { [ ["00:00", 0], ["hh:mm", nb], ... ] }
    ----------------------------------------------------------------------------------------- */
	async get_tds_supp_utc(tour_local) {
		// récupère le décalage utc/local en heure
		const d = new Date(this.day);
		d.setHours(6);
        const diff = Math.abs(d.getTimezoneOffset()) / 60;
        const tour = tour_local[this.zone];	
        
        const index_deb = diff*4 - 1;
        const tour_utc = {};
		const Jx = Object.keys(tour);
        Jx.forEach(vac => {
			tour_utc[vac] = [];
		})
            
        function push_utc(vac) {
            tour[vac].forEach( (elem, index) => {
                if (index > index_deb) {
                    let h = min_to_time(time_to_min(elem[0]) - diff*60);
                    tour_utc[vac].push([h, elem[1]]);
                }
            });
            if (diff === 2) {
                tour_utc[vac].push(["22:00", tour[vac][0][1]]);
                tour_utc[vac].push(["22:15", tour[vac][1][1]]);
                tour_utc[vac].push(["22:30", tour[vac][2][1]]);
                tour_utc[vac].push(["22:45", tour[vac][3][1]]);
            }
            tour_utc[vac].push(["23:00", tour[vac][4][1]]);
            tour_utc[vac].push(["23:15", tour[vac][5][1]]);
            tour_utc[vac].push(["23:30", tour[vac][6][1]]);
            tour_utc[vac].push(["23:45", tour[vac][7][1]]);
        }
        
		Jx.forEach(vac => {
			push_utc(vac);
		})
        console.log("tour supp utc");
		console.log(tour_utc);
        return tour_utc;
	}

}

class feuille_capa extends capa {
	/* ----------------------------------------------------------------
		@param {string} containerIdTour - id du container pour le tour
	   ---------------------------------------------------------------- */
	constructor(containerIdTour, day, zone) {
		super(day, zone);
		this.containerTour = $(containerIdTour);
		this.init_data();
	}

	/*	------------------------------------------
					Init Data		
		------------------------------------------ */
	async init_data() {
		show_popup("Patientez !", "Chargement en cours...");
		this.update = {"est": {}, "ouest": {}};
		this.update[this.zone][this.day] = {"update_count": {"J1":0, "J3":0, "S2":0, "J2":0, "S1":0, "N":0, "N-1":0, "J1BV":0, "J3BV":0, "S2BV":0, "J2BV":0, "S1BV":0, "NBV":0, "N-1BV":0}, "update_name": {"J1":[], "J3":[], "S2":[], "J2":[], "S1":[], "N":[], "N-1":[]}};
		this.pc = await this.get_nbpc_dispo(this.update[this.zone][this.day]['update_count']);
		document.querySelector('.popup-close').click();
		this.pc_15mn = this.pc["pc_total_dispo_15mn"];
		this.pc_instr_15mn = this.pc["pc_instr_15mn"];
		this.pc_jx_15mn = this.pc["pc_jx_15mn"];
		console.log("jx15mn");
		console.log(this.pc_jx_15mn);
		this.pc_vac = this.pc["pc_vac"];
		this.tab_vac_eq = this.get_vac_eq(this.day);
		this.tour_local = await loadJson(tour_json);
		this.tour_utc = await this.get_tour_utc(this.tour_local);
		this.tour_supp_local = await loadJson(tour_supp_json);
		this.tour_supp_utc = await this.get_tds_supp_utc(this.tour_supp_local);
		this.show_feuille_capa();
	}

	/*	------------------------------------------
			Affichage de la feuille de capa		
		------------------------------------------ */
		
	show_feuille_capa() {
		
		// Construit le tableau
		let res = `<table class="uceso">
					<caption>Journée du ${reverse_date(this.day)} - Zone ${this.zone}</caption>`;
		res += `<thead>
				<tr class="titre"><th class="top_2px left_2px bottom_2px right_1px">Eq</th><th class="top_2px bottom_2px right_1px">Vac</th><th class="top_2px bottom_2px right_1px">Part</th>`;
		res += `<th class="top_2px bottom_2px details masque">CDS</th><th class="top_2px bottom_2px details masque">PC</th><th class="top_2px bottom_2px right_1px details masque">det</th><th class="top_2px bottom_2px right_2px details masque">BV</th>`;
		res += `<th class="top_2px bottom_2px right_2px" colspan="96">...</th></tr>
				</thead>
				<tbody>`;
		//Object.keys(this.tour_supp_local[this.zone]).forEach(vac => {
		//res += `${this.affiche_Jx(vac)}`;
		//})
		res += `${this.affiche_Jx("J0")}`;
		
		res += `${this.affiche_vac("J1")}`;
		res += `${this.affiche_vac("J3")}`;
		res += `${this.affiche_vac("S2")}`;
		res += `${this.affiche_vac("J2")}`;
		res += `${this.affiche_vac("S1")}`;
		res += `${this.affiche_vac("N")}`;
		res += `${this.affiche_vac("N-1")}`;
		res += `${this.affiche_inst()}`;
		res += `<tr class="titre"><td class='bottom_2px left_2px' colspan="3">Heures UTC</td><td class='bottom_2px right_2px details masque' colspan="4"></td>${this.heure()}`;
		res += `${this.affiche_nbpc()}`;
		res += `${this.affiche_demi_uc()}`;
		res += `${this.affiche_uceso()}`;
		res += '</tbody></table>';
		this.containerTour.innerHTML = res;

		// ajoute le hover sur la ligne instruction
		const td_instr = document.querySelectorAll('[data-instr]');
		td_instr.forEach(td_el => {
			let detail = td_el.dataset.instr.split('$');
			detail.pop();
			td_el.addEventListener('mouseover', (event) => {
				const el = document.createElement('div');
				el.setAttribute('id', 'popinstr');
				let det = "";
				detail.forEach(value => {
					const v = value.split(":");
					det += `<div style="float:left;width:50%;">${v[0]} : </div><div style="float:left;width:50%;">${v[1]}</div>`;
				})
				const pos = td_el.getBoundingClientRect();
				el.style.position = 'absolute';
				el.style.left = pos.left + 'px';
				el.style.top = pos.top + 20 + 'px';
				el.style.backgroundColor = '#fbb';
				el.style.padding = '10px';
				el.style.width = '200px';
				document.body.insertBefore(el, $('feuille_capa_tour'));
				el.innerHTML = det;
			})
			td_el.addEventListener('mouseleave', (event) => {
				$('popinstr').remove();
			})
		})

		// ajoute les clicks sur la case du nbre de pc de la vac
		const td_pc = document.querySelectorAll('.pc');

		td_pc.forEach(td_el => {
			let vac = td_el.dataset.vac;
			if (this.update[this.zone][this.day]['update_count'][vac] !== 0) $$(`td[data-vac=${vac}].pc`).classList.add('bg_red');	
			td_el.addEventListener('click', (event) => {
				$('popup-wrap').classList.add('popup-modif');
				$$('.popup-box').classList.add('popup-modif');
				for (const user in this.pc_vac[vac]["userList"]) {
					let ih = `
					<div id="modif_eq">
					${this.add_pers("J1")}
					${this.add_pers("J3")}
					${this.add_pers("S2")}
					${this.add_pers("J2")}
					${this.add_pers("S1")}
					${this.add_pers("N")}
					${this.add_pers("N-1")}`;
					//ih += '<button id="ch">Changer</button>';
					ih += `</div>`;
				show_popup("Personnels", ih);
				}
				/*  -------------------------------------------------------
						Modification locale de la feuille de capa
					-------------------------------------------------------
				const type = document.querySelectorAll('.typePC,.typePC-DET,.typePC-RPL');
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
				*/
			});
		});
	}
		
	// Fabrique la ligne du tour de service
	affiche_vac(vac) {
		let res1 = "", res2 = "", res3 = "";
		// A = effectif/2
		// B = effectif/2 (+1)
		console.log("VAC: "+vac+" "+this.pc_vac[vac]);
		const cds = (vac == "J2" || vac == "S1") ? 0 : 1
		const dispoA = Math.min(Math.floor(this.pc_vac[vac]["nbpc"]/2), Math.floor((this.pc_vac[vac]["BV"]+this.pc_vac[vac]["renfort"]-cds-this.pc_vac[vac]["ROinduit"])/2));
		const dispoB = Math.min(Math.floor(this.pc_vac[vac]["nbpc"]/2)+(this.pc_vac[vac]["nbpc"])%2, Math.floor((this.pc_vac[vac]["BV"]+this.pc_vac[vac]["renfort"]-cds-this.pc_vac[vac]["ROinduit"])/2)+(this.pc_vac[vac]["BV"]+this.pc_vac[vac]["renfort"]-cds-this.pc_vac[vac]["ROinduit"])%2);
		
		// comp : { [ ["00:00", 0, 3, 4], ["hh:mm", cds, A, B], ... ] }
		const vacation = (vac === "N-1") ? "N" : vac;
		const comp = this.tour_utc[vacation].map( elem => [elem[0], parseInt(elem[1]), parseInt(elem[2])*dispoA, parseInt(elem[3])*dispoB]);
		
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
			<td class='right_1px'>cds</td><td class='details masque'>${cds}</td>
			<td class='pc details masque' data-vac='${vac}'>${this.pc_vac[vac]["nbpc"]}</td>
			<td class='right_1px details masque' data-vac='${vac}'>${this.pc_vac[vac]["renfort"]}</td>
			<td class='right_2px details masque'>${this.pc_vac[vac]["BV"]}</td>${res1}</tr>
		<tr data-vac='${vac}'>
			<td class='eq left_2px right_1px' data-vac='${vac}'>${this.tab_vac_eq[vac]}</td>
			<td class='right_1px'>${vac}</td><td class='right_1px'>A</td>
			<td class='right_1px details masque' colspan="3"></td><td class='right_2px details masque'></td>${res2}</tr>
		<tr data-vac='${vac}'>
			<td class='left_2px bottom_2px right_1px'></td><td class='bottom_2px right_1px'></td>
			<td class='bottom_2px right_1px'>B</td><td class='bottom_2px right_1px details masque' colspan="3"></td>
			<td class='bottom_2px right_2px details masque'></td>${res3}</tr>`;
	}
		
	// fabrique la ligne du supplément instruction
	affiche_inst() {
		let res2 = "";
		res2 += `<td class='left_2px bottom_2px'></td>`; // border left à 2px pour la case 0
		for(let i=1;i<95;i++) {	
			//console.log("Time: "+get_time(i)+"  "+in15mn[i]);
			if (this.pc_instr_15mn[i][1].length !== 0) {
				let d = "data-instr='";
				this.pc_instr_15mn[i][1].forEach(val => {
					d += val.type + ":" + val.comm+"$";
				})
				d += "'";
				d = d.trimEnd();
				res2 += `<td class='bg bottom_2px' ${d}>${this.pc_instr_15mn[i][0]}</td>`;
			}
			else res2 += `<td class='bottom_2px'></td>`;
		} 
		res2 += `<td class='bottom_2px right_2px'></td>`;
		let res = `<tr><td class='left_2px bottom_2px' colspan="3">Instru/Asa</td><td class='bottom_2px right_2px details masque' colspan="4"></td>${res2}</tr>`;
		return res;
	}

	// fabrique la ligne du supplément Jx
	affiche_Jx(vac) {
		let res2 = "";
		if (this.pc_jx_15mn[0] === 0) {
			res2 += `<td class='left_2px bottom_2px'></td>`; // border left à 2px pour la case 0
		} else {
			res2 += `<td class='bg bottom_2px'>${this.pc_jx_15mn[0]}</td>`;
		}
		for(let i=1;i<95;i++) {	
			if (this.pc_jx_15mn[i] === 0) {
				res2 += `<td class='bottom_2px'></td>`;
			} else {
				res2 += `<td class='bg bottom_2px'>${this.pc_jx_15mn[i]}</td>`;
			}
		} 
		if (this.pc_jx_15mn[95] === 0) {
			res2 += `<td class='bottom_2px right_2px'></td>`;
		} else {
			res2 += `<td class='bg bottom_2px'>${this.pc_jx_15mn[95]}</td>`;
		}
		let res = `<tr><td class='left_2px bottom_2px' colspan="3">${vac}</td><td class='bottom_2px right_2px details masque' colspan="4"></td>${res2}</tr>`;
		return res;
	}

	// fabrique la ligne du nbre de pc dispo
	affiche_nbpc() {
		let res2 = "";
		this.pc_15mn.forEach( (elem, index) => {
			let cl = "left_1px";
			if (index%4 === 0) cl = "left_2px";
			if (index === 95) cl += " right_2px";
			res2 += `<td class='${cl} bottom_2px'>${elem[1]+this.pc_instr_15mn[index][0]+this.pc_jx_15mn[index]}</td>`;
		});
		let res = `<tr><td class='left_2px bottom_2px' colspan="3">Nb PC</td><td class='bottom_2px right_2px details masque' colspan="4"></td>${res2}</tr>`;
		return res;
	}

	// fabrique la ligne du nbre de 1/2 pc
	affiche_demi_uc() {
		let res2 = "";
		this.pc_15mn.forEach( (elem, index) => {
			let cl = "left_1px";
			if (index%4 === 0) cl = "left_2px";
			if (index === 95) cl += " right_2px";
			const demi = ((elem[1]+this.pc_instr_15mn[index][0])%2 === 0) ? "" : "\u00bd";
			res2 += `<td class='${cl} bottom_2px'>${demi}</td>`;
		});
		let res = `<tr><td class='left_2px bottom_2px' colspan="3">Demi UC</td><td class='bottom_2px right_2px details masque' colspan="4"></td>${res2}</tr>`;
		return res;
	}
		
	// fabrique la ligne du nbre d'uceso dispo
	//	uceso = partie entière nbr_pc/2
	affiche_uceso() {
		const uc = this.pc_15mn.map( (elem, index) => [elem[0], Math.floor((elem[1] + this.pc_instr_15mn[index][0] + this.pc_jx_15mn[index]) / 2) ]);
		let res3 = "";
		this.compact(uc).forEach( elem => {
			let nb_occ = elem[1] - elem[0] + 1;
			res3 += `<td class="bordure_uc" colspan="${nb_occ}">${elem[2]}</td>`;
		});
		
		let res = `<tr class="bold"><td class='left_2px bottom_2px' colspan="3">UCESO</td><td class='bottom_2px right_2px details masque' colspan="4"></td>${res3}</tr>`;
		return res;
	}
		
	// fabrique la ligne des heures du tableau
	heure() {
		let res = "";
		for(var i=0;i<96;i++) {
			if (i%4 == 0) res += `<td class="left_2px bottom_2px">${i/4}</td>`;
			if (i%4 == 2) res += `<td class="left_1px bottom_2px f8px">30</td>`;
			if (i%4 == 1 || (i%4 == 3 && i != 95)) { res += '<td class="bottom_2px"></td>'; } else if (i === 95) res += '<td class="right_2px bottom_2px"></td>';
		}
		return res;
	}
		
	add_travailleurs_RO(vac, present) {
		const values = Object.values(this.pc_vac[vac]["html"]);
		for (const obj of values) {
			//console.log(values[obj]);
			for (const user in obj) {
				if (obj[user].search(/reserve/) == -1 && obj[user].search(/detache/) == -1 && obj[user].search(/0ZE/) == -1 && obj[user].search(/0ZW/) == -1) {
					if (obj[user].search(/RPL/) == -1) present.push([user, "PC"]);
				}
				if (obj[user].search(/reserve/) != -1) present.push([user, "RO"]);
				if (obj[user].search(/detache/) != -1) {
					if (obj[user].search(/ACDS/) != -1) present.push([user, "PC-ACDS"]); else present.push([user, "PC-DET"]);
				}
				if (obj[user].search(/0ZE/) != -1 || obj[user].search(/0ZW/) != -1) present.push([user, "stagiaire"]);
			}
		}
	}
		
	add_stage_conge_autre(vac, present) {
		const cles = Object.keys(this.pc_vac[vac]["teamData"]);
		for (const k of cles) {
			for (const user in this.pc_vac[vac]["teamData"][k]) {
				if (k != "autre_agent") { 
					if (k === "stage") {present.push([user, k]); } 
					if (k === "conge") {present.push([user, k]); }
				}
				else {
					if (this.pc_vac[vac]["teamData"][k][user].search(/RPL/) != -1) {
						for (const user2 in this.pc_vac[vac]["userList"]) {
							const name = this.pc_vac[vac]["userList"][user2].screen_unique_name || this.pc_vac[vac]["userList"][user2].nom;
							var re = new RegExp(name, 'g');
							if (this.pc_vac[vac]["teamData"][k][user].match(re)) {
								present.push([user, "PC-RPL", name]);
							}
						}
					}
				}
			}
		}
	}

	add_pers (vac) {
		let res = `<table><caption>${vac} : <span data-vac='${vac}'>${this.update[this.zone][this.day]['update_count'][vac]}</span></caption><thead><tr><th>Nom</th><th>Type</th></tr></thead><tbody>`;
		const pres = [];
		const present = [];
		this.add_travailleurs_RO(vac, present);
		this.add_stage_conge_autre(vac, present);
		present.forEach(elem => {
			pres.push(elem[0]);
		})

		for (const p of present) {
			let cl = `type${p[1]}`, cl_previous;
			if (this.update[this.zone][this.day]['update_name'][vac].includes(p[0])) { cl += ' barre'; cl_previous = 'surligne'; }
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
	compact(pcs) {
		const counts = [];
		let index_ini = 0;
		for(var j=0;j<95;j++) {
			if (pcs[j][1] !== pcs[j+1][1]) {
				counts.push([index_ini, j, pcs[j][1]]);
				index_ini = j+1;
			}
		}
		counts.push([index_ini, 95, pcs[95][1]]);
		return counts;
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
				counts.push([index_ini, j, pcs[j][ind]]);
				index_ini = j+1;
			}
		}
		counts.push([index_ini, 95, pcs[95][ind]]);

		return counts;
	}
}

class simu_capa extends capa {
	/* ----------------------------------------------------------------
		@param {string} containerIdTour - id du container pour le tour
	   ---------------------------------------------------------------- */
	constructor(containerIdTour, day, zone) {
		super(day, zone);
		this.containerTour = $(containerIdTour);
		this.noBV = false;
	}

	async init() {
		this.containerTour.innerHTML = '<div id="left_part"><div id="table_option"></div><div id="table"></div></div><div id="right_part"></div>';
		show_popup("Patientez !", "Chargement OLAF en cours...");
		this.pc = await this.get_nbpc_dispo();
		document.querySelector('.popup-close').click();
		this.pc_vac = this.pc["pc_vac"];
		this.tab_vac_eq = this.get_vac_eq(this.day);
		this.v = {"J1":0, "J3":0, "S2":0, "J2":0, "S1":0, "N":0, "N-1":0, "J1BV":0, "J3BV":0, "S2BV":0, "J2BV":0, "S1BV":0, "NBV":0, "N-1BV":0};
	}

	/*	------------------------------------------
			Affichage de la feuille de capa		
		------------------------------------------ */
	async show_simu_capa() {
		//show_popup("Patientez !", "Chargement en cours...");
		const update = await loadJson("../update.json");
		if (typeof update[this.zone][this.day] === 'undefined') update[this.zone][this.day] = {"update_count": {"J1":0, "J3":0, "S2":0, "J2":0, "S1":0, "N":0, "N-1":0}, "update_name": {"J1":[], "J3":[], "S2":[], "J2":[], "S1":[], "N":[], "N-1":[]}};
		//document.querySelector('.popup-close').click();
		//const tour_local = await loadJson(tour_json);
		//const tour_utc = await this.get_tour_utc(tour_local);

		this.build_tab();
		this.modify_listener();
		show_capa_graph("right_part", this.day, this.zone_schema, this.pc);
		$('feuille_capa_simu').scrollIntoView({ 
            behavior: 'smooth' 
        });

	}

	// Fabrique la partie gauche
	affiche_vac(vac) {
		const cds = (vac == "J2" || vac == "S1") ? 0 : 1
		return `
		<tr data-vac='${vac}'>
		<td class='eq left_2px right_1px bottom_2px' data-vac='${vac}'>${this.tab_vac_eq[vac]}</td><td class='right_1px bottom_2px'>${vac}</td><td class='bottom_2px'>${cds}</td>
			<td class='nbpc bottom_2px' data-vacPC='${vac}'>${this.pc_vac[vac]["nbpc"]}</td>
			<td class='nbpc right_1px bottom_2px' data-vacDET='${vac}'>${this.pc_vac[vac]["renfort"]}</td>
			<td class='bv right_1px bottom_2px' data-vacBV='${vac}'>${this.pc_vac[vac]["BV"]}</td>
			<td class='bvini right_1px bottom_2px' data-vacBV='${vac}'>${this.pc_vac[vac]["BV"]}</td>
			<td class='right_1px bottom_2px'><div class="modify"><button class="minusBV minus" data-vac='${vac}'>-</button><span class="numberPlace" data-vacBV='${vac}'>0</span><button class="plusBV plus" data-vac='${vac}'>+</button></div></td>
			<td class='right_2px bottom_2px'><div class="modify"><button class="minusPC minus" data-vac='${vac}'>-</button><span class="numberPlace" data-vacPC='${vac}'>0</span><button class="plusPC plus" data-vac='${vac}'>+</button></div></td>
		</tr>`;
	}

	build_tab() {
		// Construit le tableau
		let to = `<h2>Zone ${this.zone.toUpperCase()} / ${reverse_date(this.day)}</h2>`;
		to += '<input type="checkbox" id="check_nobv" name="check_nobv"><label for="check_nobv">Enlever les BVs pour le calcul des UCESOs</label><div><button id="upd">Update</button></div>';
		$('table_option').innerHTML = to;
		$('check_nobv').addEventListener('click', () => {
			if ($('check_nobv').checked) {
				this.noBV = true;
			} else {
				this.noBV = false;
			}
		})
		$('upd').addEventListener('click', async () => {
			this.pc = await this.get_nbpc_dispo(this.v, this.noBV);
			show_capa_graph("right_part", this.day, this.zone_schema, this.pc);
		})
		let res = `<table class="simu">
					<thead>
						<tr class="titre"><th class="top_2px left_2px bottom_2px right_1px">Eq</th><th class="top_2px bottom_2px right_1px">Vac</th><th class="top_2px bottom_2px">CDS</th><th class="top_2px bottom_2px">PC</th><th class="top_2px bottom_2px right_1px">det</th><th class="top_2px bottom_2px right_1px">BV</th><th class="top_2px bottom_2px right_1px">BVini</th><th class="top_2px bottom_2px right_2px">Mod BV</th>
						<th class="top_2px bottom_2px right_2px">Mod PC</th></tr>
					</thead>
					<tbody>`;
		res += `${this.affiche_vac("J1")}`;
		res += `${this.affiche_vac("J3")}`;
		res += `${this.affiche_vac("S2")}`;
		res += `${this.affiche_vac("J2")}`;
		res += `${this.affiche_vac("S1")}`;
		res += `${this.affiche_vac("N")}`;
		res += `${this.affiche_vac("N-1")}`;
		res += '</tbody></table>';
		$('table').innerHTML = res;
	}

	modify_listener() {
		const moinsBV = document.querySelectorAll('.minusBV');
		const plusBV = document.querySelectorAll('.plusBV');
		const moinsPC = document.querySelectorAll('.minusPC');
		const plusPC = document.querySelectorAll('.plusPC');

		plusBV.forEach(el => {
			el.addEventListener('click', async (event) => {
				const vac = el.dataset.vac;
				const vacBV = vac+"BV";
				const cds = (vac == "J2" || vac == "S1") ? 0 : 1;
				$$(`span[data-vacBV='${vac}']`).innerHTML = parseInt($$(`span[data-vacBV='${vac}']`).innerHTML) + 1;
				this.v[vacBV]++;
				const BV_elem = $$(`td.bv[data-vacBV='${vac}']`);
				BV_elem.innerHTML = parseInt(BV_elem.innerHTML) + 1;
				if (BV_elem.innerHTML != $$(`td.bvini[data-vacBV='${vac}']`).innerHTML) {
					BV_elem.classList.add('bg_red');
				} else {
					BV_elem.classList.remove('bg_red');
				}
				this.pc = await this.get_nbpc_dispo(this.v, this.noBV);
				show_capa_graph("right_part", this.day, this.zone_schema, this.pc);
			});
		});

		moinsBV.forEach(el => {
			el.addEventListener('click', async (event) => {
				const vac = el.dataset.vac;
				const vacBV = vac+"BV";
				const cds = (vac == "J2" || vac == "S1") ? 0 : 1;
				$$(`span[data-vacBV='${vac}']`).innerHTML = parseInt($$(`span[data-vacBV='${vac}']`).innerHTML) - 1;
				this.v[vacBV]--;
				const BV_elem = $$(`td.bv[data-vacBV='${vac}']`);
				BV_elem.innerHTML = parseInt(BV_elem.innerHTML) - 1;
				if (BV_elem.innerHTML != $$(`td.bvini[data-vacBV='${vac}']`).innerHTML) {
					BV_elem.classList.add('bg_red');
				} else {
					BV_elem.classList.remove('bg_red');
				}
				this.pc = await this.get_nbpc_dispo(this.v, this.noBV);
				show_capa_graph("right_part", this.day, this.zone_schema, this.pc);
			});
		});

		plusPC.forEach(el => {
			el.addEventListener('click', async (event) => {
				const vac = el.dataset.vac;
				const vacBV = vac+"BV";
				const cds = (vac == "J2" || vac == "S1") ? 0 : 1;
				$$(`span[data-vacPC='${vac}']`).innerHTML = parseInt($$(`span[data-vacPC='${vac}']`).innerHTML) + 1;
				this.v[vac]++;
				const PC_elem = $$(`td.nbpc[data-vacPC='${vac}']`);
				PC_elem.innerHTML = parseInt(PC_elem.innerHTML) + 1;
				if ($$(`span[data-vacPC='${vac}']`).innerHTML != 0) {
					PC_elem.classList.add('bg_red');
				} else {
					PC_elem.classList.remove('bg_red');
				}
				this.pc = await this.get_nbpc_dispo(this.v, this.noBV);
				show_capa_graph("right_part", this.day, this.zone_schema, this.pc);
			});
		});

		moinsPC.forEach(el => {
			el.addEventListener('click', async (event) => {
				const vac = el.dataset.vac;
				const vacBV = vac+"BV";
				const cds = (vac == "J2" || vac == "S1") ? 0 : 1;
				$$(`span[data-vacPC='${vac}']`).innerHTML = parseInt($$(`span[data-vacPC='${vac}']`).innerHTML) - 1;
				this.v[vac]--;
				const PC_elem = $$(`td.nbpc[data-vacPC='${vac}']`);
				PC_elem.innerHTML = parseInt(PC_elem.innerHTML) - 1;
				if ($$(`span[data-vacPC='${vac}']`).innerHTML != 0) {
					PC_elem.classList.add('bg_red');
				} else {
					PC_elem.classList.remove('bg_red');
				}
				this.pc = await this.get_nbpc_dispo(this.v, this.noBV);
				show_capa_graph("right_part", this.day, this.zone_schema, this.pc);
			});
		});

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
async function show_capa_graph(containerId, day, zone, pc = 0) {
	
	const container = $(containerId);
	container.innerHTML = '<div style="display: flex;"><div id="i1"></div><ul id="date_legend"><li class="bleu"></li><li class="orange"></li><li class="vert"></li></ul></div><div id="uceso"></div>';
	let chartDom = $("uceso");
	chartDom.style.height = "400px";
	let myChart = echarts.init(chartDom);
	myChart.clear();

	const d = day.split("-");
	let pc_15mn = null;
	let pc_instr_15mn = null;
	let uceso = null;
	let data_series_uceso = null;
	if (pc == 0) {
		show_popup("Données OLAF indisponibles", "Pas de graph UCESO proposé");
		await wait(1000);
		document.querySelector('.popup-close').click();
	} else {
		pc_15mn = pc["pc_total_dispo_15mn"];
		pc_instr_15mn = pc["pc_instr_15mn"];
		uceso = pc_15mn.map( (elem, index) => [elem[0], Math.floor((elem[1] + pc_instr_15mn[index][0]) / 2) ]);
		//const uceso = pc_15mn.map( elem => [elem[0],Math.floor(elem[1]/2)]);
		data_series_uceso = [];
		uceso.forEach(row => {
			let deb = row[0];
			let nb_sect = row[1];
			let f = deb.split(":");
			let time = new Date(d[0], d[1]-1, d[2], f[0], f[1]);
			data_series_uceso.push([time,nb_sect]);
		}); 
		data_series_uceso.push([new Date(d[0], d[1]-1, d[2], 23, 59), uceso[uceso.length-1][1]]);
	}
	const day7 = addDays_toString(day, -7);
	// récupère la date de 2019 : ex "2019-11-02"
	let day2019 = get_sameday(day, 2019).toISOString().split('T')[0];
	const sch = new schema_rea(day, zone);
    const schema = await sch.read_schema_realise();
	const sch7 = new schema_rea(day7, zone);
    const schema7 = await sch7.read_schema_realise();
	const sch2019 = new schema_rea(day2019, zone);
    const schema2019 = await sch2019.read_schema_realise();
	
	data_series = [];
	data_series7 = [];
	data_series2019 = [];
	
	// Si le schema du jour J existe, alors on l'affiche
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
		data_series.push([new Date(d[0], d[1]-1, d[2], 23, 59), schema.ouverture[schema.ouverture.length-1][3]]);
	}
	
	// Si le schema du jour J n'existe pas mais que J-7 existe, alors on affiche J-7
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
	
	// 2019 existe toujours pour un année >2019
	// si la date initiale est en 2019, on ne va pas chercher 2019 et schema2019 = null
	if (schema2019 != null) {
		schema2019.ouverture.forEach(row => {
			let deb = row[1];
			let fin = row[2];
			let nb_sect = row[3];
			let f = deb.split(":");
			let time = new Date(d[0], d[1]-1, d[2], f[0], f[1]);
			data_series2019.push([time,nb_sect]);
		}); 
		data_series2019.push([new Date(d[0], d[1]-1, d[2], 23, 59), schema2019.ouverture[schema2019.ouverture.length-1][3]]);
	}
	
	const i1 = get_i1(data_series, data_series_uceso);
	$("i1").innerHTML = 'Indicateur i1: '+i1+'%';
	const tab_jour=new Array("Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi");
	const jour2019 = tab_jour[new Date(day2019).getDay()];
	const jour7 = tab_jour[new Date(day7).getDay()];
	const jour = tab_jour[new Date(day).getDay()];
	$$(".bleu").innerHTML = '2019 : '+jour2019+' '+reverse_date(day2019);
	$$(".orange").innerHTML = 'J-7 : '+jour7+' '+reverse_date(day7);
	$$(".vert").innerHTML = 'J : '+jour+' '+reverse_date(day);
	
	const couleur_bleu = getComputedStyle(document.documentElement).getPropertyValue('--color-2019');
	const couleur_orange = getComputedStyle(document.documentElement).getPropertyValue('--color-j-7');
	const couleur_vert = getComputedStyle(document.documentElement).getPropertyValue('--color-j');

	let option;
	
	option = {
		
	  tooltip: {
		trigger: 'axis',
		formatter: function(params) {
			params = params[0];
			let chartdate = echarts.format.formatTime('hh:mm', params.value[0]);
			let val = '<li style="list-style:none">' + params.marker +
				params.seriesName + ':&nbsp;&nbsp;' + params.value[1] + '&nbsp;secteurs</li>';
			return chartdate + val;
		}
	  },
	  legend: {
		x: 'center', // 'center' | 'left' | {number},
		y: 'top' | 30, // 'center' | 'bottom' | {number}
		padding: -1,
		textStyle: {
			color: '#fff'
		}
	  },
	  xAxis: {
		type: 'time',
		splitNumber:12,
		name: 'Heures',
		nameTextStyle: {
			fontSize: 14,
			color: '#fff'
		},
    	nameGap: 30,
		nameLocation: 'middle',
		axisLine: {
			lineStyle: {
				color: '#bbb'
			}
		}
	  },
	  yAxis: {
		name: 'Nombre de secteurs',
		nameTextStyle: {
			fontSize: 14,
			color: '#fff'
		},
		nameRotate: 90,
    	nameGap: 30,
		nameLocation: 'middle',
		splitLine: {
		  show: true,
		  lineStyle: {
			  color: '#fff',
			  opacity: 0.3
		  }
		},
		axisLine: {
			lineStyle: {
				color: '#bbb'
			}
		},
		type: 'value'
	  },
	  series: [
		{
		  name: 'Réalisé J',
		  color: couleur_vert,
		  type: 'line',
		  step: 'end',
		  animation: false,
		  data: data_series
		},
		{
		  name: 'Réalisé J-7',
		  color: couleur_orange,
		  type: 'line',
		  step: 'end',
		  animation: false,
		  data: data_series7
		},
		{
		  name: 'Réalisé 2019', //2019
		  color: couleur_bleu,
		  type: 'line',
		  step: 'end',
		  animation: false,
		  data: data_series2019
		}
	  ]
	};

	if (pc != 0) {
		option.series.push({
			name: 'UCESO capa',
			color: '#ce7777',
			data: data_series_uceso,
			type: 'line',
			animation: false,
			step: 'end'
		});
	}

	if (option && typeof option === 'object') {
		myChart.setOption(option);
	}
	
}

/* ---------------------------------------------------------------------------------
		Affiche le i1 : Durée_réa*nb_sect_rea/Durée_uceso*nb_sect_uceso
		
		Paramètre :
		 @param {string} containerId - id du container d'affichage
		 @param {array} data_realise - [ [time, nb_secteurs], ... ]
		 @param {array} data_uceso - [ [time, nb_secteurs], ... ]
	-------------------------------------------------------------------------------- */
	function get_i1(data_realise, data_uceso) {
		const rl = data_realise.length;
		const ul = data_uceso.length;
		let rea = 0;
		let uce = 0;

		for(let i=0;i<rl-1;i++) {
			rea += (get_minutes(data_realise[i+1][0]) - get_minutes(data_realise[i][0]))*data_realise[i][1];
		}
		for(let i=1;i<ul-1;i++) {
			uce += (get_minutes(data_uceso[i+1][0]) - get_minutes(data_uceso[i][0]))*data_uceso[i][1];
		}
		const i1 = Math.round(rea*100/uce);
		return i1;

	}
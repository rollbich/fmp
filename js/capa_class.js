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
		this.tabvac = ["J2","S1","N","","","","JX","J1","J3","S2","",""]; 
		this.dep = new Date(2019, 0, 8);  // J2 le 8 janvier 2019 à 12heures pour eq11
		this.eq_dep = 11;
		this.init();
    }

	async init() {
		this.tour_local = await loadJson(tour_json);
		this.saison = this.get_date_tour(this.tour_local);
		this.tour_utc = await this.get_tour_utc();
		this.tds_supp_local = await loadJson(tour_supp_json);
		this.tds_supp_utc = await this.get_tds_supp_utc(this.tds_supp_local);
		this.instr = await loadJson("../instruction.json");
		this.tab_vac_eq = this.get_vac_eq();
		
	}

    /* ----------------------------------------------------------------------------------------------------------------
        *Calcul du nbre de PC total par vac
        *Calcul du nbre de PC total dispo par pas de 15mn à la date choisie
            @param {object} update	- {"J1":0, "J3":0, "S2":0, "J2":0, "S1":0, "N":0, "N-1":0, "J1BV":0, "J3BV":0,...}
                                    - Nombre de pc à retrancher à l'effectif OLAF ou au BV
			@param {boolean} noBV	- false pour ne pas prendre en compte les BV
            @returns {object} : 
			  { "pc_vac": {
					"JX" : {
						"JXA-ete": {"nombre": nb, "nombre_det": nb, "agent": { "nom1" : "détaché", "nom2": "salle"}}, 
						"JXB-ete": {...}, 
						"RDxxx": {...},
						"nbpc": nbre_pc,
						"nbcds": nbre_cds,
						"renfort": nbre_renfort,
						"BV": BV,
						"RO": nbre_RO,
						"RO induit": nbre_induit,
					},
					"vac": { // inclu "N-1"
						"nbpc": nbre_pc,
						"nbcds": nbre_cds,
						"renfort": nbre_renfort,
						"BV": BV,
						"RO": nbre_RO,
						"RO induit": nbre_induit,
						"teamData": {...},
						"userList": {...},
						"aTeamComposition": {...},
						"html": {...}
					}, 
					...
				}, 
                "pc_total_horsInstrRD_15mn": [ ["hh:mm", nb_pc_dispo], [...], ... ],
				"pc_total_RD_15mn": [ ["hh:mm", nb_pc_dispo], [...], ... ],
				"pc_instru_15mn": [ ["hh:mm", nb_pc_dispo], [...], ... ]
			  }
    ------------------------------------------------------------------------------------------------------------------- */
    async get_nbpc_dispo(update = {"JX":0,"J1":0, "J3":0, "S2":0, "J2":0, "S1":0, "N":0, "N-1":0, "JXBV":0,"J1BV":0, "J3BV":0, "S2BV":0, "J2BV":0, "S1BV":0, "NBV":0, "N-1BV":0}, noBV = false) {
        if (this.day === null) throw new Error("Le jour est indéfini");
		
		const yesterday = jmoins1(this.day);
		// récupère l'objet contenant les propriétés equipes
		this.effectif = this.effectif || await get_olaf(this.zone_olaf, this.day, yesterday);
		console.log("OLAF result");
		console.log(this.effectif);
		// si pas de donnée on retourne 0
		if (this.effectif == 0) return 0;
		
		// Calcul du nombre de pc à afficher 
		// On récupère l'effectif total, donc on doit enlever le cds sur les vacations qui en ont 1	
		const pc = {"JX":{},"J1":{}, "J3":{}, "S2":{}, "J2":{}, "S1":{}, "N":{}, "N-1":{}};

		/*  -------------------------------------------------
			pc["JX"] contient les JX mais aussi les RD bleus
			pc["JX"] = {
				"JXA": {
					"nombre": 2,
					"agent": {
						"Jean Coco": "détaché",
						"Moustache": "salle"
					}
				},
				"RDJ3b-ms": {
					...
				}
				...
		}
		-----------------------------------------------------  */

		const Renfort = this.effectif[this.day]['Renfort'];
		// Renfort hors JX
		const RD_names_horsJX = [];
		let nb_jx = 0;
		let nb_jx_det = 0;
		for (let renf1 in Renfort) {
			for (let cle in Renfort[renf1]) {
				const obj = Renfort[renf1][cle];
				let label = obj["contextmenutype"]["label"];
				let jx_type = "";
				let rd_type = "";
				let type_renfort = "";
				// JXA & JXB salle
				// "RD bleu JXa-ms" - "RD bleu J1-ms" - "RD bleu J3b-ms" + Est only "RD bleu S1b-ms" + West only "RD bleu S1a-ms"
				// "RD bleu J3a-ete" - "RD bleu S1b-ete" - "RD bleu J1-ete" + Est only "RD bleu JXb-ete" + West only "RD bleu J3b-ete" 
				let nb_det = 0;
				if (label.includes("JX")) {
					if (label.includes("RD bleu")) { // RD
						type_renfort = "RD";
						rd_type = label.substring(8);
						jx_type = rd_type;
						nb_det++;
						nb_jx_det++;
					} else { // JX salle
						type_renfort = "JX";
						jx_type = label;
					}
					nb_jx++;
				} else { // RD non JX
					type_renfort = "RD";
					rd_type = label.substring(8);
					jx_type = "RD"+rd_type;
					RD_names_horsJX.push(jx_type);
					nb_det++;
				}		
				
				let agent = obj["agent"]["nomComplet"];
				let agent_type = (label.includes("det") || label.includes("RD")) ? "détaché" : "salle";
				if (pc["JX"].hasOwnProperty(jx_type) === false) { pc["JX"][jx_type] = {"nombre": 0, "nombre_det": 0}; pc["JX"][jx_type]["agent"] = {}}
				pc["JX"][jx_type]["agent"][agent] = agent_type;
				pc["JX"][jx_type]["nombre"]++;
				pc["JX"][jx_type]["nombre_det"] += nb_det;
			}
		}
		console.log("Renfort JX");
		console.log(pc["JX"]);

		for(const vac in this.tab_vac_eq) {
			let p = this.tab_vac_eq[vac]+"-"+this.zone_olaf;
			const upBV = vac+"BV";
			if (vac !== "N-1") {
				if (vac !== "JX") {
					// Le RO induit apparait si detachés > 1 et plus que 1 n'est pas Expert Ops, ACDS ou Assistant sub
					pc[vac]["ROinduit"] = parseInt(this.effectif[this.day][p]["teamReserve"]["roInduction"]);
					pc[vac]["nbcds"] = parseInt(this.tour_local[this.zone][this.saison]["cds"][vac]);
					pc[vac]["nbpc"] = parseInt(this.effectif[this.day][p]["teamReserve"]["teamQuantity"]) - pc[vac]["nbcds"] + update[vac]; 
					pc[vac]["BV"] = parseInt(this.effectif[this.day][p]["teamReserve"]["BV"]) + update[upBV];
					pc[vac]["RO"] = parseInt(this.effectif[this.day][p]["teamReserve"]["roQuantity"]);
					pc[vac]["userList"] = this.effectif[this.day][p]["userList"];
					pc[vac]["teamData"] = this.effectif[this.day][p]["teamData"];
					pc[vac]["aTeamComposition"] = this.effectif[this.day][p]["aTeamComposition"];
					pc[vac]["html"] = this.effectif[this.day][p]["html"][this.day][p];
					if (typeof pc[vac]["html"]["lesrenforts"] === 'undefined') {
						pc[vac]["renfort"] = 0;
					} else {
						pc[vac]["renfort"] = Object.keys(pc[vac]["html"]["lesrenforts"]).length;
					}
					//pc[vac]["detache"] = parseInt(this.effectif[this.day][p]["teamReserve"]["detacheQuantity"]);
				} else {
					console.log("VAC: "+vac);
					pc[vac]["ROinduit"] = 0;
					pc[vac]["nbcds"] = 0;
					pc[vac]["nbpc"] = nb_jx + update[vac]; 
					pc[vac]["BV"] = 10;
					pc[vac]["RO"] = 0;
					let det = 0; 
					pc[vac]["renfort"] = nb_jx_det;
				}
			} else {
				pc[vac]["ROinduit"] = parseInt(this.effectif[yesterday][p]["teamReserve"]["roInduction"]);
				pc[vac]["nbcds"] = parseInt(this.tour_local[this.zone][this.saison]["cds"]["N"]);
				pc[vac]["nbpc"] = parseInt(this.effectif[yesterday][p]["teamReserve"]["teamQuantity"]) - pc[vac]["nbcds"] + update[vac]; // le cds ne compte pas dans le nb de pc
				pc[vac]["BV"] = parseInt(this.effectif[yesterday][p]["teamReserve"]["BV"]) + update[upBV];
				pc[vac]["RO"] = parseInt(this.effectif[yesterday][p]["teamReserve"]["roQuantity"]);
				pc[vac]["userList"] = this.effectif[yesterday][p]["userList"];
				pc[vac]["teamData"] = this.effectif[yesterday][p]["teamData"];
				pc[vac]["aTeamComposition"] = this.effectif[yesterday][p]["aTeamComposition"];
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
		// effectif_RD_15mn = {
		//	  "RD...": [],
		//	  "RD...": []
		//	  ...
		//  }
		const effectif_total_RD_15mn = [];
		const effectif_RD_15mn = {};
		const vacs = ["JX","J1", "J3", "S2", "J2", "S1"];

		for(var i=0;i<96;i++) {
			vacs.forEach(vacation => {
				const cds = pc[vacation]["nbcds"];
				let dispoA = Math.min(Math.floor(pc[vacation]["nbpc"]/2), Math.floor((pc[vacation]["BV"]+pc[vacation]["renfort"]-cds-pc[vacation]["ROinduit"])/2));
				let dispoB = Math.min(Math.floor(pc[vacation]["nbpc"]/2)+(pc[vacation]["nbpc"])%2, Math.floor((pc[vacation]["BV"]+pc[vacation]["renfort"]-cds-pc[vacation]["ROinduit"])/2)+(pc[vacation]["BV"]+pc[vacation]["renfort"]-cds-pc[vacation]["ROinduit"])%2);

				if (vacation === "JX" && this.zone === "est" && this.saison === "ete") {
					dispoB = Math.min(Math.floor(pc[vacation]["nbpc"]/2), Math.floor((pc[vacation]["BV"]+pc[vacation]["renfort"]-cds-pc[vacation]["ROinduit"])/2));
					dispoA = Math.min(Math.floor(pc[vacation]["nbpc"]/2)+(pc[vacation]["nbpc"])%2, Math.floor((pc[vacation]["BV"]+pc[vacation]["renfort"]-cds-pc[vacation]["ROinduit"])/2)+(pc[vacation]["BV"]+pc[vacation]["renfort"]-cds-pc[vacation]["ROinduit"])%2);
				}

				if (vacation === "S1" && this.zone === "est" && this.saison === "ete") {
					switch (pc["S1"]["nbpc"]) {
						case 6:
							dispoA = 3;
							dispoB = 3;
								break;
						case 7:
							dispoA = 3;
							dispoB = 4;
							break;
						case 8:
							dispoA = 3;
							dispoB = 5;
							break;
						case 9:
							dispoA = 3;
							dispoB = 6;
							break;
						case 10:
							dispoA = 3;
							dispoB = 7;
							break;
						case 11:
							dispoA = 4;
							dispoB = 7;
							break;
						case 12:
							dispoA = 4;
							dispoB = 8;
							break;
						case 13:
							dispoA = 4;
							dispoB = 9;
							break;
					}
				}
		
				if (vacation === "S1" && this.zone === "ouest" && this.saison === "ete") {
					let d = new Date(this.day);
					let jour_sem = d.getDay();
					if (jour_sem === 2 || jour_sem === 3 || jour_sem === 4) {
						dispoA = 0;
						dispoB = pc["S1"]["nbpc"];
					} else {
						switch (pc["S1"]["nbpc"]) {
							case 6:
								dispoA = 3;
								dispoB = 3;
								break;
							case 7:
								dispoA = 3;
								dispoB = 4;
								break;
							case 8:
								dispoA = 3;
								dispoB = 5;
								break;
							case 9:
								dispoA = 3;
								dispoB = 6;
								break;
							case 10:
								dispoA = 3;
								dispoB = 7;
								break;
							case 11:
								dispoA = 4;
								dispoB = 7;
								break;
							case 12:
								dispoA = 4;
								dispoB = 8;
								break;
							case 13:
								dispoA = 4;
								dispoB = 9;
								break;
						}
					}
				}

				// Ajout du CDS qui bosse sur secteur
				if (this.tour_utc[vacation][i][1] === 1) nb_pc += cds;
				// Ajout de la sous-vacation A
				if (this.tour_utc[vacation][i][2] === 1) {
					if (noBV === false) {
						nb_pc += dispoA;
					} else {
						if (this.saison === "ete") {
							nb_pc += dispoA;
						} else {
							nb_pc += Math.floor(pc[vacation]["nbpc"]/2);
						}
					}
				}
				// Ajout de la sous-vacation B
				if (this.tour_utc[vacation][i][3] === 1) {
					if (noBV === false) {
						nb_pc += dispoB;
					} else {
						if (this.saison === "ete") {
							nb_pc += dispoB;
						} else {
							nb_pc += Math.floor(pc[vacation]["nbpc"]/2)+(pc[vacation]["nbpc"])%2;
						}
					}
				}
				//console.log("Vac: "+vacation+"   heure: "+get_time(i)+"  nbpc: "+nb_pc);
			})

			// Nuit de 19h30 à 00h00
			let cds = pc["N"]["nbcds"];
			// CDS
			if (this.tour_utc["N"][i][1] === 1 && i>48) nb_pc += cds; // cds qui bosse sur secteur
			// Sous-vacation A
			if (this.tour_utc["N"][i][2] === 1 && i>48) {
				if (this.saison === "ete" && pc["N"]["nbpc"] === 6) {
					nb_pc += 2;
				} else {
					if (noBV === false) {
						nb_pc += Math.min(Math.floor(pc["N"]["nbpc"]/2), Math.floor((pc["N"]["BV"]+pc["N"]["renfort"]-cds-pc["N"]["ROinduit"])/2));
					} else {
						nb_pc += Math.floor(pc["N"]["nbpc"]/2);
					}
				}
			}
			// Sous-vacation B
			if (this.tour_utc["N"][i][3] === 1 && i>48) {
				if (this.saison === "ete" && pc["N"]["nbpc"] === 6) {
					nb_pc += 4;
				} else {
					if (noBV === false) {
						nb_pc += Math.min(Math.floor(pc["N"]["nbpc"]/2)+(pc["N"]["nbpc"])%2, Math.floor((pc["N"]["BV"]+pc["N"]["renfort"]-cds-pc["N"]["ROinduit"])/2)+(pc["N"]["BV"]+pc["N"]["renfort"]-cds-pc["N"]["ROinduit"])%2);
					} else {
						nb_pc += Math.floor(pc["N"]["nbpc"]/2)+(pc["N"]["nbpc"])%2;
					}
				}
			}

			// Nuit de 00h00 à 06h30
			cds = pc["N-1"]["nbcds"];
			if (this.tour_utc["N"][i][1] === 1 && i<48) nb_pc += cds; // cds qui bosse sur secteur
			// Sous-vacation A
			if (this.tour_utc["N"][i][2] === 1 && i<48) {
				if (this.saison === "ete" && pc["N-1"]["nbpc"] === 6) {
					nb_pc += 2;
				} else {
					if (noBV === false) {
						nb_pc += Math.min(Math.floor(pc["N-1"]["nbpc"]/2), Math.floor((pc["N-1"]["BV"]+pc["N-1"]["renfort"]-cds-pc["N-1"]["ROinduit"])/2));
					} else {
						nb_pc += Math.floor(pc["N-1"]["nbpc"]/2);
					}
				}
			}
			// Sous-vacation B
			if (this.tour_utc["N"][i][3] === 1 && i<48) {
				if (this.saison === "ete" && pc["N-1"]["nbpc"] === 6) {
					nb_pc += 4;
				} else {
					if (noBV === false) {
						nb_pc += Math.min(Math.floor(pc["N-1"]["nbpc"]/2)+(pc["N-1"]["nbpc"])%2, Math.floor((pc["N-1"]["BV"]+pc["N-1"]["renfort"]-cds-pc["N-1"]["ROinduit"])/2)+(pc["N-1"]["BV"]+pc["N-1"]["renfort"]-cds-pc["N-1"]["ROinduit"])%2);
					} else {
						nb_pc += Math.floor(pc["N-1"]["nbpc"]/2)+(pc["N-1"]["nbpc"])%2;
					}
				}
			}
			// this.tour_utc["J1"][i][0] = heure (ex : "01:45"), on aurait pu prendre n'importe quelle vac à la place de J1
			pcs.push([this.tour_utc["J1"][i][0], nb_pc]);
			nb_pc = 0;
			
			/* 	----------------------------------------------------------------------------------------
					in15mn[i] = [nb_pc_supp, { "type": "Inst ou Eleve ....", "comm": "commentaire"}]
				---------------------------------------------------------------------------------------- */
			in15mn[i] = [0, []];
			if (typeof this.instr[this.zone][this.day] !== 'undefined') {
				this.instr[this.zone][this.day].forEach( (elem, index) => {
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
							if (type === "Inst1") { in15mn[i][0] += 1; in15mn[i][1].push({type: type, comm: comm}); }
							if (type === "Eleve") { in15mn[i][1].push({type: type, comm: comm}); }
							if (type === "Asa") { in15mn[i][0] -= 1; in15mn[i][1].push({type: type, comm: comm}); }
							if (type === "Simu1PC") { in15mn[i][0] -= 1; in15mn[i][1].push({type: type, comm: comm}); }
							if (type === "Simu2PC") { in15mn[i][0] -= 2; in15mn[i][1].push({type: type, comm: comm}); }
							if (type === "-1PC") { in15mn[i][0] -= 1; in15mn[i][1].push({type: type, comm: comm}); }
						} 
					}
				});
			}
			
			// s'il y a un Jx ce jour là
			// on ne créé que les vac_jx existantes ce jour là
			RD_names_horsJX.forEach( (vac_jx, index) => {
				if (typeof effectif_RD_15mn[vac_jx] === 'undefined') effectif_RD_15mn[vac_jx] = [];
				effectif_RD_15mn[vac_jx][i] = 0;
			})
			
			RD_names_horsJX.forEach( (vac_jx, index) => {
				if (vac_jx != "nbcds") {
					const nb = pc["JX"][vac_jx]["nombre"];
					if (this.tds_supp_utc[vac_jx][i][1] === 1) {
						effectif_RD_15mn[vac_jx][i] = nb;
					}
				}
			});

		}

		for(var i=0;i<96;i++) {
			const keys = Object.keys(effectif_RD_15mn);
			effectif_total_RD_15mn[i] = 0;
			keys.forEach( vac_RD => {
				effectif_total_RD_15mn[i] += effectif_RD_15mn[vac_RD][i];
			})
		}

		// pc_total_horsInstrRD_15mn : total pc hors instr & hors RD bleu supp (les RD Jx sont inclus)
		return {"pc_vac": pc, "pc_total_horsInstrRD_15mn": pcs, "pc_instr_15mn": in15mn, "pc_RD_15mn": effectif_RD_15mn, "pc_total_RD_15mn": effectif_total_RD_15mn};
    }

    /* ---------------------------------------------------
        Calcule les équipes qui travaillent et leur vac
        Paramètres
            @param {string} day - yyyy-mm-jj
            @returns {object} { "J1": 5, "vac": n°eq ... }
    ---------------------------------------------------- */
    get_vac_eq () {
        const ecartj = this.dep.ecartJour(new Date(this.day));
        const tab = {};
        for (let eq=1;eq<13;eq++) {
            let debvac = (ecartj - parseInt(eq) + this.eq_dep) % 12;
            if (this.tabvac[debvac] !== "" && this.tabvac[debvac] !== "N") tab[this.tabvac[debvac]] = eq;
            if (this.tabvac[debvac] === "N") {
                tab[this.tabvac[debvac]] = eq;
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
    async get_tour_utc() {
        
        // récupère le décalage utc/local en heure
		const d = new Date(this.day);
		d.setHours(6);
        const diff = Math.abs(d.getTimezoneOffset()) / 60;
        const tour = this.tour_local[this.zone][this.saison];	
        
        const index_deb = diff*4 - 1;
        const tour_utc = {};
		tour_utc["JX"] = [];
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
        
		push_utc("JX");
        push_utc("J1");
        push_utc("J3");
        push_utc("S2");
        push_utc("J2");
        push_utc("S1");
        push_utc("N");
		console.log("Tour_utc");
		console.log(tour_utc);
        return tour_utc;
    }
	/* -----------------------------------------------------------------------------------------
        Transformation du tour de service (défini en heure locale) en heure UTC
        @param {object} tour_local 	- le json du tour de service
			{"est":{
				"RD...":[["00:00",0],["00:15",0],...],
				"RD...":[["00:00",0],["00:15",0],...]
				...
			}}
        @returns {object}  - tour_utc (sans la zone) 
			{ 
				"RD...": [ ["00:00", 0], ["hh:mm", nb], ... ],
				"RD...": [ ["00:00", 0], ["hh:mm", nb], ... ]
				...
			}
    ----------------------------------------------------------------------------------------- */
	async get_tds_supp_utc(tour_sup_local) {
		// récupère le décalage utc/local en heure
		const d = new Date(this.day);
		d.setHours(6);
        const diff = Math.abs(d.getTimezoneOffset()) / 60;
        const tour = tour_sup_local[this.zone];	
        
        const index_deb = diff*4 - 1;
        const tour_utc = {};
		// RD_vac_hors_Jx = ["RD...","RD...",...]
		const RD_vac_hors_Jx = Object.keys(tour);
		console.log("RD_vac_hors_Jx");
		console.log(RD_vac_hors_Jx);
        RD_vac_hors_Jx.forEach(vac => {
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
        
		RD_vac_hors_Jx.forEach(vac => {
			push_utc(vac);
		})

        return tour_utc;
	}

}

class feuille_capa extends capa {
	/* -----------------------------------------------------------------------------------------------------------
		@param {string} containerIdTour - id du container pour le tour
		@param {boolean} show			- true pour afficher la feuille de capa
										  false pour retourner l'array uceso [ [hdeb, hfin, _uceso], [...] ....]
	   ----------------------------------------------------------------------------------------------------------- */
	constructor(containerIdTour, day, zone, show = true) {
		super(day, zone);
		this.containerTour = $(containerIdTour);
		this.show = show;
		return this.init_data();
	}

	/*	------------------------------------------
					Init Data		
			async function => return : promise
		------------------------------------------ */
	async init_data() {
		show_popup("Patientez !", "Chargement en cours...");
		this.update = {"est": {}, "ouest": {}};
		this.update[this.zone][this.day] = {"update_count": {"JX":0,"J1":0, "J3":0, "S2":0, "J2":0, "S1":0, "N":0, "N-1":0, "JXBV":0,"J1BV":0, "J3BV":0, "S2BV":0, "J2BV":0, "S1BV":0, "NBV":0, "N-1BV":0}, "update_name": {"JX":[],"J1":[], "J3":[], "S2":[], "J2":[], "S1":[], "N":[], "N-1":[]}};
		this.pc = await this.get_nbpc_dispo(this.update[this.zone][this.day]['update_count']);
		console.log("pc");
		console.log(this.pc);
		await document.querySelector('.popup-close').click();
		this.pc_15mn = await this.pc["pc_total_horsInstrRD_15mn"];
		this.pc_instr_15mn = await this.pc["pc_instr_15mn"];
		this.pc_RD_15mn = await this.pc["pc_RD_15mn"];
		this.pc_total_RD_15mn = await this.pc["pc_total_RD_15mn"];
		this.pc_vac = await this.pc["pc_vac"];
		if (this.show) {this.show_feuille_capa(); return this; } else { return this.get_uceso(); }
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

		res += `${this.affiche_vac("JX")}`;
		res += `${this.affiche_vac("J1")}`;
		res += `${this.affiche_vac("J3")}`;
		res += `${this.affiche_vac("S2")}`;
		res += `${this.affiche_vac("J2")}`;
		res += `${this.affiche_vac("S1")}`;
		res += `${this.affiche_vac("N")}`;
		res += `${this.affiche_vac("N-1")}`;
		res += `${this.affiche_RD()}`;
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
					if (v[1] === "") v[1] = "-";
					det += `<div style="float:left;width:50%;">${v[0]} : </div><div style="float:left;width:50%;">${v[1]}</div>`;
				})
				const pos = td_el.getBoundingClientRect();
				el.style.position = 'absolute';
				el.style.left = pos.left + 'px';
				el.style.top = pos.top + 20 + window.scrollY + 'px';
				el.style.backgroundColor = '#fbb';
				el.style.padding = '10px';
				el.style.width = '200px';
				let parentDiv = document.getElementById("glob_container");
				parentDiv.insertBefore(el, $('feuille_capa_tour'));
				el.innerHTML = det;
			})
			td_el.addEventListener('mouseleave', (event) => {
				$('popinstr').remove();
			})
		})

		// ajoute le hover sur la case Jx
		const td_jx = document.querySelector(".click_jx");
		let jx_types = Object.keys(this.pc_vac["JX"]).filter(word => word.includes("JX"));
		const names = [];
		jx_types.forEach(elem => {
			let detail = this.pc_vac["JX"][elem]["agent"];
			const noms = Object.keys(detail);
			console.log("noms: "+noms);
			noms.forEach(nom => {
				const detache = detail[nom] === "détaché" ? " (RD)" : "";
				const aff = nom + detache;
				names.push(aff);
			})
		})
		td_jx.addEventListener('mouseover', (event) => {
			const el = document.createElement('div');
			el.setAttribute('id', 'popinstr');
			let det = '<div style="float:left;width:90%;">';
			names.forEach(agent => {
				det += `${agent}<br>`;
			})
			det += '</div>';
			const pos = td_jx.getBoundingClientRect();
			el.style.position = 'absolute';
			el.style.left = pos.left + 60 + 'px';
			el.style.top = pos.top + window.scrollY + 'px';
			el.style.backgroundColor = '#fbb';
			el.style.padding = '10px';
			el.style.width = '200px';
			let parentDiv = document.getElementById("glob_container");
			parentDiv.insertBefore(el, $('feuille_capa_tour'));
			el.innerHTML = det;
		})
		td_jx.addEventListener('mouseleave', (event) => {
			$('popinstr').remove();
		})

		// ajoute le hover sur la case RD hors JX
		const td_RD = document.querySelectorAll(".click_RD");
		td_RD.forEach(td_el => {
			let RD_type = td_el.dataset.vac;
			let detail = this.pc_vac["JX"][RD_type]["agent"];
			td_el.addEventListener('mouseover', (event) => {
				const el = document.createElement('div');
				el.setAttribute('id', 'popinstr');
				let det = '<div style="float:left;width:90%;">';
				for (const agent in detail) {
					let affich = agent+" ";
					if (detail[agent] === "détaché") affich += "(RD)";
					det += `${affich}<br>`;
				}
				det += '</div>';
				const pos = td_el.getBoundingClientRect();
				el.style.position = 'absolute';
				el.style.left = pos.left + 76 + 'px';
				el.style.top = pos.top + +window.scrollY + 'px';
				el.style.backgroundColor = '#fbb';
				el.style.padding = '10px';
				el.style.width = '200px';
				let parentDiv = document.getElementById("glob_container");
				parentDiv.insertBefore(el, $('feuille_capa_tour'));
				el.innerHTML = det;
			})
			td_el.addEventListener('mouseleave', (event) => {
				$('popinstr').remove();
			})
		})

		// ajoute les clicks sur la case du nbre de pc de la vac
		const td_pc = document.querySelectorAll('.pc');
		$('popup-wrap').classList.add('popup-modif');
		$$('.popup-box').classList.add('popup-modif');
		td_pc.forEach(td_el => {
			let vac = td_el.dataset.vac;
			if (this.update[this.zone][this.day]['update_count'][vac] !== 0) $$(`td[data-vac=${vac}].pc`).classList.add('bg_red');	
			td_el.addEventListener('click', (event) => {
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
			});
		});
	}
	
	check_S1() {
		let dispoA = null;
		let dispoB = null;
		if (this.zone === "est" && this.saison === "ete") {
			switch (this.pc_vac["S1"]["nbpc"]) {
				case 6:
					dispoA = 3;
					dispoB = 3;
				  	break;
				case 7:
					dispoA = 3;
					dispoB = 4;
					break;
				case 8:
					dispoA = 3;
					dispoB = 5;
					break;
				case 9:
					dispoA = 3;
					dispoB = 6;
					break;
				case 10:
					dispoA = 3;
					dispoB = 7;
					break;
				case 11:
					dispoA = 4;
					dispoB = 7;
					break;
				case 12:
					dispoA = 4;
					dispoB = 8;
					break;
				case 13:
					dispoA = 4;
					dispoB = 9;
					break;
			}
		}

		if (this.zone === "ouest" && this.saison === "ete") {
			let d = new Date(this.day);
			let jour_sem = d.getDay();
			if (jour_sem === 2 || jour_sem === 3 || jour_sem === 4) {
				dispoA = 0;
				dispoB = this.pc_vac["S1"]["nbpc"];
			} else {
				switch (this.pc_vac["S1"]["nbpc"]) {
					case 6:
						dispoA = 3;
						dispoB = 3;
						break;
					case 7:
						dispoA = 3;
						dispoB = 4;
						break;
					case 8:
						dispoA = 3;
						dispoB = 5;
						break;
					case 9:
						dispoA = 3;
						dispoB = 6;
						break;
					case 10:
						dispoA = 3;
						dispoB = 7;
						break;
					case 11:
						dispoA = 4;
						dispoB = 7;
						break;
					case 12:
						dispoA = 4;
						dispoB = 8;
						break;
					case 13:
						dispoA = 4;
						dispoB = 9;
						break;
				}
			}
		}
		return {"S1A": dispoA, "S1B": dispoB}
	}

	// Fabrique la ligne du tour de service
	affiche_vac(vac) {
		let res1 = "", res2 = "", res3 = "";
		// A = effectif/2
		// B = effectif/2 (+1)
		const cds = this.pc_vac[vac]["nbcds"];
		let dispoA = Math.min(Math.floor(this.pc_vac[vac]["nbpc"]/2), Math.floor((this.pc_vac[vac]["BV"]+this.pc_vac[vac]["renfort"]-cds-this.pc_vac[vac]["ROinduit"])/2));
		let dispoB = Math.min(Math.floor(this.pc_vac[vac]["nbpc"]/2)+(this.pc_vac[vac]["nbpc"])%2, Math.floor((this.pc_vac[vac]["BV"]+this.pc_vac[vac]["renfort"]-cds-this.pc_vac[vac]["ROinduit"])/2)+(this.pc_vac[vac]["BV"]+this.pc_vac[vac]["renfort"]-cds-this.pc_vac[vac]["ROinduit"])%2);
		
		let S1; 
		if (vac === "S1") {
			S1 = this.check_S1();
			if (S1.S1A !== null && S1.S1B !== null) {
				dispoA = S1.S1A;
				dispoB = S1.S1B;
			}
		}

		if (vac === "JX" && this.zone === "est" && this.saison === "ete") {
			dispoB = Math.min(Math.floor(this.pc_vac[vac]["nbpc"]/2), Math.floor((this.pc_vac[vac]["BV"]+this.pc_vac[vac]["renfort"]-cds-this.pc_vac[vac]["ROinduit"])/2));
			dispoA = Math.min(Math.floor(this.pc_vac[vac]["nbpc"]/2)+(this.pc_vac[vac]["nbpc"])%2, Math.floor((this.pc_vac[vac]["BV"]+this.pc_vac[vac]["renfort"]-cds-this.pc_vac[vac]["ROinduit"])/2)+(this.pc_vac[vac]["BV"]+this.pc_vac[vac]["renfort"]-cds-this.pc_vac[vac]["ROinduit"])%2);
		}

		if (vac === "N" && this.pc_vac[vac]["nbpc"] === 6) {
				dispoA = 2;
				dispoB = 4;
		}

		if (vac === "N-1" && this.pc_vac[vac]["nbpc"] === 6) {
			dispoA = 2;
			dispoB = 4;
		}

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
		const click_jx = vac === "JX" ? "pc details masque click_jx" : "pc details masque";
		return `
		<tr data-vac='${vac}'>
			<td class='left_2px right_1px'></td><td class='right_1px'></td>
			<td class='right_1px'>cds</td><td class='details masque'>${cds}</td>
			<td class='${click_jx}' data-vac='${vac}'>${this.pc_vac[vac]["nbpc"]}</td>
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

	// fabrique la ligne du supplément RD hors JX
	affiche_RD() {
		const vac_RD_tab = Object.keys(this.pc_RD_15mn);
		let res = "";
		vac_RD_tab.forEach( vac_RD => {
			let vac_RD_affiche = vac_RD.substring(2);
			vac_RD_affiche = vac_RD_affiche.split("-")[0] + " RD bleu";
			let sous_vac_RD = vac_RD_affiche.substring(2).toUpperCase();
			let res2 = "";
			if (this.pc_RD_15mn[vac_RD][0] === 0) {
				res2 += `<td class='left_2px bottom_2px'></td>`; // border left à 2px pour la case 0
			} else {
				res2 += `<td class='bg bottom_2px'>${this.pc_RD_15mn[vac_RD][0]}</td>`;
			}
			for(let i=1;i<95;i++) {	
				if (this.pc_RD_15mn[vac_RD][i] === 0) {
					res2 += `<td class='bottom_2px'></td>`;
				} else {
					res2 += `<td class='bg bottom_2px'>${this.pc_RD_15mn[vac_RD][i]}</td>`;
				}
			} 
			if (this.pc_RD_15mn[vac_RD][95] === 0) {
				res2 += `<td class='bottom_2px right_2px'></td>`;
			} else {
				res2 += `<td class='bg bottom_2px'>${this.pc_RD_15mn[vac_RD][95]}</td>`;
			}
			res += `<tr><td data-vac='${vac_RD}' class='left_2px bottom_2px click_RD' colspan="3">${vac_RD_affiche}</td><td class='bottom_2px right_2px details masque' colspan="4"></td>${res2}</tr>`;
		})
		return res;
	}

	// fabrique la ligne du nbre de pc dispo
	affiche_nbpc() {
		let res2 = "";
		this.pc_15mn.forEach( (elem, index) => {
			let cl = "left_1px";
			if (index%4 === 0) cl = "left_2px";
			if (index === 95) cl += " right_2px";
			res2 += `<td class='${cl} bottom_2px'>${elem[1]+this.pc_instr_15mn[index][0]+this.pc_total_RD_15mn[index]}</td>`;
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
			const demi = ((elem[1]+this.pc_instr_15mn[index][0]+this.pc_total_RD_15mn[index])%2 === 0) ? "" : "\u00bd";
			res2 += `<td class='${cl} bottom_2px'>${demi}</td>`;
		});
		let res = `<tr><td class='left_2px bottom_2px' colspan="3">Demi UC</td><td class='bottom_2px right_2px details masque' colspan="4"></td>${res2}</tr>`;
		return res;
	}
	
	get_uceso_15mn() {
		return this.pc_15mn.map( (elem, index) => [elem[0], Math.floor((elem[1] + this.pc_instr_15mn[index][0] + this.pc_total_RD_15mn[index]) / 2) ]);
	}

	// fabrique la ligne du nbre d'uceso dispo
	//	uceso = partie entière nbr_pc/2
	affiche_uceso() {
		const uc = this.get_uceso_15mn();
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
	
	// @param {string} vac - "J1"
	// @param {array} present - [] 
	
	add_travailleurs_RO(vac, present) {
		const values = Object.values(this.pc_vac[vac]["aTeamComposition"]);
		for (const obj of values) {
			for (const user in obj) {
				//console.log("user: "+user);
				const prenom = obj[user]["agent"]["prenom"];
				const nom = obj[user]["agent"]["nom"];
				const name = nom+" "+prenom;
				if (typeof obj[user]["agent"]["role"] !== 'undefined') {
					let role = obj[user]["agent"]["role"];
					// bug si lesrenforts alors role est déjà un array [9,10,98], autrement un string "9,10,98"
					if (typeof role === "string") role = role.split(","); // array des roles
					role = role.map(elem => parseInt(elem)); // array d'integer
					//console.log(name + " Role :");
					//console.log(role);
					let pushed = false;
					if (role.includes(82)) {
						//console.log("CDS ?"+obj[user]["contextmenuType"]);
						if (Array.isArray(obj[user]["contextmenuType"])) present.push([name, "PC-CDS"]); else present.push([name, "CDS"]);
						pushed = true;
					}
					if (role.includes(80)) {
						//console.log("ACDS");
						present.push([name, "PC-ACDS"]);
						pushed = true;
					} 	
					if (role.includes(14)) {
						//console.log("DET");
						present.push([name, "PC-DET"]);
						pushed = true;
					} 
					if (role.includes(10)) {
						present.push([name, "stagiaire"]);
						pushed = true;
					}
					if (typeof obj[user]["contextmenuType"] === 'object' && obj[user]["contextmenuType"] !== null && !Array.isArray(obj[user]["contextmenuType"])) { // c'est un objet
						const type = obj[user]["contextmenuType"]["type"];
						const label = obj[user]["contextmenuType"]["label"];
						if (type === "reserve_operationnelle") {
							present.push([name, "RO"]);
							pushed = true;
						}
					}
					if (pushed === false) present.push([name, "PC"]);
				} 
			}
		}
		//console.log("VAC :");
		//console.log(present);
	}

	// Gère les stages, CGE et RPL
	add_stage_conge_autre(vac, present) {
		const cles = Object.keys(this.pc_vac[vac]["teamData"]);
		for (const k of cles) {
			for (const user in this.pc_vac[vac]["teamData"][k]) {
				if (k != "autre_agent") { 
					if (k === "stage") {present.push([user, k]); } 
					if (k === "conge") {present.push([user, k]); }
				}
				else {
					if (this.pc_vac[vac]["teamData"][k][user].search(/RPL/) != -1 || this.pc_vac[vac]["teamData"][k][user].search(/PER avec/) != -1) {
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
		let res = `<table><caption>${vac}<span data-vac='${vac}'></span></caption><thead><tr><th style="background: #444;">Nom</th><th style="background: #444;">Type</th></tr></thead><tbody>`;
		const eq = [];
		this.add_travailleurs_RO(vac, eq);
		this.add_stage_conge_autre(vac, eq);
		const personnel = this.tri_equipe(eq);
		for (const p of personnel) {
			let cl = `type${p[1]}`, cl_previous;
			if (this.update[this.zone][this.day]['update_name'][vac].includes(p[0])) { cl += ' barre'; cl_previous = 'surligne'; }
			res += `<tr><td class='${cl_previous}'>${p[0]}</td><td class='${cl}' data-vac='${vac}' data-nom='${p[0]}'>${p[1]}</td><tr>`;
		}
		res += `</tbody></table>`;
		return res;
	}

	// Tri dans l'ordre du tableau de valeurs
	tri_equipe(arr_eq) {
		const tab_valeurs = ["CDS", "PC-CDS", "PC", "PC-ACDS", "PC-DET", "PC-RPL", "stagiaire", "RO", "stage", "conge"];
		let arr = [];
        tab_valeurs.forEach(valeur => {
            arr_eq.forEach(t => {
				if(t[1] == valeur) arr.push(t);
			})
        })
        return arr;
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

	compact_with_hours(pcs) {
		const counts = [];
		let index_ini = 0;
		for(var j=0;j<95;j++) {
			if (pcs[j][1] !== pcs[j+1][1]) {
				counts.push([get_time(index_ini), get_time(j+1), pcs[j][1]]);
				index_ini = j+1;
			}
		}
		counts.push([get_time(index_ini), 95, pcs[95][1]]);
		return counts;
	}

	get_uceso() {
		const res = this.get_uceso_15mn();
		return {
			"compacted": this.compact_with_hours(res),
			"quarter": this.get_uceso_15mn()
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
		this.init_simu();
	}

	async init_simu() {
		this.containerTour.innerHTML = '<div id="left_part"><div id="table_option"></div><div id="table"></div></div><div id="right_part"></div>';
		show_popup("Patientez !", "Chargement OLAF en cours...");
		this.pc = await this.get_nbpc_dispo();
		this.pc_ini = await this.get_nbpc_dispo();
		this.cds = this.tour_local[this.zone][this.saison]["cds"];
		this.cds["N-1"] = 0;
		document.querySelector('.popup-close').click();
		this.pc_vac = this.pc["pc_vac"];
		this.v = {"JX":0,"J1":0, "J3":0, "S2":0, "J2":0, "S1":0, "N":0, "N-1":0, "JXBV":0,"J1BV":0, "J3BV":0, "S2BV":0, "J2BV":0, "S1BV":0, "NBV":0, "N-1BV":0};
		
		// Récupération des schémas réalisés
		const day7 = addDays_toString(this.day, -7);
		// récupère la date de 2019 : ex "2019-11-02"
		let day2019 = get_sameday(this.day, 2019).toISOString().split('T')[0];
		const sch = new schema_rea(this.day, this.zone_schema);
		this.schema = await sch.read_schema_realise() || "vide";
		const sch7 = new schema_rea(day7, this.zone_schema);
		this.schema7 = await sch7.read_schema_realise() || "vide";
		const sch2019 = new schema_rea(day2019, this.zone_schema);
		this.schema2019 = await sch2019.read_schema_realise() || "vide";
		console.log("Schema");
		console.log(this.schema);
		console.log("Schema7");
		console.log(this.schema7);
		console.log("Schema2019");
		console.log(this.schema2019);
		this.show_simu_capa();
	}

	/*	------------------------------------------
			Affichage de la feuille de capa		
		------------------------------------------ */
	async show_simu_capa() {
		//show_popup("Patientez !", "Chargement en cours...");
		const update = {"est": {}, "ouest": {}};

		if (typeof update[this.zone][this.day] === 'undefined') update[this.zone][this.day] = {"update_count": {"JX":0,"J1":0, "J3":0, "S2":0, "J2":0, "S1":0, "N":0, "N-1":0}, "update_name": {"JX":[],"J1":[], "J3":[], "S2":[], "J2":[], "S1":[], "N":[], "N-1":[]}};
		//document.querySelector('.popup-close').click();

		this.build_tab();
		this.modify_listener();
		show_capa_graph("right_part", this.day, this.zone_schema, this.pc, this.schema, this.schema7, this.schema2019);
		$('feuille_capa_simu').scrollIntoView({ 
            behavior: 'smooth' 
        });

	}

	// Fabrique la partie gauche
	affiche_vac(vac) {
		const cds = this.cds[vac];
		// ajoute les RD bleus détachés à ceux de l'équipe
		let nbpc_vac = this.pc_vac[vac]["nbpc"];
		let nbpcdet_vac = this.pc_vac[vac]["renfort"];
		const vac_RD_tab = Object.keys(this.pc["pc_RD_15mn"]);
		if (vac_RD_tab.length != 0) {
			vac_RD_tab.forEach( vac_RD => {
				let vac_RD_extraite = vac_RD.substring(2);
				vac_RD_extraite = vac_RD_extraite.split("-")[0];
				let sous_vac_RD = vac_RD_extraite.substring(2).toUpperCase();
				vac_RD_extraite = vac_RD_extraite.substring(0,2);
				if (vac_RD_extraite === vac) {
					console.log(vac_RD+" en plus : "+this.pc_vac["JX"][vac_RD]["nombre"]);
					nbpc_vac += this.pc_vac["JX"][vac_RD]["nombre"];
					nbpcdet_vac += this.pc_vac["JX"][vac_RD]["nombre"];
				}
			})
		}
		
		return `
		<tr data-vac='${vac}'>
		<td class='eq left_2px right_1px bottom_2px' data-vac='${vac}'>${this.tab_vac_eq[vac]}</td><td class='right_1px bottom_2px'>${vac}</td><td class='bottom_2px'>${cds}</td>
			<td class='nbpc bottom_2px' data-vacPC='${vac}'>${nbpc_vac}</td>
			<td class='nbpc right_1px bottom_2px' data-vacDET='${vac}'>${nbpcdet_vac}</td>
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
			show_capa_graph("right_part", this.day, this.zone_schema, this.pc, this.schema, this.schema7, this.schema2019);
		})
		let res = `<table class="simu">
					<thead>
						<tr class="titre"><th class="top_2px left_2px bottom_2px right_1px">Eq</th><th class="top_2px bottom_2px right_1px">Vac</th><th class="top_2px bottom_2px">CDS</th><th class="top_2px bottom_2px">PC</th><th class="top_2px bottom_2px right_1px">det</th><th class="top_2px bottom_2px right_1px">BV</th><th class="top_2px bottom_2px right_1px">BVini</th><th class="top_2px bottom_2px right_2px">Mod BV</th>
						<th class="top_2px bottom_2px right_2px">Mod PC</th></tr>
					</thead>
					<tbody>`;
		res += `${this.affiche_vac("JX")}`;
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
				show_capa_graph("right_part", this.day, this.zone_schema, this.pc_ini, this.schema, this.schema7, this.schema2019, this.pc);
			});
		});

		moinsBV.forEach(el => {
			el.addEventListener('click', async (event) => {
				const vac = el.dataset.vac;
				const vacBV = vac+"BV";
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
				show_capa_graph("right_part", this.day, this.zone_schema, this.pc_ini, this.schema, this.schema7, this.schema2019, this.pc);
			});
		});

		plusPC.forEach(el => {
			el.addEventListener('click', async (event) => {
				const vac = el.dataset.vac;
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
				show_capa_graph("right_part", this.day, this.zone_schema, this.pc_ini, this.schema, this.schema7, this.schema2019, this.pc);
			});
		});

		moinsPC.forEach(el => {
			el.addEventListener('click', async (event) => {
				const vac = el.dataset.vac;
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
				show_capa_graph("right_part", this.day, this.zone_schema, this.pc_ini, this.schema, this.schema7, this.schema2019, this.pc);
			});
		});

	}
}

/* ------------------------------------------------------------------------------------
		Affiche les graphes :
		- vert de la capa offerte le jour choisi
		- orange : les ouvertures réalisées à J-7
		- bleu	 : les ouvertures réalisées à J-728 (2019)

		Les 3 derniers paramètres permettent de fournir un objet schema réalisé
		afin d'éviter un rechargement des fichiers
		
		Paramètre :
		 @param {string} containerId - id du container d'affichage
		 @param {string} day - "yyyy-mm-jj"
		 @param {string} zone - "AE" ou "AW"
		 @param {array} pc - objet d'array des crénaux horaires associés aux pc dispo
		 @param {objet/string} schema - objet schema rea ou 'no' par défaut
		 @param {objet/string} schema7 - objet schema rea J-7 ou 'no' par défaut
		 @param {objet/string} schema2019 - objet schema rea 2019 ou 'no' par défaut
	----------------------------------------------------------------------------------- */
async function show_capa_graph(containerId, day, zone, pc = 0, schema = 'no', schema7 = 'no', schema2019 = 'no', pc_simu = 0) {
	
	console.log("-Schema");
	console.log(schema);
	console.log("-Schema7");
	console.log(schema7);
	console.log("-Schema2019");
	console.log(schema2019);

	const container = $(containerId);
	container.innerHTML = '<div style="display: flex;"><div id="i1"></div><ul id="date_legend"><li class="bleu"></li><li class="orange"></li><li class="vert"></li></ul></div><div id="uceso"></div>';
	let chartDom = $("uceso");
	chartDom.style.height = "400px";
	let myChart = echarts.init(chartDom);
	myChart.clear();

	const d = day.split("-");
	let pc_15mn = null;
	let pc_instr_15mn = null;
	let pc_jx_15mn = null;
	let pc_15mn_simu = null;
	let pc_instr_15mn_simu = null;
	let pc_jx_15mn_simu = null;
	let uceso = null;
	let uceso_simu = null;
	let data_series_uceso = null;
	if (pc == 0) {
		show_popup("Données OLAF indisponibles", "Pas de graph UCESO proposé");
		await wait(1000);
		document.querySelector('.popup-close').click();
	} else {
		pc_15mn = pc["pc_total_horsInstrRD_15mn"];
		pc_instr_15mn = pc["pc_instr_15mn"];
		pc_total_RD_15mn = pc["pc_total_RD_15mn"];
		uceso = pc_15mn.map( (elem, index) => [elem[0], Math.floor((elem[1] + pc_instr_15mn[index][0] + pc_total_RD_15mn[index]) / 2) ]);
		console.log("uceso");
		console.log(uceso);
		data_series_uceso = [];
		uceso.forEach(row => {
			let deb = row[0];
			let nb_sect = row[1];
			let f = deb.split(":");
			let time = new Date(d[0], d[1]-1, d[2], f[0], f[1]);
			data_series_uceso.push([time,nb_sect]);
		}); 
		data_series_uceso.push([new Date(d[0], d[1]-1, d[2], 23, 59), uceso[uceso.length-1][1]]);

		if (pc_simu !=0 ) {
			pc_15mn_simu = pc_simu["pc_total_horsInstrRD_15mn"];
			pc_instr_15mn_simu = pc_simu["pc_instr_15mn"];
			pc_total_RD_15mn_simu = pc_simu["pc_total_RD_15mn"];
			uceso_simu = pc_15mn_simu.map( (elem, index) => [elem[0], Math.floor((elem[1] + pc_instr_15mn_simu[index][0] + pc_total_RD_15mn_simu[index]) / 2) ]);
			data_series_uceso_simu = [];
			uceso_simu.forEach(row => {
				let deb = row[0];
				let nb_sect = row[1];
				let f = deb.split(":");
				let time = new Date(d[0], d[1]-1, d[2], f[0], f[1]);
				data_series_uceso_simu.push([time,nb_sect]);
			}); 
			data_series_uceso_simu.push([new Date(d[0], d[1]-1, d[2], 23, 59), uceso_simu[uceso_simu.length-1][1]]);
		}
	}

	let sch;
	let sch7;
	let sch2019;
	let day7 = addDays_toString(day, -7);
	let day2019 = get_sameday(day, 2019).toISOString().split('T')[0];

	// si les 3 derniers params n'existe pas, l'appel ne provient de simu_capa => on lit les schemas
	if (schema === 'no') {
		sch = new schema_rea(day, zone);
    	schema = await sch.read_schema_realise();
	}
	if (schema7 === 'no') {
		sch7 = new schema_rea(day7, zone);
		schema7 = await sch7.read_schema_realise();
	}
	if (schema2019 === 'no') {
		sch2019 = new schema_rea(day2019, zone);
    	schema2019 = await sch2019.read_schema_realise();
	}
	
	// Si on récupère 'vide', c'est que l'appel provient de simu_capa et que le schema n'existe pas
	// dans ce cas, on le remet à undefined pour ne pas impacter les test qui suivent
	if (schema === 'vide') schema = undefined;
	if (schema7 === 'vide') schema7 = undefined;
	if (schema2019 === 'vide') schema2019 = undefined;

	console.log("*Schema");
	console.log(schema);
	console.log("*Schema7");
	console.log(schema7);
	console.log("*Schema2019");
	console.log(schema2019);

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
	console.log("111");
	$$(".bleu").innerHTML = '2019 : '+jour2019+' '+reverse_date(day2019);
	console.log("222");
	$$(".orange").innerHTML = 'J-7 : '+jour7+' '+reverse_date(day7);
	console.log("333");
	$$(".vert").innerHTML = 'J : '+jour+' '+reverse_date(day);
	console.log("444");
	
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

	if (pc_simu != 0) {
		option.series.push({
			name: 'UCESO simu',
			color: '#ae9999',
			data: data_series_uceso_simu,
			type: 'line',
			animation: false,
			step: 'end'
		});
	}

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
		console.log("Minutes réalisées: "+rea);
		return i1;

	}
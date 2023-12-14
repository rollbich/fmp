/*  ------------------------------------------------
				Feuille de Capa
	------------------------------------------------ */

class capa {

	/* ------------------------------------------------------
			@param {string} day 	- "yyyy-mm-jj"
            @param {string} zone	- "AE" ou "AW"
	   ------------------------------------------------------ */
    constructor(day, zone) {
		if (typeof day !== 'string') throw new Error('Day value should be a String.');
		if (typeof zone !== 'string') throw new Error('Zone value should be a String.');
		if ((zone !== 'AE') && (zone !== 'AW')) throw new Error('La zone doit etre AE ou AW.');
        this.day = day;
		this.zone_schema = zone;
        this.zone_olaf = zone.substring(1,2); // 2è lettre de la zone (E ou W)
		this.zone = this.zone_olaf === "E" ? "est" : "ouest";
		this.pc_ini = null;
    }

	async init() {
		show_popup("Patientez !", "Chargement en cours...");
		this.pc_ini = this.pc_ini || await this.get_nbpc_dispo();
		console.log("pc_ini");
		console.log(this.pc_ini);
		await document.querySelector('.popup-close').click();
		this.saison =  this.pc_ini.saison;
		this.repartition =  this.pc_ini.repartition;
		this.clean_cycle = this.pc_ini.clean_cycle;
		console.log("Saison");
		console.log(this.saison);
		this.workingTeam = this.pc_ini.workingTeam;
	}

	compare_tds_name(a, b) {
        const year_a = parseInt(a.slice(-4));
        const year_b = parseInt(b.slice(-4));
        if (year_a < year_b) {
            return -1;
        } else if (year_a > year_b) {
            return 1;
        }
        if (year_a === year_b) {
            if (a < b) return -1;
            if (a > b) return 1;
            if (a === b) return 0;
        }
    }

    /* ----------------------------------------------------------------------------------------------------------------
        *Calcul du nbre de PC total par vac
        *Calcul du nbre de PC total dispo par pas de 15mn à la date choisie
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
    async get_nbpc_dispo() {
		
		const yesterday = jmoins1(this.day);
		// récupère l'objet contenant les propriétés equipes
		this.effectif = this.effectif ?? await get_olaf(this.zone_olaf, this.day, yesterday);
		
		console.log("OLAF result");
		console.log(this.effectif);
		
		// si pas de donnée on retourne 0
		if (this.effectif == 0) return 0;
		
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

		return this.effectif;
    }

}

class feuille_capa extends capa {
	/* -----------------------------------------------------------------------------------------------------------
		@param {string} containerIdTour - id du container pour le tour
		@param {boolean} show			- true pour afficher la feuille de capa et retourner this
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
		await this.init();
		this.pc_15mn = await this.pc_ini["pc_total_horsInstrRD_15mn"];
		this.pc_instr_15mn = await this.pc_ini["pc_total_instr_15mn"];
		this.pc_RD_15mn = await this.pc_ini["pc_RD_15mn"];
		this.pc_total_RD_15mn = await this.pc_ini["pc_total_RD_15mn"];
		this.pc_vac = await this.pc_ini["pc_vac"];
		this.pc_sousvac_15mn = await this.pc_ini["pc_sousvac_15mn"];
		this.RD = await this.pc_ini["RD"];
		if (this.show) {this.show_feuille_capa(); return this; } else { return this.get_uceso(); }
	}

	/*	------------------------------------------
			Affichage de la feuille de capa		
		------------------------------------------ */
		
	show_feuille_capa() {
		
		// Construit le tableau
		let res = `<table class="uceso">
					<caption>Journ&eacute;e du ${reverse_date(this.day)} - Zone ${this.zone}</caption>`;
		res += `<thead>
				<tr class="titre"><th class="top_2px left_2px bottom_2px right_1px">Eq</th><th class="top_2px bottom_2px right_1px">Vac</th><th class="top_2px bottom_2px right_1px">Part</th>`;
		res += `<th class="top_2px bottom_2px details masque">CDS</th><th class="top_2px bottom_2px details masque">PC</th><th class="top_2px bottom_2px right_1px details masque">det</th><th class="top_2px bottom_2px right_2px details masque">BV</th>`;
		res += `<th class="top_2px bottom_2px right_2px" colspan="96">...</th></tr>
				</thead>
				<tbody>`;
		
		const cycle = [...this.clean_cycle];
		cycle.push("N-1");
		cycle.forEach(vac => {
			res += `${this.affiche_vac(vac)}`;
		})
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
			let detail = this.RD[RD_type]["agent"];
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
			td_el.addEventListener('click', (event) => {
				let ih = `
				<div id="modif_eq">
				${this.add_pers("J1")}
				${this.add_pers("J3")}
				${this.add_pers("S2")}
				${this.add_pers("J2")}
				${this.add_pers("S1")}
				${this.add_pers("N")}
				${this.add_pers("N-1")}`;
				ih += `</div>`;
				show_popup("Personnels", ih);
			});
		});
	}

	/*	-----------------------------------------------------------------------------------
			 Fabrique les lignes de 96 <td> des sous vacation du tour de service
			 Dans 1 journée : 96 1/4 d'heure
		@return [ "96 <td> cds", "96 <td> sousvac A", "96 <td> autres sousvac", "..." ]
		----------------------------------------------------------------------------------- */
	affiche_vac(vac) {
		const res = [];
		// trie le tableau avec cds en premier, puis A, B ...
		const sousvac = Object.keys(this.pc_sousvac_15mn[vac]).sort(this.compare_tds_name); 
		sousvac.forEach((sv, index_sv) => {
			res[index_sv] = "";
		})
		// array d'index 0 à 95
		for (let index=0;index<96;index++) {
			
			if (vac != "N" && vac != "N-1") {
				sousvac.forEach((sv, index_sv) => {
					let cl="";
					const nb = this.pc_sousvac_15mn[vac][sv][index];
					if (nb != 0) cl = "bg";											// class="bg" => background bleu sur le td
					if (index === 95) { cl += " right_2px"; }						// dernier <td>
					if (index%4 === 0) { cl = (cl + " left_2px").trimStart(); }		// <td> de l'heure ronde
					if (index_sv == (sousvac.length-1)) { cl += " bottom_2px"; } 	// ligne de la dernière sousvac
					res[index_sv] += `<td class='${cl}'>${nb || ''}</td>`;
				})
			}

			if (vac === "N") {
				sousvac.forEach((sv, index_sv) => {
					let cl="";
					const nb = this.pc_sousvac_15mn[vac][sv][index];
					if (nb != 0 && index >= 48) cl = "bg";
					if (index === 95) { cl += " right_2px"; }
					if (index%4 === 0) { cl = (cl + " left_2px").trimStart(); }
					if (index_sv == (sousvac.length-1)) { cl += " bottom_2px"; }
					// vac de Nuit commençant à 19h30, on affiche que le soir ( 48 = midi)
					if (index > 48) res[index_sv] += `<td class='${cl}'>${nb || ''}</td>`; else res[index_sv] += `<td class='${cl}'></td>`;
				})
			} 

			if (vac === "N-1") {
				sousvac.forEach((sv, index_sv) => {
					let cl="";
					const nb = this.pc_sousvac_15mn[vac][sv][index];
					if (nb != 0 && index < 48) cl = "bg";
					if (index === 95) { cl += " right_2px"; }
					if (index%4 === 0) { cl = (cl + " left_2px").trimStart(); }
					if (index_sv == (sousvac.length-1)) { cl += " bottom_2px"; }
					if (index < 48) res[index_sv] += `<td class='${cl}'>${nb || ''}</td>`; else res[index_sv] += `<td class='${cl}'></td>`;
				})
			}
		};	
		
		const click_jx = vac === "JX" ? "pc details masque click_jx" : "pc details masque";
		// sousvac cds et A
		let ret = `
		<tr data-vac='${vac}'>
			<td class='left_2px right_1px'></td><td class='right_1px'></td>
			<td class='right_1px'>cds</td><td class='details masque'>${this.pc_vac[vac]["nbcds"]}</td>
			<td class='${click_jx}' data-vac='${vac}'>${this.pc_vac[vac]["nbpc"]}</td>
			<td class='right_1px details masque' data-vac='${vac}'>${this.pc_vac[vac]["renfort"]}</td>
			<td class='right_2px details masque'>${this.pc_vac[vac]["BV"]}</td>${res[0]}
		</tr>
		<tr data-vac='${vac}'>
			<td class='eq left_2px right_1px' data-vac='${vac}'>${this.workingTeam[vac]}</td>
			<td class='right_1px'>${vac}</td><td class='right_1px'>A</td>
			<td class='right_1px details masque' colspan="3"></td><td class='right_2px details masque'></td>${res[1]}
		</tr>`;

		// reste des sousvac au delà de A
		for(let i=2;i<sousvac.length;i++) {
			ret += `
			<tr data-vac='${vac}'>
				<td class='left_2px bottom_2px right_1px'></td><td class='bottom_2px right_1px'></td>
				<td class='bottom_2px right_1px'>B</td><td class='bottom_2px right_1px details masque' colspan="3"></td>
				<td class='bottom_2px right_2px details masque'></td>${res[i]}
			</tr>`;
		}
		return ret;
	}
		
	// fabrique la ligne du supplément instruction
	affiche_inst() {
		let res2 = "";
		res2 += `<td class='left_2px bottom_2px'></td>`; // border left à 2px pour la case 0
		for(let i=1;i<95;i++) {	
			if (this.pc_instr_15mn[i][1].length !== 0) {
				let d = "data-instr='";
				// val = { ""}
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
		let res = "";
		this.pc_15mn.forEach( (elem, index) => {
			let cl = "left_1px";
			if (index%4 === 0) cl = "left_2px";
			if (index === 95) cl += " right_2px";
			res += `<td class='${cl} bottom_2px'>${elem[1]+this.pc_instr_15mn[index][0]+this.pc_total_RD_15mn[index]}</td>`;
		});
		let result = `<tr><td class='left_2px bottom_2px' colspan="3">Nb PC</td><td class='bottom_2px right_2px details masque' colspan="4"></td>${res}</tr>`;
		return result;
	}

	// fabrique la ligne du nbre de 1/2 pc
	affiche_demi_uc() {
		let res = "";
		this.pc_15mn.forEach( (elem, index) => {
			let cl = "left_1px";
			if (index%4 === 0) cl = "left_2px";
			if (index === 95) cl += " right_2px";
			const demi = ((elem[1]+this.pc_instr_15mn[index][0]+this.pc_total_RD_15mn[index])%2 === 0) ? "" : "\u00bd";
			res += `<td class='${cl} bottom_2px'>${demi}</td>`;
		});
		let result = `<tr><td class='left_2px bottom_2px' colspan="3">Demi UC</td><td class='bottom_2px right_2px details masque' colspan="4"></td>${res}</tr>`;
		return result;
	}
	
	get_uceso_15mn() {
		return this.pc_15mn.map( (elem, index) => [elem[0], Math.floor((elem[1] + this.pc_instr_15mn[index][0] + this.pc_total_RD_15mn[index]) / 2) ]);
	}

	// fabrique la ligne du nbre d'uceso dispo
	//	uceso = partie entière nbr_pc/2
	affiche_uceso() {
		const uc = this.get_uceso_15mn();
		let res = "";
		this.compact(uc).forEach( elem => {
			let nb_occ = elem[1] - elem[0] + 1;
			res += `<td class="bordure_uc" colspan="${nb_occ}">${elem[2]}</td>`;
		});
		let result = `<tr class="bold"><td class='left_2px bottom_2px' colspan="3">UCESO</td><td class='bottom_2px right_2px details masque' colspan="4"></td>${res}</tr>`;
		return result;
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
	
	add_travailleurs(vac, present) {
		for (let [nom, obj] of Object.entries(this.pc_vac[vac]["teamToday"])) {
			present.push([nom, obj.fonction]);
		}
		for (let [nom, obj] of Object.entries(this.pc_vac[vac]["renfortAgent"])) {
			present.push([nom, obj.fonction]);
		}
		//console.log("VAC :");
		//console.log(present);
	}

	add_RO(vac, present) {
		this.pc_vac[vac]["RoList"].forEach (nom => {
			present.push([nom, "RO"]);
		})
	}

	add_stage(vac, present) {
		this.pc_vac[vac]["stage"].forEach (nom => {
			present.push([nom, "stage"]);
		})
	}

	add_conge(vac, present) {
		this.pc_vac[vac]["conge"].forEach (nom => {
			present.push([nom, "conge"]);
		})
	}

	add_pers (vac) {
		let res = `
		<table>
			<caption>${vac}<span data-vac='${vac}'></span></caption>
			<thead>
				<tr><th style="background: #444;">Nom</th><th style="background: #444;">Type</th></tr>
			</thead>
			<tbody>`;
		const eq = [];
		this.add_travailleurs(vac, eq);
		this.add_RO(vac, eq);
		this.add_stage(vac, eq);
		this.add_conge(vac, eq);
		const personnel = this.tri_equipe(eq);
		for (const p of personnel) {
			let cl = `type${p[1]}`, cl_previous;
			if (p[1] === "CDS") { cl_previous = 'surligne_cds'; cl += ' surligne_cds'; }
			if (p[1].includes("PC")) { cl_previous = 'pc_color'; cl += ' pc_color'; }
			if (p[1] === "stage" || p[1] === "conge") { cl_previous = 'off_color'; cl += ' off_color'; }
			// nom = p[0];
			res += `<tr><td class='${cl_previous}'>${p[0]}</td><td class='${cl}' data-vac='${vac}' data-nom='${p[0]}'>${p[1]}</td><tr>`;
		}
		res += `</tbody></table>`;
		return res;
	}

	// Tri dans l'ordre du tableau de valeurs
	tri_equipe(arr_eq) {
		const tab_valeurs = ["CDS", "PC-CDS", "PC-ACDS", "PC", "PC-RPL", "PC-DET", "stagiaire", "RO", "stage", "conge"];
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
		show_popup("Patientez !", "Chargement en cours...");
		await this.init();
		
		console.log("pc_ini_simu_capa");
		console.log(this.pc_ini);
		await document.querySelector('.popup-close').click();
		this.containerTour.innerHTML = '<div id="left_part"><div id="table_option"></div><div id="table"></div></div><div id="right_part"></div>';
		this.pc = structuredClone(this.pc_ini);
		console.log("this.pc");
		console.log(this.pc);
		this.pc_vac = this.pc["pc_vac"];
		this.RD = this.pc["RD"];
		this.pc_sousvac_15mn = this.pc["pc_sousvac_15mn"];
		
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
		/*
		console.log("Schema");
		console.log(this.schema);
		console.log("Schema7");
		console.log(this.schema7);
		console.log("Schema2019");
		console.log(this.schema2019);
		*/
		this.show_simu_capa();
	}

	/*	------------------------------------------
			Affichage de la feuille de capa		
		------------------------------------------ */
	async show_simu_capa() {
		//show_popup("Patientez !", "Chargement en cours...");
		this.build_tab();
		this.modify_listener();
		show_capa_graph("right_part", this.day, this.zone_schema, this.pc, this.schema, this.schema7, this.schema2019);
		$('feuille_capa_simu').scrollIntoView({ 
            behavior: 'smooth' 
        });

	}

	// Fabrique la partie gauche
	affiche_vac(vac) {
		const cds = this.pc_vac[vac]["nbcds"];
		// ajoute les RD bleus détachés à ceux de l'équipe
		let nbpc_vac = this.pc_vac[vac]["nbpc"];
		let nbpcdet_vac = this.pc_vac[vac]["renfort"];
		const vac_RD_tab = Object.keys(this.pc["pc_RD_15mn"]);
		if (vac_RD_tab.length != 0) {
			vac_RD_tab.forEach( vac_RD => {  // "RDJ3a-ete"
				let vac_RD_extraite = vac_RD.substring(2); // "J3a-ete"
				vac_RD_extraite = vac_RD_extraite.split("-")[0]; // "J3a"
				let sous_vac_RD = vac_RD_extraite.substring(2).toUpperCase(); // "J3A"
				vac_RD_extraite = vac_RD_extraite.substring(0,2); // "J3"
				if (vac_RD_extraite === vac) {
					console.log(vac_RD+" en plus : "+this.RD[vac_RD]["nombre"]);
					nbpc_vac += this.RD[vac_RD]["nombre"];
					nbpcdet_vac += this.RD[vac_RD]["nombre"];
				}
			})
		}
		let result = `
		<tr data-vac='${vac}'>
			<td class='eq left_2px right_1px bottom_2px' data-vac='${vac}'>${this.workingTeam[vac]}</td>
			<td class='right_1px bottom_2px'>${vac}</td><td class='bottom_2px'>${cds}</td>
			<td class='nbpc bottom_2px' data-vacPC='${vac}'>${nbpc_vac}</td>
			<td class='nbpc right_1px bottom_2px' data-vacDET='${vac}'>${nbpcdet_vac}</td>
			<td class='bv right_1px bottom_2px' data-vacBV='${vac}'>${this.pc_vac[vac]["BV"]}</td>
			<td class='bvini right_1px bottom_2px' data-vacBV='${vac}'>${this.pc_vac[vac]["BV"]}</td>
			<td class='right_1px bottom_2px'><div class="modify"><button class="minusBV minus" data-vac='${vac}'>-</button><span class="numberPlace" data-vacBV='${vac}'>0</span><button class="plusBV plus" data-vac='${vac}'>+</button></div></td>
			<td class='right_2px bottom_2px'><div class="modify"><button class="minusPC minus" data-vac='${vac}'>-</button><span class="numberPlace" data-vacPC='${vac}'>0</span><button class="plusPC plus" data-vac='${vac}'>+</button></div></td>
		</tr>`;
		return result;
	}

	build_tab() {
		// Construit le tableau
		let to = `<h2>Zone ${this.zone.toUpperCase()} / ${reverse_date(this.day)}</h2>`;
		/*
		to += '<input type="checkbox" id="check_nobv" name="check_nobv"><label for="check_nobv">Enlever les BVs pour le calcul des UCESOs</label><div><button id="upd">Update</button></div>';
		*/
		$('table_option').innerHTML = to;
		/*
		$('check_nobv').addEventListener('click', () => {
			if ($('check_nobv').checked) {
				this.noBV = true;
			} else {
				this.noBV = false;
			}
		})
		$('upd').addEventListener('click', async () => {
			//this.pc = await this.get_nbpc_dispo(this.v, this.vBV, this.noBV);
			//show_capa_graph("right_part", this.day, this.zone_schema, this.pc, this.schema, this.schema7, this.schema2019);
		})
		*/
		let res = `<table class="simu">
					<thead>
						<tr class="titre">
							<th class="top_2px left_2px bottom_2px right_1px">Eq</th>
							<th class="top_2px bottom_2px right_1px">Vac</th>
							<th class="top_2px bottom_2px">CDS</th>
							<th class="top_2px bottom_2px">PC</th>
							<th class="top_2px bottom_2px right_1px">det</th>
							<th class="top_2px bottom_2px right_1px">BV</th>
							<th class="top_2px bottom_2px right_1px">BVini</th>
							<th class="top_2px bottom_2px right_2px">Mod BV</th>
							<th class="top_2px bottom_2px right_2px">Mod PC</th>
						</tr>
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

	/* 	--------------------------------------------------------
			@return {
				sousvac1: nb_pc,
				sousvac2: nb_pc,
				...
			}
		-------------------------------------------------------- */
	get_default_repartition(vacation) {
		const rep = {};
		let repart, reste, pc1, pc2;
		let tour_vacation = vacation;
		if (vacation === "N-1") tour_vacation = "N";
		const sousvacs = this.pc.all_sv[tour_vacation];
		const nb_sousvacs = sousvacs.length;
		
		switch (nb_sousvacs) {
            case 2:
				reste = this.pc_vac[vacation]["nbpc"] % 2;
				if (reste === 0) {
					repart = this.repartition[tour_vacation]["standard"]["sousvac2"]["reste0"];
				}
				if (reste === 1) {
					repart = this.repartition[tour_vacation]["standard"]["sousvac2"]["reste1"];
				}
				pc1 = Math.floor(this.pc_vac[vacation]["nbpc"]/2);
				pc2 = Math.floor((this.pc_vac[vacation]["BV"] + this.pc_vac[vacation]["renfort"] - this.pc_vac[vacation]["nbcds"] - this.pc_vac[vacation]["ROinduit"])/2);
				sousvacs.forEach(sousvac => {
					rep[sousvac] = Math.min(pc1 + repart[sousvac], pc2 + repart[sousvac]);
				})
                break;
			case 3:
				reste = this.pc_vac[vacation]["nbpc"] % 3;
				if (reste === 0) {
					repart = this.repartition[tour_vacation]["standard"]["sousvac3"]["reste0"];
				}
				if (reste === 1) {
					repart = this.repartition[tour_vacation]["standard"]["sousvac3"]["reste1"];
				}
				if (reste === 2) {
					repart = this.repartition[tour_vacation]["standard"]["sousvac3"]["reste2"];
				}
				pc1 = Math.floor(this.pc_vac[vacation]["nbpc"]/3);
				pc2 = Math.floor((this.pc_vac[vacation]["BV"] + this.pc_vac[vacation]["renfort"] - this.pc_vac[vacation]["nbcds"] - this.pc_vac[vacation]["ROinduit"])/3);
				sousvacs.forEach(sousvac => {
					rep[sousvac] = Math.min(pc1 + repart[sousvac], pc2 + repart[sousvac]);
				})
				break;
            default:
				pc1 = this.pc_vac[vacation]["nbpc"];
				pc2 = this.pc_vac[vacation]["BV"] + this.pc_vac[vacation]["renfort"] - this.pc_vac[vacation]["nbcds"] - this.pc_vac[vacation]["ROinduit"];
				rep[sousvacs[0]] = Math.min(pc1, pc2);
		}
		return rep;
	}

	get_repartition (vacation) {
		let result;
		let tour_vacation = vacation;
		if (vacation === "N-1") tour_vacation = "N";
		const sousvacs = this.pc.all_sv[tour_vacation];
		const svcle = "sousvac"+sousvacs.length;
		const d = new Date(this.day);
		const jours = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
		const weekday = jours[d.getDay()];
		const pc_cle = "pc"+this.pc_vac[vacation]["nbpc"];

		if (this.repartition[tour_vacation]["type_repartition"] === "fixe") {
			result = this.repartition[tour_vacation]["fixe"][svcle][weekday][pc_cle];
		} else {
			result = this.get_default_repartition(vacation);
		}	
		return result;
	}

	modify_listener() {
		const moinsBV = document.querySelectorAll('.minusBV');
		const plusBV = document.querySelectorAll('.plusBV');
		const moinsPC = document.querySelectorAll('.minusPC');
		const plusPC = document.querySelectorAll('.plusPC');

		plusBV.forEach(el => {
			el.addEventListener('click', async (event) => {
				const vac = el.dataset.vac;
				$$(`span[data-vacBV='${vac}']`).innerHTML = parseInt($$(`span[data-vacBV='${vac}']`).innerHTML) + 1;
				this.pc["pc_vac"][vac]["BV"]++;
				const rep = this.get_repartition(vac);
				for(let i=0;i<95;i++) {
					if (this.pc["pc_sousvac_15mn"][vac]["A"][i] != 0) {
						let temp1 = this.pc["pc_sousvac_15mn"][vac]["A"][i] - rep.A;
						this.pc["pc_sousvac_15mn"][vac]["A"][i] = rep.A;
						this.pc["pc_total_horsInstrRD_15mn"][i][1] -= temp1;
					}
					if (this.pc["pc_sousvac_15mn"][vac]["B"][i] != 0) {
						let temp2 = this.pc["pc_sousvac_15mn"][vac]["B"][i] - rep.B;
						this.pc["pc_sousvac_15mn"][vac]["B"][i] = rep.B;
						this.pc["pc_total_horsInstrRD_15mn"][i][1] -= temp2;
					}
				}	
				const BV_elem = $$(`td.bv[data-vacBV='${vac}']`);
				BV_elem.innerHTML = parseInt(BV_elem.innerHTML) + 1;
				if (BV_elem.innerHTML != $$(`td.bvini[data-vacBV='${vac}']`).innerHTML) {
					BV_elem.classList.add('bg_red');
				} else {
					BV_elem.classList.remove('bg_red');
				}
				show_capa_graph("right_part", this.day, this.zone_schema, this.pc_ini, this.schema, this.schema7, this.schema2019, this.pc);
			});
		});

		moinsBV.forEach(el => {
			el.addEventListener('click', async (event) => {
				const vac = el.dataset.vac;
				$$(`span[data-vacBV='${vac}']`).innerHTML = parseInt($$(`span[data-vacBV='${vac}']`).innerHTML) - 1;
				this.pc["pc_vac"][vac]["BV"]--;
				const rep = this.get_repartition(vac);
				for(let i=0;i<95;i++) {
					if (this.pc["pc_sousvac_15mn"][vac]["A"][i] != 0) {
						let temp1 = this.pc["pc_sousvac_15mn"][vac]["A"][i] - rep.A;
						this.pc["pc_sousvac_15mn"][vac]["A"][i] = rep.A;
						this.pc["pc_total_horsInstrRD_15mn"][i][1] -= temp1;
					}
					if (this.pc["pc_sousvac_15mn"][vac]["B"][i] != 0) {
						let temp2 = this.pc["pc_sousvac_15mn"][vac]["B"][i] - rep.B;
						this.pc["pc_sousvac_15mn"][vac]["B"][i] = rep.B;
						this.pc["pc_total_horsInstrRD_15mn"][i][1] -= temp2;
					}
				}	
				const BV_elem = $$(`td.bv[data-vacBV='${vac}']`);
				BV_elem.innerHTML = parseInt(BV_elem.innerHTML) - 1;
				if (BV_elem.innerHTML != $$(`td.bvini[data-vacBV='${vac}']`).innerHTML) {
					BV_elem.classList.add('bg_red');
				} else {
					BV_elem.classList.remove('bg_red');
				}
				show_capa_graph("right_part", this.day, this.zone_schema, this.pc_ini, this.schema, this.schema7, this.schema2019, this.pc);
			});
		});

		plusPC.forEach(el => {
			el.addEventListener('click', async (event) => {
				const vac = el.dataset.vac;
				$$(`span[data-vacPC='${vac}']`).innerHTML = parseInt($$(`span[data-vacPC='${vac}']`).innerHTML) + 1;
				this.pc["pc_vac"][vac]["nbpc"]++;
				const rep = this.get_repartition(vac);
				for(let i=0;i<95;i++) {
					if (this.pc["pc_sousvac_15mn"][vac]["A"][i] != 0) {
						let temp1 = this.pc["pc_sousvac_15mn"][vac]["A"][i] - rep.A;
						this.pc["pc_sousvac_15mn"][vac]["A"][i] = rep.A;
						this.pc["pc_total_horsInstrRD_15mn"][i][1] -= temp1;
					}
					if (this.pc["pc_sousvac_15mn"][vac]["B"][i] != 0) {
						let temp2 = this.pc["pc_sousvac_15mn"][vac]["B"][i] - rep.B;
						this.pc["pc_sousvac_15mn"][vac]["B"][i] = rep.B;
						this.pc["pc_total_horsInstrRD_15mn"][i][1] -= temp2;
					}
				}	
				const PC_elem = $$(`td.nbpc[data-vacPC='${vac}']`);
				PC_elem.innerHTML = parseInt(PC_elem.innerHTML) + 1;
				if ($$(`span[data-vacPC='${vac}']`).innerHTML != 0) {
					PC_elem.classList.add('bg_red');
				} else {
					PC_elem.classList.remove('bg_red');
				}
				show_capa_graph("right_part", this.day, this.zone_schema, this.pc_ini, this.schema, this.schema7, this.schema2019, this.pc);
			});
		});

		moinsPC.forEach(el => {
			el.addEventListener('click', async (event) => {
				const vac = el.dataset.vac;
				$$(`span[data-vacPC='${vac}']`).innerHTML = parseInt($$(`span[data-vacPC='${vac}']`).innerHTML) - 1;
				this.pc["pc_vac"][vac]["nbpc"]--;
				const rep = this.get_repartition(vac);
				for(let i=0;i<95;i++) {
					if (this.pc["pc_sousvac_15mn"][vac]["A"][i] != 0) {
						let temp1 = this.pc["pc_sousvac_15mn"][vac]["A"][i] - rep.A;
						this.pc["pc_sousvac_15mn"][vac]["A"][i] = rep.A;
						this.pc["pc_total_horsInstrRD_15mn"][i][1] -= temp1;
					}
					if (this.pc["pc_sousvac_15mn"][vac]["B"][i] != 0) {
						let temp2 = this.pc["pc_sousvac_15mn"][vac]["B"][i] - rep.B;
						this.pc["pc_sousvac_15mn"][vac]["B"][i] = rep.B;
						this.pc["pc_total_horsInstrRD_15mn"][i][1] -= temp2;
					}
				}	
				const PC_elem = $$(`td.nbpc[data-vacPC='${vac}']`);
				PC_elem.innerHTML = parseInt(PC_elem.innerHTML) - 1;
				if ($$(`span[data-vacPC='${vac}']`).innerHTML != 0) {
					PC_elem.classList.add('bg_red');
				} else {
					PC_elem.classList.remove('bg_red');
				}
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
	/*
	console.log("-Schema");
	console.log(schema);
	console.log("-Schema7");
	console.log(schema7);
	console.log("-Schema2019");
	console.log(schema2019);
	*/
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
		show_popup("Donn&eacute;es OLAF indisponibles", "Pas de graph UCESO propos&eacute;");
		await wait(1000);
		document.querySelector('.popup-close').click();
	} else {
		pc_15mn = pc["pc_total_horsInstrRD_15mn"];
		pc_instr_15mn = pc["pc_total_instr_15mn"];
		pc_total_RD_15mn = pc["pc_total_RD_15mn"];
		uceso = pc_15mn.map( (elem, index) => [elem[0], Math.floor((elem[1] + pc_instr_15mn[index][0] + pc_total_RD_15mn[index]) / 2), Math.floor((elem[1] + pc_instr_15mn[index][0] + pc_total_RD_15mn[index]) % 2) ]);
		//console.log("uceso");
		//console.log(uceso);
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
			pc_instr_15mn_simu = pc_simu["pc_total_instr_15mn"];
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
	/*
	console.log("*Schema");
	console.log(schema);
	console.log("*Schema7");
	console.log(schema7);
	console.log("*Schema2019");
	console.log(schema2019);
*/
	data_series = [];
	data_series7 = [];
	data_series2019 = [];
	data_d = [];
	
	// Si le schema du jour J existe, alors on l'affiche
	if (typeof schema !== 'undefined') {
		// schema.ouverture: [ jj/mm/aaaa, heure_début, heure_fin, nbr_secteurs, [noms des TV] ]
		schema.ouverture.forEach(row => {
			let deb = row[1];
			let fin = row[2];
			let nb_sect = row[3];
			let arr_tv = row[4];
			let f = deb.split(":");
			let time = new Date(d[0], d[1]-1, d[2], f[0], f[1]); // -1 pour le mois car l'index commence à 0
			data_series.push([time,nb_sect]);
			// "2023-05-31T22:00:00.000Z"
			let a = [];
			arr_tv.forEach(elem => {
				a.push(elem[0]);
			})
			data_d.push([deb,nb_sect,a]);
		}); 
		data_d[0][0] = "00:00";
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
		if (typeof schema2019.ouverture[schema2019.ouverture.length-1] != 'undefined') {
			data_series2019.push([new Date(d[0], d[1]-1, d[2], 23, 59), schema2019.ouverture[schema2019.ouverture.length-1][3]]);
		}
	}
	
	const i1 = get_i1(data_series, data_series_uceso);
	$("i1").innerHTML = 'Indicateur i1: '+i1+'%';
	const tab_jour=new Array("Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi");
	const jour2019 = tab_jour[new Date(day2019).getDay()];
	const jour7 = tab_jour[new Date(day7).getDay()];
	const jour = tab_jour[new Date(day).getDay()];
	const z = (zone === "AE") ? "est" : "ouest";
	console.log("max secteurs");
	console.log(schema.max_secteurs);
	const vacs = Object.keys(pc["pc_vac"]);
	const nbr = {};
	vacs.forEach(vac => {
		nbr[vac] = pc["pc_vac"][vac]["nbpc"];
	});
	save_uceso(z, day, jour, i1, uceso, data_d, schema.max_secteurs, schema.tv_h, nbr);
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

async function save_uceso(zone, day, jour, i1, uceso, realise, maxsecteurs, tvh, nbpc) {
	const save = {
		"fonction": "save_uceso", 
		"zone": zone, 
		"day": day, 
		"typejour": jour, 
		"maxsecteurs": maxsecteurs,
		"uceso": JSON.stringify(uceso), 
		"realise":JSON.stringify(realise),
		"i1":i1, 
		"tvh": JSON.stringify(tvh),
		"nbpc": JSON.stringify(nbpc)	
	}	
	var data = {
		method: "post",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(save)
	};
	
	//await fetch("../capa/tds_sql.php", data);

}
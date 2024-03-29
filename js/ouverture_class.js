class ouverture extends schema_rea {
    /*  -------------------------------------------------------------
        @param {string} containerId - Id du conteneur
            @param {string} day - "yyyy-mm-dd"
            @param {string} zone - "AE ou "AW"
    ----------------------------------------------------------------- */
    constructor(containerId, day, zone) {
        super(day, zone);
        this.container = $(containerId);
    }

/*  --------------------------------------------------------------------------------------------- 
	  Lit le schema réalisé, affiche le tableau des ouvertures et ajoute les 'clicks' sur les TV
	--------------------------------------------------------------------------------------------- */
    async show_ouverture(confs, bool) {
        this.schema = await this.read_schema_realise();
        if (typeof this.schema === 'undefined') {
            show_popup("Problème de lecture",`Vérifier le fichier`);
            return;
        }
        this.confs = confs;	
        this.show_table_ouverture(bool);
        this.add_ouverture_listener();
    }

    /*  --------------------------------------------------------------------------------------------- 
	  Lit le fichier de confs supp
        @params {string} zone - "est" ou "west"
	--------------------------------------------------------------------------------------------- */
    async get_bdd_confs(zone) {
		const url_est =  `../confs-est-supp.json`;	
        const url_west =  `../confs-west-supp.json`;	
        const url = zone === "est" ? url_est : url_west;
        console.log("load confs supp OK");
        return await loadJson(url);
	}
/*  --------------------------------------------------------------------------------------------- 
	  Prépare le fichier de correspondance confs-regroupements
	--------------------------------------------------------------------------------------------- */
    async get_fichier_confs() {
        const cf = new conf(new Date(), this.z);
        await cf.init_b2b();
        const confs_exist = cf.b2b_sorted_confs;
		const confs_supp = await this.get_bdd_confs(this.z);

        // merge les 2 fichiers
        const conf_tot = {};
        Object.assign(conf_tot, confs_exist[this.z]);
        Object.keys(confs_supp).forEach( elem => {
            conf_tot[elem] = {...conf_tot[elem], ...confs_supp[elem]}
        })

        console.log("Confs existantes");
        console.log(confs_exist);
        console.log("Confs supp");
        console.log(confs_supp);
		console.log("Confs totale mergée");
        console.log(conf_tot);
        return conf_tot;
	}

    /*  --------------------------------------------------------------------------------------------- 
	        Update les confs du fichier confs supplémentaire
			@params {string} "est" ou "ouest"
	    --------------------------------------------------------------------------------------------- */
	async update_conf_file(json, zone) {
		const url = zone === "est" ? "../admin/export_confsEst_to_json.php" : "../admin/export_confsWest_to_json.php";
		const data = {
			method: "post",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(json)
		};
		fetch(url, data);
	}

    /*  --------------------------------------------------------------------------------------------- 
	        Affiche une popup avec les confs NM + confs BDD pour un nombre de TV donné
			@params {string} nbr_regroup : nombre de TV de la conf
	    --------------------------------------------------------------------------------------------- */
    show_popup_conf(nbr_regroup) {
        // Supprime la popup si elle existe déjà pour permettre la mise à jour sinon 2 id identiques => erreur
        if ($('popup-cree-conf') != null) $('popup-cree-conf').remove();
        const el = document.createElement('div');
        el.setAttribute('id', 'popup-cree-conf');
        el.setAttribute('class', 'popup-conf1 off');
        let res2 = `<h2 class="center">Conf - ${nbr_regroup} secteurs</h2>`;
        res2 += `<div class="popup-conf2">`;
        res2 += "<div id='add_conf'>";
        res2 += `
        <table class="">
            <thead><tr class="titre"><th>Conf</th><th colspan="15"></th></tr></thead>
            <tbody>`;
            for(let conf in this.confs[nbr_regroup]) {
                let arr_tv = this.confs[nbr_regroup][conf];
                arr_tv = tri_salto(arr_tv, this.z);
                res2 += `<tr><td style="background: var(--color-2019);">${conf}</td>`; 
                arr_tv.forEach(tv => {
                    res2 +=`<td>${tv}</td>`;
                })
                res2 += '</tr>';	
            }
        res2 += '</tbody></table>';
        res2 += '</div><div class="center"><button id="close_creer_conf">Close</button></div>';
        let parentDiv = document.getElementById("glob_container");
        parentDiv.insertBefore(el, $('result'));
        el.innerHTML = res2;
        $('popup-cree-conf').classList.remove('off');
        $('close_creer_conf').addEventListener('click', e => {
            el.remove();
        })
        const div = $('add_conf');
        div.scrollTo({
            top: div.scrollHeight,
            behavior: 'smooth'
      });
    }

/*  ------------------------------------------------------------------------------
	  Affiche la table du schema d'ouvertures dans le container
        @params {boolean} bool - false accès de base
	 	 - Tri par horaire
	------------------------------------------------------------------------------ */
    show_table_ouverture(bool) {
        let res = `<div class='result'><table class="ouverture">
                        <caption>Journée du ${this.schema.date}</caption>
                        <thead>
                        <tr class="titre"><th>Début</th><th>Fin</th><th>Nb sect.</th><th>Conf</th><th class="colspan">Confs</th></tr>
                    </thead>
                    <tbody>`;                 
        this.schema.ouverture.forEach(row => { 
            res += '<tr>'; 
            for(let j=1;j<4;j++) { res += `<td>${row[j]}</td>`; }	
            const regroupements = [];
            row[4].forEach(tv => {
                regroupements.push(tv[0]);
            });
            let c = bool === true ? "Add" : "-";
            const nb_regroupements = regroupements.length;
            for(let conf in this.confs[nb_regroupements]) {
                const arr_tv = this.confs[nb_regroupements][conf];
                if (regroupements.sort().toString() == arr_tv.sort().toString()) {
                    c = conf;
                    break;
                }
            }
            switch (c.substring(0,1)) {
                case 'N':
                    res += `<td class='green'>${c}</td>`;
                  break;
                case 'Z':
                    res += `<td class='red'>${c}</td>`;
                  break;
                case 'A':
                    res += `<td class='yellow pointer' data-nbregr='${nb_regroupements}' data-tvs='${regroupements}'>${c}</td>`;
                  break;
                default:
                    res += `<td>${c}</td>`;
            }
           		
            row[4].forEach(tv => {
                let r = this.get_ouverture_totale(tv[0], time_to_min(row[1]), time_to_min(row[2]));
                const color = get_group_color(tv[0], this.z);
                res += `<td title="${tv[1]}" class="tv" data-tv="${tv[0]}" data-deb="${r[0]}" data-fin="${r[1]}" style="background: ${color}">${tv[0]}</td>`;
            });
            res += '</tr>';
                                    
        });
        res += '</tbody></table>';
        res += `<div class="max">Max secteurs : ${this.schema.max_secteurs}</div>`;
        res += `<button id='bouton_ouv_par_pos'>Afficher par position</button></div>`;                  
        this.container.innerHTML = res;
        $('bouton_ouv_par_pos').addEventListener('click', e => {
            this.show_table_ouverture_par_position();
        });
        const td_add = document.querySelectorAll('[data-nbregr]');
        if (td_add.length === 0) return;
        
		td_add.forEach(td_el => {
            td_el.addEventListener('click', async (event) => {
                const exist = $('popup-cree-conf');
                if (!!exist === true) exist.remove();
                let nbr_regroup = td_el.dataset.nbregr;
                let tvs = td_el.dataset.tvs.split(",");
                tvs = tri_salto(tvs, this.z);
                let confs_name = Object.keys(this.confs[nbr_regroup]);
                this.show_popup_conf(nbr_regroup); 
                let fir;
                let fir2A;
                let fir3A;
                if (this.z === "est") {
                    fir = ["SBAM", "MNST", "BTAJ", "SAB", "BAM", "SBM", "MN", "ST", "AJ", "BT"];
                    fir2A = ["MNST", "BTAJ"];
                    fir3A = ["MNST", "BT", "AJ"];
                } else { 
                    fir = ["MALY", "LYO", "MOLYO", "LE", "LOLS", "LELS", "LOLE", "LS", "LO", "MO", "ML", "MOML"];
                    fir2A = ["LYO", "MOML"];
                    fir3A = ["LOLS", "LE", "MOML"];
                }

                let nbr_fir = 0;
                let fir_letter = "B";
                tvs.forEach(tv => {
                    if (fir.includes(tv)) nbr_fir++;
                });
                if (nbr_fir === 1) fir_letter = "A";
                if (nbr_fir === 2) {
                    let ok = true;
                    fir2A.forEach(tv => {
                        if (tvs.includes(tv) === false) ok = false;
                    })
                    if (ok === true) fir_letter = "A";
                }
                if (nbr_fir === 3) {
                    let ok = true;
                    fir3A.forEach(tv => {
                        if (tvs.includes(tv) === false) ok = false;
                    })
                    if (ok === true) fir_letter = "A";
                }

                const nbr_uir = tvs.length - nbr_fir;

                let nbr_char1 = 65; // A=65 Z=90
                let nbr_char2 = 65; // A=65 Z=90
                let n;
                let reste;
                let Ereste;
                let ok;
                do {
                    ok = true;
                    let str_char1 = String.fromCharCode(nbr_char1);
                    let str_char2 = String.fromCharCode(nbr_char2);
                    if (nbr_fir === 0) n = `N${nbr_uir}${str_char1}${str_char2}`; else n = `N${nbr_uir}${str_char1}${str_char2}${nbr_fir}${fir_letter}`; // N5AA ou N5AA2A
                    reste = n.substring(1); // N5H2A => 5H2A
                    Ereste = "E" + reste;
                    if (nbr_char2 < 90) {
                        nbr_char2++;
                    }
                    if (nbr_char2 === 90 && nbr_char1 < 90) nbr_char1++;
                    console.log(n);
                    console.log(confs_name);
                    if (confs_name.includes(n)) { console.log(n+" existe déjà"); ok = false; }
                    if (confs_name.includes(Ereste)) ok = false;
                } while (ok === false)
                console.log("CONF CHOISIE: "+n);

                const json = await this.get_bdd_confs(this.z);
                json[nbr_regroup][n] = tvs;
                this.confs[nbr_regroup][n] = tvs;
                this.show_popup_conf(nbr_regroup);
                console.log("Creation");
                console.log(json);
                await this.update_conf_file(json, this.z);
                this.show_ouverture(this.confs, true);
                show_popup('Add Confs', `Conf ${n} créée`);
                
            })
        })
    }

/*  ------------------------------------------------------------------------------
	  Affiche la table du schema d'ouvertures dans le container
	 	- Tri par position
	------------------------------------------------------------------------------ */
    show_table_ouverture_par_position() {
        let res = `<table class="ouverture">
                        <caption>Journée du ${this.schema.date}</caption>
                        <thead>
                            <tr class="titre"><th class="separation">Position</th>`;
        let tab_h = [];
        for (const [key, value] of Object.entries(this.schema.position)) {                        				
            value.forEach(arr => {
                let tv = arr[2];
                let deb;
                let fin;
                // si les heures contiennent ":", c'est que c'est 4f : les heures sont déjà au bon format 
                // sinon c'est cautra les heures sont en minutes, il faut les convertir
                if (arr[0].toString().indexOf(':') == -1) deb = min_to_time(arr[0]); else deb = arr[0];
                if (arr[1].toString().indexOf(':') == -1) fin = min_to_time(arr[1]); else fin = arr[1];
                let data = deb+"-"+fin;
                tab_h.push(data);
                console.log("TV: "+tv+"   data: "+data);
                console.log(arr);
            });                           
        }   
        
        tab_h = [...new Set(tab_h)].sort(); 
        tab_h.forEach( h => {
            res += `<th class="separation">${h.substr(0,5)}</th>`;
        })
        res += "</tr></thead><tbody>";
        console.log("tab_h");
        console.log(tab_h);
                    
        for (const [key, value] of Object.entries(this.schema.position)) {                     
            res += '<tr>'; 
            res += `<td class="separation">${key}</td>`;
            const index_arr = new Array(tab_h.length).fill("");					
            value.forEach( arr => {
                let tv = arr[2];
                let deb;
                let fin;
                if (arr[0].toString().indexOf(':') == -1) deb = min_to_time(arr[0]); else deb = arr[0];
                if (arr[1].toString().indexOf(':') == -1) fin = min_to_time(arr[1]); else fin = arr[1];
                let d = deb+"-"+fin;
                let index = tab_h.indexOf(d);
                index_arr[index] = [tv, deb, fin];
            });
            index_arr.forEach( val => {
                if (typeof val[0] === 'undefined') res += `<td class="separation">-</td>`;
                else res += `<td class="separation">${val[0]}</td>`;
            })
            res += '</tr>';                      
        }

        res += '</tbody></table>';
        res += `<br><button id='bouton_ouv_par_heure'>Afficher par heure</button>`;                 
        this.container.innerHTML = res;
        $('bouton_ouv_par_heure').addEventListener('click', e => {
            this.show_table_ouverture();
            this.add_ouverture_listener();
        });
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

    async add_ouverture_listener() {
        try {	
            const tds = document.querySelectorAll('.tv');
            const h20 = await get_h20_b2b(this.day, this.zone, this.schema); //  {	date: { tv: [ ["heure:min", load, mv_ods], ... ] } }
            const occ = await get_occ_b2b(this.day, this.zone, this.schema);
            const h = h20[this.day];
            const o = occ[this.day];

            const reg = new regul(this.day, this.zone, false);
	        await reg.init();
            const tvset = this.zone === "AE" ? "LFMMFMPE" : "LFMMFMPW";
            const regbytv = reg.get_regbytv();
            
            const dd = this.day.split("-");
            const rd = remove_hyphen_date(this.day);
            let year = dd[0];
            let month = dd[1];
            let file_name;
            file_name = `${year}/${month}/${rd}-mv_otmv-${this.z}.json`;
            let mv_otmv = await get_data(file_name);
            if (mv_otmv === 404) {
                const default_date_MV_json = await loadJson("../default_date_MV_OTMV.json");
                const fig = default_date_MV_json["date"].split("-");
                const y = fig[0];
                const m = fig[1];
                const ddmv = remove_hyphen_date(default_date_MV_json['date']);
                const default_date_MV = reverse_date(default_date_MV_json['date']);
                file_name = `${y}/${m}/${ddmv}-mv_otmv-${this.z}.json`;
                mv_otmv = await get_data(file_name);
                show_popup(`MV/OTMV du jour indisponibles`, `Date des MV/OTMV : ${default_date_MV}`);
            }
    
            for (const td of tds) {
                let deb = td.dataset.deb;
                let fin = td.dataset.fin;
                let tv = td.dataset.tv;
                            
                td.addEventListener('click', function(event) {
                    let data = [];
                    let dataAxis = [];	
                    let data_occ = [];
                    let dataAxis_occ = [];
                    let data_reg_h20 = [];
                    let data_reg_h20_delay = []; 
                    let data_reg_h20_reason = []; 
                    let data_reg_occ = [];
                    let data_reg_occ_delay = [];
                    
                    try {
                        h[tv].forEach(value => {
                            if (time_to_min(value[0]) > time_to_min(deb)-graph_margin && time_to_min(value[0]) < time_to_min(fin)+graph_margin) {
                                dataAxis.push(value[0]);
                                data.push(value[1]);
                                if (typeof regbytv[tv] !== 'undefined') { // tv qui ont eu des reguls
                                    let r;
                                    let cause;
                                    let delay;
                                    regbytv[tv].forEach(elem => {
                                        if (time_to_min(elem[0]) > time_to_min("04:00") && time_to_min(elem[1]) < time_to_min("23:59")) {
                                            console.log(tv);
                                            if (time_to_min(elem[1]) >= time_to_min(value[0]) && time_to_min(elem[0]) <= time_to_min(value[0])) {
                                                r = elem[2]; 
                                                cause=  elem[3];
                                                delay = elem[4];  
                                            } 
                                        } 
                                    });
                                    data_reg_h20.push(r);
                                    data_reg_h20_delay.push(delay);
                                    data_reg_h20_reason.push(cause);
                                }
                            }
                        });	
                        o[tv].forEach(value => {
                            if (time_to_min(value[0]) > time_to_min(deb)-graph_margin && time_to_min(value[0]) < time_to_min(fin)+graph_margin) {
                                dataAxis_occ.push(value[0]);
                                data_occ.push(value[1]);
                                if (typeof regbytv[tv] !== 'undefined') { // tv qui ont eu des reguls
                                    let r;
                                    let cause;
                                    let delay;
                                    regbytv[tv].forEach(elem => {
                                        if (time_to_min(elem[0]) > time_to_min("04:00") && time_to_min(elem[1]) < time_to_min("23:59")) {
                                            console.log(tv);
                                            if (time_to_min(elem[1]) >= time_to_min(value[0]) && time_to_min(elem[0]) <= time_to_min(value[0])) {
                                                r = elem[2];   
                                                cause=  elem[3];
                                                delay = elem[4];  
                                            } 
                                        } 
                                    });
                                    data_reg_occ.push(r);
                                    data_reg_occ_delay.push(delay);
                                }
                            }
                        });	

                        let full_tv = "LFM"+tv;
                        let peak = mv_otmv["OTMV"][full_tv][0]["otmv"]["peak"]["threshold"];	
                        let sustain = mv_otmv["OTMV"][full_tv][0]["otmv"]["sustained"]["threshold"];				
                        if (data.length === 0) { 
                            if (data_occ.length === 0) {
                                document.getElementById('graph-container-h20').classList.add('off');
                                document.getElementById('graph-container-occ').classList.add('off');
                                show_popup("Pas de données","La plage horaire est indisponible");
                            } else {
                                document.getElementById('graph-container-occ').classList.remove('off');
                                show_popup("Le H20 n'est pas calculable","Le TV n'a ouvert assez longtemps et/ou n'est dans la plage horaire disponible ou n'est pas récupéré"); 
                                show_occ_graph('graph_occ', dataAxis_occ, data_occ, peak, sustain, tv, "", data_reg_occ, data_reg_occ_delay);
                                show_h20_graph('graph_h20', dataAxis, data, 0, 0, "NO DATA", "", data_reg_h20, data_reg_h20_delay, data_reg_h20_reason);
                            }
                        } else {
                            document.getElementById('graph-container-h20').classList.remove('off');
                            document.getElementById('graph-container-occ').classList.remove('off');
                            const full_tv = "LFM"+tv;
                            let mv_now = mv_otmv["MV"][full_tv][0]["capacity"];
                            let mv_ods = h[tv][0][2];
                            show_h20_graph('graph_h20', dataAxis, data, mv_now, mv_ods, tv, "", data_reg_h20, data_reg_h20_delay, data_reg_h20_reason);
                            show_occ_graph('graph_occ', dataAxis_occ, data_occ, peak, sustain, tv, "", data_reg_occ, data_reg_occ_delay);
                        }
                    }
                    
                    catch (err) {
                        show_popup("Attention ! ", "Les données du TV: "+tv+" n'ont pas été récupérées en B2B.");
                        console.log(err);
                    }
                    
                })
            }
        }
        catch (err) {
            const tds = document.querySelectorAll('.tv');
            for (const td of tds) {
                td.classList.remove('tv');
            }
            show_popup("Accès aux graphes impossible", `Les données du ${this.day} n'ont pas été récupérées en B2B.`);
            await wait(1250);
            document.querySelector('.popup-close').click();
            console.log(err);
        }
    }

/*  ------------------------------------------------------------------------------
	  Récupère la plage maximale d'ouverture d'un TV
	 	@param {object} schema - objet schéma
		@param {string} tv - nom du TV
		@param {string} deb - heure de début en minutes depuis minuit
		@param {string} fin - heure de fin en minutes depuis minuit
		@returns {array} - [heure 1ère ouverture du TV, heure de fermeture du TV]
	------------------------------------------------------------------------------ */
// ex : le nbre de secteur vient de passer à 6 et AB était ouvert entre 10:14 (deb) et 10:35 (fin)
// mais AB était déjà ouvert depuis 08:00 et restera ouvert jusqu'à 17:35 => on récupère ["08:00", "17:35"] 
    get_ouverture_totale(tv, deb, fin) {
        let datad = "", dataf =  "";
        for(let j=0;j<this.schema["tv_h"][tv].length;j++) {
            let Hd = this.schema["tv_h"][tv][j][0]-this.ouv_tech;
            let Hf = this.schema["tv_h"][tv][j][1]+this.ouv_tech;
            if (deb >= Hd && fin <= Hf) {
                datad = min_to_time(this.schema["tv_h"][tv][j][0]);
                dataf = min_to_time(this.schema["tv_h"][tv][j][1]);
                break;
            } 																		
        }
        return [datad, dataf];
    }

}
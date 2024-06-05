class tds_editor {

    constructor(containerId, greve = false) {
        this.containerId = containerId;
        this.greve = greve;
        this.init(); 
    }

    async init(zone = "est", saison, open = "no") {
        this.tour_vierge = new Array(96);
        this.tour_vierge.fill(0);
        this.zone = zone;
        const d = await fetch(`../php/editor-API.php?zone=${this.zone}`);
        this.data = await d.json();
        if (this.greve) {
            this.tds = this.data.tds_greve;
            this.repartition = this.data.repartition_greve;
            this.current_tds = this.data.current_tds_greve;
            this.beyond_saisons = this.data["beyond_saisons_greve"]; 
            this.all_saisons = this.data["all_saisons_greve"];
            this.grev = 1;
            this.str_greve = "yes";
            this.type_tds = "tds_greve";
            this.titre = " greve";
        } else {
            this.tds = this.data.tds_local;
            this.repartition = this.data.repartition;
            this.current_tds = this.data.current_tds;
            this.beyond_saisons = this.data["beyond_saisons"]; 
            this.all_saisons = this.data["all_saisons"];
            this.grev = 0;
            this.str_greve = "no";
            this.type_tds = "tds_local";
            this.titre = "";
        }
        this.arr_saisons = Object.keys(this.tds).sort(this.compare_tds_name);
        this.insert_header(saison, open);
        this.edit_tds(saison); // si saison non définie, prends la saison courante
        console.log(this.data);
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

/*  --------------------------------------------------------------------------------------------- 
    Affiche le bandeau du haut pour gérer :
        @param {string} open        - "yes" ou "no"
            -> pour savoir si la fenêtre gestion répartition est ouverte ou non
        @param {string} saison      - "hiver-2024" ...
    --------------------------------------------------------------------------------------------- */

    insert_header(saison = this.current_tds, open) { 
   
        let saisons = Object.keys(this.tds).sort(this.compare_tds_name);
        let titre = "TDS Editor";
        if (this.greve) titre += " Gr&egrave;ve";
        let html = `
        <header>${titre}</header>
        <div id="tds_editor_glob">
        <ul class="menu_tds_editor">
            <li>
                <select id="saison" class="select">`;
                    saisons.forEach(s => {
                        if (s === saison) html += `<option selected value="${s}">${s}</option>`; else html += `<option value="${s}">${s}</option>`;
                    })
                html += `
                </select>
                <select id="zone" class="select">`;
                if (this.zone === "est") {
                    html += `<option selected value="est">Zone EST</option><option value="ouest">Zone WEST</option>`;
                 } else {
                    html += `<option value="est">Zone EST</option><option selected value="ouest">Zone WEST</option>`;
                 }
                html += `
                </select>
                <button id="button_show" type="button" class="button_tour">Show TDS</button>
            </li>
            
        </ul>
        <ul class="menu_tds_editor">
        <li>
            <button id="button_gestion_tds" type="button" class="button_tour">Gestion des TDS</button>`;
            if (this.greve === false) html +=`
            <button id="button_gestion_tds_supp" type="button" class="button_tour">Gestion des TDS suppl</button>`;
            html +=`
            <button id="button_gestion_repartition" type="button" data-open=${open} class="button_tour">Gestion des r&eacute;partitions</button>
        </li>
        </ul>
        <ul class="menu_tds_editor">
        <li>`;
        if (this.greve === false) html += `
            <span><a href="./edit_greve.php" target="_blank">Edit TDS greve</a></span>`; else 
            html += `
            <span><a href="./edit.php" target="_blank">Edit TDS std</a></span>`;
        html += `
            <span><a href="./">back to TDS</a></span>
        </li>
        </ul>
        </div>
        <div id="plage" class=""></div>
        <div id="result" class=""></div>`;

        $(this.containerId).innerHTML = html;

        $('button_show').addEventListener('click', e => {
            const open = $('button_gestion_repartition').getAttribute('data-open');
            if (open === "yes") {
                $('close_modal_repartition').click();
                $('button_gestion_repartition').click();
            }
            this.zone = $('zone').value;
            this.init(this.zone, $('saison').value, open);
        })
        $('button_gestion_tds').addEventListener('click', e => {
            $('modal_tds').classList.toggle('off');
            this.gestion_tds();
        })

        $('zone').addEventListener('change', async e => {
            this.zone = e.target.value;
            await this.init(this.zone, undefined, open);
        })

        if (document.getElementById('button_gestion_tds_supp') !== null) { // ce bouton n'existe pas sur la page grève
            $('button_gestion_tds_supp').addEventListener('click', e => {
                $('modal_tds_supp').classList.toggle('off');
                this.gestion_tds_supp();
            })
        }

        $('button_gestion_repartition').addEventListener('click', e => {
            $('button_gestion_repartition').setAttribute('data-open', "yes");
            $('modal_repartition').classList.toggle('off');
            this.gestion_repartition();
        })
    }

/*  --------------------------------------------------------------------------------------------- 
    Affiche la page du tds :
        
        @param {string} containerId - Id du conteneur affichant la table
        @param {string} zone        - "est" ou "ouest"
        @param {string} saison      - "hiver-2024" ...
    --------------------------------------------------------------------------------------------- */

    async edit_tds(saison_select = this.current_tds) {
            
        this.affiche_plage_saisons("plage");
        this.add_listener_plage();
        
        let saison = saison_select ?? $('saison').value;
        this.affiche_tds("result", saison);
        this.add_listener_tds_supprime();
        
    }	

    affiche_plage_saisons(containerId) {
        console.log(this.beyond_saisons);
        console.log(this.arr_saisons);
        let res = '<table class="plage sortable">';
        res += `<caption>Plages temporelles des saisons - Zone ${this.zone}  <button id='button_add_plage' type="button" class="button_tour">Add</button></caption>`;
        res += '<thead><tr><th>D&eacute;but</th><th class="fin">Fin</th><th>Saison</th><th class="px80">Save&nbsp;</th><th class="px80">Delete</th></tr></thead>';
        res += '<tbody>';
        for (const [id, value] of Object.entries(this.beyond_saisons)) {
            res += `<tr>
                    <td class="pl" data-zone="${this.zone}">
                        <input type="date" value="${value.debut}" data-col="debut" data-id='${value.id}'/>
                    </td>
                    <td class="pl" data-zone="${this.zone}">
                        <input type="date" value="${value.fin}" data-col="fin" data-id='${value.id}'/>
                    </td>
                    <td class="pl" data-zone="${this.zone}">
                        <select data-id='${value.id}' data-col="nom_tds" class="select">`;
                        this.arr_saisons.forEach(s => {
                            if (s === value.nom_tds) res += `<option selected value="${s}">${s}</option>`; else res += `<option value="${s}">${s}</option>`;
                        });
                res += `</select>
                    </td>
                    <td class='plage_validate px80' data-greve="${this.grev}" data-zone="${this.zone}" data-id=${value.id}>&check;</td>
                    <td class='plage_supprime px80' data-greve="${this.grev}" data-zone="${this.zone}" data-id=${value.id}>x</td>
                    </tr>`;
        };
        res += '</tbody></table>';
        $(containerId).innerHTML = res;
        // trie par colonne date fin
        //document.querySelector('.fin').click();
        //document.querySelector('.fin').click();
    }

/*  --------------------------------------------------------------------------------------------- 
    Ajout la gestion des clicks sur les cases des plages   
        @param {string} zone        - "est" ou "ouest"
        @param {string} saison      - "hiver-2024" ...
    --------------------------------------------------------------------------------------------- */

    add_listener_plage() {
        const cases_validate = document.querySelectorAll(`td.plage_validate`);
        for (const td of cases_validate) {
            td.addEventListener('click', async (event) => {
                let id = parseInt(td.dataset.id);
                let debut = document.querySelector(`input[data-id="${id}"][data-col="debut"]`).value;
                let fin = document.querySelector(`input[data-id="${id}"][data-col="fin"]`).value;
                let saison = document.querySelector(`select[data-id="${id}"][data-col="nom_tds"]`).value;
                let zone = td.dataset.zone;
                const save_plage = { "id":id, "zone": zone, "saison": saison, "debut": debut, "fin": fin, "fonction": "save_plage"}
                console.log("save plage");
                console.log(save_plage);
                const data = {
                    method: "post",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(save_plage)
                };
                await fetch("tds_sql.php", data);
                show_popup(`Plage horaire: ${zone}`, "Modification effectu&eacute;e");
            });
        }
        const cases_suppr = document.querySelectorAll(`td.plage_supprime`);
        for (const td of cases_suppr) {
            td.addEventListener('click', async (event) => {
                let id = parseInt(td.dataset.id);
                let zone = td.dataset.zone;
                const supprime_plage = { "id":id, "zone": zone, "fonction": "supprime_plage"}
                console.log("supprime plage");
                console.log(supprime_plage);
                const data = {
                    method: "post",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(supprime_plage)
                };
                await fetch("tds_sql.php", data);
                show_popup(`Plage horaire: ${zone}`, "Suppression effectu&eacute;e");
                await this.init(zone);
            });
        }
        $(`button_add_plage`).addEventListener('click', (e) => {   
            let ih = ` 
            <div>
                <form><div class="form-group" style="text-align: left">
                    <label for="add_plage_debut" >D&eacute;but: </label>
                    <input style="display: block" type="date" id="add_plage_debut" data-col="debut" required />
                    <label for="add_plage_fin">Fin: </label>
                    <input style="display: block" type="date" id="add_plage_fin" data-col="fin" required />
                    <br>
                    <label for="add_plage_tds">Choix du TDS: </label>
                    <select id="add_plage_tds" data-col="nom_tds" class="select" style="margin-left: 0">`;
                        this.arr_saisons.forEach(s => {
                            ih += `<option value="${s}">${s}</option>`;
                        });
             ih += `</select>
                    <button id="ch" type="button" class="btn btn-primary">Add</button>
                </div></form>
            </div>`;
            show_popup("Ajout d'une plage", ih);
            $('ch').addEventListener('click', async (event) => {
                let debut = document.getElementById('add_plage_debut').value;
                let fin = document.getElementById('add_plage_fin').value;
                if (fin < debut) {
                    show_popup(`Problème`, "Il faut que :<br>Date de fin > date de d&eacute;but");
                    return;
                }
                Object.values(this.all_saisons).forEach(obj => {
                    if ((debut> obj.debut && debut<obj.fin) || (fin> obj.debut && fin<obj.fin)) {
                        show_popup(`Problème`, "Il y a un chevauchement de date");
                        return;
                    }
                });
                let tds = document.getElementById('add_plage_tds').value;
               
                const plage = { "zone": this.zone, "debut": debut, "fin": fin, "tds": tds, "greve": this.grev, "fonction": "add_plage"}
                await this.add_plage(plage);
                show_popup(`Plage horaire ${debut} / ${fin}<br>${tds}`, "Cr&eacute;ation effectu&eacute;e");
                await this.init(this.zone);
                
            })
        })
        
    }

    async add_plage(plage) {
        const data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(plage)
        };
        const result = await fetch("tds_sql.php", data);
    }

    /*  ------------------------------------------------------------------------------------------
    Fabrique la ligne du tour de service avec les entêtes 
        @param {string} vac         - "J1" "J3" "N" (nuit soirée) "N1" (nuit du matin) etc...
        @param {string} saison      - "hiver" "ete" "mi-saison-basse" "mi-saison-haute"
        @param {string} zone        - "est" ou "ouest"
        this.str_greve : "yes" ou "no"
    ------------------------------------------------------------------------------------------ */
    affiche_vac(vac, saison) {
        let res = "";
        let ligne = 1;
        
        const nb_cds = this.data[this.type_tds][saison][vac]["nb_cds"];
        const nbr_sousvac = Object.keys(this.data[this.type_tds][saison][vac]).length - 1;

        for (const [sousvac, tds] of Object.entries(this.data[this.type_tds][saison][vac])) {
            
            res += '<tr>';
            if (sousvac !== "nb_cds") { // && sousvac !== "cds"
                let cla = "left_2px right_1px";
                let cla2 = "right_1px";
                if (ligne > nbr_sousvac) { cla += " bottom_2px"; cla2 += " bottom_2px";}
                if (sousvac !== "cds") {
                    res += `<td class='${cla}'></td><td class='${cla2}'>${sousvac}</td>`;
                } else {
                    res += `<td class='${cla} add_sousvac' data-greve='${this.str_greve}' data-saison='${saison}' data-vac='${vac}' data-nbcds='${nb_cds}'>${vac}</td><td class='pc ${cla2}' data-saison='${saison}' data-nbcds='${nb_cds}' data-vac='${vac}'>cds: ${nb_cds}</td>`;
                }
                for(let index=0;index<96;index++) {
                    let case_tds = tds[index];
                    let cl = "case";
                    if (case_tds != 0) cl = "case bg";
                    if (index === 95) { cl += " right_2px";}
                    if (index%4 === 0) { cl += " left_2px";}
                    if (ligne > nbr_sousvac) { cl += " bottom_2px";}
                    res += `<td class='${cl} standard' data-vac='${vac}' data-sousvac='${sousvac}' data-col='${index}' data-saison='${saison}' data-greve='${this.str_greve}'>${case_tds || ''}</td>`;
                }
                let cl = "right_2px";
                if (ligne > nbr_sousvac) { cl += " bottom_2px";}
                if (sousvac !== "cds") { 
                    cl += " vac_tds_delete"
                    res += `<td class='${cl}' data-zone='${this.zone}' data-saison='${saison}' data-vac='${vac}' data-sousvac='${sousvac}' data-greve='${this.str_greve}'>x</td>`;
                } else {
                    res += `<td class='${cl}'></td>`;
                }
            }
            res += '</tr>'
            ligne++;
        }
        return res;
    }

    affiche_tds(containerId, saison) {
        let res = "";
        let bg = "";
        let titre = "";
        if (this.greve === true) {
            titre = "- Greve";
            bg = "#F005";
        }
        res += `<table class="ouverture">
        <caption style="background-color: ${bg}">TDS ${saison} - ${capitalizeFirstLetter(this.zone)} ${titre} <button id='button_tds_${saison}' type="button" class="button_tour">Save</button> -  <span style="font-size: 1.3rem; background-color: yellow;">Cliquez sur les cases jaunes pour g&eacute;rer les sous-vac et le cds</span></caption>
        <thead>
            <tr class="titre">
                <th class="top_2px left_2px right_1px bottom_2px">Vac</th>
                <th class="top_2px bottom_2px right_1px">Part</th>
                <th class="top_2px bottom_2px left_2px right_2px" colspan="96">...</th>
                <th class="top_2px bottom_2px right_2px">Supprime</th>
            </tr>
        </thead>
        <tbody>`;
        this.data["cycle"].forEach(vac => {
            if (vac != "") res += `${this.affiche_vac(vac, saison)}`;
        })
        res += `<tr class="titre"><td class='bottom_2px left_2px right_1px' colspan="2">Heures loc</td>${this.heure()}`;
        res += '</tbody></table>';
        $(containerId).innerHTML = res;
        this.add_listener(saison);
        this.add_create_sousvac_listener();
        this.add_save_listener(saison);
    }

    /*  ------------------------------------------------------------------------
        fabrique la ligne des heures du tableau sans l'entête (partie gauche)
        ------------------------------------------------------------------------ */
    heure() {
        let res = "";
        for(var i=0;i<96;i++) {
            if (i%4 == 0) res += `<td class="left_2px bottom_2px">${i/4}</td>`;
            if (i%4 == 2) res += `<td class="left_1px bottom_2px f8px">30</td>`;
            if (i%4 == 1 || (i%4 == 3 && i != 95)) { res += '<td class="bottom_2px"></td>'; } else if (i === 95) res += '<td class="right_2px bottom_2px"></td>';
        }
        return res;
    }

    /*  --------------------------------------------------------------------------------------------- 
            Ajout la gestion des clicks sur la croix pour supprimer une sousvac d'un tds   
        --------------------------------------------------------------------------------------------- */

    add_listener_tds_supprime() {
        let cases;
        if (this.greve) {
            cases = document.querySelectorAll(`td.vac_tds_delete[data-greve='yes']`);
        } else {
            cases = document.querySelectorAll(`td.vac_tds_delete[data-greve='no']`);
        }
    
        for (const td of cases) {
            td.addEventListener('click', async (e) => { 
                let zone = td.dataset.zone;	
                let saison = td.dataset.saison;	
                let vac = td.dataset.vac;
                let sousvac = td.dataset.sousvac;	
                const tour = {"fonction": "delete_sousvac", "zone": zone, "saison": saison, "greve": this.greve, "vac": vac, "sousvac":sousvac}	
                var data = {
                    method: "post",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(tour)
                };
                
                await fetch("tds_sql.php", data);
                show_popup(`Tour ${saison}<br>Vac ${vac}`, `Suppression sousvac ${sousvac} OK`);
                await this.init(zone, saison);
            })
        }
    }

    /*  --------------------------------------------------------------------------------------------- 
        Ajout la gestion des clicks sur les cases du tds    
            @param {string} saison      - "hiver-2024" ...
        --------------------------------------------------------------------------------------------- */

    add_listener(saison) {
        let cases;
        if (this.greve) {
            cases = document.querySelectorAll(`td.standard[data-saison=${saison}][data-greve='yes']`);
        } else {
            cases = document.querySelectorAll(`td.standard[data-saison=${saison}][data-greve='no']`);
        }
        for (const td of cases) {
            td.addEventListener('click', (event) => {
                let sousvac = td.dataset.sousvac;
                let col = td.dataset.col;
                let vac = td.dataset.vac;	
                const val = (td.innerHTML === '1') ? 0 : 1;
                td.innerHTML = (td.innerHTML === '1') ? '' : '1';
                td.classList.toggle('bg');
                this.data[this.type_tds][saison][vac][sousvac][col] = val;
            });
        }
    }

    add_create_sousvac_listener() {
    let elems;
    if (this.greve) elems = document.querySelectorAll(`td.add_sousvac[data-greve='yes']`); else elems = document.querySelectorAll(`td.add_sousvac[data-greve='no']`);
        for (const td of elems) {
            td.addEventListener('click', (event) => {
                const vac = td.dataset.vac;
                const saison = td.dataset.saison;
                const nb_cds = td.dataset.nbcds;
                const pos = td.getBoundingClientRect();
                let modal = ` 
                <div class="modal-dialog" role="document">
                  <div class="modal-content">
                    <div class="modal-body">
                        <div class="column" id="primary">
                            <h1>Cr&eacute;er une sous-vac</h1>
                            <h3>Saison : ${saison} - Vac : ${vac}</h3>
                            <form>
                                <div class="form-group">
                                <label for="sousvacInputName">Cr&eacute;ation Sous-vac :</label>
                                <select id="sousvacInputName">
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                </select>
                                </div>
                                <button id="create_sousvac_button" type="button" class="btn btn-primary">Create</button>
                            </form>
                            <div id="modal_text_sousvac" class="modal_text off"></div>
                        </div>
                        <div class="column" id="secondary">
                            <div class="sec-content">
                                <h1>Modifier le CDS</h1>
                                <h3>Saison : ${saison} - Vac : ${vac}</h3>
                                <form>
                                    <div class="form-group">
                                    <label for="cdsInputNumber">CDS actuel: ${nb_cds}</label>
                                    <input type="number" class="form-control" id="cdsInputNumber" placeholder="Nombre 0 ou 1" min="0" max="1" />
                                    </div>
                                    <button id="change_CDS_button" type="button" class="btn btn-primary">Change</button>
                                </form>
                                <div id="modal_text_cds" class="modal_text off">
                                </div>
                            </div>
                        </div>
                    </div>
                    <a id='close_modal' class='close_modal'></a>
                  </div>
                </div>`;
                const m = $('modal_popup');
                m.innerHTML = modal;
                m.style.position = 'absolute';
				m.style.left = pos.left + 76 + 'px';
                const position = pos.top + window.scrollY;
				m.style.top = position + 'px';
                $('close_modal').addEventListener('click', (e) => {
                    m.innerHTML = "";
                })
                
                $('create_sousvac_button').addEventListener('click', async (e) => {
                    const sousvac = $('sousvacInputName').value;
                    const save_sousvac = { "zone": this.zone, "saison": saison, "greve": this.greve, "vac": vac, "sousvac": sousvac, "fonction": "add_sousvac"}
                    const data = {
                        method: "post",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(save_sousvac)
                    };
                    await fetch("tds_sql.php", data);
                    $('modal_text_sousvac').innerHTML = `Sous-vac: ${sousvac} cr&eacute;&eacute;e`;
                    $('modal_text_sousvac').classList.toggle("off");
                    await this.init(this.zone, saison);
                })

                $('change_CDS_button').addEventListener('click', async (e) => {
                    const nbcds = $('cdsInputNumber').value;
                    const save_cds = { "zone": this.zone, "saison": saison, "greve": this.greve, "vac": vac, "nbcds": nbcds, "fonction": "change_cds"}
                    const data = {
                        method: "post",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(save_cds)
                    };
                    
                    await fetch("tds_sql.php", data);
                    $('modal_text_cds').innerHTML = `Vac: ${vac}<br>Changement CDS effectu&eacute;`;
                    $('modal_text_cds').classList.toggle("off");
                    td.nextElementSibling.innerHTML = `cds: ${nbcds}`;
                })
            });
        }
    }

    // Met en place des listeners des boutons save des différents tds
    add_save_listener(saison) {
        console.log(saison);
        const tour = { "zone": this.zone, "saison": saison, "greve": this.greve, "tds": this.data[this.type_tds][saison], "fonction": "save_tds"}
        $(`button_tds_${saison}`).addEventListener('click', async (e) => {
            var data = {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(tour)
            };
            
            await fetch("tds_sql.php", data);
            show_popup(`Sauvegarde du tour: ${saison}`, "La sauvegarde est termin&eacute;e");
        });
    }

    /*  ------------------------------------------------------------------
            Pop-up Gestion du TDS
        ------------------------------------------------------------------ */

    gestion_tds() {
        let saisons = Object.keys(this.tds);
        const tds_par_annee = {};
        let nb_tds_max_par_an = 0;
        saisons.forEach(saison => {
            const annee = saison.slice(-4);
            if (typeof tds_par_annee[annee] === 'undefined') tds_par_annee[annee] = [];
            tds_par_annee[annee].push(saison); 
        });
        let annees = Object.keys(tds_par_annee);
        annees.forEach(annee => {
            nb_tds_max_par_an = Math.max(nb_tds_max_par_an, tds_par_annee[annee].length);
        })
        let modal = `
        <h1>Gestion des TDS des saisons ${this.titre}</h1>
        <table class="plage sortable">`;
        modal += `<caption>Saisons ${this.titre} - Zone ${this.zone}</caption>`;
        modal += '<thead><tr><th>Ann&eacute;e</th>';
        modal += `<th colspan=${nb_tds_max_par_an}>TDS des saisons</th>`;
        modal += '</tr></thead>';
        modal += '<tbody>';
        annees.forEach(annee => {
            modal += `<tr><td>${annee}</td>`;
            tds_par_annee[annee].forEach(s => {
                modal += `<td>${s}</td>`;
            })
            for(let i=0;i<nb_tds_max_par_an-tds_par_annee[annee].length;i++) {
                modal += '<td></td>';
            }
            modal += `</tr>`;
        })
        modal += '</tbody>';
        modal += '<table>';
        modal += `
        <div class="modif">
            <div class="saison"> 
                <h2>Cr&eacute;ation d'un TDS</h2>
                <form>
                    <div class="form-group">
                    <label for="cree_saison">Saison: </label>
                    <input type="text" id="cree_saison" name="cree_saison" required minlength="2" maxlength="17" size="17" placeholder="nom du tds"/>
                    </div>
                    <p>Le nom du TDS doit se terminer par un underscore suivi de l'ann&eacute;e</p>
                    <button id="add_TDS_button" type="button" class="btn btn-primary">Ajouter TDS</button>
                </form>
                <div id="modal_text_create_tds" class="modal_text off"></div>
            </div>
            <div class="saison"> 
                <h2>Suppression d'un TDS</h2>
                <form>
                    <div class="form-group">
                    <label for="delete_TDS">Saison: </label>
                    <select id="delete_TDS" class="select">`;
                    saisons.forEach(s => {
                        modal += `<option value="${s}">${s}</option>`;
                    })
                    modal += `
                    </select>
                    </div>
                    <p>Attention, v&eacute;rifiez les plages contentant ce TDS supprimé</p>
                    <button id="delete_TDS_button" type="button" class="btn btn-primary">Supprimer TDS</button>
                </form>
                <div id="modal_text_delete" class="modal_text off"></div>
            </div>
            <div class="saison"> 
                <h2>Dupliquer un TDS</h2>
                <form>
                    <div class="form-group">
                        <label for="duplicate_old_TDS">Saison: </label>
                        <select id="duplicate_old_TDS" class="select">`;
                        saisons.forEach(s => {
                            modal += `<option value="${s}">${s}</option>`;
                        })
                        modal += `
                        </select>
                        <label for="duplicate_new_TDS">TDS: </label>
                        <input type="text" id="duplicate_new_TDS" name="duplicate_new_TDS" required minlength="2" maxlength="17" size="17" placeholder="nouveau nom"/>
                    </div>
                    <p>&nbsp;</p>
                    <button id="duplicate_TDS_button" type="button" class="btn btn-primary">Dupliquer TDS</button>
                </form>
                <div id="modal_text_duplicate" class="modal_text off"></div>
            </div>
        </div>
        <a id='close_modal_tds' class='close_modal'></a>
        `;
        
        const m = $('modal_tds');
        m.innerHTML = modal;
        $('close_modal_tds').addEventListener('click', (e) => {
            $('modal_tds').classList.toggle('off');
        })
        $('add_TDS_button').addEventListener('click', (e) => {
            const nom_saison = $('cree_saison').value;
            const last4digits = parseInt(nom_saison.slice(-4));
            if (last4digits > 2022) { 
                this.add_tds(nom_saison);
            } else {
                show_popup('Cr&eacute;ation impossible','les 4 derniers chiffres = ann&eacute;e');
            }
        })
        $('delete_TDS_button').addEventListener('click', (e) => {
            const nom_saison = $('delete_TDS').value;
            this.delete_tds(nom_saison);
        })
        $('duplicate_TDS_button').addEventListener('click', (e) => {
            const tds_to_copy = $('duplicate_old_TDS').value;
            const new_tds_name = $('duplicate_new_TDS').value;
            const last4digits = parseInt(new_tds_name.slice(-4));
            if (last4digits > 2022) { 
                this.duplicate_tds(tds_to_copy, new_tds_name);
            } else {
                show_popup('Cr&eacute;ation impossible','les 4 derniers chiffres = ann&eacute;e');
            }
        })
    }

    /*  ------------------------------------------------------------------
            Pop-up Gestion du TDS supplémentaire
        ------------------------------------------------------------------ */

    gestion_tds_supp() {  
        let saisons = Object.keys(this.data.tds_local);       
        let res = `<table class="ouverture">
        <caption>TDS Supp - ${capitalizeFirstLetter(this.zone)}</caption>
        <thead>
            <tr class="titre">
                <th class="top_2px left_2px right_1px bottom_2px">Vac</th>
                <th class="top_2px bottom_2px left_2px right_2px" colspan="96">...</th>
                <th class="top_2px bottom_2px left_1px right_2px">Save&nbsp;</th>
                <th class="top_2px bottom_2px right_2px">Delete</th>
            </tr>
        </thead>
        <tbody>`;
        const cles = Object.keys(this.data["tds_supp_local"]);
        cles.forEach(vac => {
            if (typeof this.data["tds_supp_local"][vac] != 'undefined') {
                let ligne = "";
                if (typeof this.data["tds_supp_local"][vac] != 'undefined') {
                    this.data["tds_supp_local"][vac].forEach( (elem, index) => {
                        let cl1 = "case";
                        if (elem != 0) cl1 = "case bg";
                        if (index === 95) { cl1 += " right_2px"; }
                        if (index%4 === 0) { cl1 += " left_2px"; }
                        ligne += `<td class='${cl1} supp bottom_2px' data-vac='${vac}' data-col='${index}' data-zone='${this.zone}'>${elem || ''}</td>`; 
                    });
                }
                res += `
                <tr>
                    <td class='left_2px right_1px bottom_2px' data-vac='${vac}' data-zone='${this.zone}'>${vac}</td>
                    ${ligne}
                    <td class='save_supp bottom_2px right_2px left_1px' data-zone="${this.zone}"  data-vac="${vac}">&check;</td>
                    <td class='delete_supp right_2px bottom_2px' data-zone="${this.zone}"  data-vac="${vac}">x</td>
                </tr>`;
            }
        });
        res += `<tr class="titre"><th class='bottom_2px left_2px right_1px' colspan="1">Heures loc</th>${this.heure()}`;
        res += '</tbody></table>';

        let modal = `
        <h1>Gestion des TDS suppl&eacute;mentaires</h1>
        ${res}
        <div class="modif">
            <div class="saison"> 
                <h2>Cr&eacute;ation d'une ligne de TDS suppl&eacute;mentaire</h2>
                <form>
                    <div class="form-group">
                    <label for="cree_tds_supp">Ligne Supp:&nbsp;</label>
                    <input type="text" id="cree_tds_supp" name="cree_tds_supp" required minlength="6" maxlength="18" size="18" placeholder="nom ligne supp"/>
                    <label for="associe_tds_supp">TDS associ&eacute;:&nbsp;</label>
                    <select id="associe_tds_supp" class="select">`;
                        saisons.forEach(s => {
                            modal += `<option value="${s}">${s}</option>`;
                        })
                        modal += `
                        </select>
                    </div>
                    <p>Le nom de la ligne supp doit commencer par RD et se terminer par une ann&eacute;e à 4 chiffres<br>Ex : RD1-2023</p>
                    <button id="add_TDS_supp_button" type="button" class="btn btn-primary">Ajouter TDS</button>
                </form>
                <div id="modal_text_create_tds_supp" class="modal_text off"></div>
            </div>
        </div>
        <a id='close_modal_tds_supp' class='close_modal'></a>
        `;
        
        const m = $('modal_tds_supp');
        m.innerHTML = modal;

        this.add_listener_tds_suppl();
        this.add_listener_tds_supp_save();
        this.add_listener_tds_supp_supprime();

        $('close_modal_tds_supp').addEventListener('click', (e) => {
            $('modal_tds_supp').classList.toggle('off');
        })
        $('add_TDS_supp_button').addEventListener('click', async (e) => {
            const nom_tds_supp = $('cree_tds_supp').value;
            const tds_associe = $('associe_tds_supp').value;
            const last4digits = parseInt(nom_tds_supp.slice(-4));
            const first2digit = nom_tds_supp.slice(0,2);
            if (last4digits > 2022 && first2digit === "RD") { 
                this.add_tds_supp(nom_tds_supp, tds_associe);
            } else {
                show_popup('Cr&eacute;ation impossible','les 2 premi&egrave;res lettres = RD<br>les 4 derniers chiffres = ann&eacute;e');
            }
        })
    }

    /*  ------------------------------------------------------------------------- 
            Ajout la gestion des clicks sur les cases du tds_suppl
        ------------------------------------------------------------------------- */   

    add_listener_tds_suppl() {
        const cases = document.querySelectorAll(`td.supp[data-zone=${this.zone}]`);
        for (const td of cases) {
            td.addEventListener('click', (event) => {
                let col = td.dataset.col;
                let vac = td.dataset.vac;	
                const val = (td.innerHTML === '1') ? 0 : 1;
                td.innerHTML = (td.innerHTML === '1') ? '' : '1';
                td.classList.toggle('bg');
                this.data["tds_supp_local"][vac][col] = val;
            });
        }
    }

    /*  --------------------------------------------------------------------------------------------- 
            Ajout la gestion des clicks sur la croix pour supprimer un tds suppl   
        --------------------------------------------------------------------------------------------- */
    add_listener_tds_supp_supprime() {
        const delete_supp = document.querySelectorAll(`td.delete_supp`);
        for (const td of delete_supp) {
            td.addEventListener('click', e => { 
                let vac = td.dataset.vac;	
                this.delete_tds_supp(vac);
            })
        }
    }

    /*  --------------------------------------------------------------------------------------------- 
            Ajout la gestion des clicks sur la croix pour supprimer un tds suppl   
        --------------------------------------------------------------------------------------------- */
    add_listener_tds_supp_save() {
        const save_supp = document.querySelectorAll(`td.save_supp`);
        for (const td of save_supp) {
            td.addEventListener('click', e => { 	
                let vac = td.dataset.vac;
                this.save_tds_supp(vac, this.data["tds_supp_local"][vac]);
            })
        }
    }

    /*  --------------------------------------------------------------------------------------------- 
            Pop-up Gestion répartition
        --------------------------------------------------------------------------------------------- */

    gestion_repartition(selected_vac_fixe = "J1") {  
        const saison = $('saison').value;
        console.log("SSS: "+saison);
        let vacs = Object.keys(this.tds[saison]);
        const max_pc = 14;
        const jours = ["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];
        console.log("Repartition");
        console.log(this.repartition);

        let modal = `<h1>Gestion des r&eacute;partitions</h1>`;
        modal += `<table class="gestion sortable">`;
        modal += `<caption>Choix de la R&eacute;partition<br>TDS ${saison} - Zone ${this.zone}</caption>`;
        modal += '<thead><tr><th>Vac</th>';
        modal += `<th>R&eacute;partition Actuelle</th>`;
        modal += `<th>R&eacute;partition</th>`;
        modal += '</tr></thead>';
        modal += '<tbody>';
        // true si le nombre de toutes les sous-vacs = 1
        let sousvacs_egales_1 = true;

        vacs.forEach(vac => {
            let nbr_sousvac = Object.keys(this.data[this.type_tds][saison][vac]).length - 2; // on enlève le cds et la clé nb_cds
            modal += `<tr><td>${vac}</td>`;
            if (nbr_sousvac === 1) {
                modal += `<td>-</td>`;
                modal += `<td>1 seule sous-vac</td>`;
                modal += `<td>-</td>`;
            } else {
                sousvacs_egales_1 = false;
                modal += `<td>${this.repartition[saison][vac]["type_repartition"]}</td>`;
                modal += `<td><select data-vac="${vac}" class="type_repartition select">`;
                if (this.repartition[saison][vac]["type_repartition"] === "standard") modal += `<option selected value="standard">standard</option><option value="fixe">fixe</option>`;
                if (this.repartition[saison][vac]["type_repartition"] === "fixe") modal += `<option value="standard">standard</option><option selected value="fixe">fixe</option>`;
                modal += `</select></td>`;
                modal += `<td><button class="repartition_type_save_button" type="button" data-vac="${vac}" data-saison="${saison}">Save</button></td></tr>`;
            }
        });
        modal += '</tbody>';
        modal += '</table>';

        if (sousvacs_egales_1 === false) {
            modal += `<table class="gestion sortable">`;
            modal += `<caption>R&eacute;partition &eacute;quitable (standard)<br>TDS ${saison} - Zone ${this.zone}</caption>`;
            modal += '<thead><tr><th>Vac</th>';
            modal += `<th>2 sousvacs<br>Reste 1</th>`;
            modal += `<th>3 sousvacs<br>Reste 1</th>`;
            modal += `<th>3 sousvacs<br>Reste 2</th>`;
            modal += '</tr></thead>';
            modal += '<tbody>';
            
            vacs.forEach(vac => {
                let nbr_sousvac = Object.keys(this.data[this.type_tds][saison][vac]).length - 2; // on enlève le cds et la clé nb_cds
                if (nbr_sousvac === 1) {
                    modal += `<tr><td>${vac}</td>`;
                    modal += `<td>-</td>`;
                    modal += `<td>-</td>`;
                    modal += `<td>-</td>`;
                    modal += `<td>-</td>`;
                    modal += `</tr>`;
                } else {
                    const s2A = this.repartition[saison][vac]["standard"]["sousvac2"]["reste1"]["A"];
                    const s2B = this.repartition[saison][vac]["standard"]["sousvac2"]["reste1"]["B"];
                    const s3A_1 = this.repartition[saison][vac]["standard"]["sousvac3"]["reste1"]["A"];
                    const s3B_1 = this.repartition[saison][vac]["standard"]["sousvac3"]["reste1"]["B"];
                    const s3C_1 = this.repartition[saison][vac]["standard"]["sousvac3"]["reste1"]["C"];
                    const s3A_2 = this.repartition[saison][vac]["standard"]["sousvac3"]["reste2"]["A"];
                    const s3B_2 = this.repartition[saison][vac]["standard"]["sousvac3"]["reste2"]["B"];
                    const s3C_2 = this.repartition[saison][vac]["standard"]["sousvac3"]["reste2"]["C"];
                
                    let select2A = `
                    <label for="repartition_sousvac2A">A:${s2A}</label>
                    <select data-vac="${vac}" data-nbsv="sousvac2" data-reste="reste1" data-sv="A" class="repartition_std select">
                        <option value="0">0</option>
                        <option value="1">1</option>
                    </select><br>`;
                    let select2B = `
                    <label for="repartition_sousvac2B">B:${s2B}</label>
                    <select data-vac="${vac}" data-nbsv="sousvac2" data-reste="reste1" data-sv="B" class="repartition_std select">
                        <option value="0">0</option>
                        <option value="1">1</option>
                    </select>`;

                    let select3A_1 = `
                    <label for="repartition_sousvac3A_1">A:${s3A_1}</label>
                    <select data-vac="${vac}" data-nbsv="sousvac3" data-reste="reste1" data-sv="A" class="repartition_std select">
                        <option value="0">0</option>
                        <option value="1">1</option>
                    </select><br>`;
                    let select3B_1 = `
                    <label for="repartition_sousvac3B_1">B:${s3B_1}</label>
                    <select data-vac="${vac}" data-nbsv="sousvac3" data-reste="reste1" data-sv="B" class="repartition_std select">
                        <option value="0">0</option>
                        <option value="1">1</option>
                    </select><br>`;
                    let select3C_1 = `
                    <label for="repartition_sousvac3C_1">C:${s3C_1}</label>
                    <select data-vac="${vac}" data-nbsv="sousvac3" data-reste="reste1" data-sv="C" class="repartition_std select">
                        <option value="0">0</option>
                        <option value="1">1</option>
                    </select>`;
                    let select3A_2 = `
                    <label for="repartition_sousvac3A_2">A:${s3A_2}</label>
                    <select data-vac="${vac}" data-nbsv="sousvac3" data-reste="reste2" data-sv="A"class="repartition_std select">
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                    </select><br>`;
                    let select3B_2 = `
                    <label for="repartition_sousvac3B_2">B:${s3B_2}</label>
                    <select data-vac="${vac}" data-nbsv="sousvac3" data-reste="reste2" data-sv="B" class="repartition_std select">
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                    </select><br>`;
                    let select3C_2 = `
                    <label for="repartition_sousvac3C_2">C:${s3C_2}</label>
                    <select data-vac="${vac}" data-nbsv="sousvac3" data-reste="reste2" data-sv="C" class="repartition_std select">
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                    </select>`;

                    modal += `<tr><td>${vac}</td>`;
                    modal += `<td>${select2A}${select2B}</td>`;
                    modal += `<td>${select3A_1}${select3B_1}${select3C_1}</td>`;
                    modal += `<td>${select3A_2}${select3B_2}${select3C_2}</td>`;
                    modal += `<td><button class="repartition_std_save_button" type="button" data-vac="${vac}" data-saison="${saison}">Save</button></td>`;
                    modal += `</tr>`;
                }
            })
            modal += '</tbody>';
            
            modal += '</table>';
        
        // repartition fixe 
        
            modal += '<hr>';
            modal += '<h2>Vacation :';
            modal += '<select id="repartition_fixe_vac" class="select">';
                vacs.forEach(vac => {
                    let nbr_sousvac = Object.keys(this.data[this.type_tds][saison][vac]).length - 2; // on enlève le cds et la clé nb_cds
                    if (nbr_sousvac !== 1) {
                        if (vac === selected_vac_fixe) modal += `<option selected value="${vac}">${vac}</option>`; else modal += `<option value="${vac}">${vac}</option>`;
                    }
                })
            modal += `</select></h2>`;
            modal += `<div class="modif">
                <div class="saison"> 
                    <h2>Dupliquer une journ&eacute;e vers d'autres</h2>
                        <div class="">
                        <label for="cree_tds_supp">Copier </label>
                        <select class="repartition_fixe_duplicate select">`;
                        jours.forEach(jour => {
                            modal += `<option value="${jour}">${jour}</option>`;
                        })
            modal +=   `</select>`;
            modal += `  <span>&nbsp;&nbsp;vers</span>
                        <span class="weekDays-selector">
                            <input type="checkbox" id="weekday-mon" class="weekday" data-journee="lundi" />
                            <label for="weekday-mon">L</label>
                            <input type="checkbox" id="weekday-tue" class="weekday" data-journee="mardi" />
                            <label for="weekday-tue">M</label>
                            <input type="checkbox" id="weekday-wed" class="weekday" data-journee="mercredi" />
                            <label for="weekday-wed">M</label>
                            <input type="checkbox" id="weekday-thu" class="weekday" data-journee="jeudi" />
                            <label for="weekday-thu">J</label>
                            <input type="checkbox" id="weekday-fri" class="weekday" data-journee="vendredi" />
                            <label for="weekday-fri">V</label>
                            <input type="checkbox" id="weekday-sat" class="weekday" data-journee="samedi" />
                            <label for="weekday-sat">S</label>
                            <input type="checkbox" id="weekday-sun" class="weekday" data-journee="dimanche" />
                            <label for="weekday-sun">D</label>
                        </span>
                        </div>
                        <button id="duplicate_day_repartition_button" type="button" class="btn btn-primary" data-saison="${saison}">Dupliquer</button>
                    <div id="modal_text_create_tds_supp" class="modal_text off"></div>
                </div>
            </div>`;
            
            
        }
        modal += '<div id="table_fixe"></div>';
        modal += `<a id='close_modal_repartition' class='close_modal'></a>`;
        const m = $('modal_repartition');
        m.innerHTML = modal;
        
        // Set selected=true sur les valeurs de la bdd
        document.querySelectorAll(`select.repartition_std`).forEach(elem => {
            const vac = elem.dataset.vac;
            const nbsv = elem.dataset.nbsv;
            const reste = elem.dataset.reste;
            const sv = elem.dataset.sv;
            const data = this.repartition[saison][vac]["standard"][nbsv][reste][sv];
            for (var i=0; i<elem.options.length; i++) {
                let option = elem.options[i];
                if (option.value == data) {
                    option.setAttribute('selected', true);
                }
            }
        })
        
        // Vac sélectée
        modal = "";
        if (sousvacs_egales_1 === false) {
            const vac = $('repartition_fixe_vac').value;
            
            if (vac !== '') {
                modal += `<table class="gestion sortable">`;
                modal += `<caption>TDS ${saison} - Zone ${this.zone} - R&eacute;partition fixe - ${vac} <button class="repartition_fixe_save_button" type="button" data-vac="${vac}" data-saison="${saison}">Save</button></caption>`;
                modal += '<thead><tr><th>Jour</th>';
                for(let i=2;i<max_pc;i++) {
                    modal += `<th>${i} pc</th>`;
                }
                modal += '</tr></thead>';
                modal += '<tbody>';
                
                console.log("VAC fixe: "+vac);
                let nbr_sousvac = Object.keys(this.tds[saison][vac]).length - 2; // on enlève le cds et la clé nb_cds
                const temp_sv = Object.keys(this.tds[saison][vac]);
                const sv = temp_sv.filter(sv => (sv !== "cds") && (sv !== "nb_cds")); // enlève les clés cds et nb_cds du tableau
                
                jours.forEach(jour => { 
                    modal += `<tr><td>${jour}</td>`;
                    for(let i=2;i<max_pc;i++) {
                        modal += '<td class="fixe">';
                        for(let j=0;j<nbr_sousvac;j++) { 
                            const cle_pc = "pc"+i;
                            //const sv = String.fromCharCode('A'.charCodeAt(0) + j);
                            const svcle = "sousvac"+nbr_sousvac;
                            const val = this.repartition[saison][vac]["fixe"][svcle][jour][cle_pc][sv[j]];
                            modal += `${sv[j]}:&nbsp;<input type="number" class="repartition_fixe form-control" data-saison="${saison}" data-vac="${vac}" data-sousvac="${sv[j]}" data-svcle="${svcle}" data-jour="${jour}" data-clepc="${cle_pc}" value="${val}" placeholder="Nbr" min="0" max="${i}" size="5" /><br>`; 
                        }
                        modal += '</td>';
                    }
                    modal += '</tr>';
                })
                
                modal += '</tbody>';
                modal += '<table>';
            }
        }
        
        const m2 = $('table_fixe');
        m2.innerHTML = modal;
        
        $('close_modal_repartition').addEventListener('click', (e) => {
            $('button_gestion_repartition').setAttribute('data-open', "no");
            $('modal_repartition').classList.toggle('off');
        })
        
        if ($('repartition_fixe_vac') !== null) {
            $('repartition_fixe_vac').addEventListener('change', (e) => {
                const selected_vac = e.target.value;
                this.gestion_repartition(selected_vac);
            })
        }

        document.querySelectorAll(`select.repartition_std`).forEach(elem => {
            const vac = elem.dataset.vac;
            const nbsv = elem.dataset.nbsv;
            const reste = elem.dataset.reste;
            const sv = elem.dataset.sv;
            elem.addEventListener('change', (e) => {
                this.repartition[saison][vac]["standard"][nbsv][reste][sv] = parseInt(e.target.value);
            })
        })
        
        document.querySelectorAll(`button.repartition_std_save_button`).forEach(elem => {
            const vac = elem.dataset.vac;
            const saison = elem.dataset.saison;
            elem.addEventListener('click', async (e) => {
                const a2 = parseInt(document.querySelector(`select[data-vac=${vac}][data-nbsv="sousvac2"][data-sv="A"]`).value);
                const b2 = parseInt(document.querySelector(`select[data-vac=${vac}][data-nbsv="sousvac2"][data-sv="B"]`).value);
                const total2 = a2+b2;
                if (total2 !== 1) {
                    show_popup('Sauvegarde impossible', 'Avec 2 sous-vacs et 1 reste,<br>le total des restes doit &ecirc;tre = 1');
                    return;
                }
                const a31 = parseInt(document.querySelector(`select[data-vac=${vac}][data-nbsv="sousvac3"][data-reste="reste1"][data-sv="A"]`).value);
                const b31 = parseInt(document.querySelector(`select[data-vac=${vac}][data-nbsv="sousvac3"][data-reste="reste1"][data-sv="B"]`).value);
                const c31 = parseInt(document.querySelector(`select[data-vac=${vac}][data-nbsv="sousvac3"][data-reste="reste1"][data-sv="C"]`).value);
                const total31 = a31+b31+c31;
                if (total31 !== 1) {
                    show_popup('Sauvegarde impossible', 'Avec 3 sous-vacs et 1 reste,<br>le total des restes doit &ecirc;tre = 1');
                    return;
                }
                const a32 = parseInt(document.querySelector(`select[data-vac=${vac}][data-nbsv="sousvac3"][data-reste="reste2"][data-sv="A"]`).value);
                const b32 = parseInt(document.querySelector(`select[data-vac=${vac}][data-nbsv="sousvac3"][data-reste="reste2"][data-sv="B"]`).value);
                const c32 = parseInt(document.querySelector(`select[data-vac=${vac}][data-nbsv="sousvac3"][data-reste="reste2"][data-sv="C"]`).value);
                const total32 = a32+b32+c32;
                if (total32 !== 2) {
                    show_popup('Sauvegarde impossible', 'Avec 3 sous-vacs et 2 restes,<br>le total des restes doit &ecirc;tre = 2');
                    return;
                }
                await this.set_repartition(saison, vac, this.repartition[saison][vac]);
            })
        })

        // Change le type de répartition
        document.querySelectorAll(`button.repartition_type_save_button`).forEach(elem => {
            elem.addEventListener('click', async (e) => {
                const saison = elem.dataset.saison;
                const vac = elem.dataset.vac;
                const value = document.querySelector(`select.type_repartition[data-vac="${vac}"]`).value;
                this.repartition[saison][vac]["type_repartition"] = value;
                await this.change_type_repartition(saison, vac, value);
            })
        })

        document.querySelectorAll(`.repartition_fixe`).forEach(elem => {
            elem.addEventListener('change', (e) => {
                const saison = elem.dataset.saison;
                const vac = elem.dataset.vac;
                const jour = elem.dataset.jour; // lundi, ...
                const clepc = elem.dataset.clepc; // "pc2" ou "pc3" ....
                const svcle = elem.dataset.svcle; // sousvac2 ou sousvac3 ...
                const sousvac = elem.dataset.sousvac; // A ou B ou C ...
                this.repartition[saison][vac]["fixe"][svcle][jour][clepc][sousvac] = parseInt(e.target.value);
            })
        })

        // Si au moins une vac a un nbr de sous-vac > 1
        if (sousvacs_egales_1 === false) {
            document.querySelector(`button.repartition_fixe_save_button`).addEventListener('click', async (e) => {
                const vac = e.target.dataset.vac;
                const saison = e.target.dataset.saison;
                await this.set_repartition(saison, vac, this.repartition[saison][vac]);
            })
        }
        
        if (document.getElementById(`duplicate_day_repartition_button`) !== null) {
            document.getElementById(`duplicate_day_repartition_button`).addEventListener('click', async (e) => {
                if ($('repartition_fixe_vac') !== null) {
                    const vac = $('repartition_fixe_vac').value;
                    const saison = e.target.dataset.saison;
                    const jour_ini = document.querySelector('select.repartition_fixe_duplicate').value;
                    const nbr_sv_ini = Object.keys(this.tds[saison][vac]).length - 2;
                    const svcle = "sousvac"+nbr_sv_ini;
                    let jours = [];
                    document.querySelectorAll('input.weekday').forEach(elem => {
                        if(elem.checked === true) jours.push(elem.dataset.journee);
                    })
                    jours = jours.filter(jour => jour !== jour_ini); // ne garde que les jours différent de celui à copier
                    jours.forEach(jour => {
                        this.repartition[saison][vac]["fixe"][svcle][jour] = this.repartition[saison][vac]["fixe"][svcle][jour_ini];
                    })
                    await this.set_repartition(saison, vac, this.repartition[saison][vac]);
                }
            })
        }
    }

    /*  -------------------------------------------------
            Appel vers MariaDb
        ------------------------------------------------- */
    async add_tds(nom_saison) {
        
        const tour = { "zone": this.zone, "saison": nom_saison, "greve": this.greve, "fonction": "add_tds"}
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tour)
        };
        await fetch("tds_sql.php", data);
        show_popup(`Cr&eacute;ation du TDS: ${nom_saison}`, "La cr&eacute;ation est effectu&eacute;e");
        
        await this.init(this.zone, nom_saison);
        this.gestion_tds();

    }
    
    async delete_tds(nom_saison) {

        const tour = { "zone": this.zone, "saison": nom_saison, "greve": this.greve, "fonction": "delete_tds"}
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tour)
        };
        await fetch("tds_sql.php", data);
        show_popup(`Suppression du TDS: ${nom_saison}`, "La suppression est effectu&eacute;e");
        await this.init(this.zone);
        this.gestion_tds();

    }

    async duplicate_tds(tds_to_copy, new_tds_name) {

        const tour = { "zone": this.zone, "tds_to_copy": tds_to_copy, "new_tds_name": new_tds_name, "greve": this.greve, "fonction": "duplicate_tds"}
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tour)
        };
        await fetch("tds_sql.php", data);
        show_popup(`Copie du TDS: ${tds_to_copy}`, `La copie ${new_tds_name} est effectu&eacute;e`);
        await this.init(this.zone, new_tds_name);
        this.gestion_tds();

    }

    async add_tds_supp(nom_tds, tds_associe) {
        const tour = { "zone": this.zone, "nom_tds": nom_tds, "tds_associe": tds_associe, "fonction": "add_tds_supp"}
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tour)
        };
        await fetch("tds_sql.php", data);
        show_popup(`Cr&eacute;ation du TDS: ${nom_tds}`, "La cr&eacute;ation est effectu&eacute;e");
        await this.init();
        this.gestion_tds_supp();
    }

    async delete_tds_supp(nom_tds) {
        const tour = { "zone": this.zone, "nom_tds": nom_tds, "fonction": "delete_tds_supp"}
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tour)
        };
        await fetch("tds_sql.php", data);
        show_popup(`Suppression du TDS: ${nom_tds}`, "La suppression est effectu&eacute;e");
        await this.init(this.zone);
        this.gestion_tds_supp();
    }

    async save_tds_supp(nom_tds, arr_json) {
        const tour = { "zone": this.zone, "nom_tds": nom_tds, "arr_json": JSON.stringify(arr_json), "fonction": "save_tds_supp"}
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tour)
        };
        await fetch("tds_sql.php", data);
        show_popup(`Sauvegarde du TDS: ${nom_tds}`, "La sauvegarde est effectu&eacute;e");
        await this.init(this.zone);
        this.gestion_tds_supp();
    }

    async change_type_repartition(nom_tds, vac, value) {
        const json = { "zone": this.zone, "nom_tds": nom_tds, "vac": vac, "greve": this.greve, "type": value, "fonction": "change_type_repartition"}
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(json)
        };
        await fetch("tds_sql.php", data);
        show_popup(`TDS: ${nom_tds}<br>Zone ${this.zone} `, `La Vac ${vac} vaut ${value}`);
        await this.init(this.zone, nom_tds);
        this.gestion_repartition();
    }

    async set_repartition(nom_tds, vac, json) {
        const tour = { "zone": this.zone, "nom_tds": nom_tds, "vac": vac, "greve": this.greve, "json": JSON.stringify(json), "fonction": "set_repartition"}
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tour)
        };
        await fetch("tds_sql.php", data);
        show_popup(`TDS: ${nom_tds}<br>Zone ${this.zone} `, `Sauvegarde r&eacute;partition ${vac} effectu&eacute;e`);
        await this.init(this.zone, nom_tds);
        this.gestion_repartition(vac);
    }

}

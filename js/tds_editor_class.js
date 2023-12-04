class tds_editor {

    constructor(containerId) {
        this.containerId = containerId;
        this.init();
    }

    async init(saison, open = "no") {
        this.tour_vierge = new Array(96);
        this.tour_vierge.fill(0);
        this.zone = (document.getElementById('zone') != null) ? document.getElementById('zone').value : "est";
        const d = await fetch(`../php/editor-API.php?zone=${this.zone}`);
        this.data = await d.json();
        this.insert_header(saison, open);
        this.edit_tds(saison);
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

    insert_header(saison = this.data.current_tds, open) { 
   
        let saisons = Object.keys(this.data.tds_local).sort(this.compare_tds_name);
        let html = `
        <header>TDS Editor</header>
        <div id="tds_glob">
        <ul class="menu_tds_editor">
            <li>
                <select id="saison" class="select">`;
                    saisons.forEach(s => {
                        if (s === saison) html += `<option selected value="${s}">${s}</option>`; else html += `<option value="${s}">${s}</option>`;
                    })
                html += `
                </select>
                <select id="zone" class="select">
                <option selected value="est">Zone EST</option>
                <option value="ouest">Zone WEST</option>
                </select>
                <button id="button_show" type="button" class="button_tour">Show TDS</button>
            </li>
            
        </ul>
        <ul class="menu_tds_editor">
        <li>
            <button id="button_gestion_tds" type="button" class="button_tour">Gestion des TDS</button>
            <button id="button_gestion_tds_supp" type="button" class="button_tour">Gestion des TDS suppl</button>
            <button id="button_gestion_repartition" type="button" data-open=${open} class="button_tour">Gestion des r&eacute;partitions</button>
        </li>
        </ul>
        <ul class="menu_tds_editor">
            <li class="feuille"><span><a href="./">back to TDS</a></span></li>
        </ul>
        </div>
        <div id="plage" class=""></div>
        <div id="result" class=""></div>
        <div id="result_supp" class=""></div>`;

        $(this.containerId).innerHTML = html;

        $('button_show').addEventListener('click', e => {
            const open = $('button_gestion_repartition').getAttribute('data-open');
            if (open === "yes") {
                $('close_modal_repartition').click();
                $('button_gestion_repartition').click();
            }
            this.init($('saison').value, open);
        })

        $('button_gestion_tds').addEventListener('click', e => {
            $('modal_tds').classList.toggle('off');
            this.gestion_tds();
        })
        $('button_gestion_tds_supp').addEventListener('click', e => {
            $('modal_tds_supp').classList.toggle('off');
            this.gestion_tds_supp();
        })
        $('button_gestion_repartition').addEventListener('click', e => {
            $('button_gestion_repartition').setAttribute('data-open', "yes");
            $('modal_repartition').classList.toggle('off');
            this.gestion_repartition();
        })
    }

/*  --------------------------------------------------------------------------------------------- 
    Affiche la table du tds :
        
        @param {string} containerId - Id du conteneur affichant la table
        @param {string} zone        - "est" ou "ouest"
        @param {string} saison      - "hiver-2024" ...
    --------------------------------------------------------------------------------------------- */

    async edit_tds(saison_select = this.data.current_tds) {
            
        this.affiche_saisons("plage");
        this.add_listener_plage();
        
        let saison = saison_select ?? $('saison').value;
        this.affiche_tds("result", saison);
        this.add_listener_tds_supprime();
        
    }	

    gestion_tds() {
        let saisons = Object.keys(this.data.tds_local);
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
        <h1>Gestion des TDS des saisons</h1>
        <table class="plage sortable">`;
        modal += `<caption>Saisons - Zone ${this.zone}</caption>`;
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
                    <input type="text" id="cree_saison" name="cree_saison" required minlength="2" maxlength="10" size="10" placeholder="nom du tds"/>
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
                    <label for="cree_saison">Saison: </label>
                    <select id="delete_TDS" class="select">`;
                    saisons.forEach(s => {
                        modal += `<option value="${s}">${s}</option>`;
                    })
                    modal += `
                    </select>
                    </div>
                    <p>Attention, cela va supprimer les plages associ&eacute;es</p>
                    <button id="delete_TDS_button" type="button" class="btn btn-primary">Supprimer TDS</button>
                </form>
                <div id="modal_text_delete" class="modal_text off"></div>
            </div>
            <div class="saison"> 
                <h2>Dupliquer un TDS</h2>
                <form>
                    <div class="form-group">
                        <label for="cree_saison">Saison: </label>
                        <select id="duplicate_old_TDS" class="select">`;
                        saisons.forEach(s => {
                            modal += `<option value="${s}">${s}</option>`;
                        })
                        modal += `
                        </select>
                        <label for="duplicate_saison">TDS: </label>
                        <input type="text" id="duplicate_new_TDS" name="duplicate_saison" required minlength="2" maxlength="10" size="10" placeholder="nouveau nom"/>
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
            this.add_tds(nom_saison);
        })
        $('delete_TDS_button').addEventListener('click', (e) => {
            const nom_saison = $('delete_TDS').value;
            this.delete_tds(nom_saison);
        })
        $('duplicate_TDS_button').addEventListener('click', (e) => {
            const tds_to_copy = $('duplicate_old_TDS').value;
            const new_tds_name = $('duplicate_new_TDS').value;
            this.duplicate_tds(tds_to_copy, new_tds_name);
        })
    }

    gestion_tds_supp() {         
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
                <h2>Cr&eacute;ation d'un TDS suppl&eacute;mentaire</h2>
                <form>
                    <div class="form-group">
                    <label for="cree_tds_supp">TDS: </label>
                    <input type="text" id="cree_tds_supp" name="cree_tds_supp" required minlength="6" maxlength="18" size="18" placeholder="nom du tds"/>
                    </div>
                    <p>Le nom du TDS doit se terminer par une ann&eacute;e à 4 chiffres</p>
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
            this.add_tds_supp(nom_tds_supp);
        })
    }

    gestion_repartition() {  
        const saison = $('saison').value;
        let vacs = Object.keys(this.data.tds_local[saison]);
        console.log(this.data.repartition);

        let modal = `<h1>Gestion des r&eacute;partitions</h1>`;
        modal += `<table class="plage sortable">`;
        modal += `<caption>TDS ${saison} - Zone ${this.zone} - Choix de la R&eacute;partition</caption>`;
        modal += '<thead><tr><th>Vac</th>';
        modal += `<th>R&eacute;partition Actuelle</th>`;
        modal += `<th>R&eacute;partition</th>`;
        modal += '</tr></thead>';
        modal += '<tbody>';
        vacs.forEach(vac => {
            modal += `<tr><td>${vac}</td>`;
            modal += `<td>${this.data.repartition[saison][vac]["type_repartition"]}</td>`;
            modal += `<td><select data-vac="${vac}" class="type_repartition select">`;
            if (this.data.repartition[saison][vac]["type_repartition"] === "standard") modal += `<option selected value="standard">standard</option><option value="fixe">fixe</option>`;
            if (this.data.repartition[saison][vac]["type_repartition"] === "fixe") modal += `<option value="standard">standard</option><option selected value="fixe">fixe</option>`;
            modal += `</select></td>`;
            modal += `<td><button class="repartition_save_button" type="button" data-vac="${vac}" data-saison="${saison}">Save</button></td>`;
        });
        modal += '</tbody>';
        modal += '<table>';

        modal += `<table class="plage sortable">`;
        modal += `<caption>TDS ${saison} - Zone ${this.zone} - R&eacute;partition &eacute;quitable (standard)</caption>`;
        modal += '<thead><tr><th>Vac</th>';
        modal += `<th>2 sousvacs<br>Reste 1</th>`;
        modal += `<th>3 sousvacs<br>Reste 1</th>`;
        modal += `<th>3 sousvacs<br>Reste 2</th>`;
        modal += '</tr></thead>';
        modal += '<tbody>';
        vacs.forEach(vac => {
            modal += `<tr><td>${vac}</td>`;
            const s2A = this.data.repartition[saison][vac]["standard"]["sousvac2"]["reste1"]["A"];
            const s2B = this.data.repartition[saison][vac]["standard"]["sousvac2"]["reste1"]["B"];
            let select2A = `
            <label for="repartition_sousvac2A">A:${s2A}</label>
            <select data-vac="${vac}" data-nbsv="sousvac2" data-reste="reste1" data-sv="A" class="repartition select">`;
            if (parseInt(s2A) === 0) select2A += `<option selected value="0">0</option><option value="1">1</option>`;
            if (parseInt(s2A) === 1) select2A += `<option value="0">0</option><option selected value="1">1</option>`;
            select2A += `</select><br>`;
            let select2B = `
            <label for="repartition_sousvac2B">B:${s2B}</label>
            <select data-vac="${vac}" data-nbsv="sousvac2" data-reste="reste1" data-sv="B" class="repartition select">`;
            if (parseInt(s2B) === 0) select2B += `<option selected value="0">0</option><option value="1">1</option>`;
            if (parseInt(s2B) === 1) select2B += `<option value="0">0</option><option selected value="1">1</option>`;
            select2B += `</select>`;
            modal += `<td>${select2A}${select2B}</td>`;
            const s3A_1 = this.data.repartition[saison][vac]["standard"]["sousvac3"]["reste1"]["A"];
            const s3B_1 = this.data.repartition[saison][vac]["standard"]["sousvac3"]["reste1"]["B"];
            const s3C_1 = this.data.repartition[saison][vac]["standard"]["sousvac3"]["reste1"]["C"];
            let select3A_1 = `
            <label for="repartition_sousvac3A_1">A:${s3A_1}</label>
            <select data-vac="${vac}" data-nbsv="sousvac3" data-reste="reste1" data-sv="A" class="repartition select">`;
            if (parseInt(s3A_1) === 0) select3A_1 += `<option selected value="0">0</option><option value="1">1</option>`;
            if (parseInt(s3A_1) === 1) select3A_1 += `<option value="0">0</option><option selected value="1">1</option>`;
            select3A_1 += `</select><br>`;
            let select3B_1 = `
            <label for="repartition_sousvac3B_1">B:${s3B_1}</label>
            <select data-vac="${vac}" data-nbsv="sousvac3" data-reste="reste1" data-sv="B" class="repartition select">`;
            if (parseInt(s3B_1) === 0) select3B_1 += `<option selected value="0">0</option><option value="1">1</option>`;
            if (parseInt(s3B_1) === 1) select3B_1 += `<option value="0">0</option><option selected value="1">1</option>`;
            select3B_1 += `</select><br>`;
            let select3C_1 = `
            <label for="repartition_sousvac3C_1">C:${s3C_1}</label>
            <select data-vac="${vac}" data-nbsv="sousvac3" data-reste="reste1" data-sv="C" class="repartition select">`;
            if (parseInt(s3C_1) === 0) select3C_1 += `<option selected value="0">0</option><option value="1">1</option>`;
            if (parseInt(s3C_1) === 1) select3C_1 += `<option value="0">0</option><option selected value="1">1</option>`;
            select3C_1 += `</select>`;
            const s3A_2 = this.data.repartition[saison][vac]["standard"]["sousvac3"]["reste2"]["A"];
            const s3B_2 = this.data.repartition[saison][vac]["standard"]["sousvac3"]["reste2"]["B"];
            const s3C_2 = this.data.repartition[saison][vac]["standard"]["sousvac3"]["reste2"]["C"];
            let select3A_2 = `
            <label for="repartition_sousvac3A_2">A:${s3A_2}</label>
            <select data-vac="${vac}" data-nbsv="sousvac3" data-reste="reste2" data-sv="A"class="repartition select">`;
            if (parseInt(s3A_2) === 0) select3A_2 += `<option selected value="0">0</option><option value="1">1</option><option value="2">2</option>`;
            if (parseInt(s3A_2) === 1) select3A_2 += `<option value="0">0</option><option selected value="1">1</option><option value="2">2</option>`;
            if (parseInt(s3A_2) === 2) select3A_2 += `<option value="0">0</option><option value="1">1</option><option selected value="2">2</option>`;
            select3A_2 += `</select><br>`;
            let select3B_2 = `
            <label for="repartition_sousvac3B_2">B:${s3B_2}</label>
            <select data-vac="${vac}" data-nbsv="sousvac3" data-reste="reste2" data-sv="B" class="repartition select">`;
            if (parseInt(s3B_2) === 0) select3B_2 += `<option selected value="0">0</option><option value="1">1</option><option value="2">2</option>`;
            if (parseInt(s3B_2) === 1) select3B_2 += `<option value="0">0</option><option selected value="1">1</option><option value="2">2</option>`;
            if (parseInt(s3B_2) === 2) select3B_2 += `<option value="0">0</option><option value="1">1</option><option selected value="2">2</option>`;
            select3B_2 += `</select><br>`;
            let select3C_2 = `
            <label for="repartition_sousvac3C_2">C:${s3C_2}</label>
            <select data-vac="${vac}" data-nbsv="sousvac3" data-reste="reste2" data-sv="C" class="repartition select">`;
            if (parseInt(s3C_2) === 0) select3C_2 += `<option selected value="0">0</option><option value="1">1</option><option value="2">2</option>`;
            if (parseInt(s3C_2) === 1) select3C_2 += `<option value="0">0</option><option selected value="1">1</option><option value="2">2</option>`;
            if (parseInt(s3C_2) === 2) select3C_2 += `<option value="0">0</option><option value="1">1</option><option selected value="2">2</option>`;
            select3C_2 += `</select>`;
            modal += `<td>${select3A_1}${select3B_1}${select3C_1}</td>`;
            modal += `<td>${select3A_2}${select3B_2}${select3C_2}</td>`;
            modal += `<td><button class="repartition_save_button" type="button" data-vac="${vac}" data-saison="${saison}">Save</button></td>`;
            modal += `</tr>`;
        })
        modal += '</tbody>';
        modal += '<table>';
       /*
        modal += `
        <div class="modif">
            <div class="saison"> 
                <h2>Cr&eacute;ation d'un TDS</h2>
                <form>
                    <div class="form-group">
                    <label for="cree_saison">Saison: </label>
                    <input type="text" id="cree_saison" name="cree_saison" required minlength="2" maxlength="10" size="10" placeholder="nom du tds"/>
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
                    <label for="cree_saison">Saison: </label>
                    <select id="delete_TDS" class="select">`;
                    saisons.forEach(s => {
                        modal += `<option value="${s}">${s}</option>`;
                    })
                    modal += `
                    </select>
                    </div>
                    <p>Attention, cela va supprimer les plages associ&eacute;es</p>
                    <button id="delete_TDS_button" type="button" class="btn btn-primary">Supprimer TDS</button>
                </form>
                <div id="modal_text_delete" class="modal_text off"></div>
            </div>
            <div class="saison"> 
                <h2>Dupliquer un TDS</h2>
                <form>
                    <div class="form-group">
                        <label for="cree_saison">Saison: </label>
                        <select id="duplicate_old_TDS" class="select">`;
                        saisons.forEach(s => {
                            modal += `<option value="${s}">${s}</option>`;
                        })
                        modal += `
                        </select>
                        <label for="duplicate_saison">TDS: </label>
                        <input type="text" id="duplicate_new_TDS" name="duplicate_saison" required minlength="2" maxlength="10" size="10" placeholder="nouveau nom"/>
                    </div>
                    <p>&nbsp;</p>
                    <button id="duplicate_TDS_button" type="button" class="btn btn-primary">Dupliquer TDS</button>
                </form>
                <div id="modal_text_duplicate" class="modal_text off"></div>
            </div>
        </div>`;
        */
        modal += `<a id='close_modal_repartition' class='close_modal'></a>`;
       
        const m = $('modal_repartition');
        m.innerHTML = modal;
        
        $('close_modal_repartition').addEventListener('click', (e) => {
            $('button_gestion_repartition').setAttribute('data-open', "no");
            $('modal_repartition').classList.toggle('off');
        })
        
        document.querySelectorAll(`select.repartition`).forEach(elem => {
            const vac = elem.dataset.vac;
            const nbsv = elem.dataset.nbsv;
            const reste = elem.dataset.reste;
            const sv = elem.dataset.sv;
            elem.addEventListener('change', (e) => {
                this.data.repartition[saison][vac]["standard"][nbsv][reste][sv] = e.target.value;
            })
        })
        
        document.querySelectorAll(`button.repartition_save_button`).forEach(elem => {
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
                await this.set_repartition(saison, vac, this.data.repartition[saison][vac]);
            })
        })

        /*
        $('add_TDS_button').addEventListener('click', (e) => {
            const nom_saison = $('cree_saison').value;
            this.add_tds(nom_saison);
        })
        $('delete_TDS_button').addEventListener('click', (e) => {
            const nom_saison = $('delete_TDS').value;
            this.delete_tds(nom_saison);
        })
        $('duplicate_TDS_button').addEventListener('click', (e) => {
            const tds_to_copy = $('duplicate_old_TDS').value;
            const new_tds_name = $('duplicate_new_TDS').value;
            this.duplicate_tds(tds_to_copy, new_tds_name);
        })
        */
    }

    affiche_saisons(containerId) {
        const dates_saisons = this.data["beyond_saisons"];
        let arr_saisons = Object.keys(this.data.tds_local).sort(this.compare_tds_name);
        console.log("Saisons::");
        console.log(arr_saisons);
        let res = '<table class="plage sortable">';
        res += `<caption>Plages temporelles des saisons - Zone ${this.zone}  <button id='button_add_plage' type="button" class="button_tour">Add</button></caption>`;
        res += '<thead><tr><th>D&eacute;but</th><th class="fin">Fin</th><th>Saison</th><th class="px80">Save&nbsp;</th><th class="px80">Delete</th></tr></thead>';
        res += '<tbody>';
        for (const [id, value] of Object.entries(dates_saisons)) {
            res += `<tr>
                    <td class="pl" data-zone="${this.zone}">
                        <input type="date" value="${value.debut}" data-col="debut" data-id='${value.id}'/>
                    </td>
                    <td class="pl" data-zone="${this.zone}">
                        <input type="date" value="${value.fin}" data-col="fin" data-id='${value.id}'/>
                    </td>
                    <td class="pl" data-zone="${this.zone}">
                        <select id="${saison}" data-id='${value.id}' data-col="nom_tds" class="select">`;
                        arr_saisons.forEach(s => {
                            if (s === value.nom_tds) res += `<option selected value="${s}">${s}</option>`; else res += `<option value="${s}">${s}</option>`;
                        });
                res += `</select>
                    </td>
                    <td class='plage_validate px80' data-saison='${saison}' data-zone="${this.zone}" data-id=${value.id}>&check;</td>
                    <td class='plage_supprime px80' data-saison='${saison}' data-zone="${this.zone}" data-id=${value.id}>x</td>
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
                this.init();
            });
        }
        $('button_add_plage').addEventListener('click', (e) => {
            const dates_saisons = this.data["all_saisons"];    
            let arr_saisons = Object.keys(this.data.tds_local).sort(this.compare_tds_name);
            let ih = ` 
            <div id="modif">
                <form><div class="form-group" style="text-align: left">
                    <label for="add_plage_debut" >D&eacute;but: </label>
                    <input style="display: block" type="date" id="add_plage_debut" data-col="debut" required />
                    <label for="add_plage_fin">Fin: </label>
                    <input style="display: block" type="date" id="add_plage_fin" data-col="fin" required />
                    <br>
                    <label for="add_plage_tds">Choix du TDS: </label>
                    <select id="add_plage_tds" data-col="nom_tds" class="select" style="margin-left: 0">`;
                        arr_saisons.forEach(s => {
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
                Object.values(dates_saisons).forEach(obj => {
                    if ((debut> obj.debut && debut<obj.fin) || (fin> obj.debut && fin<obj.fin)) {
                        show_popup(`Problème`, "Il y a un chevauchement de date");
                        return;
                    }
                });
                let tds = document.getElementById('add_plage_tds').value;
                const plage = { "zone": this.zone, "debut": debut, "fin": fin, "tds": tds, "fonction": "add_plage"}
                const data = {
                    method: "post",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(plage)
                };
                const result = await fetch("tds_sql.php", data);
                show_popup(`Plage horaire ${debut} / ${fin}<br>${tds}`, "Cr&eacute;ation effectu&eacute;e");
                this.init();
            })
        })
        
    }

    affiche_tds(containerId, saison) {
        let res = "";
        res += `<table class="ouverture">
        <caption>TDS ${saison} - ${capitalizeFirstLetter(this.zone)}  <button id='button_tds_${saison}' type="button" class="button_tour">Save</button></caption>
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

    add_create_sousvac_listener() {
        const elems = document.querySelectorAll(`td.add_sousvac`);
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
                                <label for="sousvacInputName">Cr&eacute;ation Sous-vac</label>
                                <input type="text" class="form-control" id="sousvacInputName" placeholder="Nom de la sous-vac">
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
                    const save_sousvac = { "zone": this.zone, "saison": saison, "vac": vac, "sousvac": sousvac, "fonction": "add_sousvac"}
                    const data = {
                        method: "post",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(save_sousvac)
                    };
                    await fetch("tds_sql.php", data);
                    //show_popup(`Cr&eacute;tion sous-vac: ${sousvac}`, "Op&eacute;ration effectu&eacute;e");
                    $('modal_text_sousvac').innerHTML = `Sous-vac: ${sousvac} cr&eacute;&eacute;e`;
                    $('modal_text_sousvac').classList.toggle("off");
                    this.init(saison);
                })

                $('change_CDS_button').addEventListener('click', async (e) => {
                    const nbcds = $('cdsInputNumber').value;
                    const save_cds = { "zone": this.zone, "saison": saison, "vac": vac, "nbcds": nbcds, "fonction": "change_cds"}
                    const data = {
                        method: "post",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(save_cds)
                    };
                    
                    await fetch("tds_sql.php", data);
                    //show_popup(`Changement CDS, vac: ${vac}`, "Op&eacute;ration effectu&eacute;e");
                    $('modal_text_cds').innerHTML = `Vac: ${vac}<br>Changement CDS effectu&eacute;`;
                    $('modal_text_cds').classList.toggle("off");
                    td.nextElementSibling.innerHTML = `cds: ${nbcds}`;
                })
            });
        }
    }

    // Met en place les listeners des boutons save des différents tds
    add_save_listener(saison) {
        const tour = { "zone": this.zone, "saison": saison, "tds": this.data["tds_local"][saison], "fonction": "save_tds"}
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

    async add_tds(nom_saison) {
        //const tour_vierge = new Array(96);
        //tour_vierge.fill(0);
        const tour = { "zone": this.zone, "saison": nom_saison, "fonction": "add_tds"}
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tour)
        };
        await fetch("tds_sql.php", data);
        show_popup(`Cr&eacute;ation du TDS: ${nom_saison}`, "La cr&eacute;ation est effectu&eacute;e");
        await this.init(nom_saison);
        this.gestion_tds();
        
    }
    
    async delete_tds(nom_saison) {
        //const tour_vierge = new Array(96);
        //tour_vierge.fill(0);
        const tour = { "zone": this.zone, "saison": nom_saison, "fonction": "delete_tds"}
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tour)
        };
        await fetch("tds_sql.php", data);
        show_popup(`Suppression du TDS: ${nom_saison}`, "La suppression est effectu&eacute;e");
        await this.init();
        this.gestion_tds();
    }

    async duplicate_tds(tds_to_copy, new_tds_name) {
        const tour = { "zone": this.zone, "tds_to_copy": tds_to_copy, "new_tds_name": new_tds_name, "fonction": "duplicate_tds"}
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tour)
        };
        await fetch("tds_sql.php", data);
        show_popup(`Copie du TDS: ${tds_to_copy}`, `La copie ${new_tds_name} est effectu&eacute;e`);
        await this.init(new_tds_name);
        this.gestion_tds();
    }

    async add_tds_supp(nom_tds) {
        const tour = { "zone": this.zone, "nom_tds": nom_tds, "fonction": "add_tds_supp"}
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
        await this.init();
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
        await this.init();
        this.gestion_tds_supp();
    }

    async set_repartition(nom_tds, vac, json) {
        const tour = { "zone": this.zone, "nom_tds": nom_tds, "vac": vac, "json": JSON.stringify(json), "fonction": "set_repartition"}
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tour)
        };
        await fetch("tds_sql.php", data);
        show_popup(`Sauvegarde r&eacute;partition ${vac} TDS: ${nom_tds}`, "La sauvegarde est effectu&eacute;e");
        await this.init(nom_tds);
        this.gestion_repartition();
    }

/*  ------------------------------------------------------------------------------------------
    Fabrique la ligne du tour de service avec les entêtes 
        @param {string} vac         - "J1" "J3" "N" (nuit soirée) "N1" (nuit du matin) etc...
        @param {string} saison      - "hiver" "ete" "mi-saison-basse" "mi-saison-haute"
        @param {string} zone        - "est" ou "ouest"
    ------------------------------------------------------------------------------------------ */
    affiche_vac(vac, saison) {
        const nb_cds = this.data["tds_local"][saison][vac]["nb_cds"];
		let res = "";
        let ligne = 1;
        let nbr_sousvac = Object.keys(this.data["tds_local"][saison][vac]).length - 1;
        
        for (const [sousvac, tds] of Object.entries(this.data["tds_local"][saison][vac])) {
            
            res += '<tr>';
            if (sousvac !== "nb_cds") { // && sousvac !== "cds"
                let cla = "left_2px right_1px";
                let cla2 = "right_1px";
                if (ligne > nbr_sousvac) { cla += " bottom_2px"; cla2 += " bottom_2px";}
                if (sousvac !== "cds") {
                    res += `<td class='${cla}'></td><td class='${cla2}'>${sousvac}</td>`;
                } else {
                    res += `<td class='${cla} add_sousvac' data-saison='${saison}' data-vac='${vac}' data-nbcds='${nb_cds}'>${vac}</td><td class='pc ${cla2}' data-saison='${saison}' data-nbcds='${nb_cds}' data-vac='${vac}'>cds: ${nb_cds}</td>`;
                }
                for(let index=0;index<96;index++) {
                    let case_tds = tds[index];
                    let cl = "case";
                    if (case_tds != 0) cl = "case bg";
                    if (index === 95) { cl += " right_2px";}
                    if (index%4 === 0) { cl += " left_2px";}
                    if (ligne > nbr_sousvac) { cl += " bottom_2px";}
                    res += `<td class='${cl} standard' data-vac='${vac}' data-sousvac='${sousvac}' data-col='${index}' data-saison='${saison}'>${case_tds || ''}</td>`;
                }
                let cl = "right_2px";
                if (ligne > nbr_sousvac) { cl += " bottom_2px";}
                if (sousvac !== "cds") { 
                    cl += " vac_tds_delete"
                    res += `<td class='${cl}' data-zone='${this.zone}' data-saison='${saison}' data-vac='${vac}' data-sousvac='${sousvac}'>x</td>`;
                } else {
                    res += `<td class='${cl}'></td>`;
                }
            }
            res += '</tr>'
            ligne++;
        }
        return res;
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
        Ajout la gestion des clicks sur les cases du tds    
            @param {string} saison      - "hiver-2024" ...
        --------------------------------------------------------------------------------------------- */

    add_listener(saison) {
        const cases = document.querySelectorAll(`td.standard[data-saison=${saison}]`);
        for (const td of cases) {
            td.addEventListener('click', (event) => {
                let sousvac = td.dataset.sousvac;
                let col = td.dataset.col;
                let vac = td.dataset.vac;	
                const val = (td.innerHTML === '1') ? 0 : 1;
                td.innerHTML = (td.innerHTML === '1') ? '' : '1';
                td.classList.toggle('bg');
                this.data["tds_local"][saison][vac][sousvac][col] = val;
            });
        }
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
            Ajout la gestion des clicks sur la croix pour supprimer une sousvac d'un tds   
        --------------------------------------------------------------------------------------------- */

    add_listener_tds_supprime() {
        const cases = document.querySelectorAll(`td.vac_tds_delete`);
        for (const td of cases) {
            td.addEventListener('click', async (e) => { 
                let zone = td.dataset.zone;	
                let saison = td.dataset.saison;	
                let vac = td.dataset.vac;
                let sousvac = td.dataset.sousvac;	
                const tour = {"fonction": "delete_sousvac", "zone": zone, "saison": saison, "vac": vac, "sousvac":sousvac}	
                var data = {
                    method: "post",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(tour)
                };
                
                await fetch("tds_sql.php", data);
                show_popup(`Tour ${saison}<br>Vac ${vac}`, `Suppression sousvac ${sousvac} OK`);
                this.init(saison);
            })
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

}

class tds_editor {

    constructor() {
        this.tour_vierge = [["00:00",0],["00:15",0],["00:30",0],["00:45",0],["01:00",0],["01:15",0],["01:30",0],["01:45",0],["02:00",0],["02:15",0],["02:30",0],["02:45",0],["03:00",0],["03:15",0],["03:30",0],["03:45",0],["04:00",0],["04:15",0],["04:30",0],["04:45",0],["05:00",0],["05:15",0],["05:30",0],["05:45",0],["06:00",0],["06:15",0],["06:30",0],["06:45",0],["07:00",0],["07:15",0],["07:30",0],["07:45",0],["08:00",0],["08:15",0],["08:30",0],["08:45",0],["09:00",0],["09:15",0],["09:30",0],["09:45",0],["10:00",0],["10:15",0],["10:30",0],["10:45",0],["11:00",0],["11:15",0],["11:30",0],["11:45",0],["12:00",0],["12:15",0],["12:30",0],["12:45",0],["13:00",0],["13:15",0],["13:30",0],["13:45",0],["14:00",0],["14:15",0],["14:30",0],["14:45",0],["15:00",0],["15:15",0],["15:30",0],["15:45",0],["16:00",0],["16:15",0],["16:30",0],["16:45",0],["17:00",0],["17:15",0],["17:30",0],["17:45",0],["18:00",0],["18:15",0],["18:30",0],["18:45",0],["19:00",0],["19:15",0],["19:30",0],["19:45",0],["20:00",0],["20:15",0],["20:30",0],["20:45",0],["21:00",0],["21:15",0],["21:30",0],["21:45",0],["22:00",0],["22:15",0],["22:30",0],["22:45",0],["23:00",0],["23:15",0],["23:30",0],["23:45",0]];
        this.insert_header();
        this.edit_tds();
    }

    insert_header() {
        const dd = new Date().toISOString().split('T')[0];
        const html = `<header>TDS Editor</header>
        <div id="tds_glob">
        <ul class="menu_tds_editor">
            <li>
                <select id="zone" class="select">
                <option selected value="est">Zone EST</option>
                <option value="ouest">Zone WEST</option>
                </select>
            <button id="button_validate" data-open="no" class="button_tour">Show TDS</button>
            <button id="button_save" class="button_tour">Save</button>
            </li>
        </ul>
        <ul class="menu_tds_editor">
            <li>
                <label for="cree_name">Nom vac:</label>
                <input type="text" id="cree_name" name="cree_name" required minlength="1" maxlength="4" size="6" />
                <button id="button_cree_supp" class="button_tour">Créer Vac</button>
                <button id="button_show_supp" class="button_tour">Voir Vacations Suppl</button>
            </li>
        </ul>
        <ul class="menu_tds_editor">
            <li class="feuille"><span><a href="./">back to TDS</a></span></li>
        </ul>
        </div>
        <div id="plage_est" class="est off"></div>
        <div id="plage_ouest" class="ouest off"></div>
        <div id="cree_supp" class="off"></div>
        <div id="result_supp_est" class="est off"></div>
        <div id="result_supp_ouest" class="ouest off"></div>
        <div id="result_hiver_est" class="est off"></div>
        <div id="result_mi-saison-basse_est" class="est off"></div>
        <div id="result_mi-saison-haute_est" class="est off"></div>
        <div id="result_ete_est" class="est off"></div>
        <div id="result_supp_ouest" class="ouest off"></div>
        <div id="result_hiver_ouest" class="ouest off"></div>
        <div id="result_mi-saison-basse_ouest" class="ouest off"></div>
        <div id="result_mi-saison-haute_ouest" class="ouest off"></div>
        <div id="result_ete_ouest" class="ouest off"></div>`;

        document.body.insertAdjacentHTML('afterBegin', html);

        $('button_validate').addEventListener('click', e => {
            $('button_validate').setAttribute('data-open', "yes");
            $('popup-wrap').classList.add('off');
            const zone = $('zone').value;
            if (zone === "est") {
                for (const z of document.querySelectorAll('.est')) {
                    z.classList.remove('off');
                }
                for (const z of document.querySelectorAll('.ouest')) {
                    z.classList.add('off');
                }
            }
            if (zone === "ouest") {
                for (const z of document.querySelectorAll('.ouest')) {
                    z.classList.remove('off');
                }
                for (const z of document.querySelectorAll('.est')) {
                    z.classList.add('off');
                }
            } 
        })
    }

/*  --------------------------------------------------------------------------------------------- 
    Affiche la table du tds :
        
        @param {string} containerId - Id du conteneur affichant la table
        @param {string} zone        - "est" ou "ouest"
        @param {string} saison      - "hiver" ou "mi-saison-basse" ou "mi-saison-haute" ou "ete"
    --------------------------------------------------------------------------------------------- */

    async edit_tds() {

        this.tour_local = await loadJson(tour_json);
        this.tour_supp = await loadJson(tour_supp_json);
        this.date_supp = await loadJson(date_supp_json);
        
        this.affiche_tds_supp("result_supp_est", "est");
        this.affiche_tds_supp("result_supp_ouest", "ouest");
        const saisons = ["hiver", "mi-saison-basse", "mi-saison-haute", "ete"];
        for (const s of saisons) {
            this.affiche_plages("plage_est", "est", s);
            this.affiche_plages("plage_ouest", "ouest", s);
            this.affiche_tds("result_"+s+"_est", "est", s);
            this.affiche_tds("result_"+s+"_ouest", "ouest", s);
        } 

        this.add_listener("hiver", "est");
        this.add_listener_plage("hiver", "est");
        this.add_listener("mi-saison-basse", "est");
        this.add_listener_plage("mi-saison-basse", "est");
        this.add_listener("mi-saison-haute", "est");
        this.add_listener_plage("mi-saison-haute", "est");
        this.add_listener("ete", "est");
        this.add_listener_plage("ete", "est");
        this.add_listener_suppl("est");

        this.add_listener("hiver", "ouest");
        this.add_listener_plage("hiver", "ouest");
        this.add_listener("mi-saison-basse", "ouest");
        this.add_listener_plage("mi-saison-basse", "ouest");
        this.add_listener("mi-saison-haute", "ouest");
        this.add_listener_plage("mi-saison-haute", "ouest");
        this.add_listener("ete", "ouest");
        this.add_listener_plage("ete", "ouest");
        this.add_listener_suppl("ouest");

        this.add_listener_supprime();

        $('button_cree_supp').addEventListener('click', e => {
            const tds_open = $('button_validate').getAttribute('data-open');
            if (tds_open === 'no') {
                $('button_validate').click();
            }
            const zone = $('zone').value;
            const name = $('cree_name').value;
            if (typeof this.tour_supp[zone][name] === 'undefined' && name != "") {
                this.tour_supp[zone][name] = this.tour_vierge;
            }
            if (name != "") {
                $('button_save').click();
                this.affiche_tds_supp("result_supp_"+zone, zone);
                this.add_listener_suppl(zone);
                this.add_listener_supprime();
            } else {
                show_popup("Nouvelle Vac", "Vous devez donner un nom");
            }
        });

        $('button_show_supp').addEventListener('click', (e) => {
            let res ="";
            for(let i=0;i<12;i++) {
                res += this.build_month(2022, i);
            }
            this.show_popup_date("Date Supp <button id='save_date_suppl' class='button_tour'>Save</button>", res);
            this.add_listener_day();
        });

        $('button_save').addEventListener('click', async (e) => {
            var data = {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(this.tour_local)
            };
            var data2 = {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(this.tour_supp)
            };
            show_popup("Patientez !", "Sauvegarde du TDS en cours...<br>Cela peut prendre 30s");
            await fetch("export_tds_supp_to_json.php", data2);
            await fetch("export_tds_to_json.php", data);
            document.querySelector('#popup-wrap a.popup-close').click();
        });
    }	

    /*  --------------------------------------------------------------------------------------------- 
        Affiche les plages horaires   
            @param {string} zone        - "est" ou "ouest"
            @param {string} saison      - "hiver" ou "mi-saison-basse" ou "mi-saison-haute" ou "ete"
        --------------------------------------------------------------------------------------------- */
    affiche_lignes_plage(zone, saison) {
        const plage = this.tour_local[zone][saison]["plage"];
        let lignes = "";
        plage.forEach((elem, index) => {
            lignes += `<tr><td class="pl" data-col="0" data-ligne=${index} data-saison='${saison+"-"+zone}'>${elem[0]}</td><td class="pl" data-col="1" data-ligne=${index} data-saison='${saison+"-"+zone}'>${elem[1]}</td></tr>`;
        });
        return lignes;
    }

    affiche_plages(containerId, zone, saison) {
        let res = $(containerId).innerHTML;
        res += '<table class="plage">';
        res += `<caption>Plage Horaire ${saison} - ${capitalizeFirstLetter(zone)}</caption>`;
        res += '<thead><tr><th>Début</th><th>Fin</th></tr></thead>';
        res += '<tbody>';
        res += `${this.affiche_lignes_plage(zone, saison)}`;
        res += '</tbody></table>';
        $(containerId).innerHTML = res;
    }

    affiche_tds(containerId, zone, saison) {
        let res = `<table class="ouverture">
        <caption>TDS ${saison} - ${capitalizeFirstLetter(zone)}</caption>
        <thead>
            <tr class="titre">
                <th class="top_2px left_2px right_1px bottom_2px">Vac</th>
                <th class="top_2px bottom_2px right_1px">Part</th>
                <th class="top_2px bottom_2px left_2px right_2px" colspan="96">...</th>
            </tr>
        </thead>
        <tbody>`;
        res += `${this.affiche_vac("J1", saison, zone)}`;
        res += `${this.affiche_vac("J3", saison, zone)}`;
        res += `${this.affiche_vac("S2", saison, zone)}`;
        res += `${this.affiche_vac("J2", saison, zone)}`;
        res += `${this.affiche_vac("S1", saison, zone)}`;
        res += `${this.affiche_vac("N", saison,  zone)}`;
        res += `<tr class="titre"><td class='bottom_2px left_2px right_1px' colspan="2">Heures loc</td>${this.heure()}`;
        res += '</tbody></table>';
        $(containerId).innerHTML = res;
    }

/*  ------------------------------------------------------------------------------------------
    Fabrique la ligne du tour de service avec les entêtes 
        @param {string} vac         - "J1" "J3" "N" (nuit soirée) "N1" (nuit du matin) etc...
        @param {string} saison      - "hiver" "ete" "mi-saison-basse" "mi-saison-haute"
        @param {string} zone        - "est" ou "ouest"
    ------------------------------------------------------------------------------------------ */
    affiche_vac(vac, saison, zone) {
        const res = this.affiche_td_vac(vac, saison, zone);
        const cds = (vac == "J2" || vac == "S1") ? "-" : "cds";
        return `
        <tr><td class='left_2px right_1px'></td><td class='pc right_1px'>${cds}</td>${res[0]}</tr>
        <tr><td class='left_2px right_1px'>${vac}</td><td class='right_1px'>A</td>${res[1]}</tr>
        <tr><td class='left_2px bottom_2px right_1px'></td><td class='bottom_2px right_1px'>B</td>${res[2]}</tr>`;
    }

    // sous-routine affichage td (partie droite)
    // returns {array} [ligne1, ligne2, ligne 3] - elements <td> formant le tds
    affiche_td_vac(vac, saison, zone) {
        let res1 = "", res2 = "", res3 = "";
        this.tour_local[zone][saison][vac].forEach( (elem, index) => {
            let r1 = elem[1];
            let r2 = elem[2];
            let r3 = elem[3];
            let cl1 = "case", cl2 = "case", cl3="case";
            if (r1 != 0) cl1 = "case bg";
            if (r2 != 0) cl2 = "case bg"; 
            if (r3 != 0) cl3 = "case bg";
            if (index === 95) { cl1 += " right_2px"; cl2 += " right_2px"; cl3+= " right_2px"; }
            if (index%4 === 0) { cl1 += " left_2px"; cl2 += " left_2px"; cl3+= " left_2px"; }
            res1 += `<td class='${cl1} standard' data-vac='${vac}' data-ligne='1' data-col='${index}' data-saison='${saison+"-"+zone}'>${r1 || ''}</td>`; // CDS sur position ?
            res2 += `<td class='${cl2} standard' data-vac='${vac}' data-ligne='2' data-col='${index}' data-saison='${saison+"-"+zone}'>${r2 || ''}</td>`; // partie A
            res3 += `<td class='${cl3} bottom_2px standard' data-vac='${vac}' data-ligne='3' data-col='${index}' data-saison='${saison+"-"+zone}'>${r3 || ''}</td>`; // partie B
        });
        return [res1, res2, res3];
    }

    /*  --------------------------------------------------------------------------------------------- 
        Affiche le TDS supplémentaire   
            @param {string} containerId - "result_supp_est" ou "result_supp_ouest"
            @param {string} zone        - "est" ou "ouest"
            @param {string} vac         - nom de la vac suppl
        --------------------------------------------------------------------------------------------- */
    affiche_tds_supp(containerId, zone) {
        let res = `<table class="ouverture">
        <caption>TDS Supp - ${capitalizeFirstLetter(zone)}</caption>
        <thead>
            <tr class="titre">
                <th class="top_2px left_2px right_1px bottom_2px">Vac</th>
                <th class="top_2px bottom_2px left_2px right_2px" colspan="96">...</th>
                <th class="top_2px bottom_2px right_2px">Supprime</th>
            </tr>
        </thead>
        <tbody>`;
        const cles = Object.keys(this.tour_supp[zone]);
        cles.forEach(vac => {
            res += `${this.affiche_vac_supp(vac, zone)}`;
        });
        res += `<tr class="titre"><th class='bottom_2px left_2px right_1px' colspan="1">Heures loc</th>${this.heure()}`;
        res += '</tbody></table>';
        $(containerId).innerHTML = res;
    }

    affiche_vac_supp(vac, zone) {
        if (typeof this.tour_supp[zone][vac] != 'undefined') {
            const res = this.affiche_td_vac_supp(vac, zone);
            return `<tr><td class='left_2px right_1px bottom_2px' data-vac='${vac}' data-zone='${zone}'>${vac}</td>${res}<td class='vac_supp right_2px bottom_2px' data-zone="${zone}"  data-vac="${vac}">x</td></tr>`;
        } else return '';
    }

    // Jx sous-routine affichage td (partie droite)
    // returns {string} ligne - elements <td> formant le tds
    affiche_td_vac_supp(vac, zone) {
        let ligne = "";
        if (typeof this.tour_supp[zone][vac] != 'undefined') {
            this.tour_supp[zone][vac].forEach( (elem, index) => {
                let r1 = elem[1];
                let cl1 = "case";
                if (r1 != 0) cl1 = "case bg";
                if (index === 95) { cl1 += " right_2px"; }
                if (index%4 === 0) { cl1 += " left_2px"; }
                ligne += `<td class='${cl1} supp bottom_2px' data-vac='${vac}' data-ligne='1' data-col='${index}' data-zone='${zone}'>${r1 || ''}</td>`; 
            });
        }
        return ligne;
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
        Construit le calendrier du mois   
            @param {string} y           - year
            @param {string} m           - month (0 à 11)
        --------------------------------------------------------------------------------------------- */

    build_month(y, m) {
        const zone = $('zone').value;
        const tabmois = ["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet", "Aout","Septembre","Octobre","Novembre","Decembre"];
        const tabjour = ["Di","Lu","Ma","Me","Je","Ve","Sa"];
        var da = new Date(y, m);
        let longueur_mois = new Date(y, m, 1).getDaysInMonth();
        let d = "";
        d += "<tr>";
        for(let i=0;i<longueur_mois;i++) {
            d += `<td>${tabjour[da.getDay()]}</td>`;
            da.addDays(1);
        }
        d += "</tr>";
        d += "<tr>";
        for(let j=1;j<longueur_mois+1;j++) {
            let day = new Date(y, m, j+1).toISOString().split('T')[0];
            d += `<td data-day='${day}' data-zone='${zone}'>${j}</td>`;
        }
        d += "</tr>";
        d += "<tr>";
        for(let j=1;j<longueur_mois+1;j++) {
            const dat = y+"-"+formattedNumber(m+1)+"-"+formattedNumber(j);
            const cles = Object.keys(this.date_supp[zone]);
            let cle = ""; 
            for (const k of cles) {
                if (k == dat) cle = k;
            }
            if (cle === "") {
                d += `<td></td>`;
            } else {
                d += '<td>';
                console.log(this.date_supp[zone][cle]);
                Object.keys(this.date_supp[zone][cle]).forEach(elem => {
                    if (this.date_supp[zone][cle][elem] !== 0) {
                        d += `<div data-date='${cle}' data-vac='${elem}' data-zone='${zone}'>${elem}</div>`;
                    }
                })
                d += '</td>';
            }
        }
        d += "</tr>";
        
        let res = `<table class="creneaux sortable"><caption>${tabmois[m]} ${y} - ${zone}</caption>`; 
        res += `<thead></thead>`;
        res += `<tbody>${d}</tbody></table>`;
        return res;
    }

    /*  --------------------------------------------------------------------------------------------- 
        Ajout la gestion des clicks sur les cases des plages   
            @param {string} zone        - "est" ou "ouest"
            @param {string} saison      - "hiver" ou "mi-saison-basse" ou "mi-saison-haute" ou "ete"
        --------------------------------------------------------------------------------------------- */

    add_listener_plage(saison, zone) {
        const cases = document.querySelectorAll(`td.pl[data-saison=${saison+"-"+zone}]`);
        for (const td of cases) {
            td.addEventListener('click', (event) => {
                let lig = parseInt(td.dataset.ligne);
                let col = parseInt(td.dataset.col);
                const dd = new Date();
                const d = reverse_date(td.innerHTML + '-' + dd.getUTCFullYear());
                let ih = `<div id="modif">
                <p>
                <input type="date" id="ch_date" class="date" value="${d}" data-cl="${col}" data-lig="${lig}">
                </p>
                <button id="ch">Changer</button>
                </div>`;
                show_popup("Modification", ih);
                $('ch').addEventListener('click', (event) => {
                    const sel = $('ch_date');
                    if (typeof sel.value != 'undefined') {
                        const v = reverse_date(sel.value).substr(0,5);
                        td.innerHTML = v;
                        if (col === 0) {
                            const v2 = this.tour_local[zone][saison]["plage"][lig][1];
                            this.tour_local[zone][saison]["plage"][lig] = [v, v2];
                        } else {
                            const v2 = this.tour_local[zone][saison]["plage"][lig][0];
                            this.tour_local[zone][saison]["plage"][lig] = [v2, v];
                        }
                    }
                })
                
            });
        }
    }

    /*  --------------------------------------------------------------------------------------------- 
        Ajout la gestion des clicks sur les cases du tds et du tds_suppl   
            @param {string} zone        - "est" ou "ouest"
            @param {string} saison      - "hiver" ou "mi-saison-basse" ou "mi-saison-haute" ou "ete"
        --------------------------------------------------------------------------------------------- */

    add_listener(saison, zone) {
        const cases = document.querySelectorAll(`td.standard[data-saison=${saison+"-"+zone}]`);
        for (const td of cases) {
            td.addEventListener('click', (event) => {
                let lig = td.dataset.ligne;
                let col = td.dataset.col;
                let vac = td.dataset.vac;	
                let heure = this.tour_local[zone][saison][vac][col][0];
                let t1 = this.tour_local[zone][saison][vac][col][1];
                let t2 = this.tour_local[zone][saison][vac][col][2];
                let t3 = this.tour_local[zone][saison][vac][col][3];
                const val = (td.innerHTML === '1') ? 0 : 1;
                td.innerHTML = (td.innerHTML === '1') ? '' : '1';
                td.classList.toggle('bg');
                if (lig == '1') {
                    this.tour_local[zone][saison][vac][col] = [heure, val, t2, t3];
                }
                if (lig == '2') {
                    this.tour_local[zone][saison][vac][col] = [heure, t1, val, t3];
                }
                if (lig == '3') {
                    this.tour_local[zone][saison][vac][col] = [heure, t1, t2, val];
                }
            });
        }
    }

    add_listener_suppl(zone) {
        const cases = document.querySelectorAll(`td.supp[data-zone=${zone}]`);
        for (const td of cases) {
            td.addEventListener('click', (event) => {
                let col = td.dataset.col;
                let vac = td.dataset.vac;	
                let heure = this.tour_supp[zone][vac][col][0];
                const val = (td.innerHTML === '1') ? 0 : 1;
                td.innerHTML = (td.innerHTML === '1') ? '' : '1';
                td.classList.toggle('bg');
                this.tour_supp[zone][vac][col] = [heure, val];
            });
        }
    }

    /*  --------------------------------------------------------------------------------------------- 
            Ajout la gestion des clicks sur la croix pour supprimer un tds suppl   
        --------------------------------------------------------------------------------------------- */

    add_listener_supprime() {
        const vac_supp = document.querySelectorAll(`td.vac_supp`);
        for (const td of vac_supp) {
            td.addEventListener('click', e => { 
                let zone = td.dataset.zone;	
                let vac = td.dataset.vac;	
                delete(this.tour_supp[zone][vac]);
                $('button_save').click();
                this.affiche_tds_supp("result_supp_"+zone, zone);
                this.add_listener_suppl(zone);
                this.add_listener_supprime();
                // supprime cette vac des dates enregistrées
                // à faire
                const cles = Object.keys(this.date_supp[zone]); // tableau des dates
                cles.forEach((date, index) => {
                    this.date_supp[zone][date] = this.date_supp[zone][date].filter(el => el != vac);
                });
                this.save_date_suppl();
            })
        }
        
    }

    async save_date_suppl() {
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(this.date_supp)
        };
        show_popup("Patientez !", "Sauvegarde des dates en cours...");
        await fetch("export_date_supp_to_json.php", data);
        document.querySelector('#popup-wrap a.popup-close').click();
    }

    /*  --------------------------------------------------------------------------------------------- 
            Ajout la gestion des clicks sur les jours du calendrier   
        --------------------------------------------------------------------------------------------- */

    add_listener_day() {
        $('save_date_suppl').addEventListener('click', (event) => {
            this.save_date_suppl();
            document.querySelector('#popup-date a.popup-close').click();
        })
        const poptds = document.createElement('div');
        poptds.setAttribute('id', 'poptds');
        const cases = document.querySelectorAll(`td[data-day]`);
        for (const td of cases) {
            td.addEventListener('click', (event) => {
                const day = td.dataset.day;
                const zone = td.dataset.zone;
                const cles = Object.keys(this.tour_supp[zone]); // ["J0A", "J0B",...]
                let data;
                if (typeof this.date_supp[zone][day] !== 'undefined') {
                    data = Object.keys(this.date_supp[zone][day]);
                } else { data = [];}
                let det = `<h2>${reverse_date(day)}</h2>`;
                cles.forEach((elem, index) => {
                    if (typeof this.date_supp[zone][day] !== 'undefined') {
                        det += `<div style='display: grid; grid-template-columns: 40px 80px;'><span style='font-size: 1.4rem; margin-top: 2px;'>${elem} : </span><span class="modify"><button class="minusJx minus" data-zone='${zone}' data-day='${day}' data-vac='${elem}'>-</button><span class="numberPlace" data-zone='${zone}' data-day='${day}' data-vac='${elem}'>${this.date_supp[zone][day][elem]}</span><button class="plusJx plus" data-zone='${zone}' data-day='${day}' data-vac='${elem}'>+</button></span></div>`;
                    } else {
                        det += `<div style='display: grid; grid-template-columns: 40px 80px;'><span style='font-size: 1.4rem; margin-top: 2px'>${elem} : </span><span class="modify"><button class="minusJx minus" data-zone='${zone}' data-day='${day}' data-vac='${elem}'>-</button><span class="numberPlace" data-zone='${zone}' data-day='${day}' data-vac='${elem}'>0</span><button class="plusJx plus" data-zone='${zone}' data-day='${day}' data-vac='${elem}'>+</button></span></div>`;
                    }
                })
                det += '';
                console.log("Data: "+data);
				const pos = td.getBoundingClientRect();
				poptds.style.left = pos.left + 'px';
				poptds.style.top = pos.top + 20 + window.scrollY + 'px';
				document.body.insertBefore(poptds, $('popup-wrap'));
				poptds.innerHTML = det;
                
                const moinsJx = document.querySelectorAll('.minusJx');
                const plusJx = document.querySelectorAll('.plusJx');

                plusJx.forEach(el => {
                    el.addEventListener('click', async (event) => {
                        const vac = el.dataset.vac;
                        const day = el.dataset.day;
                        const zone = el.dataset.zone;
                        let nb = parseInt($$(`span[data-vac='${vac}'][data-day='${day}'][data-zone='${zone}']`).innerHTML) + 1;
                        $$(`span[data-vac='${vac}'][data-day='${day}'][data-zone='${zone}']`).innerHTML = nb;
                        if (typeof this.date_supp[zone][day] === 'undefined') {
                            this.date_supp[zone][day] = {};
                            cles.forEach( vac_jx => {
                                this.date_supp[zone][day][vac_jx] = 0;
                            })
                        }
                        this.date_supp[zone][day][vac] = nb;
                    });
                });
        
                moinsJx.forEach(el => {
                    el.addEventListener('click', async (event) => {
                        const vac = el.dataset.vac;
                        const day = el.dataset.day;
                        const zone = el.dataset.zone;
                        let nb = parseInt($$(`span[data-vac='${vac}'][data-day='${day}'][data-zone='${zone}']`).innerHTML) - 1;
                        $$(`span[data-vac='${vac}'][data-day='${day}'][data-zone='${zone}']`).innerHTML = nb;
                        if (typeof this.date_supp[zone][day] === 'undefined') {
                            this.date_supp[zone][day] = {};
                            cles.forEach( vac_jx => {
                                this.date_supp[zone][day][vac_jx] = 0;
                            })
                        }
                        this.date_supp[zone][day][vac] = nb;
                    });
                });
                /*
                const check = document.querySelectorAll(`input.checkbox[data-type]`);
                console.log(check);
                for (const inp of check) {
                    inp.addEventListener('click', (event) => {
                        const day = inp.dataset.day;
                        const zone = inp.dataset.zone;
                        const type = inp.dataset.type;
                        if (inp.checked === true) { // on coche la checkbox
                            data.push(type);
                        } else {
                            data = data.filter(word => word != type); // on enlève du tableau type
                        }
                        this.date_supp[zone][day] = data;
                        console.log("day: "+day+"  -  "+this.date_supp[zone][day]);
                    })
                }
                */
            })
            td.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                poptds.style.left = '-500px';
            })
        }
    }

    /*	---------------------------------------------------------
		Affiche une Pop-up générique 
			@param {string} text1 - Titre
			@param {string} text2 - Contenu HTML
	--------------------------------------------------------- */
    show_popup_date(text1, text2) {
        let html = `<div id="popup-date" class="popup-supp off">
                    <div class="popup-box popup-supp">
                        <h2></h2>
                        <h3></h3>
                        <a class="close-btn popup-close" href="#">x</a>
                    </div>
                </div>`;

        $('date_frame').innerHTML = html;

        document.querySelector('#popup-date a.popup-close').addEventListener('click', e => {
            e.preventDefault();
            document.querySelector('#popup-date div.popup-supp').classList.remove('transform-in');
            document.querySelector('#popup-date div.popup-supp').classList.add('transform-out');
            if ($('poptds')) $('poptds').remove();
            $('date_frame').innerHTML = "";
        });
        
        document.getElementById('popup-date').classList.remove('off');
        document.querySelector('#popup-date .popup-supp h2').innerHTML = text1;
        document.querySelector('#popup-date .popup-supp h3').innerHTML = text2;
        
        document.querySelector('#popup-date .popup-supp').classList.remove('transform-out');
        document.querySelector('#popup-date .popup-supp').classList.add('transform-in');
        
    }

}

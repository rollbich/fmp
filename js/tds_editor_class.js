class tds_editor {

    constructor() {
        this.edit_tds();
    }

    /*  --------------------------------------------------------------------------------------------- 
        Affiche la table du tds :
            
            @param {string} containerId - Id du conteneur affichant la table
            @param {string} zone        - "est" ou "ouest"
            @param {string} saison      - "hiver" ou "mi-saison-basse" ou "mi-saison-haute" ou "ete"
        --------------------------------------------------------------------------------------------- */

    async edit_tds() {

        this.tour_local = await loadJson(tour_json);

        /*  --------------------------------------------------------------------------------------------- 
            Affiche les plages horaires   
                @param {string} zone        - "est" ou "ouest"
                @param {string} saison      - "hiver" ou "mi-saison-basse" ou "mi-saison-haute" ou "ete"
            --------------------------------------------------------------------------------------------- */
        const affiche_lignes_plage = (zone, saison) => {
            const plage = this.tour_local[zone][saison]["plage"];
            let lignes = "";
            plage.forEach((elem, index) => {
                lignes += `<tr><td class="pl" data-col="0" data-ligne=${index} data-saison='${saison+"-"+zone}'>${elem[0]}</td><td class="pl" data-col="1" data-ligne=${index} data-saison='${saison+"-"+zone}'>${elem[1]}</td></tr>`;
            });
            return lignes;
        }

        const affiche_plages = (containerId, zone, saison) => {
            let res = $(containerId).innerHTML;
            res += '<table class="plage">';
            res += `<caption>Plage Horaire ${saison} - ${capitalizeFirstLetter(zone)}</caption>`;
            res += '<thead><tr><th>Début</th><th>Fin</th></tr></thead>';
            res += '<tbody>';
            res += `${affiche_lignes_plage(zone, saison)}`;
            res += '</tbody></table>';
            $(containerId).innerHTML = res;
        }

        function affiche_tds(containerId, zone, saison) {
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
            res += `${affiche_vac("J1", saison, zone)}`;
            res += `${affiche_vac("J3", saison, zone)}`;
            res += `${affiche_vac("S2", saison, zone)}`;
            res += `${affiche_vac("J2", saison, zone)}`;
            res += `${affiche_vac("S1", saison, zone)}`;
            res += `${affiche_vac("N", saison,  zone)}`;
            res += `<tr class="titre"><th class='bottom_2px left_2px right_1px' colspan="2">Heures loc</th>${heure()}`;
            res += '</tbody></table>';
            $(containerId).innerHTML = res;
        }

/*  ------------------------------------------------------------------------------------------
        Fabrique la ligne du tour de service avec les entêtes 
            @param {string} vac         - "J1" "J3" "N" (nuit soirée) "N1" (nuit du matin) etc...
            @param {string} saison      - "hiver" "ete" "mi-saison-basse" "mi-saison-haute"
            @param {string} zone        - "est" ou "ouest"
        ------------------------------------------------------------------------------------------ */
        const affiche_vac = (vac, saison, zone) => {
            const res = affiche_td_vac(vac, saison, zone);
            const cds = (vac == "J2" || vac == "S1") ? "-" : "cds";
            return `
            <tr><td class='left_2px right_1px'></td><td class='pc right_1px'>${cds}</td>${res[0]}</tr>
            <tr><td class='left_2px right_1px'>${vac}</td><td class='right_1px'>A</td>${res[1]}</tr>
            <tr><td class='left_2px bottom_2px right_1px'></td><td class='bottom_2px right_1px'>B</td>${res[2]}</tr>`;
        }
    
        // sous-routine affichage td (partie droite)
        // returns {array} [ligne1, ligne2, ligne 3] - elements <td> formant le tds
        const affiche_td_vac = (vac, saison, zone) => {
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
                res1 += `<td class='${cl1}' data-vac='${vac}' data-ligne='1' data-col='${index}' data-saison='${saison+"-"+zone}'>${r1 || ''}</td>`; // CDS travaille sur position ?
                res2 += `<td class='${cl2}' data-vac='${vac}' data-ligne='2' data-col='${index}' data-saison='${saison+"-"+zone}'>${r2 || ''}</td>`; // partie A
                res3 += `<td class='${cl3} bottom_2px' data-vac='${vac}' data-ligne='3' data-col='${index}' data-saison='${saison+"-"+zone}'>${r3 || ''}</td>`; // partie B
            });
            return [res1, res2, res3];
        }
    
        /*  ------------------------------------------------------------------------
            fabrique la ligne des heures du tableau sans l'entête (partie gauche)
            ------------------------------------------------------------------------ */
        function heure() {
            let res = "";
            for(var i=0;i<96;i++) {
                if (i%4 == 0) res += `<td class="left_2px bottom_2px">${i/4}</td>`;
                if (i%4 == 2) res += `<td class="left_1px bottom_2px f8px">30</td>`;
                if (i%4 == 1 || (i%4 == 3 && i != 95)) { res += '<td class="bottom_2px"></td>'; } else if (i === 95) res += '<td class="right_2px bottom_2px"></td>';
            }
            return res;
        }

        const saisons = ["hiver", "mi-saison-basse", "mi-saison-haute", "ete"];
        for (const s of saisons) {
            affiche_plages("plage_est", "est", s);
            affiche_plages("plage_ouest", "ouest", s);
            affiche_tds("result_"+s+"_est", "est", s);
            affiche_tds("result_"+s+"_ouest", "ouest", s);
        } 

        this.add_listener("hiver", "est");
        this.add_listener_plage("hiver", "est");
        this.add_listener("mi-saison-basse", "est");
        this.add_listener_plage("mi-saison-basse", "est");
        this.add_listener("mi-saison-haute", "est");
        this.add_listener_plage("mi-saison-haute", "est");
        this.add_listener("ete", "est");
        this.add_listener_plage("ete", "est");

        this.add_listener("hiver", "ouest");
        this.add_listener_plage("hiver", "ouest");
        this.add_listener("mi-saison-basse", "ouest");
        this.add_listener_plage("mi-saison-basse", "ouest");
        this.add_listener("mi-saison-haute", "ouest");
        this.add_listener_plage("mi-saison-haute", "ouest");
        this.add_listener("ete", "ouest");
        this.add_listener_plage("ete", "ouest");

        $('button_save').addEventListener('click', (e) => {
            var data = {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(this.tour_local)
            };
            show_popup("Patientez !", "Sauvegarde du TDS en cours...<br>Cela peut prendre 30s");
            fetch("export_to_json.php", data)
            .then(function(response) {
                document.querySelector('.popup-close').click();
            });
        });
    }	

    /*  --------------------------------------------------------------------------------------------- 
        Ajout la gestion des clicks sur les cases du tds   
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
        Ajout la gestion des clicks sur les cases du tds   
            @param {string} zone        - "est" ou "ouest"
            @param {string} saison      - "hiver" ou "mi-saison-basse" ou "mi-saison-haute" ou "ete"
        --------------------------------------------------------------------------------------------- */

    add_listener(saison, zone) {
        const cases = document.querySelectorAll(`td.case[data-saison=${saison+"-"+zone}]`);
        for (const td of cases) {
            td.addEventListener('click', (event) => {
                let lig = td.dataset.ligne;
                let col = td.dataset.col;
                let vac = td.dataset.vac;	
                let t0 = this.tour_local[zone][saison][vac][col][0];
                let t1 = this.tour_local[zone][saison][vac][col][1];
                let t2 = this.tour_local[zone][saison][vac][col][2];
                let t3 = this.tour_local[zone][saison][vac][col][3];
                const val = (td.innerHTML === '1') ? 0 : 1;
                td.innerHTML = (td.innerHTML === '1') ? '' : '1';
                td.classList.toggle('bg');
                if (lig == '1') {
                    this.tour_local[zone][saison][vac][col] = [t0, val, t2, t3];
                }
                if (lig == '2') {
                    this.tour_local[zone][saison][vac][col] = [t0, t1, val, t3];
                }
                if (lig == '3') {
                    this.tour_local[zone][saison][vac][col] = [t0, t1, t2, val];
                }
            });
        }
    }

}

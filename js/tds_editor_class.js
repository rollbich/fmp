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
        this.tour_supp = await loadJson(tour_supp_json);
        this.date_supp = await loadJson(date_supp_json);
        this.tour_vierge = [["00:00",0],["00:15",0],["00:30",0],["00:45",0],["01:00",0],["01:15",0],["01:30",0],["01:45",0],["02:00",0],["02:15",0],["02:30",0],["02:45",0],["03:00",0],["03:15",0],["03:30",0],["03:45",0],["04:00",0],["04:15",0],["04:30",0],["04:45",0],["05:00",0],["05:15",0],["05:30",0],["05:45",0],["06:00",0],["06:15",0],["06:30",0],["06:45",0],["07:00",0],["07:15",0],["07:30",0],["07:45",0],["08:00",0],["08:15",0],["08:30",0],["08:45",0],["09:00",0],["09:15",0],["09:30",0],["09:45",0],["10:00",0],["10:15",0],["10:30",0],["10:45",0],["11:00",0],["11:15",0],["11:30",0],["11:45",0],["12:00",0],["12:15",0],["12:30",0],["12:45",0],["13:00",0],["13:15",0],["13:30",0],["13:45",0],["14:00",0],["14:15",0],["14:30",0],["14:45",0],["15:00",0],["15:15",0],["15:30",0],["15:45",0],["16:00",0],["16:15",0],["16:30",0],["16:45",0],["17:00",0],["17:15",0],["17:30",0],["17:45",0],["18:00",0],["18:15",0],["18:30",0],["18:45",0],["19:00",0],["19:15",0],["19:30",0],["19:45",0],["20:00",0],["20:15",0],["20:30",0],["20:45",0],["21:00",0],["21:15",0],["21:30",0],["21:45",0],["22:00",0],["22:15",0],["22:30",0],["22:45",0],["23:00",0],["23:15",0],["23:30",0],["23:45",0]];

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

        const affiche_tds_supp = (containerId, zone) => {
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
                res += `${affiche_vac_supp(vac, zone)}`;
            });
            res += `<tr class="titre"><th class='bottom_2px left_2px right_1px' colspan="1">Heures loc</th>${heure()}`;
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
                res1 += `<td class='${cl1} standard' data-vac='${vac}' data-ligne='1' data-col='${index}' data-saison='${saison+"-"+zone}'>${r1 || ''}</td>`; // CDS sur position ?
                res2 += `<td class='${cl2} standard' data-vac='${vac}' data-ligne='2' data-col='${index}' data-saison='${saison+"-"+zone}'>${r2 || ''}</td>`; // partie A
                res3 += `<td class='${cl3} bottom_2px standard' data-vac='${vac}' data-ligne='3' data-col='${index}' data-saison='${saison+"-"+zone}'>${r3 || ''}</td>`; // partie B
            });
            return [res1, res2, res3];
        }

        const affiche_vac_supp = (vac, zone) => {
            if (typeof this.tour_supp[zone][vac] != 'undefined') {
                const res = affiche_td_vac_supp(vac, zone);
                return `<tr><td class='left_2px right_1px bottom_2px' data-vac='${vac}' data-zone='${zone}'>${vac}</td>${res}<td class='vac_supp right_2px bottom_2px' data-zone="${zone}"  data-vac="${vac}">x</td></tr>`;
            } else return '';
        }

        // Jx sous-routine affichage td (partie droite)
        // returns {array} [ligne1, ligne2, ligne 3] - elements <td> formant le tds
        const affiche_td_vac_supp = (vac, zone) => {
            let res1 = "";
            if (typeof this.tour_supp[zone][vac] != 'undefined') {
                this.tour_supp[zone][vac].forEach( (elem, index) => {
                    let r1 = elem[1];
                    let cl1 = "case";
                    if (r1 != 0) cl1 = "case bg";
                    if (index === 95) { cl1 += " right_2px"; }
                    if (index%4 === 0) { cl1 += " left_2px"; }
                    res1 += `<td class='${cl1} supp bottom_2px' data-vac='${vac}' data-ligne='1' data-col='${index}' data-zone='${zone}'>${r1 || ''}</td>`; 
                });
            }
            return res1;
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
        
        affiche_tds_supp("result_supp_est", "est");
        affiche_tds_supp("result_supp_ouest", "ouest");
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

        this.add_listener_supp("est");

        this.add_listener("hiver", "ouest");
        this.add_listener_plage("hiver", "ouest");
        this.add_listener("mi-saison-basse", "ouest");
        this.add_listener_plage("mi-saison-basse", "ouest");
        this.add_listener("mi-saison-haute", "ouest");
        this.add_listener_plage("mi-saison-haute", "ouest");
        this.add_listener("ete", "ouest");
        this.add_listener_plage("ete", "ouest");

        this.add_listener_supp("ouest");

        const add_listener_supprime = () => {
            const vac_supp = document.querySelectorAll(`td.vac_supp`);
            for (const td of vac_supp) {
                td.addEventListener('click', e => { 
                    let zone = td.dataset.zone;	
                    let vac = td.dataset.vac;	
                    delete(this.tour_supp[zone][vac]);
                    $('button_save').click();
                    affiche_tds_supp("result_supp_"+zone, zone);
                    this.add_listener_supp(zone);
                 });
            }
        }

        add_listener_supprime();

        $('button_cree_supp').addEventListener('click', e => {
            const zone = $('zone').value;
            const name = $('cree_name').value;
            if (typeof this.tour_supp[zone][name] === 'undefined') {
                this.tour_supp[zone][name] = this.tour_vierge;
            }
            $('button_save').click();
            affiche_tds_supp("result_supp_"+zone, zone);
            this.add_listener_supp(zone);
            add_listener_supprime();
        });
        
        $('button_show_supp').addEventListener('click', (e) => {
            let res = `
            <table class="creneaux sortable">
                <caption>Date Supp</caption>
                <thead>
                    <tr class="titre"><th class="top_2px left_2px bottom_2px right_1px">Date</th><th class="top_2px bottom_2px right_1px">Type</th><th class="top_2px bottom_2px right_1px">Num type</th><th class="top_2px bottom_2px right_2px">Supprime</th></tr>
                </thead>
                <tbody>`;
            const cles = Object.keys(this.date_supp);
            console.log("cles "+cles);
            for (const k of cles) {
                console.log("k "+k);
                console.log("cles[k] "+this.date_supp[k]);
                this.date_supp[k].forEach(elem => {
                    res += `<tr><td>${k}</td><td>${elem[0]}</td><td>${elem[1]}</td><td class="supprime" data-id="">x</td></tr>`;
                })
            }
            res += '</tbody></table>';
			show_popup("Date Supp", res);
        })

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
            await fetch("export_supp_to_json.php", data2);
            await fetch("export_to_json.php", data);
            document.querySelector('.popup-close').click();
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

    add_listener_supp(zone) {
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

}

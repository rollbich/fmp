/*	---------------------------------------------------------------------------
		Exporte le fichier json au format Excel xlsx 
			@param {string} url 
            ex : /opt/bitnami/data/overload/2023/debut-fin-capa-140%-EST.xlsx
			@param {object} json - json à sauvegarder
            @param {string} type - "H20" ou "peak"
	--------------------------------------------------------------------------- */
function export_json_to_xls(url, json, type) {
    const exp = {};
    exp.json = json;
    exp.type = type;

    var data = {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exp)
    };
    fetch( url, data)
    .then(function(response) {
        return response.text().then(function(chemin) {
            const data = chemin.split("/");
            const nom = data[6];
            //if (data[0] === "OK") { 
                show_popup("Export réussi", `Cliquer pour télécharger le fichier<br><a href='php/download_file.php?filename=${chemin}'>${nom}</a>`); 
            //}
            //else { show_popup("Erreur d'écriture", "Vérifier le fichier dans le dossier xls"); }
        });
    });
}

class overload {

    /*  ----------------------------------------------------------------------------------
		@param {string} containerId - Id du conteneur
	 	@param {string} type - "H20" ou "peak"
		@param {string} start_day - "yyyy-mm-dd"
		@param {string} end_day - "yyyy-mm-dd"
        @param {string} zone - "AE" ou "AW"
		@param {integer} selected_pourcent - pourcentage de dépassement de MV / OTMV
	---------------------------------------------------------------------------------- */

    constructor(containerId, type, start_day, end_day, zone, selected_percent_MV, selected_percent_peak) {
        this.result_capa = {};
        this.type = type;
        this.start_day = start_day;
        this.end_day = end_day;
        this.zone = zone;
        this.z = this.zone === "AE" ? "est" : "ouest";
        this.selected_percent_MV = selected_percent_MV;
        this.selected_percent_peak = selected_percent_peak;
        this.containerId = containerId;
        // dépassement de 5mn mini
        this.peak_threshold_time = 5;
        this.init();
    }

    async init() {
        show_popup('Patientez','Chargement en cours');
        this.data = await this.get_fichiers();
        console.log("Data");
        console.log(this.data);
       	document.querySelector('.popup-close').click();
		this.show_depassement_capa();
        
    }

    /*  ----------------------------------------------------------------------------------
	        Affiche le dépassement Capa
	    ---------------------------------------------------------------------------------- */
    async show_depassement_capa() {
        if (this.type === "H20") await this.calc_capa_H20(); else await this.calc_capa_peak();
        console.log("Calc_depassement_ok");
        let res = `<table class="depassement">`;
        if (this.type === "H20") {
            res += `<caption>Nombre d'occurences<br>du ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</caption>`;
            res += `<thead>
                    <tr class="titre"><th class="space">130%</th><th>140%</th><th>150%</th><th>160%</th><th>170%</th><th>180%</th></tr>
                </thead>
                <tbody><tr>`;
            Object.keys(this.result_capa["nombre"]).forEach( key => {
                res += `<td>${this.result_capa["nombre"][key]}</td>`; 
            }) 
        } else {
            res += `<caption>Nombre d'occurences (durée > ${this.peak_threshold_time}min)<br>du ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</caption>`;
            res += `<thead>
                    <tr class="titre"><th class="space">Dépassement du peak</th></tr>
                </thead>
                <tbody><tr>`;
            res += `<td>${this.result_capa["nombre"]}</td>`;
        }
        
        res += '</tr></tbody></table>'; 
        res += `<table class="depassement">
                     <caption>Journées du ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</caption>`;
        if (this.type === "H20") {
            res +=`<thead>
                        <tr class="titre"><th class="space">Date</th><th>TV</th><th>Heure</th><th>H/20</th><th>MV</th><th>% de la MV</th></tr>
                    </thead>`;
        } else {
            res += `<thead>
                        <tr class="titre"><th class="space">Date</th><th>TV</th><th>Heure</th><th>occ peak</th><th>peak</th><th>% du peak</th></tr>
                    </thead>`;
        }
        res += "<tbody>";
        this.result_capa["data"].forEach(arr => {
            let r = get_ouv_1h(arr[2]);
            res += '<tr>'; 
            res +=`<td>${arr[0]}</td><td class="capa tv" data-date="${reverse_date(arr[0])}" data-tv="${arr[1]}" data-deb="${r[0]}" data-fin="${r[1]}">${arr[1]}</td><td>${arr[2]}</td><td>${arr[3]}</td><td>${arr[4]}</td><td>${arr[5]} %</td>`;
            res += '</tr>';	
        });
        res += '</tbody></table>';
        
        $(this.containerId).classList.remove('off');
        $(this.containerId).innerHTML = res;
        $(this.containerId).scrollIntoView({ 
            behavior: 'smooth' 
        });
        
        this.add_capa_listener();
    
    }

    /* day = "2023-07-02" */
    async get_fichiers() {
        const days = get_dates_array(new Date(this.start_day), new Date(this.end_day));

        const donnees = {};
        for (let day of days) {
            donnees[day] = {};

            // fichier mv-otmv du jour
            const dd = day.split("-");
            const rd = remove_hyphen_date(day);
            let year = dd[0];
            let month = dd[1];
            let file_name;
            file_name = `${year}/${month}/${rd}-mv_otmv-${this.z}.json`;
            let mv_otmv = await get_data(file_name);
            if (mv_otmv === 404) {
                const default_date_MV_json = await loadJson("../default_date_MV_OTMV.json");
                const d = default_date_MV_json["date"].split("-");
                const y = d[0];
                const m = d[1];
                const ddmv = remove_hyphen_date(default_date_MV_json['date']);
                const default_date_MV = reverse_date(default_date_MV_json['date']);
                file_name = `${y}/${m}/${ddmv}-mv_otmv-${this.z}.json`;
                mv_otmv = await get_data(file_name);
                show_popup(`MV/OTMV du jour indisponibles`, `Date par defaut des MV/OTMV : ${default_date_MV}`);
            }
            donnees[day]["mvotmv-b2b"] = mv_otmv;

            const t = new schema_rea(day, this.zone);
            donnees[day].rea = await t.read_schema_realise();
            if (typeof donnees[day].rea !== 'undefined') {
                const temp_h20 = await get_h20_b2b(day, this.zone, donnees[day].rea);
                const temp_occ = await get_occ_b2b(day, this.zone, donnees[day].rea);	
                donnees[day].h20 = temp_h20;
                donnees[day].occ = temp_occ;
            } else {
                show_popup(`Attention<br>le ${reverse_date(day)}`, `Fichier réalisé manquant`);
            }
        }
        return donnees;
    }

    /*  ----------------------------------------------------------------------------------
	      Calcule le dépassement Capa
            @results {object} - {
                "filtre": % du filtre (= selected_pourcent),
                "data" : [ [date, tv, heure, count, mv, pourcentage_mv], ... ],
                "nombre" : {"130":nb occurence, "140":nb occurence, ..., "180":nb}
            }
	---------------------------------------------------------------------------------- */
    async calc_capa_H20() {

        const days = get_dates_array(new Date(this.start_day), new Date(this.end_day));
        console.log("Days array");
        console.log(days);
        let z = this.z.toUpperCase();
        
        this.result_capa["data"] = [];
        this.result_capa["filtre"] = this.selected_percent_MV;
        this.result_capa["zone"] = z;
        this.result_capa["range"] = [this.start_day, this.end_day];
        this.result_capa["nombre"] = {"130":0, "140":0, "150":0, "160":0, "170":0, "180":0};

        for (let day of days) {
            for (var tv in this.data[day]["h20"][day]) {
                    const full_tv = "LFM"+tv;
                    let mv_4f = this.data[day]["mvotmv-b2b"]["MV"][full_tv][0]["capacity"];
                    try {
                        this.data[day]["h20"][day][tv].forEach(value => {
                            let count = value[1];
                            let pourcentage_mv_4f = Math.round((100 * count) / mv_4f);
                            let dd = reverse_date(day);	
                            if (pourcentage_mv_4f >= this.selected_percent_MV) {
                                this.result_capa["data"].push([dd, tv, value[0], count, mv_4f, pourcentage_mv_4f]);
                            }
                            Object.keys(this.result_capa["nombre"]).forEach( key => {
                                if (pourcentage_mv_4f >= parseInt(key)) {
                                    this.result_capa["nombre"][key]++;
                                }
                            })
                        });	
                    }
      
                    catch (err) {
                        show_popup("Erreur ! ", `Les donn&eacute;es du TV: ${tv} du ${day} ne sont pas r&eacute;cup&eacute;r&eacute;es en B2B`);
                        console.log(err);
                    }
            }
            
        }
    } 

    /*  ----------------------------------------------------------------------------------
	      Calcule le dépassement du peak
            @results {object} - {
                "filtre": % du filtre (= selected_pourcent),
                "data" : [ [day, tv, heure, maxi, peak_4f, pourcent_maxi], ... ],
                "nombre" : integer
            }
	---------------------------------------------------------------------------------- */
    async calc_capa_peak() {

        const days = get_dates_array(new Date(this.start_day), new Date(this.end_day));
        
        let z = this.z.toUpperCase();
        
        this.result_capa["data"] = [];
        this.result_capa["filtre"] = this.selected_percent_peak;
        this.result_capa["zone"] = z;
        this.result_capa["range"] = [this.start_day, this.end_day];
        this.result_capa["nombre"] = 0;
        
        for (let day of days) {
            for (var tv in this.data[day]["occ"][day]) {
                    const full_tv = "LFM"+tv;
                    let peak_4f = this.data[day]["mvotmv-b2b"]["OTMV"][full_tv][0]["otmv"]["peak"]["threshold"];
                    try {
                        const l = this.data[day]["occ"][day][tv].length;
                        for(let i=0;i<l-1-this.peak_threshold_time;i++) {
                            let value = this.data[day]["occ"][day][tv][i];
                            let heure = value[0];
                            let count = value[1];
                            let pourcentage_peak_4f = Math.round((100 * count) / peak_4f);
                            let dd = reverse_date(day);	
                            if (pourcentage_peak_4f > this.selected_percent_peak) {
                                // k commence à 1 (on a déjà la première valeur qui a dépassé)
                                let depa = true;
                                let tab_count = [count];
                                for(let k=1;k<this.peak_threshold_time;k++) {
                                    let pourc_peak_4f = Math.round((100 * this.data[day]["occ"][day][tv][i+k][1]) / peak_4f);
                                    tab_count.push(this.data[day]["occ"][day][tv][i+k][1]);
                                    if (pourc_peak_4f <= this.selected_percent_peak) {
                                        depa = false;
                                    }
                                }
                                if (depa === true) {
                                    let maxi = Math.max(...tab_count);
                                    let pourcent_maxi = Math.round((100 * maxi) / peak_4f);
                                    this.result_capa["data"].push([dd, tv, heure, maxi, peak_4f, pourcent_maxi]);
                                    i = i + this.peak_threshold_time - 1;                                                                    
                                    this.result_capa["nombre"]++;                                                                      
                                }
                            }
                        }	
                    }
      
                    catch (err) {
                        show_popup("Erreur ! ", `Les donn&eacute;es du TV: ${tv} du ${day} ne sont pas r&eacute;cup&eacute;r&eacute;es en B2B`);
                        console.log(err);
                    }
            }
            
        }
    } 

    /*  ----------------------------------------------------------------------------------------------------------------
	  récupère un tableau des dates où il y a un dépassement
	  sert à ne charger que ces dates là pour l'affichage H20:Occ
	  	@param {nodeList} td_tv - liste des élément <td>
            ex : <td class="capa tv" data-date="2021-06-21" data-tv="RAEE" data-deb="06:19" data-fin="07:19">RAEE</td>
	-------------------------------------------------------------------------------------------------------------------- */
    extract_date(td_tv) {
        let arr = [];
        for (const td of td_tv) {
            arr.push(td.dataset.date);
        }
        // enlève les doublons
        return [...new Set(arr)];
    }

    /*  ----------------------------------------
	        Ajoute les clicks sur TV
	    ---------------------------------------- */
    async add_capa_listener() {
        const td_tv = document.querySelectorAll('.capa');
        const date_arr = this.extract_date(td_tv);

        let h = {}, o = {};
        for (const d of date_arr) {
           h[d] = this.data[d]["h20"];
           o[d] = this.data[d]["occ"];
        }

        for (const td of td_tv) {
            let dat = td.dataset.date;
            let deb = td.dataset.deb;
            let fin = td.dataset.fin;
            let tv = td.dataset.tv;
                              
            td.addEventListener('click', event => {
                let data = [];
                let dataAxis = [];	
                let data_occ = [];
                let dataAxis_occ = [];
                try {
                    h[dat][dat][tv].forEach(value => {
                        if (time_to_min(value[0]) > time_to_min(deb)-graph_margin && time_to_min(value[0]) < time_to_min(fin)+graph_margin) {
                            dataAxis.push(value[0]);
                            data.push(value[1]);
                        }
                    });	
                    o[dat][dat][tv].forEach(value => {
                        if (time_to_min(value[0]) > time_to_min(deb) && time_to_min(value[0]) < time_to_min(fin)) {
                            dataAxis_occ.push(value[0]);
                            data_occ.push(value[1]);
                        }
                    });	
                    
                    let full_tv = "LFM"+tv;
                    let peak = this.data[dat]["mvotmv-b2b"]["OTMV"][full_tv][0]["otmv"]["peak"]["threshold"];	
                    let sustain = this.data[dat]["mvotmv-b2b"]["OTMV"][full_tv][0]["otmv"]["sustained"]["threshold"];		
                    if (data.length === 0) { 
                        if (data_occ.length === 0) {
                            document.getElementById('graph-container-h20').classList.add('off');
                            document.getElementById('graph-container-occ').classList.add('off');
                            show_popup("Pas de données","La plage horaire est indisponible");
                        } else {
                            document.getElementById('graph-container-occ').classList.remove('off');
                            show_popup("Le H20 n'est pas calculable","En effet, le TV n'a ouvert assez longtemps et/ou n'est dans la plage disponible 4h-20h40 UTC"); 
                            show_occ_graph('graph_occ', dataAxis_occ, data_occ, peak, sustain, tv);
                            show_h20_graph('graph_h20', dataAxis, data, 0, 0, "NO DATA");
                        }
                    } else {
                        document.getElementById('graph-container-h20').classList.remove('off');
                        document.getElementById('graph-container-occ').classList.remove('off');
                        const full_tv = "LFM"+tv;
                        let mv_4f = this.data[dat]["mvotmv-b2b"]["MV"][full_tv][0]["capacity"];
                        const mv_ods = 0;
                        show_h20_graph('graph_h20', dataAxis, data, mv_4f, mv_ods, tv);
                        show_occ_graph('graph_occ', dataAxis_occ, data_occ, peak, sustain, tv);
                    }
                }
      
                catch (err) {
                    show_popup("Attention ! ", "Les données du TV: "+tv+" n'ont pas été récupérées en B2B.");
                    console.log(err);
                }
            })
        }
    }

}





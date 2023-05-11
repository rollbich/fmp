class overload {

    constructor(containerId, type, start_day, end_day, zone, selected_percent) {
        this.result_h20 = {};
        this.result_capa = {};
        this.type = type;
        this.start_day = start_day;
        this.end_day = end_day;
        this.zone = zone;
        this.selected_percent = selected_percent;
        this.containerId = containerId;
        this.show_capa_H20();
    }

    /*  ----------------------------------------------------------------------------------
	 Affiche le dépassement Capa
		@param {string} containerId - Id du conteneur
	 	@param {string} zone - "AE" ou "AW"
		@param {string} start_day - "yyyy-mm-dd"
		@param {string} end_day - "yyyy-mm-dd"
		@param {integer} selected_pourcent - pourcentage de dépassement de MV
	---------------------------------------------------------------------------------- */
    async show_capa_H20() {
        await this.calc_capa_H20();
        console.log("Calc_capa_ok");
        let res = `<table class="depassement">
                     <caption>Journées du ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</caption>
                     <thead>
                        <tr class="titre"><th class="space">Date</th><th>TV</th><th>Heure</th><th>H/20</th><th>MV</th><th>% de la MV</th></tr>
                    </thead>
                    <tbody>`;
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

    /*  ----------------------------------------------------------------------------------
	 Calcule le dépassement Capa
		@param {string} zone - "AE" ou "AW"
		@param {string} start_day - "yyyy-mm-dd"
		@param {string} end_day - "yyyy-mm-dd"
		@param {integer} selected_pourcent - pourcentage de dépassement de MV
		@results {object} - {
			"filtre": % du filtre (= selected_pourcent),
			"data" : [ [date, tv, heure, count, mv, pourcentage_mv], ... ]
		}
	---------------------------------------------------------------------------------- */
    async calc_capa_H20() {
        const nom_fichier = "../b2b/MV.json";
        const mv_json = await loadJson(nom_fichier);
        const days = get_dates_array(new Date(this.start_day), new Date(this.end_day));
        
        for (let day of days) {
            const sch = new schema_rea(day, this.zone);
            const s = await sch.read_schema_realise();
            if (typeof s !== 'undefined') {
                const temp = await get_h20_b2b(day, this.zone, s);	
                Object.assign(this.result_h20, temp);
            }
        }
        
        const z = this.zone === "AE" ? "EST" : "OUEST";
        
        this.result_capa["data"] = [];
        this.result_capa["filtre"] = this.selected_percent;
        this.result_capa["zone"] = z;
        this.result_capa["range"] = [this.start_day, this.end_day];
        
        for (let day in this.result_h20) {
            for (var tv in this.result_h20[day]) {
                    try {
                        let mv = parseInt(mv_json[`TV-${z}`][tv]["MV"]);
                        this.result_h20[day][tv].forEach(value => {
                            let count = value[1];
                            let pourcentage_mv = Math.round((100 * count) / mv);
                            
                            if (pourcentage_mv >= this.selected_percent) {
                                let dd = reverse_date(day);	
                                this.result_capa["data"].push([dd, tv, value[0], count, mv, pourcentage_mv]);
                            }
                        });	
                    }
      
                    catch (err) {
                        show_popup("Erreur ! ", "Les données du TV: "+tv+" ne sont pas récupérées en B2B ou alors le TV n'est pas défini dans le fichier MV.json");
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
		@param {string} zone - "AE"ou "AW"
	---------------------------------------- */
    async add_capa_listener() {
        const td_tv = document.querySelectorAll('.capa');
        const date_arr = this.extract_date(td_tv);

        let h = {}, o = {};
        for (const d of date_arr) {
            const sch = new schema_rea(d, this.zone);
            const s = await sch.read_schema_realise();	
            h[d] = await get_h20_b2b(d, this.zone, s);
            console.log("H20_ok");
            o[d] = await get_occ_b2b(d, this.zone, s);
        }

        for (const td of td_tv) {
            let dat = td.dataset.date;
            let deb = td.dataset.deb;
            let fin = td.dataset.fin;
            let tv = td.dataset.tv;
                              
            td.addEventListener('click', function(event) {
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
                        if (time_to_min(value[0]) > time_to_min(deb)-graph_margin && time_to_min(value[0]) < time_to_min(fin)+graph_margin) {
                            dataAxis_occ.push(value[0]);
                            data_occ.push(value[1]);
                        }
                    });	
                    
                    let peak = o[dat][dat][tv][0][2];
                    let sustain = o[dat][dat][tv][0][3];			
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
                        let mv = h[dat][dat][tv][0][2];
                        let mv_ods = h[dat][dat][tv][0][2];
                        show_h20_graph('graph_h20', dataAxis, data, mv, mv_ods, tv);
                        show_occ_graph('graph_occ', dataAxis_occ, data_occ, peak, sustain, tv);
                    }
                }
      
                catch (err) {
                    show_popup("Attention ! ", "Les données du TV: "+tv+" n'ont pas été récupérées en B2B.");
                }
            })
        }
    }

}





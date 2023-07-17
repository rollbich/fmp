class overload {

    /*  ----------------------------------------------------------------------------------
		@param {string} containerId - Id du conteneur
	 	@param {string} type - "H20" ou "peak"
		@param {string} start_day - "yyyy-mm-dd"
		@param {string} end_day - "yyyy-mm-dd"
        @param {string} zone - "AE" ou "AW"
		@param {integer} selected_pourcent - pourcentage de dépassement de MV / OTMV
	---------------------------------------------------------------------------------- */

    constructor(containerId, type, start_day, end_day, zone, selected_percent) {
        this.result_h20 = {};
        this.result_peak = {};
        this.result_capa = {};
        this.type = type;
        this.start_day = start_day;
        this.end_day = end_day;
        this.zone = zone;
        this.z = this.zone === "AE" ? "est" : "ouest";
        this.selected_percent = selected_percent;
        this.containerId = containerId;
        this.mv_json = null;
        this.mv_b2b_4f = null;
        this.otmv_b2b_4f = null;
        // dépassement de 5mn mini
        this.peak_threshold_time = 5;
    }

    async init() {
        const nom_fichier = "../b2b/MV.json";
        this.mv_json = await loadJson(nom_fichier);
        /*
        this.mv_b2b = new mv(convertDate(new Date()), this.z);
        this.mv_b2b_4f = await this.mv_b2b.get_b2b_mvs();
        if (this.mv_b2b_4f === null) show_popup('Erreur connexion B2B', "MVs non récupérées");
        this.otmv_b2b_4f = await this.mv_b2b.get_b2b_otmvs();
        if (this.otmv_b2b_4f === null) show_popup('Erreur connexion B2B', "OTMVs non récupérées");
        */
        const dd = this.start_day.split("-");
        const rd = remove_hyphen_date(this.start_day);
        let year = dd[0];
        let month = dd[1];
        let file_name;
        file_name = `../b2b/json/${year}/${month}/${rd}-mv_otmv-${this.z}.json`;
        let mv_otmv = await loadJson(file_name);
        if (typeof mv_otmv === 'undefined') {
            const default_date_MV_json = await loadJson("../default_date_MV_OTMV.json");
            const ddmv = remove_hyphen_date(default_date_MV_json['date']);
            const default_date_MV = reverse_date(default_date_MV_json['date']);
            file_name = `../b2b/json/2023/06/${ddmv}-mv_otmv-${this.z}.json`;
            mv_otmv = await loadJson(file_name);
            show_popup(`MV/OTMV du jour indisponibles`, `Date des MV/OTMV : ${default_date_MV}`);
        }
        this.mv_b2b_4f = mv_otmv["MV"];
        this.otmv_b2b_4f = mv_otmv["OTMV"];
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
        
        for (let day of days) {
            const sch = new schema_rea(day, this.zone);
            const s = await sch.read_schema_realise();
            if (typeof s !== 'undefined') {
                const temp = await get_h20_b2b(day, this.zone, s);	
                Object.assign(this.result_h20, temp);
            } else {
                show_popup(`Attention<br>le ${reverse_date(day)}`, `Fichier réalisé manquant`);
            }
        }
        
        let z = this.z.toUpperCase();
        
        this.result_capa["data"] = [];
        this.result_capa["filtre"] = this.selected_percent;
        this.result_capa["zone"] = z;
        this.result_capa["range"] = [this.start_day, this.end_day];
        this.result_capa["nombre"] = {"130":0, "140":0, "150":0, "160":0, "170":0, "180":0};
        
        for (let day in this.result_h20) {
            for (var tv in this.result_h20[day]) {
                    let mv_ods = parseInt(this.mv_json[`TV-${z}`][tv]["MV"]);
                    const full_tv = "LFM"+tv;
                    let mv_4f = this.mv_b2b_4f[full_tv][0]["capacity"];
                    try {
                        this.result_h20[day][tv].forEach(value => {
                            let count = value[1];
                            let pourcentage_mv_4f = Math.round((100 * count) / mv_4f);
                            let dd = reverse_date(day);	
                            if (pourcentage_mv_4f >= this.selected_percent) {
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
                        show_popup("Erreur ! ", "Les données du TV: "+tv+" du "+day+" ne sont pas récupérées en B2B ou alors le TV n'est pas défini dans le fichier MV.json<br>MV 4f : "+mv_4f);
                    }
            }
            
        }
    } 

    /*  ----------------------------------------------------------------------------------
	      Calcule le dépassement Capa
            @results {object} - {
                "filtre": % du filtre (= selected_pourcent),
                "data" : [ [date, tv, heure, count, mv, pourcentage_mv], ... ],
                "nombre" : {"130":nb occurence, "140":nb occurence, ..., "180":nb}
            }
	---------------------------------------------------------------------------------- */
    async calc_capa_peak() {

        const days = get_dates_array(new Date(this.start_day), new Date(this.end_day));
        
        for (let day of days) {
            const sch = new schema_rea(day, this.zone);
            const s = await sch.read_schema_realise();
            if (typeof s !== 'undefined') {
                const temp = await get_occ_b2b(day, this.zone, s);	
                Object.assign(this.result_peak, temp);
            } else {
                show_popup(`Attention<br>le ${reverse_date(day)}`, `Fichier réalisé manquant`);
            }
        }
        
        let z = this.z.toUpperCase();
        
        this.result_capa["data"] = [];
        this.result_capa["filtre"] = this.selected_percent;
        this.result_capa["zone"] = z;
        this.result_capa["range"] = [this.start_day, this.end_day];
        this.result_capa["nombre"] = 0;
        

        for (let day in this.result_peak) {
            for (var tv in this.result_peak[day]) {
                    const full_tv = "LFM"+tv;
                    let peak_4f = this.otmv_b2b_4f[full_tv][0]["otmv"]["peak"]["threshold"];
                    try {
                        const l = this.result_peak[day][tv].length;
                        for(let i=0;i<l-1-this.peak_threshold_time;i++) {
                            let value = this.result_peak[day][tv][i];
                            let heure = value[0];
                            let count = value[1];
                            let pourcentage_peak_4f = Math.round((100 * count) / peak_4f);
                            let dd = reverse_date(day);	
                            if (pourcentage_peak_4f > 100) {
                                console.log("Tv:"+tv+"   heure: "+heure+"  count: "+count);
                                // k commence à 1 (on a déjà la première valeur qui a dépassé)
                                let depa = true;
                                let tab_count = [count];
                                console.log(tab_count);
                                for(let k=1;k<this.peak_threshold_time;k++) {
                                    let pourc_peak_4f = Math.round((100 * this.result_peak[day][tv][i+k][1]) / peak_4f);
                                    tab_count.push(this.result_peak[day][tv][i+k][1]);
                                    if (pourc_peak_4f < 101) {
                                        console.log("turned to false    pour4f: "+pourc_peak_4f+"    selectedp: "+this.selected_percent);
                                        depa = false;
                                    }
                                }
                                if (depa === true) {
                                    console.log("depa true");
                                    let maxi = Math.max(...tab_count);
                                    let p_maxi = Math.round((100 * maxi) / peak_4f);
                                    console.log("Maxi: "+maxi+"   p_maxi: "+p_maxi);
                                    this.result_capa["data"].push([dd, tv, heure, maxi, peak_4f, p_maxi]);
                                    i = i + this.peak_threshold_time - 1;                                                                    
                                    this.result_capa["nombre"]++;                                                                      
                                }
                            }
                        }	
                    }
      
                    catch (err) {
                        console.log("Erreur: "+tv);
                        console.log( this.result_capa);
                        show_popup("Erreur ! ", "Les données du TV: "+tv+" du "+day+" ne sont pas récupérées en B2B ou alors le TV n'est pas défini dans le fichier MV.json<br>MV 4f : "+peak_4f);
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
                    
                    //let peak = o[dat][dat][tv][0][2];
                    //let sustain = o[dat][dat][tv][0][3];
                    let full_tv = "LFM"+tv;
                    let peak = this.otmv_b2b_4f[full_tv][0]["otmv"]["peak"]["threshold"];	
                    let sustain = this.otmv_b2b_4f[full_tv][0]["otmv"]["sustained"]["threshold"];		
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
                        let z = this.zone === "AE" ? "EST" : "OUEST";
                        let mv_ods = parseInt(this.mv_json[`TV-${z}`][tv]["MV"]);
                        const full_tv = "LFM"+tv;
                        let mv_4f = this.mv_b2b_4f[full_tv][0][ "capacity"];
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





class period_vols_bdd {
	/*  ------------------------------------------------------------------	
			@param {string} start_day - "yyyy-mm-dd"
			@param {string} end_day - "yyyy-mm-dd"
			@param {string} zone - "crna", "est", "ouest" ou "app"
		------------------------------------------------------------------ */
    #aero = {
        "Nice": ["LFMN","LFMD","LFTZ","LFTH"],
        "Provence": ["LFML","LFMV","LFMQ","LFMI","LFMC","LFMA"],
        "Lyon": ["LFLL", "LFLY", "LFLS", "LFLU"],
        "Montpellier": ["LFMT","LFMP","LFTW", "LFMU","LFMZ"],
        "Clermont": ["LFLC","LFMH","LFLV"],
        "Chambery": ["LFLB", "LFLP", "LFLI"],
        "Corse": ["LFKB","LFKC","LFKJ","LFKF","LFKS","LFKO","LFKA"],
        "Divers": ["LFMY","LFMO","LFMS","LFMF","LFTF","LFNA"]
    }
    
    #selected_ad = ["LFMN", "LFML", "LFLL", "LFMT", "LFMD", "LFTZ", "LFTH", "LFKB", "LFKC", "LFKJ", "LFKF", "LFTW", "LFMP", "LFLS", "LFLY", "LFLB", "LFLP", "LFLC","LFMV"];
    #reste_ad = ["LFMQ","LFMU","LFLV","LFLN","LFLU","LFMI","LFMH","LFMA","LFLI","LFMC","LFKS","LFMY","LFMO","LFKA","LFKO","LFMS","LFMZ","LFMF","LFTF","LFLE",
    "LFLG","LFLJ","LFLM","LFLO","LFNA","LFNB","LFNG","LFNH","LFXA"];

	constructor() {
        this.zone = document.getElementById('zone').value;
        this.show_zone_menu();
        this.zone_button_listener();
	}

    zone_button_listener() {
        const z = document.querySelector('#zone');
        z.addEventListener('change', (e) => {
            document.getElementById('traffic_menu').innerHTML = "";
            document.getElementById('result').innerHTML = "";
            document.getElementById('graph-container').classList.add('off');
            document.getElementById('graph-container2').classList.add('off');
            document.getElementById('graph-container3').classList.add('off');
            this.zone = e.target.value;
            this.show_zone_menu();
        });
    }

    show_zone_menu() {
        let ad_html;
        if (this.zone === "app") {
            ad_html = `
            <div class="aero_div">
                <div class="aero_list"> 
                    <h2>S&eacute;lectionner les AD : (pr&eacute;s&eacute;lection en vert)</h2>
                        <div class="airport_block">
                            <span class="ad-selector">`;
                                this.#selected_ad.forEach(ad => {
                                    ad_html += `<input type="checkbox" id="${ad}-checkbox" class="ad_input" data-ad="${ad}" data-preselect="yes" checked/>
                                <label for="${ad}-checkbox">${ad}</label>`;
                                })
                            ad_html += `
                            <button id='reset_button'>Reset</button>
                            <button id='decocher_tout_button'>D&eacutecocher tout</button>
                            <button id='cocher_tout_button'>Cocher tout</button>
                            </span>
                        </div>
                        <div class="airport_block">
                            <span class="ad-selector">`;
                                this.#reste_ad.forEach(ad => {
                                    ad_html += `<input type="checkbox" id="${ad}-checkbox" class="ad_input" data-ad="${ad}" data-preselect="no"/>
                                <label for="${ad}-checkbox">${ad}</label>`;
                                })
                            ad_html += `
                            </span>
                        </div><br>
                        <div class='center'>
                            <button id='show_ad_vols_button'>Show plage de vols</button>
                            <button id='show_ad_graph_button'>Show AD graph</button>
                        </div>
                </div>
            </div>`;
            document.getElementById('traffic_menu').innerHTML = ad_html;
            this.button_ad_listener();
            this.button_ad_graph_listener();
        } else {
            ad_html = `
            <div class="aero_div">
                <div class="crna_menu">
                    <button id='show_crna_vols_button'>Show plage de vols</button>
                    <button id='show_crna_graph_button'>Show crna graph</button>
                </div>
            </div>`;
            document.getElementById('traffic_menu').innerHTML = ad_html;
            this.button_crna_listener();
            this.button_crna_graph_listener();
        }
    }

    button_crna_listener() {
        document.getElementById('show_crna_vols_button').addEventListener('click', async e => {
            await this.init();
            this.show_result_vols("result");
            $('glob_container').classList.remove('off');
        });
    }

    button_crna_graph_listener() {
        document.getElementById('show_crna_graph_button').addEventListener('click', async e => {
            await this.init();
            this.show_result_vols_crna("result");
    
            const sd_year = parseInt(new Date(this.start_day).getFullYear());
            const start_day_lastyear = convertDate(get_sameday(this.start_day, sd_year - 1));
            const ed_year = parseInt(new Date(this.end_day).getFullYear());
            const end_day_lastyear = convertDate(get_sameday(this.end_day, ed_year - 1));

            document.getElementById('graph-container').classList.remove('off');
            document.getElementById('graph-container2').classList.remove('off');
            document.getElementById('graph-container3').classList.remove('off');
            
            const traffic_year = this.vols;
            const traffic_lastyear = await this.get_vols_crna(start_day_lastyear, end_day_lastyear);
            console.log("traffic crna year");
            console.log(traffic_year);
            console.log("traffic crna last year");
            console.log(traffic_lastyear);
            
            const dataAxis = [];
            const data_CTA = [];
            const data_CTA_lastyear = [];
            const data_CTAE = [];
            const data_CTAE_lastyear = [];
            const data_CTAW = [];
            const data_CTAW_lastyear = [];
            traffic_year.forEach( elem => {
                dataAxis.push(elem.jour);
                data_CTA.push(elem.LFMMCTA_regdemand);
                data_CTAE.push(elem.LFMMCTAE_regdemand);
                data_CTAW.push(elem.LFMMCTAW_regdemand);
            })
            traffic_lastyear.forEach( elem => {
                data_CTA_lastyear.push(elem.LFMMCTA_regdemand);
                data_CTAE_lastyear.push(elem.LFMMCTAE_regdemand);
                data_CTAW_lastyear.push(elem.LFMMCTAW_regdemand);
            })
            show_vols_period("graph-container", dataAxis, data_CTA, data_CTA_lastyear, null, "LFMMCTA");
            show_vols_period("graph-container2", dataAxis, data_CTAE, data_CTAE_lastyear, null, "LFMM Est");
            show_vols_period("graph-container3", dataAxis, data_CTAW, data_CTAW_lastyear, null, "LFMM West");
            $('glob_container').classList.remove('off');
        });
    }

    button_ad_listener() {
        document.getElementById("decocher_tout_button").addEventListener('click', e => {
            document.querySelectorAll("input.ad_input").forEach( elem => {
                elem.checked=false;
            })
        })
        document.getElementById("cocher_tout_button").addEventListener('click', e => {
            document.querySelectorAll("input.ad_input").forEach( elem => {
                elem.checked=true;
            })
        })
        document.getElementById("reset_button").addEventListener('click', e => {
            document.querySelectorAll("input.ad_input").forEach(elem => {
                if (elem.dataset.preselect === "yes") elem.checked=true; else elem.checked=false;
            })
        })

        document.getElementById("show_ad_vols_button").addEventListener('click', async e => {
            await this.init();
            this.show_result_vols("result");

            const checked_ad = this.checked_AD();
            if (checked_ad.length === 1) { 
                document.getElementById('show_ad_graph_button').click();
                document.getElementById('graph-container').classList.remove('off');
                document.getElementById('graph-container2').classList.remove('off');
            } else {
                document.getElementById('graph-container').classList.add('off');
                document.getElementById('graph-container2').classList.add('off');
            }

            $('glob_container').classList.remove('off');
        })
    }

    checked_AD() {
        const checked_AD = [];
        document.querySelectorAll("input.ad_input").forEach( elem => {
            if (elem.checked) checked_AD.push(elem.dataset.ad);
        })
        return checked_AD;
    }

    button_ad_graph_listener() {
        document.getElementById('show_ad_graph_button').addEventListener('click', async e => {
            
            /*  ---------------------------------------------------------------------------------
                                        Graph plage de date
                --------------------------------------------------------------------------------- */
            await this.init();
            this.show_result_vols_app("result");
    
            const sd_year = parseInt(new Date(this.start_day).getFullYear());
            const start_day_lastyear = convertDate(get_sameday(this.start_day, sd_year - 1));
            const ed_year = parseInt(new Date(this.end_day).getFullYear());
            const end_day_lastyear = convertDate(get_sameday(this.end_day, ed_year - 1));
            
            const checked_AD = this.checked_AD();
    
            let airport;
            if (checked_AD.length !== 1) { 
                alert("Vous devez cocher 1 seul AD pour le graph"); 
                return; 
            } else {
                airport = checked_AD; 
                console.log("Airport: "+airport);
            }

            document.getElementById('graph-container').classList.remove('off');
            document.getElementById('graph-container2').classList.remove('off');
            
            const traffic_year = this.vols;
            const traffic_lastyear = await this.get_vols_app(start_day_lastyear, end_day_lastyear);
            console.log("traffic year");
            console.log(traffic_year);
            console.log("traffic last year");
            console.log(traffic_lastyear);
            
            const dataAxis = [];
            const data = [];
            const data_lastyear = [];
            traffic_year.forEach( elem => {
                dataAxis.push(elem.jour);
                data.push(elem[airport]);
            })
            traffic_lastyear.forEach( elem => {
                data_lastyear.push(elem[airport]);
            })

            /*  ---------------------------------------------------------------------------------
                                        Graph semaine sur l'année
                --------------------------------------------------------------------------------- */
            const year = parseInt(new Date().getFullYear());
            const last_year = year-1;
    
            //const nb_week = weeksInYear(year);
            // ATTENTION : à corriger si semaine 1
            const nb_week = getPreviousWeekNumber(new Date())[1];
            const nb_week_lastyear = weeksInYear(last_year);
        
            const nb = Math.max(nb_week, nb_week_lastyear);
            const listWeek = [];
            for (let k=1;k<nb+1;k++) { listWeek.push(k);}
    
            const week_arr_year = [];
            const week_arr_lastyear = []; 

            const first_day_of_lastyear = convertDate(weekDateToDate(last_year, 1, 1)); // 1er lundi du week 1
            console.log("first day of last year");
            console.log(first_day_of_lastyear);
            const last_day_of_lastyear = convertDate(weekDateToDate(last_year, nb_week_lastyear, 7));
            console.log("last day of last year");
            console.log(last_day_of_lastyear);

            const first_day_of_year = convertDate(weekDateToDate(year, 1, 1)); // 1er lundi du week 1
            const previousWN = getPreviousWeekNumber(new Date());
            const last_day_of_year = convertDate(weekDateToDate(previousWN[0], previousWN[1], 7)); // Dimanche de la semaine dernière

            const yearly_traffic_year = await this.get_vols_app(first_day_of_year, last_day_of_year);
            console.log('yearly_traffic_year');
            console.log(yearly_traffic_year);
            const yearly_traffic_lastyear = await this.get_vols_app(first_day_of_lastyear, last_day_of_lastyear); 
            console.log('yearly_traffic_lastyear');
            console.log(yearly_traffic_lastyear); 

            for (let k=1;k<nb_week_lastyear+1;k++) { 
                const start = weekDateToDate(last_year, k, 1); // Obj Date du lundi 
                const end = weekDateToDate(last_year, k, 7); // Obj Date du dimanche
                let index_start = ecart_date(new Date(first_day_of_lastyear), new Date(start));
                const arr_days = get_dates_array(start, end);
                let vols = 0;
                arr_days.forEach( day => {
                    vols += yearly_traffic_lastyear[index_start][airport];
                    index_start++;
                })
                week_arr_lastyear.push(vols);
            }
            for (let k=1;k<nb_week+1;k++) { 
                const start = weekDateToDate(year, k, 1); // Obj Date du lundi 
                const end = weekDateToDate(year, k, 7); // Obj Date du dimanche
                let index_start = ecart_date(new Date(first_day_of_year), new Date(start));
                const arr_days = get_dates_array(start, end);
                let vols = 0;
                arr_days.forEach( day => {
                    vols += yearly_traffic_year[index_start][airport];
                    index_start++;
                })
                week_arr_year.push(vols);
            }
    
            $('glob_container').classList.remove('off');
            show_traffic_graph("graph-container2", year, listWeek, week_arr_year, week_arr_lastyear, null, airport);
            show_vols_period("graph-container", dataAxis, data, data_lastyear, null, airport);
    
        });
    }
	
    /*  -------------------------------------------------------------
		Lit la bdd
			@param {string} start_day - "yyyy-mm-dd"
            @param {string} end_day - "yyyy-mm-dd"
			@param {string} zone - "est" ou "ouest"
            @returns {date1: objet_vol, date2: objet_vol,...}
	----------------------------------------------------------------- */
    async init() {
        this.start_day = document.getElementById('start').value; // yyyy-mm-dd
        this.end_day = document.getElementById('end').value; // yyyy-mm-dd
        this.zone = document.getElementById('zone').value;
        if (this.zone === "app") {
            this.vols = await this.get_vols_app(this.start_day, this.end_day);
            let checked_list = document.querySelectorAll("input.ad_input:checked");
            checked_list = Array.from(checked_list);
            this.checked_ad = checked_list.map(el => el.dataset.ad);
            console.log(this.checked_ad);
        } else {
            this.vols = await this.get_vols_crna(this.start_day, this.end_day);
        }
        this.check_dates();
        console.log(this.vols);
	}

    // Vérifie que toutes les dates existent bien pour faire la stat
    check_dates() {
        const dates = get_dates_array(new Date(this.start_day), new Date(this.end_day));
        const vols_dates = this.vols.map(obj => obj.jour);
        dates.forEach(day => {
            if (vols_dates.includes(day) === false) alert(`La stat totale est fausse. Il manque la date ${day} dans la bdd`);
        });
    }

	async get_vols_crna(start_day, end_day) {
        const cles = {
            "start_day": start_day, 
            "end_day": end_day,
            "zone": "crna",
            "fonction": "get_vols_crna"
        }	
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cles)
        };
        try {
            const response = await fetch("../php/bdd_sql.php", data);
            if (!response.ok) { // pas entre 200 et 300
                throw new Error("Network response was not OK");
            }
            return await response.json();
        }
        catch (err) {
            console.error(err);
            alert(err);
        }
	}

    async get_vols_app(start_day, end_day) {
        const cles = {
            "start_day": start_day, 
            "end_day": end_day,
            "fonction": "get_vols_app"
        }	
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cles)
        };
        try {
            const response = await fetch("../php/bdd_sql.php", data);
            if (!response.ok) { // pas entre 200 et 300
                throw new Error("Network response was not OK");
            }
            return await response.json();
        }
        catch (err) {
            console.error(err);
            alert(err);
        }
	}

    async get_vols_airport(airport) {
        const cles = {
            "start_day": this.start_day, 
            "end_day": this.end_day,
            "airport": airport,
            "fonction": "get_vols_app"
        }	
        var data = {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cles)
        };
        try {
            const response = await fetch("../php/bdd_sql.php", data);
            if (!response.ok) { // pas entre 200 et 300
                throw new Error("Network response was not OK");
            }
            return await response.json();
        }
        catch (err) {
            console.error(err);
            alert(err);
        }
	}

	get_period_vols_crna() { 
		const vols = {};
		let total_vols_est = 0, total_vols_west = 0, total_vols_cta = 0; 
		for (const obj of this.vols) {	
            total_vols_est += parseInt(obj['LFMMCTAE_regdemand']);
            total_vols_west += parseInt(obj['LFMMCTAW_regdemand']);
            total_vols_cta += parseInt(obj['LFMMCTA_regdemand']);
        }
		vols['est'] = total_vols_est;
		vols['west'] = total_vols_west;
		vols['cta'] = total_vols_cta;
		return vols;
	}

	get_period_vols_app() { 
        let total_vols = {};
		total_vols['app'] = 0;

		this.filtre_app.forEach(approche => {
			total_vols[approche] = 0;
		})
        
        for (const obj of this.vols) {
            this.filtre_app.forEach(approche => {
                total_vols[approche] += obj[approche];
            })
            total_vols['app'] += obj['flights'];
        }
		return total_vols;
	}

    async show_result_vols(containerId) {
        if (this.zone === "app") this.show_result_vols_app(containerId); else this.show_result_vols_crna(containerId);
    }

	/*  ------------------------------------------------------------------	
		 @param {string} containerId - Id de l'HTML Element container 
		------------------------------------------------------------------ */	 
        
	async show_result_vols_crna(containerId) {
		let result_vols = `<h2>Nombre de vols : ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</h2><br>`;
		result_vols += "<div class='delay'>";
		let res = `
		<table class="regulation sortable">
			<thead><tr class="titre"><th class="space">Date</th><th>Jour</th><th>CTA</th><th>Est</th><th>West</th></tr></thead>
			<tbody>`;
		let total_vols_est = 0, total_vols_west = 0, total_vols_cta = 0; 
        
        for (const obj of this.vols) {
            res += '<tr>'; 
            res +=`<td>${reverse_date(obj.jour)}</td><td>${obj.typejour}</td><td>${obj['LFMMCTA_regdemand']}</td><td>${obj['LFMMCTAE_regdemand']}</td><td>${obj['LFMMCTAW_regdemand']}</td>`;
            res += '</tr>';	
            total_vols_est += parseInt(obj['LFMMCTAE_regdemand']);
            total_vols_west += parseInt(obj['LFMMCTAW_regdemand']);
            total_vols_cta += parseInt(obj['LFMMCTA_regdemand']);
        }
        res += '</tbody></table>';
		
		result_vols += `<span class="rect">LFMM Est : ${total_vols_est} vols</span><span class="rect">LFMM West : ${total_vols_west} vols</span><span class="rect">LFMM CTA : ${total_vols_cta} vols</span>`;
		result_vols += "</div>";
		result_vols += res;
		$(containerId).innerHTML = result_vols;
		
	}

    async show_result_vols_app(containerId) {
        let total_vols_app = 0;
        let total_vols = {};
		let result_vols = `<h2>Nombre de vols : ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</h2>`;
        result_vols += `<p>La colonne APP et LFMM APP indiquent le total de tous les AD m&ecirc;me non coch&eacute;s</p><br>`;
		result_vols += "<div class='delay'>";
		let res = `
		<table class="regulation sortable">
			<thead><tr class="titre"><th class="space">Date</th><th>Jour</th><th>APP</th>`;
            this.checked_ad.forEach(approche => {
                res += `<th>${approche}</th>`;
                total_vols[approche] = 0;
            })
            res += '</tr></thead><tbody>';
        
        for (const obj of this.vols) {
            res += '<tr>'; 
            res +=`<td>${reverse_date(obj.jour)}</td><td>${obj.typejour}</td><td>${obj['flights']}</td>`;
            this.checked_ad.forEach(approche => {
                res += `<td>${obj[approche]}</td>`;
                total_vols[approche] += obj[approche];
            })
            res += '</tr>';
            total_vols_app += obj['flights'];
        }
        res += '</tbody></table>';
		
		result_vols += `<span class="rect">LFMM APP : ${total_vols_app} vols</span>`;
		result_vols += "</div>";
		result_vols += res;
		$(containerId).innerHTML = result_vols;
		
	}
}

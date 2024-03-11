class period_vols_bdd {
	/*  ------------------------------------------------------------------	
			@param {string} start_day - "yyyy-mm-dd"
			@param {string} end_day - "yyyy-mm-dd"
			@param {string} zone - "crna", "est", "ouest" ou "app"
		------------------------------------------------------------------ */
        
	constructor(start_day, end_day, zone) {
		this.start_day = start_day;
		this.end_day = end_day;
		this.zone = zone;
		this.filtre_app = ["LFMN", "LFML", "LFLL", "LFMT", "LFMD", "LFTZ", "LFTH", "LFKB", "LFKC", "LFKJ", "LFKF", "LFTW", "LFMP", "LFLS", "LFLY", "LFLB", "LFLP", "LFLC", "LFMP"];
	}
	
    /*  -------------------------------------------------------------
		Lit la bdd
			@param {string} start_day - "yyyy-mm-dd"
            @param {string} end_day - "yyyy-mm-dd"
			@param {string} zone - "est" ou "ouest"
            @returns {date1: objet_vol, date2: objet_vol,...}
	----------------------------------------------------------------- */
    async init() {
        if (this.zone === "app") {
            this.vols = await this.get_vols_app();
        } else {
            this.vols = await this.get_vols_crna();
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

	async get_vols_crna() {
        const cles = {
            "start_day": this.start_day, 
            "end_day": this.end_day,
            "zone": this.zone,
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

    async get_vols_app() {
        const cles = {
            "start_day": this.start_day, 
            "end_day": this.end_day,
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

    async show_result_vols(containerId, zone) {
        if (zone === "app") this.show_result_vols_app(containerId); else this.show_result_vols_crna(containerId);
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
        const apps = structuredClone(this.vols[0]);
        delete apps.flights;
        delete apps.jour;
        delete apps.typejour;
        let all_approches = Object.keys(apps);
        let total_vols_app = 0;
        let total_vols = {};
		let result_vols = `<h2>Nombre de vols : ${reverse_date(this.start_day)} au ${reverse_date(this.end_day)}</h2><br>`;
		result_vols += "<div class='delay'>";
		let res = `
		<table class="regulation sortable">
			<thead><tr class="titre"><th class="space">Date</th><th>Jour</th><th>APP</th>`;
            this.filtre_app.forEach(approche => {
                res += `<th>${approche}</th>`;
                total_vols[approche] = 0;
            })
            res += '</tr></thead><tbody>';
        
        for (const obj of this.vols) {
            res += '<tr>'; 
            res +=`<td>${reverse_date(obj.jour)}</td><td>${obj.typejour}</td><td>${obj['flights']}</td>`;
            this.filtre_app.forEach(approche => {
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

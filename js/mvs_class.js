class mv {
	/*  ---------------------------------------------
			@param {string} day - "yyyy-mm-dd"
			@param {string} zone - "est" ou "ouest"
		--------------------------------------------- */
	constructor(day, zone) {
		this.day = day;
		this.zone = zone;
	}

    async init_mv() {
        this.result = await this.get_b2b_mvs();
        console.log(this.result);
        this.show_existing_mvs("result");
    }

    async init_otmv() {
        //show_popup("Chargement","Patientez 5s...")
        this.result = await this.get_b2b_otmvs();
		//document.querySelector('.popup-close').click();
        console.log(this.result);
        this.show_existing_otmvs("result");
    }

	/*  ---------------------------------------------------------------------------------------
			Récupère les MVs du jour sélectionné existantes en B2B

			@return {
				"LFMA1": [
                    {
                        "applicabilityPeriod": {
                            "wef": "2024-01-12 00:00", 
                            "unt": "2024-01-12 14:00"
                        },
                        "dataSource": "AIRSPACE",
                        "capacity": 28
                    },
                    {
                        "applicabilityPeriod": {
                            "wef": "2024-01-12 14:00", 
                            "unt": "2024-01-13 00:00"
                        },
                        "dataSource": "TACTICAL",
                        "capacity": 26
                    }
                ],
				"tv": [{}, ..., {}]       
				...
			}
		--------------------------------------------------------------------------------------- */

	async get_b2b_mvs() { 
        
		try {
			let response = await fetch("../b2b/known_mvs.php", {
				method: 'POST',
				headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "zone": this.zone, "day": this.day})
			});
			if (response.ok) { // entre 200 et 300
                return Promise.resolve(response.json())
              } else {
                // l'erreur est transmise au bloc catch de loadJson
                if (response.status == 404) { return Promise.reject(new Error(`Le fichier ${response.url} n'existe pas`)); }
                return Promise.reject(new Error('Erreur: '+response.statusText))
            }  
		}
		
		catch (err) {
			show_popup("Erreur", "Chargement des MVs en B2B impossible<br>Vérifiez la connexion internet");
			console.log('Get MVs existantes Load json error: '+err.message);
		}
	}

    /*  ---------------------------------------------------------------------------------------
			Récupère les OTMVs du jour sélectionné existantes en B2B

			@return {
				"LFMA1": [
                    {
                        "applicabilityPeriod": {
                            "wef": "2024-01-12 00:00", 
                            "unt": "2024-01-12 14:00"
                        },
                        "dataSource": "AIRSPACE",
                        "otmv": {
                            "otmvDuration": "0010",
                            "trafficVolume": "LFMA1",
                            "peak" : { "threshold": 12},
                            "sustained": {"threshold": 8, "crossingOccurences": "99", "elapsed": "0139"}
                        }
                    },
                    {
                        "applicabilityPeriod": {
                            "wef": "2024-01-12 14:00", 
                            "unt": "2024-01-13 00:00"
                        },
                        "dataSource": "TACTICAL",
                        "otmv": {
                            "otmvDuration": "0010",
                            "trafficVolume": "LFMA1",
                            "peak" : { "threshold": 11},
                            "sustained": {"threshold": 7, "crossingOccurences": "99", "elapsed": "0139"}
                        }
                    }
                ],
				"tv": [{}, ..., {}]       
				...
			}
		--------------------------------------------------------------------------------------- */

    async get_b2b_otmvs() { 
		try {
			let response = await fetch("../b2b/known_otmvs.php", {
				method: 'POST',
				headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "zone": this.zone, "day": this.day})
			});
			if (response.ok) { // entre 200 et 300
                return Promise.resolve(response.json())
              } else {
                // l'erreur est transmise au bloc catch de loadJson
                if (response.status == 404) { return Promise.reject(new Error(`Le fichier ${response.url} n'existe pas`)); }
                return Promise.reject(new Error('Erreur: '+response.statusText))
            }  
		}
		
		catch (err) {
			show_popup("Erreur", "Chargement des OTMVs impossible<br>Vérifiez la connexion internet");
			console.log('Get OTMVs existantes Load json error: '+err.message);
		}
	}
 

    /*  -----------------------------------------------------------
            Affiche les MVs existantes
            @param {string} containerId - Id de l'HTML Element container	
        ------------------------------------------------------------------ */
    async show_existing_mvs(containerId) {

        let res = "<div>";
        res += `
        <table class="sortable conf">
            <caption>MVs existantes - Zone ${this.zone}</caption>
            <thead><tr class="titre"><th class="space">TV</th><th>Heure</th><th>MV</th><th>Source</th></tr></thead>
            <tbody>`.trimStart();
        
        Object.keys(this.result).forEach( tv => {
            const obj = this.result[tv]; // array de 1 ou +
            const l = obj.length;
            const hor = [];
            const mv = [];
            const s = [];
            for(let i=0;i<l;i++) {
                let t1 = obj[i].applicabilityPeriod.wef;
                let t2 = obj[i].applicabilityPeriod.unt;
                let h1 = t1.substring(t1.length - 5); // récupère l'heure
                let h2 = t2.substring(t2.length - 5); // récupère l'heure
                hor.push(h1);
                if (l === 1) hor.push(h2);
                let taux = obj[i].capacity;
                mv.push(taux);
                let source = obj[i].dataSource;
                s.push(source);
            }
            res += `<tr>`;
            res += `<td>${tv}</td><td>${hor.join('-')}</td><td>${mv.join('-')}</td><td>${s}</td>`
            res += `</tr>`;
        })

        res += '</tbody></table>';
        res += '</div>';
        $(containerId).innerHTML = res;
            
    }

/*  -----------------------------------------------------------
        Affiche les OTMVs existantes
        @param {string} containerId - Id de l'HTML Element container	
    ------------------------------------------------------------------ */
    async show_existing_otmvs(containerId) {

        let res = "<div>";
        res += `
        <table class="sortable conf">
            <caption>OTMVs existantes - Zone ${this.zone}</caption>
            <thead><tr class="titre"><th class="space">TV</th><th>Heure</th><th>Sustain</th><th>Peak</th><th>Duration</th><th>Source</th></tr></thead>
            <tbody>`.trimStart();
        
        Object.keys(this.result).forEach( tv => {
            const obj = this.result[tv]; // array de 1 ou +
            const l = obj.length;
            const hor = [];
            const sust = [];
            const p = [];
            const d = [];
            const s = [];
            for(let i=0;i<l;i++) {
                let t1 = obj[i].applicabilityPeriod.wef;
                let t2 = obj[i].applicabilityPeriod.unt;
                let h1 = t1.substring(t1.length - 5); // récupère l'heure
                let h2 = t2.substring(t2.length - 5); // récupère l'heure
                hor.push(h1);
                if (l === 1) hor.push(h2);
                let sustain = obj[i].otmv.sustained.threshold;
                sust.push(sustain);
                let peak = obj[i].otmv.peak.threshold;
                p.push(peak);
                let duration = obj[i].otmv.otmvDuration;
                d.push(duration);
                let source = obj[i].dataSource;
                s.push(source);
            }
            res += `<tr>`;
            res += `<td>${tv}</td><td>${hor.join('-')}</td><td>${sust.join('-')}</td><td>${p.join('-')}</td><td>${d.join('-')}</td><td>${s}</td>`
            res += `</tr>`;
        })

        res += '</tbody></table>';
        res += '</div>';
        $(containerId).innerHTML = res;
            
    }

}

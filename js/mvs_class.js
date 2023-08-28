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

			Attention pour les confs à un secteur, "item" n'est pas un array mais une valeur

			@return {
				"known_confs": {
					"est": [{
						"key": "E10A2B",
						"value": {
							"item": ["LFMMG12", "LFMMG34", "LFMMB12", "LFMMB34", "LFMMY12", "LFMMY34", "LFMMMNST", "LFMMAA", "LFMMBTAJ", "LFMMEK1", "LFMMEK3", "LFMMEK2" ]
						}
					},
					...
					{...}],
					"west" : []
				},
				"est": [{}, ..., {}],       // conf du jour
				"ouest": [{}, ..., {}],      // conf du jour
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
        Affiche les MVs existantes
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
            console.log("TV: "+tv+"  array"+obj);
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

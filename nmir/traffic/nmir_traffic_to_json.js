class nmir_traffic {

    constructor() {
       this.read_nmir_traffic();
    }

/*  ----------------------------------------------------------------------------------------------------------------
	Parse fichiers count de l'airspace LFMMCTA et des tv NMIR LFMRAE et LFMRAW: 
	NMIR Traffic & Delay - Hourly Monitoring of traffic - choisir per Airspace ou Traffic Volume
	Entry Day : 1er jour
	Number of days : xx
	Slice duration : 60
	Time window 00-23

		Traffic-CTA.csv
		Traffic-RAE.csv
		Traffic-RAW.csv

 	@returns {object} json
 	  
 	}
	---------------------------------------------------------------------------------------------------------------- */
    async read_nmir_traffic() {
      const nmir_RAE = "fmp/nmir/traffic/Traffic-RAE.csv";
	  const nmir_RAW = "fmp/nmir/traffic/Traffic-RAW.csv";
	  const nmir_CTA = "fmp/nmir/traffic/Traffic-CTA.csv";
        
    try { 
		const contenu_RAE = await fetch(`/${nmir_RAE}`).then( (response) => {
			if (response.ok) { // entre 200 et 300
				return Promise.resolve(response)
			} else {
				return Promise.reject(new Error('Erreur'+response.statusText))
			}
		}); 
		
		const contenu_RAW = await fetch(`/${nmir_RAW}`).then( (response) => {
			if (response.ok) { // entre 200 et 300
				return Promise.resolve(response)
			} else {
				return Promise.reject(new Error('Erreur'+response.statusText))
			}
		}); 
		
		const contenu_CTA = await fetch(`/${nmir_CTA}`).then( (response) => {
			if (response.ok) { // entre 200 et 300
				return Promise.resolve(response)
			} else {
				return Promise.reject(new Error('Erreur'+response.statusText))
			}
		}); 
	  
		const resp_RAE = await contenu_RAE.text();
		const resp_RAW = await contenu_RAW.text();
		const resp_CTA = await contenu_CTA.text();
	
	const rows_RAE = resp_RAE.split('\r\n'); // retour ligne
	const rows_RAW = resp_RAW.split('\r\n'); // retour ligne
	const rows_CTA = resp_CTA.split('\r\n'); // retour ligne
	// enlève les données d'entête
	rows_RAE.shift();
	rows_RAW.shift();
	rows_CTA.shift();
	const counts = {};
	console.log(rows_RAE);
	console.log(rows_RAW);
	console.log(rows_CTA);

	// il faut faire 3 boucles car il peut y avoir des lignes manquantes si pas de données nmir pour une heure et donc i serait différent pour les 3 espaces
	for(let i=0;i<rows_RAE.length-1;i++) {
		const ligne_RAE = rows_RAE[i].split(",");
		const day = ligne_RAE[1];
		if (typeof counts[day] === 'undefined') { counts[day] = {}; counts[day]["LFMRAE"] = 0; counts[day]["LFMRAW"] = 0; counts[day]["LFMMCTA"] = 0; }
		const type = ligne_RAE[2];
		if (type === "CTFM") {
			counts[day]["LFMRAE"] += parseInt(ligne_RAE[4]); //4 = ATC activated plus proche realité
			console.log("Day: "+day+"  "+counts[day]["LFMRAE"]);
		}
	}
	for(let i=0;i<rows_RAW.length-1;i++) {
		const ligne_RAW = rows_RAW[i].split(",");
		const day = ligne_RAW[1];
		if (typeof counts[day] === 'undefined') { counts[day] = {}; counts[day]["LFMRAE"] = 0; counts[day]["LFMRAW"] = 0; counts[day]["LFMMCTA"] = 0; }
		const type = ligne_RAW[2];
		if (type === "CTFM") {
			counts[day]["LFMRAW"] += parseInt(ligne_RAW[4]); 
		}
	}
	for(let i=0;i<rows_CTA.length-1;i++) {
		const ligne_CTA = rows_CTA[i].split(",");
		const day = ligne_CTA[1];
		if (typeof counts[day] === 'undefined') { counts[day] = {}; counts[day]["LFMRAE"] = 0; counts[day]["LFMRAW"] = 0; counts[day]["LFMMCTA"] = 0; }
		const type = ligne_CTA[2];
		if (type === "CTFM") {
			counts[day]["LFMMCTA"] += parseInt(ligne_CTA[4]);
		}
	}
	console.log(counts);
	
	for (let [key, value] of Object.entries(counts)) {
		let vols = {};
		vols["LFMMFMPE"] = [];
		vols["LFMMFMPW"] = [];
		vols["LFMMCTA"] = ["LFMMCTA", key, value["LFMMCTA"]];
		vols["LFMMFMPE"].push(["LFMRAE", key, value["LFMRAE"]]);
		vols["LFMMFMPW"].push(["LFMRAW", key, value["LFMRAW"]]);
		convert(vols);
	}
	
	async function convert(vols) {
		
		var data = {
			method: "post",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(vols)
		};
		await fetch( 'export_nmir_traffic_to_json.php', data);
		/*
		.then((response) => {
			//alert("ok");
		});
		*/
	}
	
    }
    catch (err) {
        alert(err.message);
    }  
    }
}
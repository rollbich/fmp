// Récupère la CAPA OLAF

async function get_olaf(zone, day, yesterday) { 
	try {
		let response = await fetch("../php/get_capa.php", {
			method: 'POST',
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ "zone": zone, "day": day, "yesterday": yesterday})
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
		alert('Get OLAF Load json error: '+err.message);
	}
}

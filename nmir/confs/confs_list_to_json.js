class confs_list {

    constructor() {
       this.read_confs_list();
    }

/*  ----------------------------------------------------------------------------------------------------------------
	Parse fichiers CSV des confs 
		confs-est.csv
		confs-west.csv

 	@returns {object} json
 	  
 	}
	---------------------------------------------------------------------------------------------------------------- */
    async read_confs_list() {
      const csv_est = "fmp/nmir/confs/confs-est.csv";
	  const csv_west = "fmp/nmir/confs/confs-west.csv";
        
    try { 
		const contenu_est = await fetch(`/${csv_est}`).then( (response) => {
			if (response.ok) { // entre 200 et 300
				return Promise.resolve(response)
			} else {
				return Promise.reject(new Error('Erreur1'+response.statusText))
			}
		}); 
		
		const contenu_west = await fetch(`/${csv_west}`).then( (response) => {
			if (response.ok) { // entre 200 et 300
				return Promise.resolve(response)
			} else {
				return Promise.reject(new Error('Erreur2'+response.statusText))
			}
		}); 
	  
		const resp_est = await contenu_est.text();
		const resp_west = await contenu_west.text();
	
	const rows_est = resp_est.split('\r\n'); // retour ligne
	const rows_west = resp_west.split('\r\n'); // retour ligne
	
	const confs_est = {};
	confs_est["zone"] = "est";
	const confs_west = {};
	confs_west["zone"] = "west";
	//console.log("nb rows: "+rows.length);

	for(let i=0;i<rows_est.length-1;i++) {
		const ligne_est = rows_est[i].split(";");
		const nb_sect = parseInt(ligne_est[0]);
		console.log("nb sect: "+nb_sect);
		if (typeof confs_est[nb_sect] === 'undefined') { confs_est[nb_sect] = {}; }
		const conf_name = ligne_est[1];
		confs_est[nb_sect][conf_name] = [];
		for(let k=2;k<2+nb_sect;k++) {
			confs_est[nb_sect][conf_name].push(ligne_est[k]);
		}
	}
	for(let i=0;i<rows_west.length-1;i++) {
		const ligne_west = rows_west[i].split(";");
		const nb_sect = parseInt(ligne_west[0]);
		if (typeof confs_west[nb_sect] === 'undefined') { confs_west[nb_sect] = {}; }
		const conf_name = ligne_west[1];
		confs_west[nb_sect][conf_name] = [];
		for(let k=2;k<2+nb_sect;k++) {
			confs_west[nb_sect][conf_name].push(ligne_west[k]);
		}
	}
	
	console.log(confs_est);
	console.log(confs_west);
	convert(confs_est);
	convert(confs_west);
	
	async function convert(vols) {
		
		var data = {
			method: "post",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(vols)
		};
		await fetch( 'export_csv_confs_to_json.php', data);
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
class nmir_reg {

    constructor() {
       this.read_nmir_reg();
    }

/*  ----------------------------------------------------------------------------------------------------------------
	Parse fichier NMIR : Reg_with_Applied_Rate.csv

 	@returns {object} json
 	  
 	}
	---------------------------------------------------------------------------------------------------------------- */
    async read_nmir_reg() {
      const fichier_nmir = "fmp/regulations/Regulations.csv";
		
      const reg = {};
        
      try { 
		const contenu = await fetch(`/${fichier_nmir}`).then( (response) => {
			if (response.ok) { // entre 200 et 300
				return Promise.resolve(response)
			} else {
				return Promise.reject(new Error('Erreur'+response.statusText))
			}
		}); 
		
		const lfmm_tvset = ["LFMMFMPE", "LFMMFMPW", "LFMMAPP"];
		const lfbb_tvset = ["LFBBFMP", "LFBBAPP"];
		const lfee_tvset = ["LFEEFMP", "LFEEAPP"];
		const lfff_tvset = ["LFFFFMPE", "LFFFFMPW", "LFFFAD"];
		const lfrr_tvset = ["LFRRFMP", "LFRRAPP"];
		const dsna_tvset = ["LFDSNA"];
		
        const response = await contenu.text();
		const rows = response.split('\n'); // retour ligne
        // enlève les données d'entête
        rows.shift();
        
		console.log("nb rows: "+rows.length);
		for(let i=0;i<rows.length;i++) {
			//console.log("i: "+i);
			const ligne = rows[i].split(",");
			const TVS = ligne[0];
			const TVId = ligne[1];
			const RegId = ligne[2];
			const App_Wef = ligne[4].substring(0, 16);
			const App_Unt = ligne[5].substring(0, 16);
			const Rate = ligne[7];
			const Reason = ligne[9].substring(4);
			const NbVols = ligne[10];
			const Delay = ligne[13];
			const Day_Wef = ligne[4].substring(0, 10);
			const Day_Unt = ligne[5].substring(0, 10);
			// On ne peut pas utiliser ligne 18 = jour car il peut y avoir des nb à virgules dans les 3 champs précédents
			const Wef = Day_Wef.trimEnd()+" "+ligne[8].substring(3, 8);
			const Unt = Day_Unt.trimEnd()+" "+ligne[8].substring(15, 20);
			const d = `${remove_hyphen_date(Day_Wef)}`;
			if (typeof reg[d] === 'undefined') {
				reg[d] = {};
				reg[d]["LFMMFMPE"] = [];
				reg[d]["LFMMFMPW"] = [];
				reg[d]["LFMMAPP"] = [];
				reg[d]["LFBBFMP"] = [];
				reg[d]["LFBBAPP"] = [];
				reg[d]["LFEEFMP"] = [];
				reg[d]["LFEEAPP"] = [];
				reg[d]["LFFFFMPE"] = [];
				reg[d]["LFFFFMPW"] = [];
				reg[d]["LFFFAD"] = [];
				reg[d]["LFRRFMP"] = [];
				reg[d]["LFRRAPP"] = [];
				reg[d]["LFDSNA"] = [];
			}
			
			//console.log("rows: "+rows[i]);
			let nbConstraints = 1;
			
			if(typeof rows[i+1] !== 'undefined') {
				for(let j=i+1;j<rows.length;j++) {
					//console.log("j: "+j);
					const lig = rows[j].split(",");
						if (RegId === lig[2]) {
							nbConstraints++;
						}
				}
			}
			
			//console.log("nb const: "+nbConstraints);

			let constraints = `{
				"constraintPeriod": {
					"wef": "${Wef}",
					"unt": "${Unt}"
				},
				"normalRate": ${Rate},
				"pendingRate": 0,
				"equipmentRate": 0
			}`;
			
			for(let k=1;k<nbConstraints;k++) {
				console.log("plusieurs taux");
				const lign = rows[i+k].split(",");
				//console.log("2: "+lign);
				//console.log("18: "+lign[17]);
				const Wef = ligne[4].substring(0, 10)+" "+lign[8].substring(3, 8);
				const Unt = ligne[5].substring(0, 10)+" "+lign[8].substring(15, 20);
				constraints += `, {
					"constraintPeriod": {
						"wef": "${Wef}",
						"unt": "${Unt}"
					},
					"normalRate": ${lign[7]},
					"pendingRate": 0,
					"equipmentRate": 0
				}`;
			}
			//console.log(constraints);
			const obj = `{
				"regId": "${RegId}",
				"tv": "${TVId}",
				"applicability": {
					"wef": "${App_Wef}",
					"unt": "${App_Unt}"
				},
				"constraints": [${constraints}],
				"reason": "${Reason}",
				"delay": ${Delay},
				"impactedFlights": ${NbVols},
				"TVSet": "${TVS}"
			}`;
			//console.log(obj);
			const json_obj = JSON.parse(obj);
			//console.log(json_obj);
			reg[d][TVS].push(json_obj);
			i = i + nbConstraints - 1;
		}
		console.log(reg);
		
		var data = {
			method: "post",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(reg)
		};
		fetch( 'export_nmir_to_json.php', data)
		.then((response) => {
			alert("ok");
		});
	
      }
        
      catch (err) {
          alert(err.message);
      }
        
    }
}
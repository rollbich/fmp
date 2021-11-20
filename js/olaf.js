/* ------------------------------------------------------
	Charge le json OLAF
	@param {string} zone - "E" ou "W"
	@param {string} day - "yyyy-mm-dd"
	
	@returns :
	{"2021-10-02":
		{"6-E":
			{
			"teamReserve": {
				"html":"",
				"roQuantity":3,
				"detacheQuantity":0,
				"BV":7,
				"defaultDifferentFromCurrent":null,
				"roInduction":0,
				"teamNominalQuantity":10,
				"teamQuantity":10,
				"roQuantityAssigned":0},
			"assigned":0
			},
		"5-E":
			{"teamReserve": etc...
 --------------------------------------------------------- */

async function get_olaf(zone, day) { 
	try {
		let response = await fetch("../php/get_capa.php", {
			method: 'POST',
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ "zone": zone, "day": day})
		})
		.then(rep_status); 
		let json = await response.json(); 
		return json;
	}
	
	catch (err) {
		alert('Load json error: '+err.message);
	}
}
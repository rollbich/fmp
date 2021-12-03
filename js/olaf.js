/* ------------------------------------------------------
	Charge le json OLAF
	@param {string} zone - "E" ou "W"
	@param {string} day - "yyyy-mm-dd"
	
	@returns :
	{"2021-10-02":
		{"6-E":	{
			"teamReserve": {
				"html":"",
				"roQuantity":3,
				"detacheQuantity":0,
				"BV":7,
				"defaultDifferentFromCurrent":null,
				"roInduction":0,
				"teamNominalQuantity":10,
				"teamQuantity":10,
				"roQuantityAssigned":0
			},
			"userList": {
				"17822": {
					"prenom": "Nicolas",
					"nom": "MOUSTACHE",
					"corps": "ICNA",
					"photoFichier": "17822.jpg",
					...
				},
				"27739": {
					"prenom": "John",
					"nom": "BURGUIN",
				}
			},
			"teamData": {
				"conge": {
				   "NOM1": "<tr ki=4001035 class=conge>\n\t\t<td class=w150p>RICHARD</td>\n <td class=w250p>JCF </td>\n <td class=w250p>\n\t\n\tLe <b>04/12/2021</b>\n </td>\n</tr>\n",
				   "NOM2": ...
				},
				"stage": {
					"NOM1": "<tr ...</tr>",
					"NOM2": ...
				},
				"renfort": ,
				"RO": ,
				"autre_agent":  
			},
			"decompte": {
				"stage": 3,
				"RO": 1,
				"equipe": 8,
				"JCF": 1
			}
		},
		"5-E":
			{"teamReserve": etc...
 --------------------------------------------------------- */

async function get_olaf(zone, day, yesterday) { 
	try {
		let response = await fetch("../php/get_capa.php", {
			method: 'POST',
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ "zone": zone, "day": day, "yesterday": yesterday})
		})
		.then(rep_status); 
		let json = await response.json(); 
		return json;
	}
	
	catch (err) {
		alert('Get OLAF Load json error: '+err.message);
	}
}
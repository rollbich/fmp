<?php
header("Content-type:application/json");
require_once("config_olaf.php");

/* ----------------------------------------------------------------------------------------------------------------------------------------
        API OLAF
	https://olafatco.dsna.aviation-civile.gouv.fr/ws/teamCompositionGet.php?center=LFMM&zone=$zone&dateStart=$date&dateEnd=$date&type=team
	* la zone n'est obligatoire que pour les centres bizones, E ou W
	* on peut mettre date=2022-01-24 si on veut une seule journée,
	* type= team est optionnel et permet d'enlever toutes les données nominatives et donc de réduire la taille du retour.
   ---------------------------------------------------------------------------------------------------------------------------------------- */
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
					"prenom": "Pistache",
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

function get_olaf($zone, $date, $yesterdate) {
	
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, OLAF_URL."?center=LFMM&zone=".$zone."&dateStart=".$yesterdate."&dateEnd=".$date);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
	/*------------------------------------------------------*/
	// déactiver les 2 lignes suivantes sur le serveur live
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // si pb de certificat SSL force la requête
	/*------------------------------------------------------*/
	$cred = OLAF_USER.":".OLAF_PASS;
	curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
	curl_setopt($ch, CURLOPT_USERPWD, $cred);
	$result = curl_exec($ch);
	unset($ch);   // to use with php >= 8.0 : launch garbage mechanism for $ch
	return $result;
}

if (isset($_GET["zone"]) && isset($_GET["dateStart"]) && isset($_GET["dateEnd"])) {
    $zone = $_GET["zone"];
    $dateStart= $_GET["dateStart"];
    $dateEnd = $_GET["dateEnd"];
    $olaf = get_olaf($zone, $dateEnd, $dateStart);
    echo $olaf;
} else {
    echo json_encode("Il manque des params GET dans l'url");
}

?>
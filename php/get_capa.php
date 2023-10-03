<?php
require_once("config_olaf.php");

/* ----------------------------------------------------------------------------------------------------------------------------------------
	https://olafatco.dsna.aviation-civile.gouv.fr/ws/teamCompositionGet.php?center=LFMM&zone=$zone&dateStart=$date&dateEnd=$date&type=team
	* la zone n'est obligatoire que pour les centres bizones, 
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
	// si pb de certificat SSL force la requête
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
	/*------------------------------------------------------*/
	$cred = OLAF_USER.":".OLAF_PASS;
	curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
	curl_setopt($ch, CURLOPT_USERPWD, $cred);
	$result = curl_exec($ch);
	/*
	$status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	echo "HTTP CODE:: " . $status_code;
	echo curl_error($ch);
	*/
	unset($ch);   // to use with php >= 8.0 : launch garbage mechanism for $ch
	return $result;
}

/* ----------------------------------------------------------------------
	https://lfmm-fmp.fr/php/uceso-API.php?day=$day&zone=$zone
	* @param {string} zone : est ou ouest, 
	* @param {string} date : "yyyy-mm-dd"
   ---------------------------------------------------------------------- */

function get_api($zone, $day) {
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, CAPA_API_URL."?day=$day&zone=$zone");
	curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
	/*------------------------------------------------------*/
	// déactiver les 2 lignes suivantes sur le serveur live
	// si pb de certificat SSL force la requête
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
	/*------------------------------------------------------*/
	/*
	$cred = CAPA_USER.":".CAPA_PASS;
	curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
	curl_setopt($ch, CURLOPT_USERPWD, $cred);
	*/
	$result = curl_exec($ch);
	/*
	$status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	echo "HTTP CODE:: " . $status_code;
	echo curl_error($ch);
	*/
	unset($ch);   // to use with php >= 8.0 : launch garbage mechanism for $ch
	return $result;
}

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
	$decoded = json_decode($content, true); // array
	$zone = $decoded["zone"];
	$zz = "est";
	if ($zone === "W" || $zone === "ouest") $zz = "ouest";
	$day = $decoded["day"];
	$resultat = get_api($zz, $day);
	echo $resultat;
	
} else { echo "<br/>pas json<br/>"; }


?>
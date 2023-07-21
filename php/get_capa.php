<?php
require_once("config_olaf.php");

/* ----------------------------------------------------------------------------------------------------------------------------------------
	https://olafatco.dsna.aviation-civile.gouv.fr/ws/teamCompositionGet.php?center=LFMM&zone=$zone&dateStart=$date&dateEnd=$date&type=team
	* la zone n'est obligatoire que pour les centres bizones, 
	* on peut mettre date=2022-01-24 si on veut une seule journée,
	* type= team est optionnel et permet d'enlever toutes les données nominatives et donc de réduire la taille du retour.
   ---------------------------------------------------------------------------------------------------------------------------------------- */

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
	/*
	$status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	echo "HTTP CODE:: " . $status_code;
	echo curl_error($ch);
	*/
	//curl_close($ch);  //no effect on php >= 8.0
	unset($ch);   // to use with php >= 8.0 : launch garbage mechanism for $ch
	return $result;
}

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
	$decoded = json_decode($content, true); // array
	
	$zone = $decoded["zone"];
	$day = $decoded["day"];
	$yesterday = $decoded["yesterday"];
	$resultat = get_olaf($zone, $day, $yesterday);
	echo $resultat;
	
} else { echo "<br/>pas json<br/>"; }


?>
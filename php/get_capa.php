<?php
require_once("config_olaf.php");

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
	$yesterday = date($day, strtotime('-1 day'));
	$resultat = get_api($zz, $day);
	//$resultat = get_olaf($zone, $day, $yesterday);
	echo $resultat;
	
} else { echo "<br/>pas json<br/>"; }


?>
<?php
ini_set('memory_limit', '1G');
require_once("B2B.php");
require_once("B2B-Service.php");
require_once("B2B-AirspaceServices.php");
require_once("B2B-FlightServices.php");
require_once("B2B-FlowServices.php");
include_once("config.inc.php");
include_once("hour_config".$config.".inc.php");
include_once("path.inc.php");
/* 16 mai 2021 15h
$wef=gmdate("Y-m-d H:i", mktime(15, 0, 0, 5, 16, 2021));
$unt=gmdate("Y-m-d H:i", mktime(17, 0, 0, 5, 16, 2021));
*/

// Lit un fichier dans opt/bitnami/data/json
function get_data($url) {
	
	$ch = curl_init();
    // prod : DATA_PATH = https://data.lfmm-fmp.fr/json = opt/bitnami/data/json
	curl_setopt($ch, CURLOPT_URL, DATA_PATH."/$url");
	curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
	/*------------------------------------------------------*/
	// déactiver les 2 lignes suivantes sur le serveur live
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // si pb de certificat SSL force la requête
	/*------------------------------------------------------*/
	$result = curl_exec($ch);
	
	$status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	//echo "HTTP CODE:: " . $status_code;
	//echo curl_error($ch);
	if ($status_code == 404) return 404;
	unset($ch);   // to use with php >= 8.0 : launch garbage mechanism for $ch
	return $result;
}

/*  ------------------------------------------
		Ecriture du fichier générique json
		$arr : tableau contenant les données
		$zone : est ou west
		$type : H20, Occ, Reg
		$wef : pour la date du jour
		ex : 20210621-H20-est.csv
	------------------------------------------ */

function write_json($arr, $zone, $type, $wef) {
	
	$date = new DateTime($wef);
	$d = $date->format('Ymd');
	$y = $date->format('Y');
	$m = $date->format('m');
	$dir = WRITE_PATH."/json/$y/$m/";
	// pour Alban DGAC $dir = "J:/Svc_Expl/SUB_CT/FMP/Utilisateurs Bureau FMP/Adonis/Récup B2B NM/json/$y/$m/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	
	$fp = fopen($dir.$d.$type.$zone.".json", 'w');
	fwrite($fp, json_encode($arr));
	fclose($fp);

}

/*  ---------------------------------------------------------- */
/* 						début du programme
/*  ---------------------------------------------------------- */

$soapClient = new B2B();
$today = gmdate('Y-m-d', strtotime("today"));

// récupère les données MV, duration, sustain, peak des TV LFMM
// données du fichier MV.json
// $mv_file_content : données MV et OTMV de la zone 

$yesterday = new DateTime('yesterday');
$yesterday_d = $yesterday->format('d');
$yesterday_y = $yesterday->format('Y');
$yesterday_m = $yesterday->format('m');

$url = "$yesterday_y/$yesterday_m/$yesterday_y$yesterday_m$yesterday_d-mv_otmv-ouest.json";
$mv_file_content = json_decode(get_data($url));

echo "Fichier $yesterday_y$yesterday_m$yesterday_d-mv_otmv-ouest.json OK<br>";

// récupère les TV que l'on veut compter en H/20 et Occ
// données du fichier TV_count.json
// Attention, il faut que le TV ait une MV, OTMV dans MV.json
$fichier_tv_count = file_get_contents(dirname(__FILE__)."/TV_count.json");
$obj2 = json_decode($fichier_tv_count, true);
$tvs_west = $obj2["TV-OUEST"];

echo "Fichier TV_count.json OK<br>";

// -------------------------------------------------
// 		récupère les données H20, Occ
//			LOAD + DEMAND (request DEMAND Adonis)
// -------------------------------------------------

$occ_west1 = $soapClient->flowServices()->get_occ("LFM", $tvs_west, $mv_file_content, $wef_counts, $unt_counts, "LOAD");
$occ_west2 = $soapClient->flowServices()->get_occ("LFM", $tvs_west, $mv_file_content, $wef_counts, $unt_counts, "DEMAND");

echo "Get Occ OK<br>";

$h20_west1 = $soapClient->flowServices()->get_entry("LFM", $tvs_west, $mv_file_content, $wef_counts, $unt_counts, "LOAD");
$h20_west2 = $soapClient->flowServices()->get_entry("LFM", $tvs_west, $mv_file_content, $wef_counts, $unt_counts, "DEMAND");

echo "Get H20 OK<br>";

// ------------------------------------------------------------------------------------------
//	 Merger les 2 tableaux de H20
//	@params (array) : [ ["RAE", "2022-06-07", "05:20", mv, load], [...] ]
//	@params (array)	: [ ["RAE", "2022-06-07", "05:20", mv, demand], [...] ] 
//  @return	(array)	: [ ["RAE", "2022-06-07", "05:20", mv, load, demand], [...] ]
// -------------------------------------------------------------------------------------------
$h20_west = array();
foreach($h20_west1 as $key=>$val) {
	array_push($val, $h20_west2[$key][4]);
    array_push($h20_west, $val);
}

// ----------------------------------------------------------------------------------------------------
//	 Merger les 2 tableaux Occ
//	@params (array) : [ ["RAE", "2022-07-07", "17:48", peak, sustain, load], [...] ]
//	@params (array)	: [ ["RAE", "2022-07-07", "17:48", peak, sustain, demand], [...] ] 
//  @return	(array)	: [ ["RAE", "2022-06-07", "17:48", peak, sustain, load, demand], [...] ]
// ----------------------------------------------------------------------------------------------------
$occ_west = array();
foreach($occ_west1 as $key=>$val) {
	array_push($val, $occ_west2[$key][5]);
    array_push($occ_west, $val);
}

echo "Merge occ & H20 OK<br>";

try {	
	
	write_json($occ_west, "west", "-Occ-", $wef_counts);
	write_json($h20_west, "west", "-H20-", $wef_counts);
	
}

catch (Exception $e) {
	$err = "Erreur, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
	echo "Erreur, verifier les sauvegardes\n<br>";
	echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";
	$soapClient->flightServices()->send_mail($err);
}

?>
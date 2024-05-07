<?php
ini_set('memory_limit', '1G');
require_once("B2B-2.php");
require_once("B2B-Service.php");
require_once("B2B-AirspaceServices.php");
require_once("B2B-FlightServices.php");
require_once("B2B-FlowServices.php");
include_once("hour_config-vps-journee.inc.php");
include_once("path.inc.php");

/*  ----------------------------------------------------
		LFMM-FMP.FR : tâche CRON 
		de 04:00 à 20:00 UTC
    ---------------------------------------------------- */

/*  ----------------------------------------------------
		Lit un fichier dans opt/bitnami/data/json
    ---------------------------------------------------- */

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
	
	try {
		$date = new DateTime($wef);
		$d = $date->format('Ymd');
		$y = $date->format('Y');
		$m = $date->format('m');
		$h = $date->format('H');
		$dir = WRITE_PATH."/json/$y/$m/";
		
		if (!file_exists($dir)) {
			mkdir($dir, 0777, true);
		}
		
		$fp = fopen($dir.$d.$type.$zone."-".$h."h00.json", 'w');
		fwrite($fp, json_encode($arr));
		fclose($fp);
	}
	catch (Exception $e) {
		$err = "Erreur counts-journee.php, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
		echo "Erreur counts-journee.php, verifier les sauvegardes\n<br>";
		echo 'Exception reçue : ',  $e->getMessage(), "\n<br>\n<br>";
	}

}

/*  ------------------------------------------
		Ecriture d'un log
		ex : 20210621-log.csv
	------------------------------------------ */
function write_log($occ_text, $reg_text, $vol_text) {
	
	$date = new DateTime();
	$d = $date->format('Ymd');
	$h = $date->format('Hi');
	$dir = WRITE_PATH."/log/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	
	// Open a file in write mode ('w')
	$fp = fopen($dir.$d.$h."-log.csv", 'w');
	  
	fwrite($fp, $occ_text."\n");
	fwrite($fp, $reg_text."\n");
	fwrite($fp, $vol_text."\n");
		  
	fclose($fp);
	
}

/*  ---------------------------------------------------------- */
/* 						début du programme
/*  ---------------------------------------------------------- */

try {

$soapClient = new B2B();

// récupère les données MV, duration, sustain, peak des TV LFMM
// données du fichier MV.json
// $tve : données de la zone est et $tvw : données west

$today = new DateTime('today');
$today_d = $today->format('d');
$today_y = $today->format('Y');
$today_m = $today->format('m');

$url_est = "$today_y/$today_m/$today_y$today_m$today_d-mv_otmv-est.json";
$mv_file_content_est = json_decode(get_data($url_est));
echo "Fichier $today_y$today_m$today_d-mv_otmv-est.json OK<br>";

$url_west = "$today_y/$today_m/$today_y$today_m$today_d-mv_otmv-ouest.json";
$mv_file_content_west = json_decode(get_data($url_west));
echo "Fichier $today_y$today_m$today_d-mv_otmv-ouest.json OK<br>";

// récupère les TV que l'on veut compter en H/20 et Occ
// données du fichier TV_count.json
// Attention, il faut que le TV ait une MV, OTMV dans MV.json
$fichier_tv_count = file_get_contents(dirname(__FILE__)."/TV_count.json");
$obj2 = json_decode($fichier_tv_count, true);
$tvs_est = $obj2["TV-EST"];
$tvs_west = $obj2["TV-OUEST"];

echo "Fichier TV_count.json OK<br>";

// ---------------------------------------
// 		récupère les données H20, Occ
// ---------------------------------------

$h20_est = $soapClient->flowServices()->get_entry("LFM", $tvs_est, $mv_file_content_est, $wef_counts, $unt_counts, "LOAD");
//$h20_est2 = $soapClient->flowServices()->get_entry("LFM", $tvs_est, $mv_file_content_est, $wef_counts, $unt_counts, "DEMAND");
$h20_west = $soapClient->flowServices()->get_entry("LFM", $tvs_west, $mv_file_content_west, $wef_counts, $unt_counts, "LOAD");
//$h20_west2 = $soapClient->flowServices()->get_entry("LFM", $tvs_west, $mv_file_content_west, $wef_counts, $unt_counts, "DEMAND");

$occ_est = $soapClient->flowServices()->get_occ("LFM", $tvs_est, $mv_file_content_est, $wef_counts, $unt_counts, "LOAD");
//$occ_est2 = $soapClient->flowServices()->get_occ("LFM", $tvs_est, $mv_file_content_est, $wef_counts, $unt_counts, "DEMAND");
$occ_west = $soapClient->flowServices()->get_occ("LFM", $tvs_west, $mv_file_content_west, $wef_counts, $unt_counts, "LOAD");
//$occ_west2 = $soapClient->flowServices()->get_occ("LFM", $tvs_west, $mv_file_content_west, $wef_counts, $unt_counts, "DEMAND");

/*
// ------------------------------------------------------------------------------------------
//	 Merger les 2 tableaux de H20
//	@params (array) : [ ["RAE", "2022-06-07", "05:20", mv, load], [...] ]
//	@params (array)	: [ ["RAE", "2022-06-07", "05:20", mv, regulated_demand], [...] ] 
//  @return	(array)	: [ ["RAE", "2022-06-07", "05:20", mv, load, demand], [...] ]
// -------------------------------------------------------------------------------------------
$h20_est = array();
$h20_west = array();
foreach($h20_est1 as $key=>$val) {
	array_push($val, $h20_est2[$key][4]);
    array_push($h20_est, $val);
}
foreach($h20_west1 as $key=>$val) {
	array_push($val, $h20_west2[$key][4]);
    array_push($h20_west, $val);
}

// ----------------------------------------------------------------------------------------------------
//	 Merger les 2 tableaux Occ
//	@params (array) : [ ["RAE", "2022-07-07", "17:48", peak, sustain, load], [...] ]
//	@params (array)	: [ ["RAE", "2022-07-07", "17:48", peak, sustain, regulated_demand], [...] ] 
//  @return	(array)	: [ ["RAE", "2022-06-07", "17:48", peak, sustain, load, regulated_demand], [...] ]
// ----------------------------------------------------------------------------------------------------

$occ_est = array();
$occ_west = array();
foreach($occ_est1 as $key=>$val) {
	array_push($val, $occ_est2[$key][5]);
    array_push($occ_est, $val);
}
foreach($occ_west1 as $key=>$val) {
	array_push($val, $occ_west2[$key][5]);
    array_push($occ_west, $val);
}
*/
	
	write_json($occ_est, "est", "-Occ-", $wef_counts);
	write_json($occ_west, "west", "-Occ-", $wef_counts);
	write_json($h20_est, "est", "-H20-", $wef_counts);
	write_json($h20_west, "west", "-H20-", $wef_counts);
	
	echo "<br>Recup Count OK<br>";
	
}
catch (Exception $e) {
	$err = "Erreur, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
	echo "Erreur, verifier les sauvegardes\n<br>";
	echo 'Exception reçue : ',  $e->getMessage(), "\n<br>\n<br>";
}


?>
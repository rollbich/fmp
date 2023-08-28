<?php
ini_set('memory_limit', '1G');
require_once("B2B.php");
require_once("B2B-Service.php");
require_once("B2B-AirspaceServices.php");
require_once("B2B-FlightServices.php");
require_once("B2B-FlowServices.php");
include_once("config.inc.php");
include_once("hour_config".$config."-journee.inc.php");
include_once("path.inc.php");

/*  ----------------------------------------------------
		LFMM-FMP.FR : tâche CRON à 05h20, 6h20
		08h20, 10h20, 12h20, 14h20, 16h20 et 18h20 loc
    ---------------------------------------------------- */


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
	$h = $date->format('H');
	$dir = WRITE_PATH."/json/$y/$m/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	
	$fp = fopen($dir.$d.$type.$zone."-".$h."h00.json", 'w');
	fwrite($fp, json_encode($arr));
	fclose($fp);

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

$soapClient = new B2B();

// récupère les données MV, duration, sustain, peak des TV LFMM
// données du fichier MV.json
// $tve : données de la zone est et $tvw : données west
$fichier_mv = file_get_contents(dirname(__FILE__)."/MV.json");
$obj = json_decode($fichier_mv, true);
$tve = $obj["TV-EST"];
$tvw = $obj["TV-OUEST"];

echo "Fichier MV.json OK<br>";

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

$h20_est = $soapClient->flowServices()->get_entry("LFM", $tvs_est, $tve, $wef_counts, $unt_counts, "LOAD");
//$h20_est2 = $soapClient->flowServices()->get_entry("LFM", $tvs_est, $tve, $wef_counts, $unt_counts, "DEMAND");
$h20_west = $soapClient->flowServices()->get_entry("LFM", $tvs_west, $tvw, $wef_counts, $unt_counts, "LOAD");
//$h20_west2 = $soapClient->flowServices()->get_entry("LFM", $tvs_west, $tvw, $wef_counts, $unt_counts, "DEMAND");

$occ_est = $soapClient->flowServices()->get_occ("LFM", $tvs_est, $tve, $wef_counts, $unt_counts, "LOAD");
//$occ_est2 = $soapClient->flowServices()->get_occ("LFM", $tvs_est, $tve, $wef_counts, $unt_counts, "DEMAND");
$occ_west = $soapClient->flowServices()->get_occ("LFM", $tvs_west, $tvw, $wef_counts, $unt_counts, "LOAD");
//$occ_west2 = $soapClient->flowServices()->get_occ("LFM", $tvs_west, $tvw, $wef_counts, $unt_counts, "DEMAND");

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

try {	
	
	write_json($occ_est, "est", "-Occ-", $wef_counts);
	write_json($occ_west, "west", "-Occ-", $wef_counts);
	write_json($h20_est, "est", "-H20-", $wef_counts);
	write_json($h20_west, "west", "-H20-", $wef_counts);
	
	echo "<br>Recup Count OK<br>";
	
}
catch (Exception $e) {
	$err = "Erreur, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
	echo "Erreur, verifier les sauvegardes\n<br>";
	echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";
}


?>
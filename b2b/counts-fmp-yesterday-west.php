<?php
ini_set('memory_limit', '1G');
require_once("xlsxwriter.class.php");
require_once("mail-msg.php");
require_once("B2B.php");
require_once("B2B-Service.php");
require_once("B2B-AirspaceServices.php");
require_once("B2B-FlightServices.php");
require_once("B2B-FlowServices.php");
include_once("config.inc.php");
include_once("hour_config".$config.".inc.php");
/* 16 mai 2021 15h
$wef=gmdate("Y-m-d H:i", mktime(15, 0, 0, 5, 16, 2021));
$unt=gmdate("Y-m-d H:i", mktime(17, 0, 0, 5, 16, 2021));
*/

/*  ------------------------------------------
		Ecriture du fichier Excel XLS
		4 onglets H20, Occ, Regul et flights
	------------------------------------------ */
function write_xls($zone, $wef, $occ_est, $occ_west, $h20_est, $h20_west) {
		
	$header_occ = array(
		'TV'=>'string',
		'Date'=>'date',
		'Time'=>'string',
		'Peak'=>'integer',
		'Sustain'=>'integer',
		'Load'=>'integer',
		'Demand'=>'integer'
	);
	
	$header_h20 = array(
		'TV'=>'string',
		'Date'=>'date',
		'Time'=>'string',
		'MV'=>'integer',
		'Load'=>'integer',
		'Demand'=>'integer'
	);
	
	$header_reg = array(
		'Reg-Id'=>'string',
		'TV'=>'string',
		'Date'=>'date',
		'Début'=>'string',
		'Fin'=>'string',
		'Raison'=>'string',
		'Normal Rate'=>'integer',
		'Pending Rate'=>'integer',
		'Equipment Rate'=>'integer',
		'Total delay'=>'integer',
		'Vols impactés'=>'integer',
		'TV-Set'=>'string',
		'Update Type'=>'string',
		'Date update'=>'date',
		'Heure update'=>'string'
	);
	
	$header_flights = array(
		'TV'=>'string',
		'Date'=>'date',
		'Vols'=>'integer'
	);

	$header_cta = array(
		'Airspace'=>'string',
		'Date'=>'date',
		'RegDemand'=>'integer',
		'Load'=>'integer',
		'Demand'=>'integer'
	);
	
	$style_header = array( 'font'=>'Arial','font-size'=>12,'font-style'=>'bold', 'halign'=>'center');
	$style = array('halign'=>'center');

	$writer = new XLSXWriter();
	$writer->setAuthor('LFMM-FMP'); 
	
	// Occ
	$writer->writeSheetHeader('Occ', $header_occ, $style_header );
		
	foreach(${"occ_".$zone} as $row) {
		$writer->writeSheetRow('Occ', $row, $style);
	}
	
	// H20
	$writer->writeSheetHeader('H20', $header_h20, $style_header );
		
	foreach(${"h20_".$zone} as $row) {
		$writer->writeSheetRow('H20', $row, $style);
	}
	
	$date = new DateTime($wef);
	$d = $date->format('Ymd');
	$y = $date->format('Y');
	$m = $date->format('m');
	$dir = dirname(__FILE__)."/xls/$y/$m/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	
	$writer->writeToFile($dir.$d."-Occ-H20-".$zone."-test.xlsx");

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
	$dir = dirname(__FILE__)."/json/$y/$m/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	
	$fp = fopen($dir.$d.$type.$zone."-test.json", 'w');
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
// $tve : données de la zone est et $tvw : données west
$fichier_mv = file_get_contents(dirname(__FILE__)."/MV.json");
// on transforme le fichier json de MV en array
$obj = json_decode($fichier_mv, true);
$tvw = $obj["TV-OUEST"];

echo "Fichier MV.json OK<br>";

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

$occ_west1 = $soapClient->flowServices()->get_occ("LFM", $tvs_west, $tvw, $wef_counts, $unt_counts, "LOAD");
$occ_west2 = $soapClient->flowServices()->get_occ("LFM", $tvs_west, $tvw, $wef_counts, $unt_counts, "DEMAND");

echo "Get Occ OK<br>";

$h20_west1 = $soapClient->flowServices()->get_entry("LFM", $tvs_west, $tvw, $wef_counts, $unt_counts, "LOAD");
$h20_west2 = $soapClient->flowServices()->get_entry("LFM", $tvs_west, $tvw, $wef_counts, $unt_counts, "DEMAND");

echo "Get H20 OK<br>";

// ------------------------------------------------------------------------------------------
//	 Merger les 2 tableaux de H20
//	@params (array) : [ ["RAE", "2022-06-07", "05:20", mv, load], [...] ]
//	@params (array)	: [ ["RAE", "2022-06-07", "05:20", mv, demand], [...] ] 
//  @return	(array)	: [ ["RAE", "2022-06-07", "05:20", mv, load, demand], [...] ]
// -------------------------------------------------------------------------------------------
$h20_est = array();
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
$occ_est = array();
$occ_west = array();
foreach($occ_west1 as $key=>$val) {
	array_push($val, $occ_west2[$key][5]);
    array_push($occ_west, $val);
}

echo "Merge occ & H20 OK<br>";

include("tab_TV.inc.php");

try {	
	
	write_xls("west", $wef_counts, $occ_est, $occ_west, $h20_est, $h20_west);
	
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
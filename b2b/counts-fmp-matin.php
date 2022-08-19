<?php
ini_set('memory_limit', '1G');
require_once("xlsxwriter.class.php");
require_once("mail-msg.php");
require_once("B2B.php");
require_once("B2B-functions.inc.php");

/*  ----------------------------------------------------
		LFMM-FMP.FR : tâche CRON à 05h20, 6h20
		08h20, 10h20, 12h20, 14h20, 16h20 et 18h20 loc
    ---------------------------------------------------- */

/*  ------------------------------------------
		Ecriture du fichier Excel XLS
		4 onglets H20, Occ, Regul et flights
	------------------------------------------ */
function write_xls($zone, $wef) {

	global $occ_est;
	global $occ_west;
	global $h20_est;
	global $h20_west;
	global $regul;
	global $flights;
		
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
	
	// Reg
	$writer->writeSheetHeader('Regul', $header_reg, $style_header );
	if ($zone == "est") {
		foreach($regul["LFMMFMPE"] as $row) {
			$writer->writeSheetRow('Regul', $row, $style);
		}
	}
	if ($zone == "west") {	
		foreach($regul["LFMMFMPW"] as $row) {
			$writer->writeSheetRow('Regul', $row, $style);
		}
	}
	$writer->writeSheetHeader('Regul-App', $header_reg, $style_header );
	foreach($regul["LFMMAPP"] as $row) {
		$writer->writeSheetRow('Regul-App', $row, $style);
	}

	$date = new DateTime($wef);
	$d = $date->format('Ymd');
	$h = $date->format('H');
	$dir = dirname(__FILE__)."/xls/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	
	$writer->writeToFile($dir.$d."-Occ-H20-".$zone.$h."20.xlsx");

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
	$h = $date->format('H');
	$dir = dirname(__FILE__)."/json/$y/$m/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	
	$fp = fopen($dir.$d.$type.$zone.$h."20.json", 'w');
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
	$dir = dirname(__FILE__)."/log/";
	
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

// objet contenant les reguls de LF*
$json_reg = new stdClass();
$json_reg->LFMMFMPE = array();
$json_reg->LFMMFMPW = array();
$json_reg->LFMMAPP = array();

$json_reg->LFBBFMP = array();
$json_reg->LFBBAPP = array();

$json_reg->LFEEFMP = array();
$json_reg->LFEEAPP = array();

$json_reg->LFDSNA = array();

$json_reg->LFFFFMPE = array();
$json_reg->LFFFFMPW = array();
$json_reg->LFFFAD = array();

$json_reg->LFRRFMP = array();
$json_reg->LFRRAPP = array();

include_once("config.inc.php");
include_once("hour_config".$config."-matin.inc.php");
	
// récupère les données MV, duration, sustain, peak des TV LFMM
// données du fichier MV.json
// $tve : données de la zone est et $tvw : données west
$fichier_mv = file_get_contents(dirname(__FILE__)."/MV.json");
$obj = json_decode($fichier_mv, true);
$tve = $obj["TV-EST"];
$tvw = $obj["TV-OUEST"];

// récupère les TV que l'on veut compter en H/20 et Occ
// données du fichier TV_count.json
// Attention, il faut que le TV ait une MV, OTMV dans MV.json
$fichier_tv_count = file_get_contents(dirname(__FILE__)."/TV_count.json");
$obj2 = json_decode($fichier_tv_count, true);
$tvs_est = $obj2["TV-EST"];
$tvs_west = $obj2["TV-OUEST"];

// ---------------------------------------
// 		récupère les données H20, Occ
// ---------------------------------------

$h20_est = get_entry("est", $wef_counts, $unt_counts, "LOAD");
//$h20_est2 = get_entry("est", $wef_counts, $unt_counts, "DEMAND");
//$h20_west = get_entry("west", $wef_counts, $unt_counts, "LOAD");
//$h20_west2 = get_entry("west", $wef_counts, $unt_counts, "DEMAND");

$occ_est = get_occ("est", $wef_counts, $unt_counts, "LOAD");
//$occ_est2 = get_occ("est", $wef_counts, $unt_counts, "DEMAND");
//$occ_west = get_occ("west", $wef_counts, $unt_counts, "LOAD");
//$occ_west2 = get_occ("west", $wef_counts, $unt_counts, "DEMAND");


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
// ---------------------------------------
// 		récupère les données Reg
// ---------------------------------------
$regul = get_regulations("LF", $wef_regs, $unt_regs);


// Sauvegarde des fichiers
// Affichage d'un message suivant la réussite de la sauvegarde
// écriture d'un log
// Envoi d'un email en cas d'erreur

try {	
	
	write_xls("est", $wef_counts);
	//write_xls("west", $wef_counts);
	
	write_json($occ_est, "est", "-Occ-", $wef_counts);
	//write_json($occ_west, "west", "-Occ-", $wef_counts);
	write_json($h20_est, "est", "-H20-", $wef_counts);
	//write_json($h20_west, "west", "-H20-", $wef_counts);
	
	write_json($json_reg, "", "-reg", $wef_counts);
	echo "<br>Recup OK<br>";
	
}
catch (Exception $e) {
	$err = "Erreur, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
	echo "Erreur, verifier les sauvegardes\n<br>";
	echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";
}


?>
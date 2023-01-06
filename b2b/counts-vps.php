<?php
ini_set('memory_limit', '1G');
require_once("mail-msg.php");
require_once("B2B.php");
require_once("B2B-Service.php");
require_once("B2B-AirspaceServices.php");
require_once("B2B-FlightServices.php");
require_once("B2B-FlowServices.php");
include_once("hour_config-vps.inc.php");
/* 16 mai 2021 15h
$wef=gmdate("Y-m-d H:i", mktime(15, 0, 0, 5, 16, 2021));
$unt=gmdate("Y-m-d H:i", mktime(17, 0, 0, 5, 16, 2021));
*/

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
// $tve : données de la zone est et $tvw : données west
$fichier_mv = file_get_contents(dirname(__FILE__)."/MV.json");
// on transforme le fichier json de MV en array
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

// -------------------------------------------------
// 		récupère les données H20, Occ
//			LOAD + DEMAND (request DEMAND Adonis)
// -------------------------------------------------

$occ_est1 = $soapClient->flowServices()->get_occ("LFM", $tvs_est, $tve, $wef_counts, $unt_counts, "LOAD");
$occ_est2 = $soapClient->flowServices()->get_occ("LFM", $tvs_est, $tve, $wef_counts, $unt_counts, "DEMAND");
$occ_west1 = $soapClient->flowServices()->get_occ("LFM", $tvs_west, $tvw, $wef_counts, $unt_counts, "LOAD");
$occ_west2 = $soapClient->flowServices()->get_occ("LFM", $tvs_west, $tvw, $wef_counts, $unt_counts, "DEMAND");

echo "Get Occ OK<br>";

$h20_est1 = $soapClient->flowServices()->get_entry("LFM", $tvs_est, $tve, $wef_counts, $unt_counts, "LOAD");
$h20_est2 = $soapClient->flowServices()->get_entry("LFM", $tvs_est, $tve, $wef_counts, $unt_counts, "DEMAND");
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
//	@params (array)	: [ ["RAE", "2022-07-07", "17:48", peak, sustain, demand], [...] ] 
//  @return	(array)	: [ ["RAE", "2022-06-07", "17:48", peak, sustain, load, demand], [...] ]
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

echo "Merge occ & H20 OK<br>";

// ---------------------------------------
// 		récupère les données Reg
// ---------------------------------------
// objet contenant les reguls de LF*
$json_reg = new stdClass();
$json_reg->LFMMFMPE = array();
$json_reg->LFMMFMPW = array();
$json_reg->LFMMAPP = array();
$json_reg->LFBBFMP = array();
$json_reg->LFBBAPP = array();
$json_reg->LFEEFMP = array();
$json_reg->LFEEAPP = array();
$json_reg->LFFFFMPE = array();
$json_reg->LFFFFMPW = array();
$json_reg->LFFFAD = array();
$json_reg->LFRRFMP = array();
$json_reg->LFRRAPP = array();
$json_reg->LFDSNA = array();

$reg = [];
$reg["LFMMFMPE"] = array();
$reg["LFMMFMPW"] = array();
$reg["LFMMAPP"] = array();
$reg["LFBBFMP"] = array();
$reg["LFBBAPP"] = array();
$reg["LFEEFMP"] = array();
$reg["LFEEAPP"] = array();
$reg["LFFFFMPE"] = array();
$reg["LFFFFMPW"] = array();
$reg["LFFFAD"] = array();
$reg["LFRRFMP"] = array();
$reg["LFRRAPP"] = array();
$reg["LFDSNA"] = array();

// objet contenant les reguls Europe
$json_atfcm_reg = $soapClient->flowServices()->get_ATFCM_situation();
// Comme seul data est sauvé, ajoute sendTime dedans
$json_atfcm_reg->data->sendTime = $json_atfcm_reg->sendTime;

echo "get atfcm_situation OK<br>";

// Remplit l'object $json_reg (et l'array $reg pour l'export xls)
$soapClient->flowServices()->get_full_regulations("LF", $wef_regs, $unt_regs, $json_reg, $reg, $json_atfcm_reg);

echo "get regulation OK<br>";

// ATC conf du jour
$airspace1 = "LFMMCTAE";
$airspace2 = "LFMMCTAW";
// today = minuit locale soit la veille 22h00 UTC
$today = gmdate('Y-m-d', strtotime("today"));
$plan_e = $soapClient->flowServices()->get_atc_conf($airspace1, $today);
$plan_w = $soapClient->flowServices()->get_atc_conf($airspace2, $today);

echo "get conf jour OK<br>";

$atc_confs = new stdClass();
$atc_confs->est = $plan_e->data->plan->nmSchedule->item;
$atc_confs->ouest = $plan_w->data->plan->nmSchedule->item;
// confs existantes dans NM pour l'est et l'ouest 
//$atc_confs->known_confs = new stdClass();
//$atc_confs->known_confs->est = $plan_e->data->plan->knownConfigurations->item;
//$atc_confs->known_confs->ouest = $plan_w->data->plan->knownConfigurations->item;

// Counts de LFMMCTAE
// Attention avec les réglages "local", on récupère effectiveTrafficWindow sur 2 jours => $query_LFMMCTA->data->counts->item[0]->value
// Alors qu'en prod, on récupère bien sur 1 journée => data->counts->item->value

$query_LFMMCTA_LOAD = $soapClient->flowServices()->query_entry_day_count("LFMMCTA","LOAD", $wef_flights, $unt_flights);
if (is_array($query_LFMMCTA_LOAD->data->counts->item)) {
	$counts_LFMMCTA_LOAD = $query_LFMMCTA_LOAD->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTA_LOAD = $query_LFMMCTA_LOAD->data->counts->item->value->item->value->totalCounts;
}

echo "get CTA LOAD OK<br>";

$query_LFMMCTA_DEMAND = $soapClient->flowServices()->query_entry_day_count("LFMMCTA","DEMAND", $wef_flights, $unt_flights);
$today = substr($query_LFMMCTA_DEMAND->data->effectiveTrafficWindow->wef, 0, 10);
if (is_array($query_LFMMCTA_DEMAND->data->counts->item)) {
	$counts_LFMMCTA_DEMAND = $query_LFMMCTA_DEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTA_DEMAND = $query_LFMMCTA_DEMAND->data->counts->item->value->item->value->totalCounts;
}

echo "get CTA DEMAND OK<br>";

$query_LFMMCTA_REGDEMAND = $soapClient->flowServices()->query_entry_day_count("LFMMCTA","REGULATED_DEMAND", $wef_flights, $unt_flights);
if (is_array($query_LFMMCTA_REGDEMAND->data->counts->item)) {
	$counts_LFMMCTA_REGDEMAND = $query_LFMMCTA_REGDEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTA_REGDEMAND = $query_LFMMCTA_REGDEMAND->data->counts->item->value->item->value->totalCounts;
}

echo "get CTA REGULATED_DEMAND OK<br>";

$query_LFMMCTAE_LOAD = $soapClient->flowServices()->query_entry_day_count("LFMMCTAE","LOAD", $wef_flights, $unt_flights);
if (is_array($query_LFMMCTAE_LOAD->data->counts->item)) {
	$counts_LFMMCTAE_LOAD = $query_LFMMCTAE_LOAD->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAE_LOAD = $query_LFMMCTAE_LOAD->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTAE_DEMAND = $soapClient->flowServices()->query_entry_day_count("LFMMCTAE","DEMAND", $wef_flights, $unt_flights);
if (is_array($query_LFMMCTAE_DEMAND->data->counts->item)) {
	$counts_LFMMCTAE_DEMAND = $query_LFMMCTAE_DEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAE_DEMAND = $query_LFMMCTAE_DEMAND->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTAE_REGDEMAND = $soapClient->flowServices()->query_entry_day_count("LFMMCTAE","REGULATED_DEMAND", $wef_flights, $unt_flights);
if (is_array($query_LFMMCTAE_REGDEMAND->data->counts->item)) {
	$counts_LFMMCTAE_REGDEMAND = $query_LFMMCTAE_REGDEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAE_REGDEMAND = $query_LFMMCTAE_REGDEMAND->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTAW_LOAD = $soapClient->flowServices()->query_entry_day_count("LFMMCTAW","LOAD", $wef_flights, $unt_flights);
if (is_array($query_LFMMCTAW_LOAD->data->counts->item)) {
	$counts_LFMMCTAW_LOAD = $query_LFMMCTAW_LOAD->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAW_LOAD = $query_LFMMCTAW_LOAD->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTAW_DEMAND = $soapClient->flowServices()->query_entry_day_count("LFMMCTAW","DEMAND", $wef_flights, $unt_flights);
if (is_array($query_LFMMCTAW_DEMAND->data->counts->item)) {
	$counts_LFMMCTAW_DEMAND = $query_LFMMCTAW_DEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAW_DEMAND = $query_LFMMCTAW_DEMAND->data->counts->item->value->item->value->totalCounts;
}

$query_LFMMCTAW_REGDEMAND = $soapClient->flowServices()->query_entry_day_count("LFMMCTAW","REGULATED_DEMAND", $wef_flights, $unt_flights);
if (is_array($query_LFMMCTAW_REGDEMAND->data->counts->item)) {
	$counts_LFMMCTAW_REGDEMAND = $query_LFMMCTAW_REGDEMAND->data->counts->item[0]->value->item->value->totalCounts;
} else {
	$counts_LFMMCTAW_REGDEMAND = $query_LFMMCTAW_REGDEMAND->data->counts->item->value->item->value->totalCounts;
}

echo "get Entry day count Est-West OK<br>";

include("tab_TV.inc.php");

$flights = new stdClass();
$flights->LFMMCTA = ["LFMMCTA", $today, $counts_LFMMCTA_REGDEMAND, $counts_LFMMCTA_LOAD, $counts_LFMMCTA_DEMAND];
$flights->LFMMCTAE = ["LFMMCTAE", $today, $counts_LFMMCTAE_REGDEMAND, $counts_LFMMCTAE_LOAD, $counts_LFMMCTAE_DEMAND];
$flights->LFMMCTAW = ["LFMMCTAW", $today, $counts_LFMMCTAW_REGDEMAND, $counts_LFMMCTAW_LOAD, $counts_LFMMCTAW_DEMAND];
$soapClient->flightServices()->get_vols_Est($flights, $tab_TVE, $wef_flights, $unt_flights);
echo "get vols Est OK<br>";
$soapClient->flightServices()->get_vols_West($flights, $tab_TVW, $wef_flights, $unt_flights);
echo "get vols West OK<br>";
$soapClient->flightServices()->get_vols_App($flights, $tab_TVAPP, $tab_ADAPP, $wef_flights, $unt_flights);
echo "get vols App OK<br>";

try {	
	
	write_json($occ_est, "est", "-Occ-", $wef_counts);
	write_json($occ_west, "west", "-Occ-", $wef_counts);
	write_json($h20_est, "est", "-H20-", $wef_counts);
	write_json($h20_west, "west", "-H20-", $wef_counts);
	
	write_json($json_reg, "", "-reg", $wef_counts);
	write_json($json_atfcm_reg->data, "", "-atfcm-reg", $wef_counts);
	write_json($atc_confs, "", "-confs", $wef_counts);
	
	write_json($flights, "", "-vols", $wef_counts);
	
}

catch (Exception $e) {
	$err = "Erreur, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
	echo "Erreur, verifier les sauvegardes\n<br>";
	echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";
	//$soapClient->flightServices()->send_mail($err);
}

?>
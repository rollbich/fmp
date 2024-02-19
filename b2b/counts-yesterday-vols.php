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
include_once("../php/bdd.class.php");
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
/* --------------------------------------------------------------
    $tab_TVE = ["LFMRAE", "LFMSBAM", "LFMGY", "LFMAB", "LFMEK"];
    $tab_TVW = ["LFMRAW", "LFMMALY", "LFMWW", "LFMMF", "LFMDZ"];
    $tab_TVAPP = ["LFKJ","LFKF","LFKB","LFKC","LFMN","LFMD","LFTZ","LFTH","LFML","LFMV","LFMQ","LFLL","LFLY","LFLS","LFLB","LFLP","LFLC","LFMT","LFTW","LFMP","LFMU","LFLV","LFLN","LFLU"];
    $tab_ADAPP = ["LFMI","LFMH","LFMA","LFLI","LFMC","LFKS","LFMY","LFMO","LFKA","LFKO","LFMS","LFMZ","LFMF","LFTF","LFLE","LFLG","LFLJ","LFLM","LFLO","LFNA","LFNB","LFNG","LFNH","LFXA"];
----------------------------------------------------------------- */

$flights = new stdClass();
$flights->LFMMCTA = ["LFMMCTA", $today, $counts_LFMMCTA_REGDEMAND, $counts_LFMMCTA_LOAD, $counts_LFMMCTA_DEMAND];
$flights->LFMMCTAE = ["LFMMCTAE", $today, $counts_LFMMCTAE_REGDEMAND, $counts_LFMMCTAE_LOAD, $counts_LFMMCTAE_DEMAND];
$flights->LFMMCTAW = ["LFMMCTAW", $today, $counts_LFMMCTAW_REGDEMAND, $counts_LFMMCTAW_LOAD, $counts_LFMMCTAW_DEMAND];
$soapClient->flightServices()->get_vols_Est($flights, $tab_TVE, $wef_flights, $unt_flights);
echo "get vols Blocs Est OK<br>";
$soapClient->flightServices()->get_vols_West($flights, $tab_TVW, $wef_flights, $unt_flights);
echo "get vols Blocs West OK<br>";
$soapClient->flightServices()->get_vols_App($flights, $tab_TVAPP, $tab_ADAPP, $wef_flights, $unt_flights);
echo "get vols App OK<br>";

try {	
	// Maria Db : LONGTEXT (=JSON type)
	// A TEXT column with a maximum length of 4,294,967,295 characters.
	write_json($flights, "", "-vols", $wef_counts);
	$bdd = new bdd();
	$bdd->set_vols_crna($today, $counts_LFMMCTA_REGDEMAND, $counts_LFMMCTA_LOAD, $counts_LFMMCTA_DEMAND, $counts_LFMMCTAE_REGDEMAND, $counts_LFMMCTAE_LOAD, $counts_LFMMCTAE_DEMAND, $counts_LFMMCTAW_REGDEMAND, $counts_LFMMCTAW_LOAD, $counts_LFMMCTAW_DEMAND, $flights->LFMMFMPE[0][2], $flights->LFMMFMPE[1][2], $flights->LFMMFMPE[2][2], $flights->LFMMFMPE[3][2], $flights->LFMMFMPE[4][2], $flights->LFMMFMPW[0][2], $flights->LFMMFMPW[1][2], $flights->LFMMFMPW[2][2], $flights->LFMMFMPW[3][2], $flights->LFMMFMPW[4][2],json_encode($flights->VOLS_RAE), json_encode($flights->VOLS_RAW));
	$bdd->set_vols_app($today, $flights->LFMMAPP);
}

catch (Exception $e) {
	$err = "Erreur, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
	echo "Erreur, verifier les sauvegardes\n<br>";
	echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";
	$soapClient->flightServices()->send_mail($err);
}

?>
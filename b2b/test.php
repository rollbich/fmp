<?php
ini_set('memory_limit', '1G');
require_once("B2B.php");
require_once("B2B-Service.php");
require_once("B2B-FlightServices.php");
require_once("B2B-FlowServices.php");
include_once("path.inc.php");
include_once("hour_config-vps.inc.php");
/*
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

/*  -----------------------------------------------------------------------
		instanciation soap FLIGHT Services
		
		Range de requête : 24h max
		trafficWindow (OPERATIONAL)	 : [yesterday .. tomorrow]
		trafficWindow (FORECAST)	 : [yesterday 21:00 UTC .. today+5d]
	----------------------------------------------------------------------- */

$soapClient = new B2B();
$today = gmdate('Y-m-d', strtotime("today"));

include("tab_TV-test.inc.php");

$flights = new stdClass();
//$flights->LFMMCTA = ["LFMMCTA", $today, $counts_LFMMCTA_REGDEMAND, $counts_LFMMCTA_LOAD, $counts_LFMMCTA_DEMAND];
//$flights->LFMMCTAE = ["LFMMCTAE", $today, $counts_LFMMCTAE_REGDEMAND, $counts_LFMMCTAE_LOAD, $counts_LFMMCTAE_DEMAND];
//$flights->LFMMCTAW = ["LFMMCTAW", $today, $counts_LFMMCTAW_REGDEMAND, $counts_LFMMCTAW_LOAD, $counts_LFMMCTAW_DEMAND];
//$soapClient->flightServices()->get_vols_Est($flights, $tab_TVE, $wef_flights, $unt_flights);
//$res = $soapClient->flightServices()->get_nb_vols_TV("LFMB12", $wef_flights, $unt_flights);

/*
get_vols_Est($flights, $tab_TVE, $wef_flights, $unt_flights);
get_vols_West($flights, $tab_TVW, $wef_flights, $unt_flights);
*/
$soapClient->flightServices()->get_vols_App($flights, $tab_TVAPP, $tab_ADAPP, $wef_flights, $unt_flights);


// Sauvegarde des fichiers
// Affichage d'un message suivant la réussite de la sauvegarde
// écriture d'un log
// Envoi d'un email en cas d'erreur

try {	
	var_dump($flights);
	write_json($flights, "", "-vols", $wef_counts);
	
}
catch (Exception $e) {
	$err = "Erreur, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
	echo "Erreur, verifier les sauvegardes\n<br>";
	echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";
}


?>
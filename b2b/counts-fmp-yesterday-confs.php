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

try {	

	write_json($atc_confs, "", "-confs", $wef_counts);
	
}

catch (Exception $e) {
	$err = "Erreur, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
	echo "Erreur, verifier les sauvegardes\n<br>";
	echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";
	$soapClient->flightServices()->send_mail($err);
}

?>
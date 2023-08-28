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

/*  ---------------------------------------------------------- 
 						début du programme
					récupère les données Reg
	----------------------------------------------------------
	return :
	{
	"LFMMFMPE": [
		{
			"regId": "MAB3423A",
			"tv": "LFMAB34",
			"lastUpdate": {
				"eventTime": "2023-08-23 14:39:00",
				"userUpdateEventTime": "2023-08-23 14:39:00",
				"userUpdateType": "UPDATE",
				"userId": "F3BBT"
			},
			"applicability": { "wef": "2023-08-23 14:00", "unt": "2023-08-23 20:40" },
			"constraints": [
				{
				"constraintPeriod": {
					"wef": "2023-08-23 14:00",
					"unt": "2023-08-23 14:40"
				},
				"normalRate": 34,
				"pendingRate": 2,
				"equipmentRate": 0
				},
				{
				"constraintPeriod": {
					"wef": "2023-08-23 14:40",
					"unt": "2023-08-23 20:40"
				},
				"normalRate": 30,
				"pendingRate": 1,
				"equipmentRate": 0
				}
			],
			"reason": "ATC_STAFFING",
			"delay": 2320,
			"impactedFlights": 203,
			"TVSet": "LFMMFMPE"
		}, {...}, ... ],
	"LFMMFMPW": [{...}, ...],
	"LFMMAPP": [ {...}, ...],
	"LFBBFMP": ...
	...
	}
/*  ---------------------------------------------------------- */

$soapClient = new B2B();

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

// objet contenant les reguls Europe
$json_atfcm_reg = $soapClient->flowServices()->get_ATFCM_situation();
// Comme seul data est sauvé, ajoute sendTime dedans
$json_atfcm_reg->data->sendTime = $json_atfcm_reg->sendTime;
echo "get atfcm_situation OK<br>";

// Remplit l'object $json_reg (et l'array $reg pour l'export xls)
$soapClient->flowServices()->get_full_regulations_json("LF", $wef_regs, $unt_regs, $json_reg, $json_atfcm_reg);

echo "get regulation OK<br>";

/*  -------------------------------------------------------
				 ATC conf du nb_vols
	-------------------------------------------------------
	return : 
	{
	"est": [
		{
			"applicabilityPeriod": {
				"wef": "2023-08-23 00:00",
				"unt": "2023-08-23 02:30"
			},
			"dataSource": "TACTICAL",
			"sectorConfigurationId": "E1A"
		},
		{ ... }
	],
	"ouest": [
		{ ... }, ...
	]
	}
	------------------------------------------------------ */

$airspace1 = "LFMMCTAE";
$airspace2 = "LFMMCTAW";

// On récupère la conf du jour à l'heure de la tâche CRON (23:57 UTC)
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
	
	write_json($json_reg, "", "-reg", $wef_counts);
	write_json($json_atfcm_reg->data, "", "-atfcm-reg", $wef_counts);
	write_json($atc_confs, "", "-confs", $wef_counts);
	
}

catch (Exception $e) {
	$err = "Erreur, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
	echo "Erreur, verifier les sauvegardes\n<br>";
	echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";
	$soapClient->flightServices()->send_mail($err);
}

?>
<?php
ini_set('memory_limit', '1G');
require_once("xlsxwriter.class.php");
require_once("mail-msg.php");
require_once("B2B.php");
require_once("B2B-Service.php");
require_once("B2B-AirspaceServices.php");
include_once("config.inc.php");
include_once("hour_config".$config.".inc.php");
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
$date = new DateTime("2022-08-25");
//$aup = $soapClient->airspaceServices()->get_AUP_chain($date, array("LFFAZAMC","LIRRZAMC","LECMZAMC"));
//$aup = $soapClient->airspaceServices()->get_AUP($date, array("LFFAZAMC","LIRRZAMC","LECMZAMC"));
$aup_chain = $soapClient->airspaceServices()->get_EAUP_chain($date);
if ($aup_chain->status == "OK") {
	if (is_array($aup_chain->data->chain->eaups)) {
		$seqNumber = count($aup_chain->data->chain->eaups);
	} else {
		$seqNumber = 1;
	}
}
$aup = $soapClient->airspaceServices()->get_EAUP_rsa($date, 1);
echo "<br>Sequence Number : $seqNumber<br>";
var_dump($aup_chain);
echo "<br>";
var_dump($aup);
?>
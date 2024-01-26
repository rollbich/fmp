<?php
ini_set('memory_limit', '1G');
require_once("xlsxwriter.class.php");
require_once("B2B-2.php");
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
		
		$fp = fopen($dir.$d.$type.$zone.$h."20.json", 'w');
		fwrite($fp, json_encode($arr));
		fclose($fp);
	}
	catch (Exception $e) {
		$err = "Erreur counts-reg-journee.php, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
		echo "Erreur counts-reg-journee.php, verifier les sauvegardes\n<br>";
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

$soapClient = new B2B();

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

echo "get atfcm_situation OK<br>\n";

// Remplit l'object $json_reg 
$soapClient->flowServices()->get_full_regulations_json("LF", $wef_regs, $unt_regs, $json_reg, $json_atfcm_reg);

echo "get regulation OK<br>\n";

// Sauvegarde des fichiers
// Affichage d'un message suivant la réussite de la sauvegarde
// écriture d'un log
// Envoi d'un email en cas d'erreur

try {	
	
	write_json($json_reg, "", "-reg", $wef_counts);
	echo "<br>Recup reg OK<br>\n";
	
}
catch (Exception $e) {
	$err = "Erreur, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
	echo "Erreur, verifier les sauvegardes\n<br>";
	echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";
}


?>
<?php
ini_set('memory_limit', '1G');
require_once("xlsxwriter.class.php");
require_once("B2B-2.php");
require_once("B2B-Service.php");
require_once("B2B-AirspaceServices.php");
require_once("B2B-FlightServices.php");
require_once("B2B-FlowServices.php");
include_once("hour_config-vps-journee.inc.php");
include_once("path.inc.php");
include_once(__DIR__."/../php/bdd.class.php");

/*  ----------------------------------------------------
		LFMM-FMP.FR : tâche CRON périodique
    ---------------------------------------------------- */


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
	$day = substr($wef_counts, 0, 10);
	$bdd = new bdd();
	$bdd->set_reguls($day, $json_reg, "LFMMFMPE");
	$bdd->set_reguls($day, $json_reg, "LFMMFMPW");
	$bdd->set_reguls($day, $json_reg, "LFMMAPP");
	
}
catch (Exception $e) {
	$err = "Erreur, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
	echo "Erreur, verifier les sauvegardes\n<br>";
	echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";
}


?>
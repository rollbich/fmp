<?php
header("Content-type:application/json");
ini_set('memory_limit', '1G');
require_once("B2B.php");
require_once("B2B-Service.php");
require_once("Airspace.php");
require_once("B2B-AirspaceServices.php");
require_once("B2B-FlowServices.php");
include_once("path.inc.php");
require_once("MV-OTMV.inc.php");

/*  -------------------------------------------------------
		Ecriture du fichier MV-OTMV json
		$resultat : données
		Récupération auto à 03h10 UTC
        => 20230525-mv_otmv-zone.json
	------------------------------------------------------- */
function write_json($resultat, String $zone) {

    $date = new DateTime('today');
    $d = $date->format('Ymd');
    $y = $date->format('Y');
    $m = $date->format('m');
   
    $dir = WRITE_PATH."/json/$y/$m/";
    
    if (!file_exists($dir)) {
        mkdir($dir, 0777, true);
    }
    
    $fp = fopen($dir.$d."-mv_otmv-".$zone.".json", 'w');
    fwrite($fp, json_encode($resultat));
    fclose($fp);

}

function get_mv_otmv($plan) {
    $date = new DateTime('today');
    $d = $date->format('Y-m-d');
    $soapClient = new B2B();
    $result = new stdClass();
    $result->MV = $soapClient->flowServices()->get_easy_capacity_plan($plan, $d);
    $result->OTMV = $soapClient->flowServices()->get_otmv_plan($plan, $d, $soapClient->getCurrentVersion());
    var_dump($result->OTMV);
    return $result;
}

//$res_est = get_mv_otmv($tv_est);
//write_json($res_est, "est");
$res_west = get_mv_otmv($tv_west);
//write_json($res_west, "ouest");

?>
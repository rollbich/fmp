<?php
header("Content-type:application/json");
ini_set('memory_limit', '1G');
require_once("B2B.php");
require_once("B2B-Service.php");
require_once("Airspace.php");
require_once("B2B-AirspaceServices.php");
require_once("B2B-FlowServices.php");
include_once("config.inc.php");

/*  -------------------------------------------------------
		Ecriture du fichier AUP json
		$resultat : données
		Récupération auto à 16h24 de l'AUP du lendemain
        => 20230525-aup.json
	------------------------------------------------------- */
function write_json($resultat, String $zone) {

    $date = new DateTime('today');
    $d = $date->format('Ymd');
    $y = $date->format('Y');
    $m = $date->format('m');
   
    $dir = dirname(__FILE__)."/json/$y/$m/";
    
    if (!file_exists($dir)) {
        mkdir($dir, 0777, true);
    }
    
    $fp = fopen($dir.$d."-mv_otmv-".$zone.".json", 'w');
    fwrite($fp, json_encode($resultat));
    fclose($fp);

}

function lfm(String $elem) {
    return "LFM".$elem;
}

$tv_est = array_map("lfm", ["RAE", "RAEM", "RAES", "RAEE", "RAEE1", "SBAM", "MNST", "BTAJ", "SAB", "BAM", "SBM", "MN", "ST", "AJ", "BT", "EK", "EK1", "EK2", "EK3", "EK12", "EK3", "EK23", "E12", "E3", "E23", "KK", "K12", "K3", "K23", "EE", "KK", "E1", "E2", "K1", "K2", "AB", "AB1", "AB2", "AB3", "AB4", "AB12", "AB34", "B12", "B34", "B1", "B2", "B3", "B4", "AA", "BB", "A12", "A34", "A1", "A2", "A3", "A4", "GY", "GY1", "GY2", "GY3", "GY4", "GY12", "GY34", "GG", "YY", "Y12", "Y34", "Y1", "Y2", "Y3", "Y4", "G12", "G34", "G1", "G2", "G3", "G4", "GYAB", "GYA"]);

$tv_west = array_map("lfm", ["RAW", "RAWM", "RAWN", "RAWS", "WLMO", "MALY", "LYO", "MOLYO", "MML", "LE", "LOLS", "LELS", "LOLE", "LS", "LO", "MO", "ML", "MOML", "W1", "W23", "W12", "W2", "W3", "WM", "WW", "WMF", "MF", "MF1", "MF2", "MF3", "MF4", "MM", "M12", "M1", "M123", "M34", "M234", "M2", "M3", "M4", "FF", "F12", "F1", "F2", "MF12", "F123", "MF34", "F234", "F34", "F3", "F4", "DZ", "DD", "ZZ", "DH", "ZH", "DL", "DZL", "DZH", "FDZ", "MFDZ"]);


function get_mv_otmv($plan) {
    $date = new DateTime('today');
    $d = $date->format('Y-m-d');
    $soapClient = new B2B();
    $result = new stdClass();
    $result->MV = $soapClient->flowServices()->get_easy_capacity_plan($plan, $d);
    $result->OTMV = $soapClient->flowServices()->get_otmv_plan($plan, $d);
    return $result;
}

$res_est = get_mv_otmv($tv_est);
write_json($res_est, "est");
$res_west = get_mv_otmv($tv_west);
write_json($res_west, "west");

?>
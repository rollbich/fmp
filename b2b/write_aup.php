<?php
header("Content-type:application/json");
ini_set('memory_limit', '1G');
require_once("B2B.php");
require_once("B2B-Service.php");
require_once("Airspace.php");
require_once("B2B-AirspaceServices.php");
include_once("path.inc.php");

/*  -------------------------------------------------------
		Ecriture du fichier AUP json
		$resultat : données
		Récupération auto à 16h24 de l'AUP du lendemain
        => 20230525-aup.json
	------------------------------------------------------- */
function write_json($resultat) {

    $date = new DateTime('tomorrow');
    $d = $date->format('Ymd');
    $y = $date->format('Y');
    $m = $date->format('m');
   
    $dir = WRITE_PATH."/json/$y/$m/";
    
    if (!file_exists($dir)) {
        mkdir($dir, 0777, true);
    }
    
    $fp = fopen($dir.$d."-aup.json", 'w');
    fwrite($fp, json_encode($resultat));
    fclose($fp);

}

function get_aup() {
    $date = new DateTime('tomorrow');
    $soapClient = new B2B();
    $eaup_rsa = $soapClient->airspaceServices()->get_RSA($date, array('LF*','LI*'));
    return $eaup_rsa;
}

$resultat = get_aup();
echo json_encode($resultat);
write_json($resultat);
?>
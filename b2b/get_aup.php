<?php
header("Content-type:application/json");
ini_set('memory_limit', '1G');
require_once("B2B.php");
require_once("B2B-Service.php");
require_once("Airspace.php");
require_once("B2B-AirspaceServices.php");

function get_aup($day) {
    $date = new DateTime($day);
    $soapClient = new B2B();
    $eaup_rsa = $soapClient->airspaceServices()->get_RSA($date, array('LF*','LI*'));
    return $eaup_rsa;
}

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
if ($contentType === "application/json") {
	$content = trim(file_get_contents("php://input"));
	$decoded = json_decode($content, true); // array
	
	$day = $decoded["day"]; // Y-m-d

	$resultat = get_aup($day);
	echo json_encode($resultat);
	
} else { 
    $arr = array('erreur' => 'pas json');
    echo json_encode($arr);
}

?>
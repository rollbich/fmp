<?php
header('content-type:application/json');
ini_set('memory_limit', '1G');
require_once("mail-msg.php");
require_once("B2B.php");
require_once("B2B-Service.php");
require_once("B2B-InfoServices.php");

/* -----------------------------------------------------------------
	Récupère les infos du certif NM 

    @return {
            
        }

   -----------------------------------------------------------------*/

/*  ---------------------------------------------------------- */
/* 						début du programme
/*  ---------------------------------------------------------- */

$soapClient = new B2B();

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if ($contentType === "application/json") {

	$content = trim(file_get_contents("php://input"));
	$decoded = json_decode($content, true); // array
	$info = $decoded["info"];
    $result = 'undefined';

    if ($info === "certif") {
        $result = $soapClient->infoServices()->get_certif_info();
    }

    if ($info === "nm") {
        $result = $soapClient->infoServices()->get_NM_info();
    }
	
    $result->currentVersion = $soapClient->getCurrentVersion();

    echo json_encode($result);	

} else { echo "<br/>pas json<br/>"; }


?>
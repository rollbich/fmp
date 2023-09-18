<?php
header('content-type:application/json');
ini_set('memory_limit', '1G');
require_once("mail-msg.php");
require_once("B2B.php");
require_once("B2B-Service.php");
require_once("B2B-FlowServices.php");
require_once("MV-OTMV.inc.php");

/* -----------------------------------------------------------------
	Récupère les MVs existantes 
	@param {array} $plan - ["LFMGY","tv2",...]
	@param {gmdate} $day - gmdate('Y-m-d', strtotime("tomorrow"));
		possible : today à J+1 

    @return {
            "LFMEE":[{"applicabilityPeriod":{"wef":"2023-04-04 00:00","unt":"2023-04-05 00:00"},"dataSource":"AIRSPACE","capacity":30}],
            "LFMGY":[
                {
                    "applicabilityPeriod":{"wef":"2023-04-04 00:00","unt":"2023-04-04 04:30"},
                    "dataSource":"AIRSPACE",
                    "capacity":43
                },{
                    "applicabilityPeriod":{"wef":"2023-04-04 04:30","unt":"2023-04-04 14:47"},
                    "dataSource":"MEASURE",
                    "capacity":39
                },{
                    "applicabilityPeriod":{"wef":"2023-04-04 14:47","unt":"2023-04-05    00:00"},
                    "dataSource":"AIRSPACE",
                    "capacity":43
                }
            ]
        }
        
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
	$zone = $decoded["zone"];
	$day = $decoded["day"];
    $plan = null;
    if (strcmp($zone, "est") === 0) $plan = $tv_est; else $plan = $tv_west;
	$mvs = $soapClient->flowServices()->get_easy_capacity_plan($plan, $day);
    echo json_encode($mvs);	

} else { echo "<br/>pas json<br/>"; }


?>
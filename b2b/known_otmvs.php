<?php
ini_set('memory_limit', '1G');
require_once("B2B.php");
require_once("B2B-Service.php");
require_once("B2B-FlowServices.php");

/* -------------------------------------------------------------------------------------
	Récupère les OTMVs existantes 
	@param {array} $plan - ["LFMGY","tv2",...]
	@param {gmdate} $day - gmdate('Y-m-d', strtotime("tomorrow"));
		possible : today à J+1 

    @return {
        "tv": [ {période 1}, ..., {période n}],
        "LFMGY": [{
            "applicabilityPeriod":{"wef":"2023-04-05 00:00","unt":"2023-04-06 00:00"},
            "dataSource":"AIRSPACE",
            "otmv":{
                "trafficVolume":"LFMGY",
                "otmvDuration":"0009",     /// attention string
                "peak":{"threshold":17},
                "sustained":{"threshold":13,"crossingOccurrences":99,"elapsed":"0139"}
            }
        }]
    }    
   ------------------------------------------------------------------------------------*/

/*  ---------------------------------------------------------- */
/* 						début du programme
/*  ---------------------------------------------------------- */

$soapClient = new B2B();

function setPrefix($elem) {
    return "LFM".$elem;
}

$tv_est = array_map("setPrefix", ["RAE", "RAEM", "RAES", "RAEE", "RAEE1", "SBAM", "MNST", "BTAJ", "SAB", "BAM", "SBM", "MN", "ST", "AJ", "BT", "EK", "EK1", "EK2", "EK3", "EK12", "EK3", "EK23", "E12", "E3", "E23", "KK", "K12", "K3", "K23", "EE", "KK", "E1", "E2", "K1", "K2", "AB", "AB1", "AB2", "AB3", "AB4", "AB12", "AB34", "B12", "B34", "B1", "B2", "B3", "B4", "AA", "BB", "A12", "A34", "A1", "A2", "A3", "A4", "GY", "GY1", "GY2", "GY3", "GY4", "GY12", "GY34", "GG", "YY", "Y12", "Y34", "Y1", "Y2", "Y3", "Y4", "G12", "G34", "G1", "G2", "G3", "G4", "GYAB", "GYA"]);

$tv_west = array_map("setPrefix", ["RAW", "RAWM", "RAWN", "RAWS", "WLMO", "MALY", "LYO", "MOLYO", "MML", "LE", "LOLS", "LELS", "LOLE", "LS", "LO", "MO", "ML", "MOML", "W1", "W23", "W12", "W2", "W3", "WM", "WW", "WMF", "MF", "MF1", "MF2", "MF3", "MF4", "MM", "M12", "M1", "M123", "M34", "M234", "M2", "M3", "M4", "FF", "F12", "F1", "F2", "MF12", "F123", "MF34", "F234", "F34", "F3", "F4", "DZ", "DD", "ZZ", "DH", "ZH", "DL", "DZL", "DZH", "FDZ", "MFDZ"]);

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if ($contentType === "application/json") {

	$content = trim(file_get_contents("php://input"));
	$decoded = json_decode($content, true); // array
	$zone = $decoded["zone"];
	$day = $decoded["day"];
    $plan = null;
    if (strcmp($zone, "est") === 0) $plan = $tv_est; else $plan = $tv_west;
	$otmvs = $soapClient->flowServices()->get_otmv_plan($plan, $day, $soapClient->getCurrentVersion());
    echo json_encode($otmvs);	

} else { echo "<br/>pas json<br/>"; }

?>
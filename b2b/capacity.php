<?php
ini_set('memory_limit', '1G');
require_once("mail-msg.php");
require_once("B2B.php");
require_once("B2B-Service.php");
require_once("B2B-FlowServices.php");

/* -----------------------------------------------------------------
	Récupère les MV
	@param {string} $tvs - [tv1, tv2, ...]
	@param {gmdate} $day - gmdate('Y-m-d', strtotime("tomorrow"));
		

    @return {

        "data": {
            "plan" : {
                { "knownConfigurations": {
                    "item" :[{
                        "key": "E10A2B",
                        "value": {
                            "item": ["LFMMG12", "LFMMG34", "LFMMB12", "LFMMB34", "LFMMY12", "LFMMY34", "LFMMMNST", "LFMMAA", "LFMMBTAJ", "LFMMEK1", "LFMMEK3", "LFMMEK2" ]
                        }
                        },
                        ...
                        {...}
                    ],
                }
            }
        }
    }
        
}

   -----------------------------------------------------------------*/

/*  ---------------------------------------------------------- */
/* 						début du programme
/*  ---------------------------------------------------------- */

$soapClient = new B2B();

function lfm($elem) {
    return "LFM".$elem;
}

$tv_est = array_map("lfm", ["RAE", "RAEM", "RAES", "RAEE", "RAEE1", "SBAM", "MNST", "BTAJ", "SAB", "BAM", "SBM", "MN", "ST", "AJ", "BT", "EK", "EK1", "EK2", "EK3", "EK12", "EK3", "EK23", "E12", "E3", "E23", "KK", "K12", "K3", "K23", "EE", "KK", "E1", "E2", "K1", "K2", "AB", "AB1", "AB2", "AB3", "AB4", "AB12", "AB34", "B12", "B34", "B1", "B2", "B3", "B4", "AA", "BB", "A12", "A34", "A1", "A2", "A3", "A4", "GY", "GY1", "GY2", "GY3", "GY4", "GY12", "GY34", "GG", "YY", "Y12", "Y34", "Y1", "Y2", "Y3", "Y4", "G12", "G34", "G1", "G2", "G3", "G4"]);

$tv_west = array_map("lfm", ["RAW", "RAWM", "RAWN", "RAWS", "WLMO", "MALY", "LYO", "MOLYO", "MML", "LE", "LOLS", "LELS", "LOLE", "LS", "LO", "MO", "ML", "MOML", "W1", "W23", "W12", "W2", "W3", "WM", "WW", "WMF", "MF", "MF1", "MF2", "MF3", "MF4", "MM", "M12", "M1", "M123", "M34", "M234", "M2", "M3", "M4", "FF", "F12", "F1", "F2", "MF12", "F123", "MF34", "F234", "F34", "F3", "F4", "DZ", "DD", "ZZ", "DH", "ZH", "DL", "DZL", "DZH"]);

$today = gmdate('Y-m-d', strtotime("now"));
// identique à $dt = new DateTime(); echo $dt->format('Y-m-d');

//$mv = $soapClient->flowServices()->get_capacity_plan(["LFMRAE"], $today);
//$otmv = $soapClient->flowServices()->get_otmv_tv("LFMEE", $today);
//$otmv_plan = $soapClient->flowServices()->get_otmv_tv("LFMGY", $today);
$mv_easy = $soapClient->flowServices()->get_otmv_plan(["LFMEE","LFMGY"], $today);
//echo json_encode($mv);
echo "<br><br>";
//echo json_encode($otmv);
//echo json_encode($otmv_plan);
echo json_encode($mv_easy);
?>
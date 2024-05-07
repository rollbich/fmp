<?php
ini_set('memory_limit', '1G');
require_once("B2B.php");
require_once("B2B-Service.php");
require_once("B2B-FlowServices.php");

/* -----------------------------------------------------------------
	Récupère les confs existantes (ainsi que les confs déclarés)
	@param {string} $airspace - "LFMMCTAE"
	@param {gmdate} $day - gmdate('Y-m-d', strtotime("tomorrow"));
		possible : yesterday, today, tomorrow 

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

$airspace1 = "LFMMCTAE";
$airspace2 = "LFMMCTAW";
$today = gmdate('Y-m-d', strtotime("now"));
$plan_e = $soapClient->flowServices()->get_atc_conf($airspace1, $today);
$plan_w = $soapClient->flowServices()->get_atc_conf($airspace2, $today);
$atc_confs = new stdClass();
$atc_confs->est = $plan_e->data->plan->nmSchedule->item;
$atc_confs->ouest = $plan_w->data->plan->nmSchedule->item;
// confs existantes dans NM pour l'est et l'ouest 
$atc_confs->known_confs = new stdClass();
$atc_confs->known_confs->est = $plan_e->data->plan->knownConfigurations->item;
$atc_confs->known_confs->ouest = $plan_w->data->plan->knownConfigurations->item;

echo json_encode($atc_confs);

?>
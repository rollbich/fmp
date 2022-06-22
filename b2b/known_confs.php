<?php
ini_set('memory_limit', '1G');
require_once("B2B.php");

/*  -----------------------------------------------------------------------
		instanciation soap FLOW Services
		
		Range de requête : 24h max
		trafficWindow (OPERATIONAL)	 : [yesterday .. tomorrow]
		trafficWindow (FORECAST)	 : [yesterday 21:00 UTC .. today+5d]

	----------------------------------------------------------------------- */
 
$soapFlow = new B2B("flow");
$soapClientFlow = $soapFlow->get_client();

/* -----------------------------------------------------------------
	Récupère les confs déclarés
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
function get_atc_conf($airspace, $day) {
	
	global $soapClientFlow;
	
	$params = array(
		'sendTime'=>gmdate("Y-m-d H:i:s"),
		'dataset'=>array('type'=>'OPERATIONAL'),
		'day'=> $day,
		'airspace' => $airspace
	);
						
	try {
		$output = $soapClientFlow->__soapCall('retrieveSectorConfigurationPlan', array('parameters'=>$params));
		return $output;
		}

	catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}
}

/*  ---------------------------------------------------------- */
/* 						début du programme
/*  ---------------------------------------------------------- */

// ATC conf du jour (attention : il faut demander tomorrow dans la requête)
$airspace1 = "LFMMCTAE";
$airspace2 = "LFMMCTAW";
$today = gmdate('Y-m-d', strtotime("tomorrow"));
$plan_e = get_atc_conf($airspace1, $today);
$plan_w = get_atc_conf($airspace2, $today);
$atc_confs = new stdClass();
$atc_confs->est = $plan_e->data->plan->nmSchedule->item;
$atc_confs->ouest = $plan_w->data->plan->nmSchedule->item;
// confs existantes dans NM pour l'est et l'ouest 
$atc_confs->known_confs = new stdClass();
$atc_confs->known_confs->est = $plan_e->data->plan->knownConfigurations->item;
$atc_confs->known_confs->ouest = $plan_w->data->plan->knownConfigurations->item;

echo json_encode($atc_confs);

?>
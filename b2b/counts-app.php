<?php
ini_set('memory_limit', '1G');
require_once("xlsxwriter.class.php");
require_once("mail-msg.php");
require_once("B2B.php");



/*  ------------------------------------------
		Ecriture du fichier générique json
		$arr : tableau contenant les données
		$zone : est ou west
		$type : H20, Occ, Reg
		$wef : pour la date du jour
		ex : 20210621-H20-est.csv
	------------------------------------------ */
function write_json($arr, $zone, $type, $wef) {
	
	$date = new DateTime($wef);
	$d = $date->format('Ymd');
	$dir = dirname(__FILE__)."/json/";
	
	if (!file_exists($dir)) {
		mkdir($dir, 0777, true);
	}
	
	$fp = fopen($dir.$d.$type.$zone.".json", 'w');
	fwrite($fp, json_encode($arr));
	fclose($fp);

}

/*  ---------------------------------------------------------- */
/* 						début du programme
/*  ---------------------------------------------------------- */

include_once("config.inc.php");
include_once("hour_config".$config.".inc.php");
	
/*
$wef=gmdate("Y-m-d H:i", mktime(15, 0, 0, 5, 16, 2021));
$unt=gmdate("Y-m-d H:i", mktime(17, 0, 0, 5, 16, 2021));
*/

/*  -----------------------------------------------------------------------
		instanciation soap FLIGHT Services
		
		Range de requête : 24h max
		trafficWindow (OPERATIONAL)	 : [yesterday .. tomorrow]
		trafficWindow (FORECAST)	 : [yesterday 21:00 UTC .. today+5d]
	----------------------------------------------------------------------- */

$soapFlight = new B2B("flight");
$soapClientFlight = $soapFlight->get_client();

/*  ---------------------------------------------------------------------
		Nombre de vols d'un TV par jour : FlightService
	--------------------------------------------------------------------- */
function get_nb_vols($tv, $wef, $unt) {

    global $soapClientFlight;
    global $receptionTime;
    
    $params = array(
        'sendTime'=>gmdate("Y-m-d H:i:s"),
        'dataset'=>array('type'=>'OPERATIONAL'),
        'trafficType'=>'LOAD',
        'includeProposalFlights'=>false,
        'includeForecastFlights'=>false,
        'trafficWindow'=>array('wef'=>$wef,'unt'=>$unt),
        'requestedFlightFields'=>array('timeAtReferenceLocationEntry','aircraftType','aircraftOperator','actualTakeOffTime','actualTimeOfArrival'),
        'trafficVolume'=>$tv,
        'calculationType'=>'ENTRY'
    );
                        
    try {
        $output = $soapClientFlight->__soapCall('queryFlightsByTrafficVolume', array('parameters'=>$params));
        $receptionTime = $output->requestReceptionTime;
        echo "TV : ".$tv."<br>";
        var_dump($output);
        echo "<br><br>";
        return $output;
        }

    catch (Exception $e) {echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";}
}

function get_vols_App($obj, $tv_arr, $wef, $unt) {
	$obj->LFMMAPP = new stdClass();
	$obj->VOLS_APP = new stdClass();
	$date = new DateTime($wef);
	foreach($tv_arr as $tv) {
		$res = get_nb_vols($tv, $wef, $unt);
        // S'il n'y a pas de vol alors pas de property "flights"
        if (property_exists($res->data, "flights")) {
            // S'il n'y a qu'un vol alors $res->data->flights n'est pas un array
            if (is_array($res->data->flights)) {
                $obj->LFMMAPP->$tv = array($date->format('Y-m-d'), count($res->data->flights));
            } else {
                $obj->LFMMAPP->$tv = array($tv, $date->format('Y-m-d'), 1);
            }
        } else {
            $obj->LFMMAPP->$tv = array($tv, $date->format('Y-m-d'), 0);
        }
        if (property_exists($res->data, "flights")) {
            // S'il n'y a qu'un vol alors $res->data->flights n'est pas un array
            if (is_array($res->data->flights)) {
                $obj->VOLS_APP->$tv = $res->data->flights;
            } else {
                $obj->VOLS_APP->$tv = $res->data->flights;
            }
        } else {
            $obj->VOLS_APP->$tv = new stdClass();
        }
	}
}

include("tab_TV.inc.php");

$flights = new stdClass();
get_vols_App($flights, $tab_TVAPP, $wef_flights, $unt_flights);


// Sauvegarde des fichiers
// Affichage d'un message suivant la réussite de la sauvegarde
// écriture d'un log
// Envoi d'un email en cas d'erreur

try {	
	
	write_json($flights, "", "-vols", $wef_counts);

}
catch (Exception $e) {
	$err = "Erreur, verifier les sauvegardes\n"."Exception reçue : ".$e->getMessage()."\n";
	echo "Erreur, verifier les sauvegardes\n<br>";
	echo 'Exception reçue : ',  $e->getMessage(), "\n<br>";
	write_log("", "", $err);
	send_mail();
}


?>
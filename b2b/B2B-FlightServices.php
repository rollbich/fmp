<?php

class FlightServices extends Service {
    /*  ---------------------------------------------------------------------
		Nombre de vols d'un TV par jour : FlightService
        @param $wef / $unt           - gmdate('Y-m-d H:i')
	--------------------------------------------------------------------- */

    public function get_nb_vols_TV($tv, $wef, $unt) {
        
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
            $output = $this->getSoapClient()->__soapCall('queryFlightsByTrafficVolume', array('parameters'=>$params));
            if ($output->status !== "OK") {
                $erreur = $this->getFullErrorMessage("Erreur get_nb_vols_TV $tv : ".$output->reason);
                echo $erreur."\n<br>";
                $this->send_mail($erreur);
            }
            return $output;
        }

        catch (Exception $e) {
            echo 'Exception reçue get_nb_vols_TV: ',  $e->getMessage(), "\n<br>";
            $erreur = $this->getFullErrorMessage("Erreur : get_nb_vols_TV");
            echo $erreur."\n<br>";
            $this->send_mail($erreur);
        }
    }

    /*  ---------------------------------------------------------------------
            Nombre de vols d'un AD par jour : FlightService
            @param $ad (string)         - "LFML"
            @param $wef / $unt          - gmdate('Y-m-d H:i')
        --------------------------------------------------------------------- */
    public function get_nb_vols_AD($ad, $wef, $unt) {
        
        $params = array(
            'sendTime'=>gmdate("Y-m-d H:i:s"),
            'dataset'=>array('type'=>'OPERATIONAL'),
            'trafficType'=>'LOAD',
            'includeProposalFlights'=>false,
            'includeForecastFlights'=>false,
            'trafficWindow'=>array('wef'=>$wef,'unt'=>$unt),
            'requestedFlightFields'=>array('timeAtReferenceLocationEntry','aircraftType','aircraftOperator','actualTakeOffTime','actualTimeOfArrival'),
            'aerodrome'=>$ad,
            'aerodromeRole'=>'BOTH' // NM 27 : GLOBAL au lieu de BOTH 
        );
                            
        try {
            $output = $this->getSoapClient()->__soapCall('queryFlightsByAerodrome', array('parameters'=>$params));
            if ($output->status !== "OK") {
                $erreur = $this->getFullErrorMessage("Erreur get_nb_vols_AD pour $ad : ".$output->reason);
                echo $erreur."\n<br>";
                $this->send_mail($erreur);
            }
            return $output;
        }

        catch (Exception $e) {
            echo 'Exception reçue get_nb_vols_AD: ',  $e->getMessage(), "\n<br>";
            $erreur = $this->getFullErrorMessage("Erreur : get_nb_vols_AD");
            echo $erreur."\n<br>";
            $this->send_mail($erreur);
        }
    }

    public function get_vols_Est($obj, $tv_arr, $wef, $unt) {
        $obj->LFMMFMPE = array();
        $date = new DateTime($wef);
        foreach($tv_arr as $index => $tv) {
            $res = $this->get_nb_vols_TV($tv, $wef, $unt);
            if ($index == 0) { // la 1ère fois, on remplit ces 2 propriétés
                $obj->requestReceptionTime = $res->requestReceptionTime;
                $obj->status = $res->status;
            }
            array_push($obj->LFMMFMPE, array($tv, $date->format('Y-m-d'), count($res->data->flights)));
            if ($tv == "LFMRAE") $obj->VOLS_RAE = $res->data->flights;
        }
    }
    
    public function get_vols_West($obj, $tv_arr, $wef, $unt) {
        $obj->LFMMFMPW = array();
        $date = new DateTime($wef);
        foreach($tv_arr as $tv) {
            $res = $this->get_nb_vols_TV($tv, $wef, $unt);
            array_push($obj->LFMMFMPW, array($tv, $date->format('Y-m-d'), count($res->data->flights)));
            if ($tv == "LFMRAW") $obj->VOLS_RAW = $res->data->flights;
        }
    }
    
    public function get_vols_App($obj, $tv_arr, $tv_arr2, $wef, $unt) {
        $obj->LFMMAPP = new stdClass();
        $obj->VOLS_APP = new stdClass();
        $date = new DateTime($wef);
        $total_app = 0;
        foreach($tv_arr as $tv) {
            $res = $this->get_nb_vols_TV($tv, $wef, $unt);
            if ($res->status == "OK") {
                $nb_flight = 0;
                // S'il n'y a pas de vol alors pas de property "flights"
                if (property_exists($res->data, "flights")) {
                    // S'il n'y a qu'un vol alors $res->data->flights n'est pas un array
                    if (is_array($res->data->flights)) {
                        $nb_flight = count($res->data->flights);
                        $obj->LFMMAPP->$tv = array($date->format('Y-m-d'), count($res->data->flights));
                    } else {
                        $nb_flight = 1;
                        $obj->LFMMAPP->$tv = array($date->format('Y-m-d'), 1);
                    }
                } else {
                    $nb_flight = 0;
                    $obj->LFMMAPP->$tv = array($date->format('Y-m-d'), 0);
                }
                $total_app += $nb_flight;
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
        foreach($tv_arr2 as $tv) {
            $res = $this->get_nb_vols_AD($tv, $wef, $unt);
            if ($res->status == "OK") {
                $nb_flight = 0;
                // S'il n'y a pas de vol alors pas de property "flights"
                if (property_exists($res->data, "flights")) {
                    // S'il n'y a qu'un vol alors $res->data->flights n'est pas un array
                    if (is_array($res->data->flights)) {
                        $nb_flight = count($res->data->flights);
                        $obj->LFMMAPP->$tv = array($date->format('Y-m-d'), count($res->data->flights));
                    } else {
                        $nb_flight = 1;
                        $obj->LFMMAPP->$tv = array($date->format('Y-m-d'), 1);
                    }
                } else {
                    $nb_flight = 0;
                    $obj->LFMMAPP->$tv = array($date->format('Y-m-d'), 0);
                }
                $total_app += $nb_flight;
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
        $obj->LFMMAPP->flights = $total_app;
    }
}
<?php

class FlowServices extends Service {

    /*  ----------------------------------------------------------------------------------------
                        Appel b2b
            récupère le nbre de vols d'une journée d'un airspace LFMMCTA, LFMMCTAE et LFMMCTAW
                @param $airspace    (string) - airspace name
                @param $trafficType (string) - "LOAD" / "DEMAND" / "REGULATED_DEMAND"
                @param $wef / $unt           - gmdate('Y-m-d H:i')
        ---------------------------------------------------------------------------------------- */
    // (marche aussi pour un TV en changeant la requete par queryTrafficCountsByTrafficVolume et en remplacant airspace par trafficVolume)
    function query_entry_day_count($airspace, $trafficType, $wef, $unt) {
        
        $params = array(
            'sendTime'=>gmdate("Y-m-d H:i:s"),
            'dataset'=>array('type'=>'OPERATIONAL'),
            'trafficTypes'=>array('item'=>$trafficType),
            'includeProposalFlights'=>false,
            'includeForecastFlights'=>false,
            'trafficWindow'=>array('wef'=>$wef,'unt'=>$unt),
            'countsInterval'=>array('duration'=>'2400','step'=>'2400'),
            'airspace'=>$airspace,
            'subTotalComputeMode'=>'NO_SUB_TOTALS',
            'calculationType'=>'ENTRY'
        );
        
        try {
            $output = $this->getSoapClient()->__soapCall('queryTrafficCountsByAirspace', array('parameters'=>$params));
            if (isset($output->data->counts) == false) {
                $erreur = $this->getFullErrorMessage("Erreur query_entry_day_count : output->data->counts n'existe pas");
                echo $erreur."\n<br>";
                $this->send_mail($erreur);
            }
            return $output;
        }

        catch (Exception $e) {
            echo 'Exception reçue query_entry_day_count: ',  $e->getMessage(), "\n<br>";
            $erreur = $this->getFullErrorMessage("Erreur query_entry_day_count");
            echo $erreur."\n<br>";
            $this->send_mail($erreur);
        }
    }

    /*  --------------------------------------------------------------------------------
                        Appel b2b
            récupère le H20 (duration 60, step 20)
            dans la plage horaire $wef-$unt en heure UTC
                @param $tv (string)          - "LFMAB"
                @param $trafficType (string) - "LOAD" / "DEMAND" / "REGULATED_DEMAND"
                @param $wef / $unt           - gmdate('Y-m-d H:i')
        -------------------------------------------------------------------------------- */
    function query_entry_count($tv, $wef, $unt, $trafficType) {
        
        $params = array(
            'sendTime'=>gmdate("Y-m-d H:i:s"),
            'dataset'=>array('type'=>'OPERATIONAL'),
            'trafficTypes'=>array('item'=>$trafficType),
            'includeProposalFlights'=>false,
            'includeForecastFlights'=>false,
            'trafficWindow'=>array('wef'=>$wef,'unt'=>$unt),
            'subTotalComputeMode'=>'NO_SUB_TOTALS',
            'countsInterval'=>array('duration'=>'0060','step'=>'0020'),
            'trafficVolume'=>$tv,
            'calculationType'=>'ENTRY'
        );
        
        try {
            $output = $this->getSoapClient()->__soapCall('queryTrafficCountsByTrafficVolume', array('parameters'=>$params));
            if (isset($output->data->counts) == false) {
                $erreur = $this->getFullErrorMessage("Erreur query_entry_count : output->data->counts n'existe pas");
                echo $erreur."\n<br>";
                $this->send_mail($erreur);
            }
            return $output;
        }

        catch (Exception $e) {
            echo 'Exception reçue query_entry_count: ',  $e->getMessage(), "\n<br>";
            $erreur = $this->getFullErrorMessage("Erreur query_entry_count");
            echo $erreur."\n<br>";
            $this->send_mail($erreur);
        }
    }

    /*  --------------------------------------------------------------------------------
                        Appel b2b
            récupère l'occ (duration en fonction du TV, step 1)
            dans la plage horaire $wef-$unt en heure UTC
                @param $tv (string)          - "LFMAB"
                @param $trafficType (string) - "LOAD" / "DEMAND" / "REGULATED_DEMAND"
                @param $wef / $unt           - gmdate('Y-m-d H:i')
        ------------------------------------------------------------------------------- */
    function query_occ_count($tv, $tv_duration, $wef, $unt, $trafficType) {
        
        $params = array(
            'sendTime'=>gmdate("Y-m-d H:i:s"),
            'dataset'=>array('type'=>'OPERATIONAL'),
            'trafficTypes'=>array('item'=>$trafficType),
            'includeProposalFlights'=>false,
            'includeForecastFlights'=>false,
            'trafficWindow'=>array('wef'=>$wef,'unt'=>$unt),
            'subTotalComputeMode'=>'NO_SUB_TOTALS',
            'countsInterval'=>array('duration'=>$tv_duration,'step'=>'0001'),
            'trafficVolume'=>$tv,
            'calculationType'=>'OCCUPANCY'
        );
                                
        try {
            $output = $this->getSoapClient()->__soapCall('queryTrafficCountsByTrafficVolume', array('parameters'=>$params));
            if (isset($output->data->counts) == false) {
                $erreur = $this->getFullErrorMessage("Erreur query_occ_count : output->data->counts n'existe pas");
                echo $erreur."\n<br>";
                $this->send_mail($erreur);
            }
            return $output;
        }

        catch (Exception $e) {
            echo 'Exception reçue query_occ_count: ',  $e->getMessage(), "\n<br>";
            $erreur = $this->getFullErrorMessage("Erreur query_occ_count");
            echo $erreur."\n<br>";
            $this->send_mail($erreur);
        }
        
    }

    /*  ---------------------------------------------------------------------------------------------
			récupère le H20 de la zone "est" ou "west"
		dans la plage horaire $wef-$unt en heure UTC
          @param $prefix (string)      - "LFM"
          @param $tv_group (array)     - array des TVs
          @param $tv_zone_mv (object)  - objet dont les clés sont les TVs contenant les MV, et OTMV
          @param $trafficType (string) - "LOAD" / "DEMAND" / "REGULATED_DEMAND"
          @param $wef / $unt           - gmdate('Y-m-d H:i')
		    @return [ ["TV", "yyyy-mm-dd", "hh:mm", MV, H/20], [...], ... ]
	------------------------------------------------------------------------------------------------ */
    function get_entry($prefix, $tv_group, $tv_zone_mv, $wef, $unt, $trafficType) {
        
        $arr = array();
        
        if (!is_array($tv_group)) throw new Exception("TV_group doit être un array !");
        if (!is_array($tv_zone_mv)) throw new Exception("TV_mv doit être un array !");

        foreach($tv_group as $tv) {
            
            if (isset($tv_zone_mv[$tv]["MV"])) { $tv_mv = $tv_zone_mv[$tv]["MV"]; } else { throw new Exception("Le TV ".$tv." a une MV non defini dans MV.json"); }
            
            $date = new DateTime($wef);
            $timestamp = $date->getTimestamp();
            $result = $this->query_entry_count($prefix.$tv, $wef, $unt, $trafficType);

            for ($i=0; $i<count($result->data->counts->item); $i++) {
                $date->setTimestamp($timestamp+$i*60*20);
                array_push($arr, array($tv, $date->format('Y-m-d'), $date->format('H:i'), $tv_mv, $result->data->counts->item[$i]->value->item->value->totalCounts));
            }
        }
        return $arr;
    }

    /*  --------------------------------------------------------------------------------------
                récupère l'occ de la zone "est" ou "west"
            dans la plage horaire $wef-$unt en heure UTC
            @param $prefix (string)      - "LFM"
            @param $tv_group (array)     - array des TVs
            @param $tv_mv (object)       - objet dont les clés sont les TVs contenant les MV, et OTMV
            @param $trafficType (string) - "LOAD" / "DEMAND" / "REGULATED_DEMAND"
            @param $wef / $unt           - gmdate('Y-m-d H:i')
                @return [ ["TV", "yyyy-mm-dd", "hh:mm", peak, sustain, H/20], [...], ... ]
        ------------------------------------------------------------------------------------- */
    function get_occ($prefix, $tv_group, $tv_zone_mv, $wef, $unt, $trafficType) {
        
        $tv_duration = 0;
        
        $arr = array();
        
        if (!is_array($tv_group)) throw new Exception("TV_group doit être un array !");
        if (!is_array($tv_zone_mv)) throw new Exception("TV_mv doit être un array !");

        foreach($tv_group as $tv) {
            
            if (isset($tv_zone_mv[$tv]["peak"])) { $tv_peak = $tv_zone_mv[$tv]["peak"]; } else { throw new Exception("Le TV ".$tv." a un peak non defini dans MV.json"); }
            if (isset($tv_zone_mv[$tv]["sustain"])) { $tv_sustain = $tv_zone_mv[$tv]["sustain"]; } else { throw new Exception("Le TV ".$tv." a un sustain non defini dans MV.json"); }
            if (isset($tv_zone_mv[$tv]["duration"])) { $tv_duration = str_pad($tv_zone_mv[$tv]["duration"], 4, '0', STR_PAD_LEFT); } else { throw new Exception("Le TV ".$tv." a une duration non defini dans MV.json"); }
            
            $date = new DateTime($wef);
            $timestamp = $date->getTimestamp();
            $result = $this->query_occ_count($prefix.$tv, $tv_duration, $wef, $unt, $trafficType);
        
            for ($i=0; $i<count($result->data->counts->item); $i++) {
                $date->setTimestamp($timestamp+$i*60);
                array_push($arr, array($tv, $date->format('Y-m-d'), $date->format('H:i'), $tv_peak, $tv_sustain, $result->data->counts->item[$i]->value->item->value->totalCounts));
            }
        }
        return $arr;
    }

    /*  ----------------------------------------------------------------------
		récupère les reguls d'une zone définie par un trigramme
				$area : 3 premières lettres (ex : LFM)
				$wef-$unt : plage en heure UTC
		Note :  queryRegulations ne récupère pas les delais des TV
				c'est pourquoi, on effectue une requete atfcm_situation
				
		On récupère un tableau pour sauvegarde simple en xls et csv
		On créé un objet global json plus complet $json_reg
		pour la sauvegarde json
	---------------------------------------------------------------------- */
    public function get_regulations($area, $wef, $unt) {
        
        $params = array(
            'sendTime'=>gmdate("Y-m-d H:i:s"),
            'dataset'=>array('type'=>'OPERATIONAL'),
            'requestedRegulationFields'=>array('item'=>array('applicability', 'initialConstraints', 'delayTVSet', 'reason', 'location', 'lastUpdate')),
            'queryPeriod'=>array('wef'=>$wef,'unt'=>$unt),
            'tvs'=>array($area."*")
        );

        try {
            $output = $this->getSoapClient()->__soapCall('queryRegulations', array('parameters'=>$params));
            if (isset($output->data) == false) {
                $erreur = $this->getFullErrorMessage("Erreur get_regulations : output->data n'existe pas");
                echo $erreur."\n<br>";
                $this->send_mail($erreur);
            }
            return $output;
        }

        catch (Exception $e) {
            echo 'Exception reçue get_regulations: ',  $e->getMessage(), "\n<br>";
            $erreur = $this->getFullErrorMessage("Erreur get_regulations");
            echo $erreur."\n<br>";
            $this->send_mail($erreur);
        }
    
    }

    /*  -----------------------------------------------------------------------------------
            récupère la situation ATFCM en europe
            - delai, nbre vols (landed, suspendus...), reason globaux europe
            - reguls europe avec delai de chaque TV (format string HHMM), vols impactés
        ----------------------------------------------------------------------------------- */

    public function get_ATFCM_situation() {

        $day = gmdate('Y-m-d', strtotime("now"));

        $params = array(
            'sendTime'=>gmdate("Y-m-d H:i:s"),
            'dataset'=>array('type'=>'OPERATIONAL'),
            'day'=>$day
        );
                            
        try {
            $output = $this->getSoapClient()->__soapCall('retrieveATFCMSituation', array('parameters'=>$params));
            if (isset($output->data) == false) {
                $erreur = $this->getFullErrorMessage("Erreur get_ATFCM_situation : output->data n'existe pas");
                echo $erreur."\n<br>";
                $this->send_mail($erreur);
            }
            return $output;
        }

        catch (Exception $e) {
            echo 'Exception reçue get_ATFCM_situation: ',  $e->getMessage(), "\n<br>";
            $erreur = $this->getFullErrorMessage("Erreur get_ATFCM_situation");
            echo $erreur."\n<br>";
            $this->send_mail($erreur);
        }	
    }

    // PHP par défaut : objets sont passés par référence / array par copie
    public function get_full_regulations($area, $wef_regs, $unt_regs, $situation_ATFCM = null, $json_reg, & $reg) {
        
        try {
            $regulations = $this->get_regulations($area, $wef_regs, $unt_regs);
            if ($situation_ATFCM == null) $situation_ATFCM = $this->get_ATFCM_situation();
            $situation = $this->get_area_situation($situation_ATFCM, $area);
            for ($i=0; $i<count($regulations->data->regulations->item); $i++) {
                $r = $regulations->data->regulations->item[$i];
                $id = $r->regulationId;
                $lastUpdateDate = substr($r->lastUpdate->userUpdateEventTime, 0, 10);
                $lastUpdateTime = substr($r->lastUpdate->userUpdateEventTime, 11, 5);
                $delay = 0;
                $nbrImpactedFlight = 0;
                foreach ($situation as $regul) {
                    if ($regul[0] == $id) {
                        $delay = (int) $regul[1];
                        $nbrImpactedFlight = (int) $regul[2];
                    }
                }
                $tvset = $r->delayTVSet;
                $c = $r->initialConstraints;
                if (is_array($c)) {
                    // pour export Excel
                    for($j=0; $j<count($c); $j++) {
                        $date = substr($r->initialConstraints[$j]->constraintPeriod->wef, 0, 10);
                        $hdeb = substr($r->initialConstraints[$j]->constraintPeriod->wef, -5);
                        $hfin = substr($r->initialConstraints[$j]->constraintPeriod->unt, -5);
                        array_push($reg[$tvset], array($r->regulationId, $r->location->id, $date, $hdeb, $hfin, $r->reason, $r->initialConstraints[$j]->normalRate, $r->initialConstraints[$j]->pendingRate, $r->initialConstraints[$j]->equipmentRate, $delay, $nbrImpactedFlight, $r->delayTVSet, $r->lastUpdate->userUpdateType, $lastUpdateDate, $lastUpdateTime));
                    }
                    // pour export json
                    $obj = new stdClass();
                    $obj->regId = $r->regulationId;
                    $obj->tv = $r->location->id;
                    $obj->lastUpdate = $r->lastUpdate;
                    $obj->applicability = $r->applicability;
                    $obj->constraints = $r->initialConstraints;
                    $obj->reason = $r->reason;
                    $obj->delay = $delay;
                    $obj->impactedFlights = $nbrImpactedFlight;
                    $obj->TVSet = $r->delayTVSet;
                    array_push($json_reg->$tvset, $obj);
                } else {
                    // pour export Excel
                    $init_c = array($r->initialConstraints->constraintPeriod, $r->initialConstraints->normalRate, $r->initialConstraints->pendingRate, $r->initialConstraints->equipmentRate);
                    $date = substr($r->initialConstraints->constraintPeriod->wef, 0, 10);
                    $hdeb = substr($r->initialConstraints->constraintPeriod->wef, -5);
                    $hfin = substr($r->initialConstraints->constraintPeriod->unt, -5);
                    array_push($reg[$tvset], array($r->regulationId, $r->location->id, $date, $hdeb, $hfin, $r->reason, $r->initialConstraints->normalRate, $r->initialConstraints->pendingRate, $r->initialConstraints->equipmentRate, $delay, $nbrImpactedFlight, $r->delayTVSet, $r->lastUpdate->userUpdateType, $lastUpdateDate, $lastUpdateTime));
                    // pour export json
                    $obj = new stdClass();
                    $obj->regId = $r->regulationId;
                    $obj->tv = $r->location->id;
                    $obj->lastUpdate = $r->lastUpdate;
                    $obj->applicability = $r->applicability;
                    $obj->constraints = array($r->initialConstraints);
                    $obj->reason = $r->reason;
                    $obj->delay = $delay;
                    $obj->impactedFlights = $nbrImpactedFlight;
                    $obj->TVSet = $r->delayTVSet;
                    array_push($json_reg->$tvset, $obj);
                }
            }
        }
        
        catch (Exception $e) {
            echo 'Exception reçue get_full_regulations: ',  $e->getMessage(), "\n<br>";
            $erreur = $this->getFullErrorMessage("Erreur get_full_regulations");
            echo $erreur."\n<br>";
            $this->send_mail($erreur);
        }
            
    }

    /*  -------------------------------------------------------------------------
            Extrait de la situation ATFCM europe une zone précise d'europe
            -> reguls de la zone avec delai de chaque TV, vols impactés
                @param (objet ATFCM_situation) 
                @param (string) - bigramme de l'area (ex : "LF" pour la France)
                @return [ [regId, delay, impactedflights], ... [...] ]
        ------------------------------------------------------------------------- */
    public function get_area_situation($atfcm_situation, $area) {
        $arr = array();
        
        for ($i=0; $i<count($atfcm_situation->data->regulations->item); $i++) {
            $r = $atfcm_situation->data->regulations->item[$i];
            $delay_h = null;
            if (strlen($r->delay) === 5) $delay_h = (int) substr($r->delay, 0, 3); else $delay_h = (int) substr($r->delay, 0, 2);
            $delay_mn = (int) substr($r->delay, -2);
            $delay = $delay_h*60 + $delay_mn;
            if (substr($r->trafficVolumeId, 0, 2) == $area) {
                array_push($arr, array($r->regulationId, $delay, $r->nrImpactedFlights));
            }
        }
        return $arr;
    }

    /* ----------------------------------------------------------------------------
        Récupère les confs déclarés
        @param {string} $airspace - "LFMMCTAE"
        @param {gmdate} $day - gmdate('Y-m-d', strtotime("today"));
            possible : yesterday, today, tomorrow 
            "today" = minuit local = 22h00 UTC la veille(=> données de la veille)
    -------------------------------------------------------------------------------*/
    public function get_atc_conf($airspace, $day) {
        
        $params = array(
            'sendTime'=>gmdate("Y-m-d H:i:s"),
            'dataset'=>array('type'=>'OPERATIONAL'),
            'day'=> $day,
            'airspace' => $airspace
        );
                            
        try {
            $output = $this->getSoapClient()->__soapCall('retrieveSectorConfigurationPlan', array('parameters'=>$params));
            return $output;
            }

        catch (Exception $e) {
            echo 'Exception reçue get_atc_conf: ',  $e->getMessage(), "\n<br>";
            $erreur = $this->getFullErrorMessage("Erreur get_atc_conf");
            echo $erreur."\n<br>";
            $this->send_mail($erreur);
        }
    }

}

?>
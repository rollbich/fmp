<?php

class FlowServices extends Service {

    /*  ----------------------------------------------------------------------------------------
                        Appel b2b
            récupère le nbre de vols d'une journée d'un airspace LFMMCTA, LFMMCTAE et LFMMCTAW
                @param $airspace    (string) - airspace name
                @param $trafficType (string) - "LOAD" / "DEMAND" / "REGULATED_DEMAND"
                @param $wef / $unt  (string) - "YYYY-MM-DD hh:mm"   (ex : gmdate('Y-m-d H:i'))
        ---------------------------------------------------------------------------------------- */
    // (marche aussi pour un TV en changeant la requete par queryTrafficCountsByTrafficVolume et en remplacant airspace par trafficVolume)
    function query_entry_day_count(string $airspace, string $trafficType, string $wef, string $unt) {
        
        $params = array(
            'sendTime'=>gmdate("Y-m-d H:i:s"),
            'dataset'=>array('type'=>'OPERATIONAL'),
            'trafficTypes'=>array('item'=>$trafficType),
            'includeProposalFlights'=>false,
            'includeForecastFlights'=>false,
            'trafficWindow'=>array('wef'=>$wef,'unt'=>$unt),
            'countsInterval'=>array('duration'=>'2400','step'=>'2400'),
            'airspace'=>$airspace,
            'subTotalComputeMode'=>'NO_SUB_TOTALS', // NM 26.0
            'calculationType'=>'ENTRY'
        );
        
        try {
            $output = $this->getSoapClient()->__soapCall('queryTrafficCountsByAirspace', array('parameters'=>$params));
            if ($output->status !== "OK") {
                $erreur = $this->getFullErrorMessage("Erreur query_entry_day_count $airspace : ".$output->reason);
                echo $erreur."<br>\n";
                $this->send_mail($erreur);
            }
            return $output;
        }

        catch (Exception $e) {
            echo 'Exception reçue query_entry_day_count: ',  $e->getMessage(), "<br>\n";
            $erreur = $this->getFullErrorMessage("Erreur query_entry_day_count");
            echo $erreur."<br>\n";
            $this->send_mail($erreur);
        }
    }

    /*  ---------------------------------------------------------------------------------------
                        Appel b2b
            récupère le H20 (duration 60, step 20)
            dans la plage horaire $wef-$unt en heure UTC
                @param $tv (string)          - "LFMAB"
                @param $trafficType (string) - "LOAD" / "DEMAND" / "REGULATED_DEMAND"
                @param $wef / $unt  (string) - "YYYY-MM-DD hh:mm"   (ex : gmdate('Y-m-d H:i'))
        --------------------------------------------------------------------------------------- */
    function query_entry_count(string $tv, string $wef, string $unt, string $trafficType) {
        
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
            if ($output->status !== "OK") {
                $erreur = $this->getFullErrorMessage("Erreur query_entry_count $tv : ".$output->reason);
                echo $erreur."<br>\n";
                $this->send_mail($erreur);
            }
            return $output;
        }

        catch (Exception $e) {
            echo 'Exception reçue query_entry_count: ',  $e->getMessage(), "<br>\n";
            $erreur = $this->getFullErrorMessage("Erreur query_entry_count");
            echo $erreur."<br>\n";
            $this->send_mail($erreur);
        }
    }

    /*  -----------------------------------------------------------------------------------------------
                        Appel b2b
            récupère l'occ (duration en fonction du TV, step 1)
            dans la plage horaire $wef-$unt en heure UTC
                @param $tv (string)          - "LFMAB"
                @param $tv_duration (string) - "hhmm"
                @param $trafficType (string) - "LOAD" / "DEMAND" / "REGULATED_DEMAND"
                @param $wef / $unt  (string) - "YYYY-MM-DD hh:mm"   (ex : gmdate('Y-m-d H:i'))
        ----------------------------------------------------------------------------------------------- */
    function query_occ_count(string $tv, string $tv_duration, string $wef, string $unt, string $trafficType) {
        
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
            if ($output->status !== "OK") {
                $erreur = $this->getFullErrorMessage("Erreur query_occ_count $tv : ".$output->reason);
                echo $erreur."\n<br>";
                $this->send_mail($erreur);
            }
            return $output;
        }

        catch (Exception $e) {
            echo 'Exception reçue query_occ_count: ',  $e->getMessage(), "<br>\n";
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
          @param $wef / $unt  (string) - "YYYY-MM-DD hh:mm"   (ex : gmdate('Y-m-d H:i'))
		    @return [ ["TV", "yyyy-mm-dd", "hh:mm", MV, H/20], [...], ... ]
	------------------------------------------------------------------------------------------------ */
    function get_entry(string $prefix, array $tv_group, $tv_zone_mv, string $wef, string $unt, string $trafficType) {
        
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

    /*  ----------------------------------------------------------------------------------------------
                récupère l'occ de la zone "est" ou "west"
            dans la plage horaire $wef-$unt en heure UTC
            @param $prefix (string)      - "LFM"
            @param $tv_group (array)     - array des TVs
            @param $tv_mv (object)       - objet dont les clés sont les TVs contenant les MV, et OTMV
            @param $trafficType (string) - "LOAD" / "DEMAND" / "REGULATED_DEMAND"
            @param $wef / $unt  (string) - "YYYY-MM-DD hh:mm"   (ex : gmdate('Y-m-d H:i'))
                @return [ ["TV", "yyyy-mm-dd", "hh:mm", peak, sustain, H/20], [...], ... ]
        ---------------------------------------------------------------------------------------------- */
    function get_occ(string $prefix, array $tv_group, $tv_zone_mv, string $wef, string $unt, string $trafficType) {
        
        $tv_duration = 0;
        
        $arr = array();
        
        if (!is_array($tv_group)) throw new Exception("TV_group doit être un array !");
        if (!is_array($tv_zone_mv)) throw new Exception("TV_mv doit être un array !");

        foreach($tv_group as $tv) {
            
            if (isset($tv_zone_mv[$tv]["peak"])) { 
                $tv_peak = $tv_zone_mv[$tv]["peak"]; 
            } else { 
                $erreur = "Erreur get_occ : Le TV $tv a un peak non defini dans MV.json";
                echo $erreur."<br>\n";
                $this->send_mail($erreur);
                throw new Exception("Le TV $tv a un peak non defini dans MV.json"); 
            }
            if (isset($tv_zone_mv[$tv]["sustain"])) { 
                $tv_sustain = $tv_zone_mv[$tv]["sustain"]; 
            } else { 
                $erreur = "Erreur get_occ : Le TV $tv a un sustain non defini dans MV.json";
                echo $erreur."<br>\n";
                $this->send_mail($erreur);
                throw new Exception("Le TV $tv a un sustain non defini dans MV.json"); 
            }
            if (isset($tv_zone_mv[$tv]["duration"])) { 
                $tv_duration = str_pad($tv_zone_mv[$tv]["duration"], 4, '0', STR_PAD_LEFT); 
            } else { 
                $erreur = "Erreur get_occ : Le TV $tv a une duration non defini dans MV.json";
                echo $erreur."<br>\n";
                $this->send_mail($erreur);
                throw new Exception("Le TV a une duration non defini dans MV.json"); 
            }
            
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

    /*  -----------------------------------------------------------------------------------
		récupère les reguls d'une zone définie par un trigramme
			@param (string) $area : 3 premières lettres (ex : LFM)
			@param (string) $wef / $unt - "YYYY-MM-DD hh:mm"   (ex : gmdate('Y-m-d H:i'))
		Note :  queryRegulations ne récupère pas les delais des TV
				c'est pourquoi, on effectue une requete atfcm_situation

		On récupère un tableau pour sauvegarde simple en xls et csv
		On créé un objet global json plus complet $json_reg
		pour la sauvegarde json
	--------------------------------------------------------------------------------------- */
    public function get_regulations(string $area, string $wef, string $unt) {
        
        $params = array(
            'sendTime'=>gmdate("Y-m-d H:i:s"),
            'dataset'=>array('type'=>'OPERATIONAL'),
            'requestedRegulationFields'=>array('item'=>array('applicability', 'initialConstraints', 'delayTVSet', 'reason', 'location', 'lastUpdate')),
            'queryPeriod'=>array('wef'=>$wef,'unt'=>$unt),
            'tvs'=>array($area."*")
        );

        try {
            $output = $this->getSoapClient()->__soapCall('queryRegulations', array('parameters'=>$params));
            if ($output->status !== "OK") {
                $erreur = $this->getFullErrorMessage("Erreur get_regulations : ".$output->reason);
                echo $erreur."<br>\n";
                $this->send_mail($erreur);
            }
            return $output;
        }

        catch (Exception $e) {
            echo 'Exception reçue get_regulations: ',  $e->getMessage(), "<br>\n";
            $erreur = $this->getFullErrorMessage("Erreur get_regulations");
            echo $erreur."<br>\n";
            $this->send_mail($erreur);
        }
    
    }

    /*  -----------------------------------------------------------------------------------
            récupère la situation ATFCM en europe
            - delai, nbre vols (landed, suspendus...), reason globaux europe
            - reguls europe avec delai de chaque TV (format string HHMM), vols impactés
            $day : string "YYYY-MM-DD"
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
            if ($output->status !== "OK") {
                $erreur = $this->getFullErrorMessage("Erreur get_ATFCM_situation : ".$output->reason);
                echo $erreur."<br>\n";
                $this->send_mail($erreur);
            }
            return $output;
        }

        catch (Exception $e) {
            echo 'Exception reçue get_ATFCM_situation: ',  $e->getMessage(), "<br>\n";
            $erreur = $this->getFullErrorMessage("Erreur get_ATFCM_situation");
            echo $erreur."<br>\n";
            $this->send_mail($erreur);
        }	
    }

    // PHP par défaut : objets sont passés par référence / array par copie
    // change for php 8.1 : les paramètres optionnels doivent être placés après les paramètres obligatoires
    public function get_full_regulations(string $area, string $wef_regs, string $unt_regs, $json_reg, & $reg, $situation_ATFCM = null) {
        
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
            echo 'Exception reçue get_full_regulations: ',  $e->getMessage(), "<br>\n";
            $erreur = $this->getFullErrorMessage("Erreur get_full_regulations");
            echo $erreur."<br>\n";
            $this->send_mail($erreur);
        }
            
    }

    /*  -------------------------------------------------------------------------
            Extrait de la situation ATFCM europe une zone précise d'europe
            -> reguls de la zone avec delai de chaque TV, vols impactés
                @param (objet ATFCM_situation) 
                @param (string) $area - bigramme de l'area (ex : "LF" pour la France)
                @return [ [regId, delay, impactedflights], ... [...] ]
        ------------------------------------------------------------------------- */
    public function get_area_situation($atfcm_situation, string $area) {
        $arr = array();
        
        for ($i=0; $i<count($atfcm_situation->data->regulations->item); $i++) {
            $r = $atfcm_situation->data->regulations->item[$i];
            $delay_h = null;
            if (strlen($r->delay) === 5) $delay_h = (int) substr($r->delay, 0, 3); else $delay_h = (int) substr($r->delay, 0, 2);
            $delay_mn = (int) substr($r->delay, -2);
            $delay = $delay_h*60 + $delay_mn;
            if (substr($r->trafficVolumeId, 0, 2) == $area) {
                array_push($arr, array($r->regulationId, $delay, $r->nrImpactedFlights)); // NM 27 nrImpactedFlights remplacé par impactedFlightCount
				// impactedFlightCount : Number of flights which are crossing the regulation location during the regulation activation period.
				// delay : The cumulated delay of the flights having the regulation as most penalising regulation.
            }
        }
        return $arr;
    }

    /* -------------------------------------------------------------------------------------------------------
        Récupère les confs déclarés (ainsi que les confs existantes : data->plan->knownConfigurations->item)
        @param {string} $airspace - "LFMMCTAE"
        @param {string} $day - "YYYY-MM-DD"  (ex : gmdate('Y-m-d', strtotime("today"));)
            possible : yesterday, today, tomorrow 
            "today" = minuit local = 22h00 UTC la veille(=> données de la veille)
        
    ----------------------------------------------------------------------------------------------------------*/
    public function get_atc_conf(string $airspace, string $day) {
        
        $params = array(
            'sendTime'=>gmdate("Y-m-d H:i:s"),
            'dataset'=>array('type'=>'OPERATIONAL'),
            'day'=> $day,
            'airspace' => $airspace
        );
                            
        try {
            $output = $this->getSoapClient()->__soapCall('retrieveSectorConfigurationPlan', array('parameters'=>$params));
            if ($output->status !== "OK") {
                $erreur = $this->getFullErrorMessage("Erreur get_atc_conf $airspace, $day : ".$output->reason);
                echo $erreur."<br>\n";
                $this->send_mail($erreur);
            }
            return $output;
            }

        catch (Exception $e) {
            echo 'Exception reçue get_atc_conf: ',  $e->getMessage(), "<br>\n";
            $erreur = $this->getFullErrorMessage("Erreur get_atc_conf");
            echo $erreur."<br>\n";
            $this->send_mail($erreur);
        }
    }

    /* -------------------------------------------------------------------------------------------------------
        Récupère les MV d'un array de TVs
        @param {array} $tvs - [tv1, tv2, ...]
        @param {string} $day - "YYYY-MM-DD"   (ex : gmdate('Y-m-d', strtotime("today"));)
            "today" = minuit local = 22h00 UTC la veille(=> données de la veille)
        
    ----------------------------------------------------------------------------------------------------------*/
    public function get_capacity_plan(array $tvs, string $day) {
        
        $params = array(
            'sendTime'=>gmdate("Y-m-d H:i:s"),
            'dataset'=>array('type'=>'OPERATIONAL'),
            'day'=> $day,
            'trafficVolumes' => $tvs
        );
                            
        try {
            $output = $this->getSoapClient()->__soapCall('retrieveCapacityPlan', array('parameters'=>$params));
            if ($output->status !== "OK") {
                $erreur = $this->getFullErrorMessage("Erreur get_capacity_plan $tvs, $day : ".$output->reason);
                echo $erreur."<br>\n";
                $this->send_mail($erreur);
            }
            return $output;
            }

        catch (Exception $e) {
            echo 'Exception reçue get_capacity_plan: ',  $e->getMessage(), "<br>\n";
            $erreur = $this->getFullErrorMessage("Erreur get_capacity_plan");
            echo $erreur."<br>\n";
            $this->send_mail($erreur);
        }
    }

    /* -------------------------------------------------------------------------------------------------------
        Récupère les MV d'un array de TVs dans un objet simple
        @param {array} $tvs - [tv1, tv2, ...]
        @param {string} $day - "YYYY-MM-DD"    (ex : gmdate('Y-m-d', strtotime("today"));)
            "today" = minuit local = 22h00 UTC la veille(=> données de la veille)
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
        
    ----------------------------------------------------------------------------------------------------------*/
    public function get_easy_capacity_plan(array $tvs, string $day) {
                
        $result = new stdClass();

        try {
            $output = $this->get_capacity_plan($tvs, $day);
            $r = $output->data->plans->tvCapacities->item;
            if (is_array($r)) {
                foreach($r as $item) {
                    $tv_seul = $item->key;
                    if (is_array($item->value->nmSchedule->item)) {
                        $result->$tv_seul = $item->value->nmSchedule->item;
                    } else {
                        $result->$tv_seul = [$item->value->nmSchedule->item];
                    }
                }
            } else {
                $tv_seul = $r->key;
                if (is_array($r->value->nmSchedule->item)) {
                    $result->$tv_seul = $r->value->nmSchedule->item;
                } else {
                    $result->$tv_seul = [$r->value->nmSchedule->item];
                }
            }
            return $result;
        }

        catch (Exception $e) {
            echo 'Exception reçue get_easy_capacity_plan: ',  $e->getMessage(), "<br>\n";
            $erreur = $this->getFullErrorMessage("Erreur get_easy_capacity_plan");
            echo $erreur."<br>\n";
            $this->send_mail($erreur);
        }
    }

    /* -------------------------------------------------------------------------------------------------------
        Récupère les OTMV d'un seul TV
        @param {string} $tv 
        @param {string} $day - "YYYY-MM-DD"    (ex : gmdate('Y-m-d', strtotime("today"));)
            "today" = minuit local = 22h00 UTC la veille(=> données de la veille)
        
    ----------------------------------------------------------------------------------------------------------*/
    public function get_otmv_tv(string $tv, string $day) {
        
        $params = array(
            'sendTime'=>gmdate("Y-m-d H:i:s"),
            'dataset'=>array('type'=>'OPERATIONAL'),
            'day'=> $day,
            'otmvsWithDuration' => array('item'=>array('trafficVolume'=>$tv))
        );
                            
        try {
            $output = $this->getSoapClient()->__soapCall('retrieveOTMVPlan', array('parameters'=>$params));
            if ($output->status !== "OK") {
                $erreur = $this->getFullErrorMessage("Erreur get_otmv_tv $tv, $day : ".$output->reason);
                echo $erreur."<br>\n";
                $this->send_mail($erreur);
            }
            return $output;
            }

        catch (Exception $e) {
            echo 'Exception reçue get_otmv_tv: ',  $e->getMessage(), "<br>\n";
            $erreur = $this->getFullErrorMessage("Erreur get_otmv_plantv");
            echo $erreur."<br>\n";
            $this->send_mail($erreur);
        }
    }

    /* -------------------------------------------------------------------------------------------------------
        Récupère les OTMV d'un array de TV
        @param {array} $tvs 
        @param {string} $day - "YYYY-MM-DD"    (ex : gmdate('Y-m-d', strtotime("today"));)
            "today" = minuit local = 22h00 UTC la veille(=> données de la veille)
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
    ----------------------------------------------------------------------------------------------------------*/
    public function get_otmv_plan(array $tvs, string $day) {
           
        $result = new stdClass();

        try {
            foreach ($tvs as $tv) {
                $output = $this->get_otmv_tv($tv, $day);
                $result->$tv = new stdClass();
                $r = $output->data->plans->tvsOTMVs->item->value->item;
                if (is_array($r)) { $r = $r[0]; } // on prend la première duration s'il y en a plusieurs
                $rr = $r->value->nmSchedule->item;
                if (is_array($rr)) {
                    $result->$tv = $rr;
                } else {
                    $result->$tv = [$rr];
                }
            }
            return $result;
        }

        catch (Exception $e) {
            echo 'Exception reçue get_otmv_plan: ',  $e->getMessage(), "<br>\n";
            $erreur = $this->getFullErrorMessage("Erreur get_otmv_plan");
            echo $erreur."<br>\n";
            $this->send_mail($erreur);
        }
    }

}

?>